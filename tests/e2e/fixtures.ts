import { type BrowserContext, chromium, type Page, test as base, type Worker } from '@playwright/test'
import { readFileSync } from 'node:fs'
import path from 'node:path'
import type { SnapshotMeta } from '../../scripts/snapshot'
import type { ValidSettings } from '../../src/shared/settings'

// EXTENSION_DIR lets the suite run against another build, e.g. 1.3.5's dist/
const EXTENSION_DIR = path.resolve(process.env.EXTENSION_DIR ?? '.output/chrome-mv3')
const FIXTURES_DIR = path.resolve('tests/fixtures')

function loadSnapshot(name: string): { dir: string; meta: SnapshotMeta } {
  const dir = path.join(FIXTURES_DIR, name)

  return { dir, meta: JSON.parse(readFileSync(path.join(dir, 'meta.json'), 'utf8')) }
}

const snapshots = [loadSnapshot('presentation'), loadSnapshot('fullscreen')]

export const [PRESENTATION_URL, FULLSCREEN_URL] = snapshots.map(({ meta }) => meta.url) as [string, string]

/**
 * Serves the saved pages at their real URLs and blocks every other request
 */
async function serveSnapshots(context: BrowserContext) {
  await context.route('**/*', (route) => {
    const url = route.request().url()

    if (url.startsWith('chrome-extension://')) {
      return route.fallback()
    }

    for (const { dir, meta } of snapshots) {
      const entry = meta.entries[url] ?? meta.entries[url.split('?')[0] ?? '']

      if (entry) {
        return route.fulfill({
          status: entry.status,
          contentType: entry.contentType,
          body: readFileSync(path.join(dir, 'files', entry.file))
        })
      }
    }

    return route.abort()
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

    await serveSnapshots(context)
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
 * Replaces window.print with a counter kept in sessionStorage, so that it survives reloads.
 * With afterprint, the stub also fires the afterprint event, as closing the print dialog does.
 */
export async function stubPrint(page: Page, options: { afterprint?: boolean } = {}) {
  await page.addInitScript((afterprint) => {
    window.print = () => {
      sessionStorage.setItem('__printCalls', String(Number(sessionStorage.getItem('__printCalls') ?? 0) + 1))

      if (afterprint) {
        window.dispatchEvent(new Event('afterprint'))
      }
    }
  }, options.afterprint ?? false)
}

export function printCalls(page: Page): Promise<number> {
  return page.evaluate(() => Number(sessionStorage.getItem('__printCalls') ?? 0))
}
