/**
 * Saves a public slides.com presentation for the e2e tests: the page and every
 * script, stylesheet, font and data response it loads (no images, no media),
 * plus a map from URL to file. Run with a fresh profile and no login.
 *
 * Usage: npm run snapshot -- <url> [name]   (saved in tests/fixtures/<name>, default "presentation")
 */
import { chromium } from '@playwright/test'
import { createHash } from 'node:crypto'
import { mkdir, rm, writeFile } from 'node:fs/promises'
import path from 'node:path'

const SKIPPED_TYPES = new Set(['image', 'media'])
const SKIPPED_HOSTS = ['googletagmanager.com', 'google-analytics.com', 'doubleclick.net']

export interface SnapshotEntry {
  file: string
  status: number
  contentType: string
}

export interface SnapshotMeta {
  url: string
  savedAt: string
  entries: Record<string, SnapshotEntry>
}

/**
 * Removes per-visit values from the page (the anonymous CSRF token)
 */
function scrub(html: string): string {
  return html.replace(/(<meta name="csrf-token" content=")[^"]*/, '$1scrubbed')
}

async function main() {
  const [url, name = 'presentation'] = process.argv.slice(2)

  if (!url) {
    throw new Error('Usage: npm run snapshot -- <url> [name]')
  }

  const OUT_DIR = path.resolve('tests/fixtures', name)
  const FILES_DIR = path.join(OUT_DIR, 'files')

  await rm(OUT_DIR, { recursive: true, force: true })
  await mkdir(FILES_DIR, { recursive: true })

  const browser = await chromium.launch({ channel: 'chromium' })
  const page = await browser.newPage()
  const entries: Record<string, SnapshotEntry> = {}
  const pending: Promise<void>[] = []

  page.on('response', (response) => {
    const request = response.request()

    const host = new URL(request.url()).hostname

    if (
      request.method() !== 'GET' ||
      SKIPPED_TYPES.has(request.resourceType()) ||
      SKIPPED_HOSTS.some((skipped) => host.endsWith(skipped))
    ) {
      return
    }

    pending.push(
      (async () => {
        const status = response.status()

        if (status >= 300 && status < 400) {
          return
        }

        let body = await response.body().catch(() => null)

        if (!body) {
          return
        }

        const isDocument = request.resourceType() === 'document'

        if (isDocument) {
          body = Buffer.from(scrub(body.toString('utf8')))
        }

        const ext = isDocument ? '.html' : path.extname(new URL(request.url()).pathname).slice(0, 8) || '.bin'
        const file = createHash('sha1').update(request.url()).digest('hex').slice(0, 16) + ext

        await writeFile(path.join(FILES_DIR, file), body)
        entries[request.url()] = { file, status, contentType: response.headers()['content-type'] ?? '' }
      })()
    )
  })

  await page.goto(url, { waitUntil: 'networkidle' })
  await page.waitForSelector('.reveal .slides')
  await Promise.all(pending)
  await browser.close()

  const meta: SnapshotMeta = { url, savedAt: new Date().toISOString(), entries }

  await writeFile(path.join(OUT_DIR, 'meta.json'), JSON.stringify(meta, null, 2) + '\n')
  console.log(`Saved ${Object.keys(entries).length} responses for ${url}`)
}

await main()
