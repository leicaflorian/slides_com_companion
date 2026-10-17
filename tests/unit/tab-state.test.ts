import { beforeEach, describe, expect, it, vi } from 'vitest'
import { browser, type Browser } from 'wxt/browser'
import { fakeBrowser } from 'wxt/testing/fake-browser'
import { checkCurrentTab } from '@/background/tab-state'

type ScriptResult = { fullscreen: boolean; embed: boolean }

function tab(url: string | undefined): Browser.tabs.Tab {
  return { id: 1, url } as Browser.tabs.Tab
}

function stubAction() {
  return {
    enable: vi.spyOn(browser.action, 'enable').mockResolvedValue(undefined),
    disable: vi.spyOn(browser.action, 'disable').mockResolvedValue(undefined),
    setIcon: vi.spyOn(browser.action, 'setIcon').mockResolvedValue(undefined),
    setBadgeText: vi.spyOn(browser.action, 'setBadgeText').mockResolvedValue(undefined),
    setBadgeBackgroundColor: vi.spyOn(browser.action, 'setBadgeBackgroundColor').mockResolvedValue(undefined)
  }
}

function stubPresentation(result: ScriptResult) {
  return vi
    .spyOn(browser.scripting, 'executeScript')
    .mockResolvedValue([{ frameId: 0, result, documentId: 'doc' }] as never)
}

describe('checkCurrentTab', () => {
  beforeEach(() => {
    fakeBrowser.reset()
  })

  it('disables the action on a non-slides.com url', async () => {
    const action = stubAction()

    await checkCurrentTab(tab('https://example.com/'))

    expect(action.disable).toHaveBeenCalled()
    expect(action.setIcon).toHaveBeenCalledWith({ path: '/icons/icon-disabled.png' })
    expect(action.setBadgeText).toHaveBeenCalledWith({ text: '' })
    expect(action.enable).not.toHaveBeenCalled()
  })

  it('enables the action on a fullscreen presentation', async () => {
    const action = stubAction()
    stubPresentation({ fullscreen: true, embed: false })

    await checkCurrentTab(tab('https://slides.com/user/deck'))

    expect(action.enable).toHaveBeenCalled()
    expect(action.setIcon).toHaveBeenCalledWith({ path: '/icons/16x16.png' })
    expect(action.setBadgeText).toHaveBeenCalledWith({ text: 'Print' })
    expect(action.setBadgeBackgroundColor).toHaveBeenCalledWith({ color: 'green' })
  })

  it('enables the action on an embedded presentation', async () => {
    const action = stubAction()
    stubPresentation({ fullscreen: false, embed: true })

    await checkCurrentTab(tab('https://slides.com/user/deck'))

    expect(action.enable).toHaveBeenCalled()
    expect(action.setBadgeText).toHaveBeenCalledWith({ text: 'Print' })
  })

  it('disables the action on slides.com without a presentation', async () => {
    const action = stubAction()
    stubPresentation({ fullscreen: false, embed: false })

    await checkCurrentTab(tab('https://slides.com/'))

    expect(action.disable).toHaveBeenCalled()
    expect(action.enable).not.toHaveBeenCalled()
  })

  it('disables the action when the script cannot run', async () => {
    const action = stubAction()
    vi.spyOn(browser.scripting, 'executeScript').mockRejectedValue(new Error('Cannot access contents of the page'))

    await checkCurrentTab(tab('https://slides.com/user/deck'))

    expect(action.disable).toHaveBeenCalled()
    expect(action.enable).not.toHaveBeenCalled()
  })

  it('does nothing for a tab without url', async () => {
    const action = stubAction()

    await checkCurrentTab(tab(undefined))

    expect(action.enable).not.toHaveBeenCalled()
    expect(action.disable).not.toHaveBeenCalled()
  })

  it('reads the active tab when none is given', async () => {
    const action = stubAction()
    vi.spyOn(browser.tabs, 'query').mockResolvedValue([tab('https://example.com/')] as never)

    await checkCurrentTab()

    expect(action.disable).toHaveBeenCalled()
  })
})
