import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { defaultSettings, Settings, type ValidSettings } from '@/shared/settings'

const stored: ValidSettings = { showToolbarOverlay: false, debug: true }

describe('Settings', () => {
  let bridge: HTMLScriptElement

  beforeEach(() => {
    vi.spyOn(console, 'info').mockImplementation(() => {})
    bridge = document.createElement('script')
    bridge.id = 'slc-injected-script'
    document.body.appendChild(bridge)
  })

  afterEach(() => {
    bridge.remove()
  })

  function respond(settings: ValidSettings | undefined) {
    bridge.dispatchEvent(new CustomEvent('getSettings-response', { detail: { settings } }))
  }

  it('asks for stored settings on creation', () => {
    const onGet = vi.fn()
    bridge.addEventListener('getSettings', onGet)

    new Settings()

    expect(onGet).toHaveBeenCalledTimes(1)
  })

  it('emits settingsLoaded with the stored settings', () => {
    const settings = new Settings()
    const onLoaded = vi.fn()
    settings.on('settingsLoaded', onLoaded)

    respond(stored)

    expect(onLoaded).toHaveBeenCalledWith(stored)
    expect(settings.settings).toEqual(stored)
  })

  it('saves the defaults when nothing is stored', () => {
    const onSet = vi.fn()
    bridge.addEventListener('setSettings', (e) => onSet((e as CustomEvent).detail))
    const settings = new Settings()

    respond(undefined)

    expect(onSet).toHaveBeenCalledWith({ settings: defaultSettings })
    expect(settings.settings).toEqual(defaultSettings)
  })

  it('emits settingsChanged on a change', () => {
    const settings = new Settings()
    const onChanged = vi.fn()
    settings.on('settingsChanged', onChanged)

    bridge.dispatchEvent(new CustomEvent('settingsChanged', { detail: { settings: stored } }))

    expect(onChanged).toHaveBeenCalledWith(stored)
    expect(settings.settings).toEqual(stored)
  })
})
