import { type BrowserContext, chromium, type Page, test as base, type Worker } from '@playwright/test'
import { readFileSync } from 'node:fs'
import path from 'node:path'
import type { SnapshotMeta } from '../../scripts/snapshot'
import type { ValidSettings } from '../../src/shared/settings'

// EXTENSION_DIR lets the suite run against another build, e.g. 1.3.5's dist/
const EXTENSION_DIR = path.resolve(process.env.EXTENSION_DIR ?? '.output/chrome-mv3')
const FIXTURE_DIR = path.resolve('tests/fixtures/presentation')
const meta: SnapshotMeta = JSON.parse(readFileSync(path.join(FIXTURE_DIR, 'meta.json'), 'utf8'))

export const PRESENTATION_URL = meta.url

/**
 * Serves the saved presentation at its real URL and blocks every other request
 */
async function serveSnapshot(context: BrowserContext) {
  await context.route('**/*', (route) => {
    const url = route.request().url()

    if (url.startsWith('chrome-extension://')) {
      return route.fallback()
    }
    const entry = meta.entries[url] ?? meta.entries[url.split('?')[0] ?? '']

    if (!entry) {
      return route.abort()
    }

    return route.fulfill({
      status: entry.status,
      contentType: entry.contentType,
      body: readFileSync(path.join(FIXTURE_DIR, 'files', entry.file))
    })
  })
}

export const test = base.extend<{
  context: BrowserContext
  serviceWorker: Worker
  extensionId: string
}>({
  // eslint-disable-next-line no-empty-pattern
  context: async ({}, use) => {
    const context = await chromium.launchPersistentContext('', {
      channel: 'chromium',
      args: [`--disable-extensions-except=${EXTENSION_DIR}`, `--load-extension=${EXTENSION_DIR}`]
    })

    await serveSnapshot(context)
    await use(context)
    await context.close()
  },
  serviceWorker: async ({ context }, use) => {
    const [worker] = context.serviceWorkers()

    await use(worker ?? (await context.waitForEvent('serviceworker')))
  },
  extensionId: async ({ serviceWorker }, use) => {
    await use(new URL(serviceWorker.url()).host)
  }
})

export const expect = test.expect

export async function storeSettings(serviceWorker: Worker, settings: ValidSettings) {
  await serviceWorker.evaluate((value) => chrome.storage.sync.set({ settings: value }), settings)
}

/**
 * Replaces window.print with a counter readable from window.__printCalls
 */
export async function stubPrint(page: Page) {
  await page.addInitScript(() => {
    const target = window as unknown as { __printCalls: number }

    target.__printCalls = 0
    window.print = () => {
      target.__printCalls++
    }
  })
}

export function printCalls(page: Page): Promise<number> {
  return page.evaluate(() => (window as unknown as { __printCalls: number }).__printCalls)
}
