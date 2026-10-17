import path from 'node:path'
import { PRESENTATION_URL, test } from './fixtures'

// Not a test: `npm run toolbar-image` runs it to export the toolbar image shown in the popup.
test.skip(!process.env.UPDATE_TOOLBAR_IMAGE, 'run with npm run toolbar-image')

test('exports the toolbar image for the popup', async ({ context }) => {
  const page = await context.newPage()
  await page.setViewportSize({ width: 1280, height: 720 })
  await page.goto(PRESENTATION_URL)
  await page.getByRole('button', { name: 'Print / Save as PDF' }).hover()
  await page.waitForTimeout(500)

  const box = await page.locator('#slides-extension .slc-toolbar').boundingBox()

  if (!box) {
    throw new Error('Toolbar not found')
  }

  // the open toolbar with a margin of slide around it, as it appears on a presentation
  await page.screenshot({
    path: path.resolve('public/options/toolbar.png'),
    clip: { x: box.x - 60, y: box.y - 20, width: box.width + 60, height: box.height + 40 }
  })
})
