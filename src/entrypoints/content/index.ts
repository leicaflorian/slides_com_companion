import { browser } from 'wxt/browser'
import { defineContentScript } from 'wxt/utils/define-content-script'
import { Log } from '@/shared/log'
import { bridgeNotes } from './notes-bridge'
import './style.scss'

let reloadAsap = false

/**
 * start pinging until on the page does not appear a presentation
 * This may occur when a presentation is password protected and the user must log in
 */
function checkForPresentation(): void {
  if (!document.querySelector('.reveal-viewport > .reveal')) {
    Log.info('Presentation not found, trying again in 1000ms')

    reloadAsap = true

    setTimeout(checkForPresentation, 1000)
    return
  }

  if (reloadAsap) {
    window.location.reload()
  }

  // inject the scripts only if there is a presentation on the page
  injectScripts()
}

function injectScripts() {
  Log.info('Injecting scripts')

  const script = document.createElement('script')
  script.id = 'slc-injected-script'
  script.setAttribute('extension-id', browser.runtime.id)
  document.body.appendChild(script)

  script.addEventListener('getSettings', async () => {
    const data = await browser.storage.sync.get('settings')

    script.dispatchEvent(
      new CustomEvent('getSettings-response', {
        detail: {
          settings: data.settings
        }
      })
    )
  })

  script.addEventListener('setSettings', async (e) => {
    const details = (e as CustomEvent).detail

    await browser.storage.sync.set(details)
  })

  browser.storage.onChanged.addListener((changes, area) => {
    if (area === 'sync' && changes.settings?.newValue) {
      script.dispatchEvent(
        new CustomEvent('settingsChanged', {
          detail: {
            settings: changes.settings.newValue
          }
        })
      )
    }
  })

  bridgeNotes(script)

  // inject the necessary scripts on the page
  setTimeout(() => {
    browser.runtime.sendMessage('inject')
  }, 300)
}

export default defineContentScript({
  matches: ['*://slides.com/*'],
  main() {
    checkForPresentation()
  }
})
