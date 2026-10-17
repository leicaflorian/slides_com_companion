import type { Page } from '@playwright/test'
import {
  expect,
  FULLSCREEN_URL,
  NO_SLIDE_IDS_URL,
  PRESENTATION_URL,
  printCalls,
  speakerNotes,
  storedNotes,
  storeSettings,
  stubPrint,
  test
} from './fixtures'

// SLConfig.deck.id of the saved presentation
const DECK_ID = '395083'
const toolbar = '.reveal #slides-extension .slc-toolbar'

function currentSlideId(page: Page): Promise<string> {
  return page.evaluate(() => window.Reveal.getCurrentSlide().getAttribute('data-id') as string)
}

async function openNotes(page: Page) {
  await page.locator(toolbar).hover()
  await page.getByRole('button', { name: 'Speaker Notes' }).click()

  return page.getByRole('textbox', { name: 'Notes for this slide' })
}

async function writeNote(page: Page, note: string) {
  const notes = await openNotes(page)
  await notes.fill(note)
  await page.getByRole('button', { name: 'Close notes' }).click()
}

async function openSpeakerView(page: Page) {
  const speakerView = page.waitForEvent('popup')
  await page.locator(toolbar).hover()
  await page.getByRole('button', { name: 'Speaker View' }).click()

  return speakerView
}

test('writes a note and shows it in the speaker view', async ({ context, serviceWorker }) => {
  const page = await context.newPage()
  await page.goto(PRESENTATION_URL)
  const slideId = await currentSlideId(page)

  await writeNote(page, 'Saluta il pubblico')
  const speakerView = await openSpeakerView(page)

  await expect.poll(() => speakerNotes(speakerView)).toBe('Saluta il pubblico')
  await expect.poll(() => storedNotes(serviceWorker, DECK_ID)).toEqual({ [slideId]: 'Saluta il pubblico' })
})

test('updates the open speaker view', async ({ context }) => {
  const page = await context.newPage()
  await page.goto(PRESENTATION_URL)
  const speakerView = await openSpeakerView(page)

  const notes = await openNotes(page)
  await notes.fill('Scritta con la vista relatore aperta')

  await expect.poll(() => speakerNotes(speakerView)).toBe('Scritta con la vista relatore aperta')
})

test('keeps notes after a reload', async ({ context }) => {
  const page = await context.newPage()
  await page.goto(PRESENTATION_URL)
  await writeNote(page, 'Resta dopo il reload')

  await page.reload()

  await expect(await openNotes(page)).toHaveValue('Resta dopo il reload')
})

test('does not move the presentation while typing', async ({ context }) => {
  const page = await context.newPage()
  await page.goto(PRESENTATION_URL)
  const indices = await page.evaluate(() => window.Reveal.getIndices())
  let popups = 0
  page.on('popup', () => popups++)

  const notes = await openNotes(page)
  await notes.focus()
  for (const key of ['ArrowRight', 'Space', 'f', 's', 'o', 'b']) {
    await page.keyboard.press(key)
  }

  expect(await page.evaluate(() => window.Reveal.getIndices())).toEqual(indices)
  expect(await page.evaluate(() => window.Reveal.isOverview())).toBe(false)
  expect(await page.evaluate(() => document.fullscreenElement)).toBeNull()
  expect(popups).toBe(0)

  await page.keyboard.press('Escape')

  await expect(page.getByRole('dialog', { name: 'Speaker notes' })).toHaveCount(0)
  expect(await page.evaluate(() => window.Reveal.getIndices())).toEqual(indices)
  expect(await page.evaluate(() => window.Reveal.isOverview())).toBe(false)
})

test('shows HTML in a note as text', async ({ context }) => {
  const page = await context.newPage()
  await page.goto(PRESENTATION_URL)

  await writeNote(page, 'Mostra <b>prima</b> & dopo')
  const speakerView = await openSpeakerView(page)

  await expect.poll(() => speakerNotes(speakerView)).toBe('Mostra <b>prima</b> & dopo')
  expect(await speakerView.locator('.speaker-controls-notes .value b').count()).toBe(0)
})

test('shares notes between the presentation and the fullscreen view', async ({ context }) => {
  const page = await context.newPage()
  await page.goto(PRESENTATION_URL)
  const slideId = await currentSlideId(page)
  await writeNote(page, 'Anche a schermo intero')

  await page.goto(FULLSCREEN_URL)

  await expect(page.locator(`.reveal .slides section[data-id="${slideId}"]`)).toHaveAttribute(
    'data-notes',
    'Anche a schermo intero'
  )
})

test('leaves the notes out of the print view', async ({ context }) => {
  const page = await context.newPage()
  await page.goto(PRESENTATION_URL)
  await writeNote(page, 'Non nel PDF')
  // printing is not called: only the page is checked
  await page.addInitScript(() => (window.print = () => {}))

  await page.goto(`${FULLSCREEN_URL}?print-pdf`)

  await expect(page.locator('.pdf-page').first()).toBeAttached()
  await expect(page.locator('.reveal #slides-extension')).toBeAttached()
  await expect(page.locator('.reveal .slides section[data-notes]')).toHaveCount(0)
  await expect(page.getByRole('button', { name: 'Speaker Notes' })).toHaveCount(0)
})

test('hides the Notes button with the toolbar', async ({ context, serviceWorker }) => {
  const page = await context.newPage()
  await page.goto(PRESENTATION_URL)
  const slideId = await currentSlideId(page)
  await writeNote(page, 'Con la barra spenta')
  await storeSettings(serviceWorker, { showToolbarOverlay: false })

  await page.reload()

  await expect(page.locator('.reveal #slides-extension')).toBeAttached()
  await expect(page.getByRole('button', { name: 'Speaker Notes' })).toHaveCount(0)
  await expect(page.locator(`.reveal .slides section[data-id="${slideId}"]`)).toHaveAttribute(
    'data-notes',
    'Con la barra spenta'
  )
})

test('saves a note typed right before printing', async ({ context, serviceWorker }) => {
  const page = await context.newPage()
  await stubPrint(page)
  await page.goto(PRESENTATION_URL)
  const slideId = await currentSlideId(page)

  const notes = await openNotes(page)
  await notes.fill('Scritta e subito stampata')
  await page.locator(toolbar).hover()
  await page.getByRole('button', { name: 'Print / Save as PDF' }).click()

  await expect.poll(() => printCalls(page)).toBe(1)
  expect(await storedNotes(serviceWorker, DECK_ID)).toEqual({ [slideId]: 'Scritta e subito stampata' })
})

test('keeps the notes written in two tabs of the same deck', async ({ context, serviceWorker }) => {
  const first = await context.newPage()
  await first.goto(PRESENTATION_URL)
  const second = await context.newPage()
  await second.goto(`${FULLSCREEN_URL}#/1`)
  const firstSlide = await currentSlideId(first)
  const secondSlide = await currentSlideId(second)

  await writeNote(second, 'Dalla scheda a schermo intero')
  await expect
    .poll(() => storedNotes(serviceWorker, DECK_ID))
    .toEqual({ [secondSlide]: 'Dalla scheda a schermo intero' })
  await writeNote(first, 'Dalla prima scheda')

  await expect
    .poll(() => storedNotes(serviceWorker, DECK_ID))
    .toEqual({ [secondSlide]: 'Dalla scheda a schermo intero', [firstSlide]: 'Dalla prima scheda' })
})

test('writes notes on a deck without slide ids', async ({ context, serviceWorker }) => {
  const page = await context.newPage()
  await page.goto(NO_SLIDE_IDS_URL)
  await writeNote(page, 'Prima slide')
  await page.evaluate(() => window.Reveal.next())
  await writeNote(page, 'Seconda slide')

  const speakerView = await openSpeakerView(page)

  await expect.poll(() => speakerNotes(speakerView)).toBe('Seconda slide')
  await expect
    .poll(() => storedNotes(serviceWorker, '381389'))
    .toEqual({ '0/0': 'Prima slide', '1/0': 'Seconda slide' })
})
