/**
 * Renders the Chrome Web Store images into .output/store-assets/: five screenshots (1280 × 800) of the
 * extension at work on a public presentation, and the two promotional tiles (440 × 280, 1400 × 560).
 * The frames are in .github/assets/store/, in the colours of the og-image.
 *
 * Usage: npm run store-assets   (builds the extension first; needs the network: the captures are taken
 * on slides.com, with a fresh profile and no login)
 *
 * The store wants 24-bit images without alpha: every PNG is re-encoded without it (sips, macOS).
 */
import { type BrowserContext, chromium, type Page } from '@playwright/test'
import { execFileSync } from 'node:child_process'
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'

const OUT = path.resolve('.output/store-assets')
const SOURCES = path.resolve('.github/assets/store')
const EXTENSION_DIR = path.resolve('.output/chrome-mv3')
const ICON = readFileSync(path.resolve('Chrome Web Store/icon/icon.svg'), 'utf8').replace(
  'viewBox="0 0 128 128"',
  'viewBox="8 8 112 112" width="100%" height="100%"'
)

// A public presentation by the Slides.com team; its first slide (their logo) is never shown.
const DECK = 'https://slides.com/news/make-better-presentations/fullscreen'
const HOST = 'slides.com/news/make-better-presentations/fullscreen'

// The page area inside the frame of screenshot.html: 1160 px wide, 610 px under the window bar.
const VIEW = { width: 1160, height: 610 }

interface Shot {
  file: string
  title: string // <b> marks the words in pink
  text: string
  host: string
  capture: (context: BrowserContext) => Promise<Buffer>
  popup?: boolean
  extra?: string // more HTML inside the browser window of the frame
}

const dataUrl = (png: Buffer) => `data:image/png;base64,${png.toString('base64')}`

interface PreviewPage {
  src: string
  number: number
}

function printPreview(pages: PreviewPage[]): string {
  const cards = pages
    .map(({ src, number }) => `<figure><img src="${src}" alt="" /><figcaption>Page ${number}</figcaption></figure>`)
    .join('')
  return `<style>
    * { box-sizing: border-box; margin: 0; }
    body { background: #e9e5e6; font-family: system-ui, -apple-system, sans-serif; padding: 34px 60px;
      display: grid; grid-template-columns: repeat(3, 1fr); gap: 26px 40px; align-content: start; }
    img { display: block; width: 100%; box-shadow: 0 6px 18px rgba(42, 26, 30, 0.25); }
    figcaption { margin-top: 8px; text-align: center; font-size: 13px; color: #6b545a; }
  </style>${cards}`
}

// renders a piece of HTML at the size of the page area, as if it were a capture of the page
async function renderPart(context: BrowserContext, html: string): Promise<Buffer> {
  const page = await context.newPage()
  await page.setViewportSize(VIEW)
  await page.setContent(html)
  await page.evaluate(() => Promise.all([...document.images].map((img) => img.decode())))
  const png = await page.screenshot()
  await page.close()
  return png
}

async function openDeck(context: BrowserContext, slide: string, print = false): Promise<Page> {
  const page = await context.newPage()
  await page.setViewportSize(VIEW)
  if (print) {
    // the print view opens the print dialog on its own: not here
    await page.addInitScript({ content: 'window.print = () => {}' })
  }
  await page.goto(`${DECK}${print ? '?print-pdf' : ''}${slide}`, { waitUntil: 'networkidle' })
  await page.getByRole('button', { name: 'Print / Save as PDF' }).waitFor({ state: 'attached' })
  await page.waitForTimeout(1000)
  return page
}

async function toolbarOn(page: Page, button: 'Print / Save as PDF' | 'Speaker View'): Promise<Buffer> {
  // open the toolbar first: while it slides open, the buttons move under the mouse
  await page.locator('#slides-extension .slc-toolbar').hover()
  await page.waitForTimeout(600)
  await page.getByRole('button', { name: button }).hover()
  await page.waitForTimeout(800)
  return page.screenshot()
}

const SHOTS: Shot[] = [
  {
    file: '1-print-to-pdf.png',
    title: 'Print or save any presentation as <b>PDF</b>',
    text: 'A small toolbar on every Slides.com presentation. Free.',
    host: HOST,
    capture: async (context) => toolbarOn(await openDeck(context, '#/5'), 'Print / Save as PDF')
  },
  {
    file: '2-one-slide-per-page.png',
    title: '<b>One slide per page</b>, only the slides',
    text: "Reveal.js's own print view: choose Save as PDF in the print dialog.",
    host: `${HOST}?print-pdf`,
    capture: async (context) => {
      const page = await openDeck(context, '', true)
      await page.locator('.pdf-page').nth(6).waitFor()
      await page.mouse.move(VIEW.width / 2, VIEW.height - 10)
      await page.waitForTimeout(1200)
      // six pages of the print view with some text (after the logo), laid out like a print preview
      const pages: PreviewPage[] = []
      const all = page.locator('.pdf-page')
      for (let i = 1; pages.length < 6 && i < (await all.count()); i++) {
        if ((await all.nth(i).innerText()).trim()) {
          pages.push({ src: dataUrl(await all.nth(i).screenshot()), number: i + 1 })
        }
      }
      return renderPart(context, printPreview(pages))
    }
  },
  {
    file: '3-speaker-view.png',
    title: 'Present with the <b>Speaker View</b>',
    text: 'Current and next slide, your notes and a timer, in a window of its own.',
    host: HOST,
    capture: async (context) => {
      const page = await openDeck(context, '#/5')
      const opened = page.waitForEvent('popup')
      await page.getByRole('button', { name: 'Speaker View' }).hover()
      await page.getByRole('button', { name: 'Speaker View' }).click()
      const speakerView = await opened
      await speakerView.setViewportSize(VIEW)
      await speakerView.waitForTimeout(3000)
      return speakerView.screenshot()
    }
  },
  {
    file: '4-out-of-the-way.png',
    title: 'Stays <b>out of the way</b>',
    text: 'Just a tab on the edge of the slides, until you need it.',
    host: HOST,
    // a ring around the closed tab (top right of the page, under the window bar)
    extra: '<span class="ring" style="top: 50px; right: -6px"></span>',
    capture: async (context) => {
      const page = await openDeck(context, '#/6')
      await page.mouse.move(200, VIEW.height - 40)
      await page.waitForTimeout(800)
      return page.screenshot()
    }
  },
  {
    file: '5-free-and-private.png',
    title: '<b>Free</b>, open source, <b>private</b>',
    text: 'No data collected, no server, no tracking. Report a problem on GitHub from the popup.',
    host: HOST,
    popup: true,
    capture: async (context) => toolbarOn(await openDeck(context, '#/4'), 'Speaker View')
  }
]

async function popupImage(context: BrowserContext, extensionId: string): Promise<Buffer> {
  const popup = await context.newPage()
  await popup.setViewportSize({ width: 400, height: 600 })
  await popup.goto(`chrome-extension://${extensionId}/popup.html`)
  await popup.waitForTimeout(800)
  const png = await popup.locator('#app > div').screenshot()
  await popup.close()
  return png
}

async function render(context: BrowserContext, html: string, width: number, height: number, file: string) {
  const page = await context.newPage()
  await page.setViewportSize({ width, height })
  await page.setContent(html)
  await page.evaluate(() => Promise.all([...document.images].map((img) => img.decode())))
  const target = path.join(OUT, file)
  writeFileSync(target, await page.screenshot({ clip: { x: 0, y: 0, width, height }, scale: 'css' }))
  await page.close()
  // re-encode without the alpha channel: PNG -> JPEG drops it, JPEG -> PNG gives a 24-bit PNG
  const jpg = `${target}.jpg`
  execFileSync('sips', ['-s', 'format', 'jpeg', '-s', 'formatOptions', 'best', target, '--out', jpg], {
    stdio: 'ignore'
  })
  execFileSync('sips', ['-s', 'format', 'png', jpg, '--out', target], { stdio: 'ignore' })
  execFileSync('rm', [jpg])
  console.log(`.output/store-assets/${file}`)
}

mkdirSync(OUT, { recursive: true })
const frame = readFileSync(path.join(SOURCES, 'screenshot.html'), 'utf8')
// sharp captures: they are scaled down into the frames
const context = await chromium.launchPersistentContext('', {
  channel: 'chromium',
  deviceScaleFactor: 2,
  args: [`--disable-extensions-except=${EXTENSION_DIR}`, `--load-extension=${EXTENSION_DIR}`]
})

try {
  const worker = context.serviceWorkers()[0] ?? (await context.waitForEvent('serviceworker'))
  const extensionId = new URL(worker.url()).host
  let heroShot: Buffer | undefined

  for (const shot of SHOTS) {
    const png = await shot.capture(context)
    heroShot ??= png
    const popup = shot.popup ? `<img src="${dataUrl(await popupImage(context, extensionId))}" alt="" />` : ''
    const html = frame
      .replaceAll('{{ICON}}', ICON)
      .replace('{{TITLE}}', shot.title)
      .replace('{{TEXT}}', shot.text)
      .replace('{{HOST}}', shot.host)
      .replace('{{SHOT}}', dataUrl(png))
      .replace('{{POPUP}}', popup)
      .replace('{{EXTRA}}', shot.extra ?? '')
    await render(context, html, 1280, 800, shot.file)
  }

  const tiles = [
    { file: 'small-tile-440x280.png', source: 'small-tile.html', width: 440, height: 280 },
    { file: 'marquee-1400x560.png', source: 'marquee.html', width: 1400, height: 560 }
  ]
  for (const tile of tiles) {
    const html = readFileSync(path.join(SOURCES, tile.source), 'utf8')
      .replaceAll('{{ICON}}', ICON)
      .replace('{{SHOT}}', heroShot ? dataUrl(heroShot) : '')
    await render(context, html, tile.width, tile.height, tile.file)
  }
} finally {
  await context.close()
}
