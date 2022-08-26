import { Log } from '../utilities/Log'
import EventEmitter from 'events'

export interface ValidSettings {
  showToolbarOverlay: boolean,
  debug: boolean,
}

export const defaultSettings: ValidSettings = {
  showToolbarOverlay: true,
  debug: false
}

export class Settings extends EventEmitter {
  private _settings: ValidSettings = { ...defaultSettings }
  private eventListenerTarget
  
  constructor (settings?: ValidSettings) {
    super()
    
    this.eventListenerTarget = document.getElementById('slc-injected-script')
    
    if (settings) {
      Object.assign(this._settings, settings)
    }
    
    this.eventListenerTarget?.addEventListener('getSettings-response', (e) => {
      const details = (e as CustomEvent).detail
      
      Log.info('Receiving response for "Loading stored settings"', details)
      
      // if there are stored settings, store them inside the class
      // otherwise save the default settings
      if (details?.settings) {
        this._settings = details.settings
        this.emit('settingsLoaded', this._settings)
      } else {
        this.saveStoredSettings()
      }
    })
    
    this.eventListenerTarget?.addEventListener('settingsChanged', (e) => this.onSettingsChanged(e as CustomEvent))
    
    this.loadStoredSettings()
  }
  
  onSettingsChanged (e: CustomEvent) {
    const details = e.detail
    
    Log.info('Settings has changed', details)
    
    if (details?.settings) {
      this._settings = details.settings
      
      this.emit('settingsChanged', this._settings)
    }
  }
  
  loadStoredSettings () {
    Log.info('Loading stored settings')
    
    this.eventListenerTarget?.dispatchEvent(new CustomEvent('getSettings'))
  }
  
  saveStoredSettings () {
    Log.info('Saving stored settings')
    
    this.eventListenerTarget?.dispatchEvent(new CustomEvent('setSettings', { detail: { settings: this._settings } }))
  }
  
  get settings () {
    return this._settings
  }
}

