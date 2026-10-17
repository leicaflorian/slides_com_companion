import { beforeEach, describe, expect, it, vi } from 'vitest'
import { browser, type Browser } from 'wxt/browser'
import { fakeBrowser } from 'wxt/testing/fake-browser'
import { checkCurrentTab } from '@/background/tab-state'
import { defaultSettings } from '@/shared/settings'
import background from '@/entrypoints/background'

describe('background', () => {
  beforeEach(() => {
    fakeBrowser.reset()
    // not implemented by fakeBrowser
    vi.spyOn(fakeBrowser.tabs.onAttached, 'addListener').mockImplementation(() => {})
    background.main()
  })

  it('stores the defaults under "settings" on first install', async () => {
    await fakeBrowser.runtime.onInstalled.trigger({ reason: 'install' } as never)

    expect(await fakeBrowser.storage.sync.get(['settings', 'options'])).toEqual({ settings: defaultSettings })
  })

  it('injects into the tab that sent the message', async () => {
    vi.spyOn(browser.action, 'disable').mockResolvedValue(undefined)
    vi.spyOn(browser.action, 'setIcon').mockResolvedValue(undefined)
    vi.spyOn(browser.action, 'setBadgeText').mockResolvedValue(undefined)
    vi.spyOn(browser.action, 'setBadgeBackgroundColor').mockResolvedValue(undefined)
    vi.spyOn(browser.tabs, 'query').mockResolvedValue([{ id: 1, url: 'https://example.com/' }] as never)
    // the last tab read by the background is tab 1
    await checkCurrentTab()
    const executeScript = vi.spyOn(browser.scripting, 'executeScript').mockResolvedValue([] as never)

    await fakeBrowser.runtime.onMessage.trigger('inject', { tab: { id: 2 } as Browser.tabs.Tab }, () => {})

    expect(executeScript).toHaveBeenCalledWith(
      expect.objectContaining({ target: { tabId: 2 }, files: ['/injected.js'], world: 'MAIN' }),
      expect.any(Function)
    )
  })

  it('injects nothing for a message without a tab', async () => {
    const executeScript = vi.spyOn(browser.scripting, 'executeScript').mockResolvedValue([] as never)

    await fakeBrowser.runtime.onMessage.trigger('inject', {}, () => {})

    expect(executeScript).not.toHaveBeenCalled()
  })
})
