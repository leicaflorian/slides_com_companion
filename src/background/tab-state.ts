import { browser, type Browser } from 'wxt/browser'

interface CheckSlidePageResult {
  frameId: number
  result?: { embed: boolean; fullscreen: boolean }
}

type ChromeTab = Browser.tabs.Tab

export async function getCurrentTab(): Promise<ChromeTab | undefined> {
  const [tab] = await browser.tabs.query({ active: true, currentWindow: true })

  return tab
}

/**
 * @returns {Promise<CheckSlidePageResult[]>}
 */
export async function checkSlidePage(tabId: number): Promise<CheckSlidePageResult[]> {
  return browser.scripting.executeScript({
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
async function isValidSlidesPage(tabId: number): Promise<void> {
  const checkResult = (await checkSlidePage(tabId))[0]
  const result = checkResult?.result

  if (!result || (!result.embed && !result.fullscreen)) {
    return Promise.reject()
  }
}

async function enableIcon() {
  await browser.action.enable()
  browser.action.setIcon({ path: '/icons/16x16.png' })
  await browser.action.setBadgeText({ text: 'Print' })
  await browser.action.setBadgeBackgroundColor({ color: 'green' })
}

async function disableIcon() {
  await browser.action.disable()
  browser.action.setIcon({ path: '/icons/icon-disabled.png' })
  await browser.action.setBadgeText({ text: '' })
  await browser.action.setBadgeBackgroundColor({ color: 'green' })
}

export async function checkCurrentTab(tab: ChromeTab | null = null) {
  const currentTab = tab ?? (await getCurrentTab())

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
  } catch {
    await disableIcon()
  }
}
