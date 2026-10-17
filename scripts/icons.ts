/**
 * Exports the extension icons from the SVG sources in `Chrome Web Store/icon/`
 * to the PNG files in `public/icons/`. The 128px icon follows the Chrome Web
 * Store guideline (96px artwork centred in 128px with transparent padding);
 * every other size, the grey icon included, fills the whole canvas with the tile.
 *
 * Usage: npm run icons
 */
import { chromium } from '@playwright/test'
import { readFile } from 'node:fs/promises'
import path from 'node:path'

const SRC_DIR = path.resolve('Chrome Web Store/icon')
const OUT_DIR = path.resolve('public/icons')

interface Export {
  source: string
  file: string
  size: number
  /** Size of the artwork inside the canvas; defaults to the canvas size. */
  artwork?: number
}

const EXPORTS: Export[] = [
  { source: 'icon.svg', file: '16x16.png', size: 16 },
  { source: 'icon.svg', file: '32x32.png', size: 32 },
  { source: 'icon.svg', file: '72x72.png', size: 72 },
  { source: 'icon.svg', file: '96x96.png', size: 96 },
  { source: 'icon.svg', file: '128x128.png', size: 128, artwork: 96 },
  { source: 'icon-disabled.svg', file: 'icon-disabled.png', size: 128 }
]

const browser = await chromium.launch()
const page = await browser.newPage()

for (const { source, file, size, artwork } of EXPORTS) {
  const svg = await readFile(path.join(SRC_DIR, source), 'utf8')
  // the SVGs leave 8 units of transparent margin around the tile: crop the viewBox to the tile so it
  // fills the whole canvas (or the artwork area of the 128px icon), like the other toolbar icons
  const markup = svg.replace('viewBox="0 0 128 128"', 'viewBox="8 8 112 112"')
  const inner = artwork ?? size

  await page.setViewportSize({ width: size, height: size })
  await page.setContent(
    `<style>html,body{margin:0;background:transparent}` +
      `svg{display:block;width:${inner}px;height:${inner}px;margin:${(size - inner) / 2}px}</style>${markup}`
  )
  await page.screenshot({ path: path.join(OUT_DIR, file), omitBackground: true })
  console.log(`${file} (${size}px) ← ${source}`)
}

await browser.close()
