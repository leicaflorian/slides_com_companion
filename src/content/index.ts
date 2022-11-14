import { Log } from '../utilities/Log'

interface SLCEvent extends HTMLElementEventMap {
  detail: any
}

let reloadAsap = false

/**
 * start pinging until on the page does not appear a presentation
 * This may occur when a presentation is password protected and the user must log in
 */
function checkForPresentation (): void {
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

function injectScripts () {
  Log.info('Injecting scripts')
  
  const script = document.createElement('script')
  script.id = 'slc-injected-script'
  script.setAttribute('extension-id', chrome.runtime.id)
  document.body.appendChild(script)
  
  script.addEventListener('getSettings', async () => {
    const data = await chrome.storage.sync.get('settings')
    
    script.dispatchEvent(new CustomEvent('getSettings-response', {
      detail: {
        settings: data.settings
      }
    }))
  })
  
  script.addEventListener('setSettings', async (e) => {
    const details = (e as CustomEvent).detail
    
    await chrome.storage.sync.set(details)
  })
  
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area === 'sync' && changes.settings?.newValue) {
      script.dispatchEvent(new CustomEvent('settingsChanged', {
        detail: {
          settings: changes.settings.newValue
        }
      }))
    }
  })
  
  // inject the necessary scripts on the page
  setTimeout(() => {
    chrome.runtime.sendMessage('inject')
  }, 300)
}

checkForPresentation()
