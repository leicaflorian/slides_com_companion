import { browser } from 'wxt/browser'
import { defineBackground } from 'wxt/utils/define-background'
import { checkCurrentTab } from '@/background/tab-state'
import { defaultSettings } from '@/shared/settings'

export default defineBackground(() => {
  browser.tabs.onCreated.addListener(() => checkCurrentTab())
  browser.tabs.onActivated.addListener(() => checkCurrentTab())
  browser.tabs.onAttached.addListener(() => checkCurrentTab())
  browser.tabs.onUpdated.addListener(() => checkCurrentTab())

  browser.runtime.onInstalled.addListener(function (details) {
    if (details.reason == 'install') {
      console.log('This is a first install!')
      browser.storage.sync.set({ settings: defaultSettings })
    } else if (details.reason == 'update') {
      //
    }
  })

  browser.runtime.onMessage.addListener((message, sender) => {
    console.log('receiving message', message)

    switch (message) {
      case 'inject':
        if (sender.tab?.id === undefined) {
          break
        }

        browser.scripting.executeScript(
          {
            target: { tabId: sender.tab.id },
            files: ['/injected.js'],
            world: 'MAIN'
          },
          () => {
            console.log('script.js executed')
          }
        )
        break
    }
  })
})
