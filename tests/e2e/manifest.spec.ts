import { expect, test } from './fixtures'

test('describes the extension in the store summary', async ({ serviceWorker }) => {
  const manifest = await serviceWorker.evaluate(() => chrome.runtime.getManifest())

  expect(manifest.description).toBe(
    'Print or save any Slides.com presentation as PDF and open the speaker view, for free.'
  )
  expect(manifest.description?.length).toBeLessThanOrEqual(132)
})

test('names the extension in the action title', async ({ serviceWorker }) => {
  const manifest = await serviceWorker.evaluate(() => chrome.runtime.getManifest())

  expect(manifest.action?.default_title).toBe('Slides.com Companion')
})

test('asks only for the permissions it uses', async ({ serviceWorker }) => {
  const manifest = await serviceWorker.evaluate(() => chrome.runtime.getManifest())

  expect([...(manifest.permissions ?? [])].sort()).toEqual(['scripting', 'storage', 'tabs'])
  expect(manifest.host_permissions).toEqual(['*://slides.com/*'])
})

test('has no debug switch in the popup', async ({ context, extensionId }) => {
  const popup = await context.newPage()

  await popup.goto(`chrome-extension://${extensionId}/popup.html`)

  await expect(popup.getByLabel('Show toolbar overlay')).toBeAttached()
  await expect(popup.getByText('Debug')).toHaveCount(0)
})
