import { expect, PRESENTATION_URL, printCalls, storeSettings, stubPrint, test } from './fixtures'

const toolbar = '.reveal #slides-extension .toolbar'

test('mounts the toolbar inside the presentation', async ({ context }) => {
  const page = await context.newPage()

  await page.goto(PRESENTATION_URL)

  await expect(page.locator(toolbar)).toBeVisible()
})

test('uses the defaults when nothing is stored', async ({ context, serviceWorker }) => {
  // as after an update from 1.3.5, which stored the defaults under "options"
  await serviceWorker.evaluate(() => chrome.storage.sync.clear())
  const page = await context.newPage()

  await page.goto(PRESENTATION_URL)

  await expect(page.locator(toolbar)).toBeVisible()
  await expect
    .poll(() => serviceWorker.evaluate(() => chrome.storage.sync.get('settings')))
    .toEqual({ settings: { showToolbarOverlay: true, debug: false } })
})

test('hides the toolbar when showToolbarOverlay is false', async ({ context, serviceWorker }) => {
  await storeSettings(serviceWorker, { showToolbarOverlay: false, debug: false })
  const page = await context.newPage()

  await page.goto(PRESENTATION_URL)

  await expect(page.locator('.reveal #slides-extension')).toBeAttached()
  await expect(page.locator(toolbar)).toHaveCount(0)
})

test('shows the toolbar when the popup turns it on', async ({ context, serviceWorker, extensionId }) => {
  await storeSettings(serviceWorker, { showToolbarOverlay: false, debug: false })
  const page = await context.newPage()
  await page.goto(PRESENTATION_URL)
  await expect(page.locator('.reveal #slides-extension')).toBeAttached()

  const popup = await context.newPage()
  await popup.goto(`chrome-extension://${extensionId}/popup.html`)
  await expect(popup.locator('#showToolbarOverlaySwitch')).not.toBeChecked()
  await popup.locator('#showToolbarOverlaySwitch').click()

  await expect(page.locator(toolbar)).toBeVisible()
})

test('prints from the toolbar', async ({ context }) => {
  // 1.3.5 too: on today's slides.com SL.util.setupReveal throws "Reveal.js has already been initialized",
  // so print is never called. Known defect, to be fixed in a later phase.
  test.fail()
  const page = await context.newPage()
  await stubPrint(page)
  await page.goto(PRESENTATION_URL)

  await page.locator(toolbar).hover()
  await page.locator(`${toolbar} button`, { hasText: 'Print' }).click()

  await expect.poll(() => printCalls(page)).toBe(1)
  expect(await page.locator('.slides').evaluate((el) => (el as HTMLElement).style.transform)).toBe('')
})

test('prints on its own with ?print-pdf', async ({ context }) => {
  const page = await context.newPage()
  await stubPrint(page)

  await page.goto(`${PRESENTATION_URL}?print-pdf`)

  await expect.poll(() => printCalls(page)).toBe(1)
})

test('opens the speaker view', async ({ context }) => {
  const page = await context.newPage()
  await page.goto(PRESENTATION_URL)

  await page.locator(toolbar).hover()
  const speakerView = page.waitForEvent('popup')
  await page.locator(`${toolbar} button`, { hasText: 'Speaker View' }).click()

  expect(await speakerView).toBeTruthy()
})

test('reloads when the presentation appears later', async ({ context }) => {
  let documents = 0
  await context.route(PRESENTATION_URL, (route) => {
    documents++

    // first visit: a page without a presentation, as behind a password
    return documents === 1
      ? route.fulfill({ contentType: 'text/html', body: '<body>Password</body>' })
      : route.fallback()
  })
  const page = await context.newPage()
  await page.goto(PRESENTATION_URL)

  const reloaded = page.waitForEvent('load')
  await page.evaluate(() => {
    document.body.innerHTML = '<div class="reveal-viewport"><div class="reveal"></div></div>'
  })
  await reloaded

  await expect(page.locator(toolbar)).toBeVisible()
  expect(documents).toBe(2)
})
