import { expect, FULLSCREEN_URL, PRESENTATION_URL, printCalls, storeSettings, stubPrint, test } from './fixtures'

const toolbar = '.reveal #slides-extension .slc-toolbar'

test('mounts the toolbar inside the presentation', async ({ context }) => {
  const page = await context.newPage()

  await page.goto(PRESENTATION_URL)

  await expect(page.locator(toolbar)).toBeVisible()
})

test('is closed until hovered', async ({ context }) => {
  const page = await context.newPage()

  await page.goto(PRESENTATION_URL)

  await expect(page.locator(toolbar)).not.toHaveCSS('transform', 'none')
})

test('opens on keyboard focus', async ({ context }) => {
  const page = await context.newPage()
  await page.goto(PRESENTATION_URL)

  await page.getByRole('button', { name: 'Print / Save as PDF' }).focus()

  await expect(page.locator(toolbar)).toHaveCSS('transform', 'none')
})

test('closes when the mouse leaves after a click', async ({ context }) => {
  const page = await context.newPage()
  await page.goto(PRESENTATION_URL)
  await page.locator(toolbar).hover()
  const speakerView = page.waitForEvent('popup')
  await page.getByRole('button', { name: 'Speaker View' }).click()
  await (await speakerView).close()

  await page.mouse.move(100, 400)

  await expect(page.locator(toolbar)).not.toHaveCSS('transform', 'none')
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
  const page = await context.newPage()
  await stubPrint(page)
  await page.goto(`${PRESENTATION_URL}#/2`)

  await page.locator(toolbar).hover()
  await page.getByRole('button', { name: 'Print / Save as PDF' }).click()

  // the presentation page prints the rest of the page too, so printing goes through the fullscreen view
  await expect(page).toHaveURL(`${FULLSCREEN_URL}?print-pdf#/2`)
  await expect.poll(() => printCalls(page)).toBe(1)
})

test('returns to the presentation after printing from the toolbar', async ({ context }) => {
  const page = await context.newPage()
  await stubPrint(page, { afterprint: true })
  await page.goto(`${PRESENTATION_URL}#/2`)

  await page.locator(toolbar).hover()
  await page.getByRole('button', { name: 'Print / Save as PDF' }).click()

  await expect.poll(() => printCalls(page)).toBe(1)
  await expect(page).toHaveURL(`${PRESENTATION_URL}#/2`)
  await expect(page.locator(toolbar)).toBeVisible()
})

test('prints from the fullscreen view', async ({ context }) => {
  // Slides.com's fullscreen view drops ?print-pdf on pdf-ready; the extension stops that event
  const page = await context.newPage()
  await stubPrint(page)
  await page.goto(`${FULLSCREEN_URL}#/2`)

  await page.locator(toolbar).hover()
  await page.getByRole('button', { name: 'Print / Save as PDF' }).click()

  await expect.poll(() => printCalls(page)).toBe(1)
  await expect(page).toHaveURL(`${FULLSCREEN_URL}?print-pdf#/2`)
  await expect(page.locator('.pdf-page').first()).toBeAttached()
})

test('returns to the fullscreen view after printing it', async ({ context }) => {
  const page = await context.newPage()
  await stubPrint(page, { afterprint: true })
  await page.goto(`${FULLSCREEN_URL}#/2`)

  await page.locator(toolbar).hover()
  await page.getByRole('button', { name: 'Print / Save as PDF' }).click()

  await expect.poll(() => printCalls(page)).toBe(1)
  await expect(page).toHaveURL(`${FULLSCREEN_URL}#/2`)
})

test('stays in print view when opened with ?print-pdf', async ({ context }) => {
  const page = await context.newPage()
  await stubPrint(page, { afterprint: true })

  await page.goto(`${PRESENTATION_URL}?print-pdf`)

  await expect.poll(() => printCalls(page)).toBe(1)
  await page.waitForTimeout(500)
  await expect(page).toHaveURL(`${PRESENTATION_URL}?print-pdf`)
})

test('ignores a print started from the button that never finished', async ({ context }) => {
  const page = await context.newPage()
  await page.goto(PRESENTATION_URL)
  // as when a print started from the button on another presentation never finished
  await page.evaluate(() =>
    sessionStorage.setItem(
      'slc-print-from-button',
      JSON.stringify({
        printUrl: 'https://slides.com/other/deck?print-pdf',
        returnUrl: 'https://slides.com/other/deck'
      })
    )
  )
  await stubPrint(page, { afterprint: true })

  await page.goto(`${PRESENTATION_URL}?print-pdf`)

  await expect.poll(() => printCalls(page)).toBe(1)
  await page.waitForTimeout(500)
  await expect(page).toHaveURL(`${PRESENTATION_URL}?print-pdf`)
})

test('prints again from the toolbar in print view', async ({ context }) => {
  const page = await context.newPage()
  await stubPrint(page)
  await page.goto(`${PRESENTATION_URL}?print-pdf#/2`)
  await expect.poll(() => printCalls(page)).toBe(1)

  await page.locator(toolbar).hover()
  await page.getByRole('button', { name: 'Print / Save as PDF' }).click()

  await expect.poll(() => printCalls(page)).toBe(2)
  await expect(page).toHaveURL(`${PRESENTATION_URL}?print-pdf#/2`)
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
  await page.getByRole('button', { name: 'Speaker View' }).click()

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

test('links to a new GitHub issue from the popup', async ({ context, extensionId }) => {
  const popup = await context.newPage()

  await popup.goto(`chrome-extension://${extensionId}/popup.html`)

  const link = popup.getByRole('link', { name: 'Report a problem on GitHub' })
  await expect(link).toHaveAttribute('target', '_blank')
  const href = new URL((await link.getAttribute('href')) ?? '')
  expect(href.origin + href.pathname).toBe('https://github.com/leicaflorian/slides_com_companion/issues/new')
  expect(href.searchParams.get('body')).toContain('Extension version: 1.5.0')
})
