import { Settings } from '../composables/Settings'

enum LogType {
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error',
}

export class Log {
  // private static settingsInstance: Settings
  
  private static execLog (type: LogType, ...message: any) {
    const prefix = 'SLC -'
    
   /* if (chrome.storage) {
      console.log('storage available')
    } else {
      this.settingsInstance = new Settings()
    }
    
    console.log(this.settingsInstance.settings)*/
    
    console[type](prefix, ...message)
  }
  
  static info (...message: any) {
    this.execLog(LogType.INFO, ...message)
  }
  
  static warn (...message: any) {
    this.execLog(LogType.WARN, ...message)
  }
  
  static error (...message: any) {
    this.execLog(LogType.ERROR, ...message)
  }
}
