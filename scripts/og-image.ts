/**
 * Renders .github/assets/og-image.html to .github/assets/og-image.png (1280x640),
 * the README header and the GitHub social preview. Needs the network for Inter.
 *
 * Usage: npm run og-image
 */
import { chromium } from '@playwright/test'
import path from 'node:path'
import { pathToFileURL } from 'node:url'

const SOURCE = path.resolve('.github/assets/og-image.html')
const OUTPUT = path.resolve('.github/assets/og-image.png')

const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1280, height: 640 } })

await page.goto(pathToFileURL(SOURCE).href, { waitUntil: 'networkidle' })
await page.evaluate(() => document.fonts.ready)
await page.screenshot({ path: OUTPUT })
await browser.close()

console.log(`Saved ${path.relative(process.cwd(), OUTPUT)}`)
