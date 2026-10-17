import { defineContentScript } from 'wxt/utils/define-content-script'
import { isPrintUrl } from '@/shared/print'

/**
 * Slides.com's fullscreen view listens to Reveal's pdf-ready event and removes print-pdf from the URL,
 * which reloads the page and closes the print dialog. This runs in the page before Slides.com's code
 * and stops the event in the capture phase, so the print view stays.
 */
export default defineContentScript({
  matches: ['*://slides.com/*'],
  world: 'MAIN',
  runAt: 'document_start',
  main() {
    if (!isPrintUrl(window.location.href)) {
      return
    }

    window.addEventListener('pdf-ready', (event) => event.stopImmediatePropagation(), true)
  }
})
