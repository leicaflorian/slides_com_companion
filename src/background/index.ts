import { defaultSettings } from '../composables/Settings'

interface CheckSlidePageResult {
  frameId: number;
  result?: { embed: boolean, fullscreen: boolean };
}

type ChromeTab = chrome.tabs.Tab

let currentTab: ChromeTab

async function getCurrentTab (): Promise<ChromeTab> {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
  
  currentTab = tab
  
  return tab
}

/**
 * @returns {Promise<CheckSlidePageResult[]>}
 */
async function checkSlidePage (tabId: number): Promise<CheckSlidePageResult[]> {
  return chrome.scripting.executeScript(
    {
      target: { tabId },
      func: () => {
        // if fullscreen
        return {
          fullscreen: !!document.querySelector('body.reveal-viewport > .reveal .slides'),
          embed: !!document.querySelector('#main > .marquee > .reveal-frame > .reveal-viewport > .reveal .slides')
        }
      }
    })
}

/**
 *
 * @param {number} tabId
 * @throws {PromiseRejectionEvent}
 */
async function isValidSlidesPage (tabId: number): Promise<void> {
  const checkResult = (await checkSlidePage(tabId))[0]
  const result = checkResult.result
  
  if (!result || (!result.embed && !result.fullscreen)) {
    return Promise.reject()
  }
}

async function enableIcon () {
  await chrome.action.enable()
  chrome.action.setIcon({ path: '/assets/icons/16x16.png' })
  await chrome.action.setBadgeText({ text: 'Print' })
  await chrome.action.setBadgeBackgroundColor({ color: 'green' })
}

async function disableIcon () {
  await chrome.action.disable()
  chrome.action.setIcon({ path: '/assets/icons/icon-disabled.png' })
  await chrome.action.setBadgeText({ text: '' })
  await chrome.action.setBadgeBackgroundColor({ color: 'green' })
}

async function checkCurrentTab (tab: ChromeTab | null = null) {
  const currentTab: ChromeTab = tab ?? await getCurrentTab()
  
  /*await new Promise((resolve) => {
    setTimeout(() => {
      resolve(true)
    }, 1000)
  })*/
  
  if (!currentTab) {
    return
  }
  
  const url = currentTab.url
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  const tabId: number = currentTab.id || currentTab.tabId
  
  if (!url) {
    return
  }
  
  try {
    if (url.match(/http(s|):\/\/slides\.com/)) {
      await isValidSlidesPage(tabId)
      
      await enableIcon()
    } else {
      await disableIcon()
    }
  } catch (er) {
    await disableIcon()
  }
}

chrome.tabs.onCreated.addListener(() => checkCurrentTab())
chrome.tabs.onActivated.addListener(() => checkCurrentTab())
chrome.tabs.onAttached.addListener(() => checkCurrentTab())
chrome.tabs.onUpdated.addListener(() => checkCurrentTab())

chrome.runtime.onInstalled.addListener(function (details) {
  if (details.reason == 'install') {
    console.log('This is a first install!')
    chrome.storage.sync.set({ 'options': defaultSettings })
  } else if (details.reason == 'update') {
    //
  }
})

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('receiving message', message)
  
  switch (message) {
    case'inject':
      chrome.scripting.executeScript(
        {
          target: { tabId: currentTab.id as number },
          files: ['injectable/index.js'],
          world: 'MAIN'
        },
        () => {
          console.log('script.js executed')
        })
      break
  }
})


