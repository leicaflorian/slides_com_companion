import { defineConfig } from 'wxt'

export default defineConfig({
  srcDir: 'src',
  modules: ['@wxt-dev/module-vue'],
  manifest: {
    name: 'Slides.com Companion',
    description: 'Chrome/Edge extension that aims to add a few missing features (free) to Slides.com presentations.',
    icons: {
      16: 'icons/16x16.png',
      32: 'icons/32x32.png',
      72: 'icons/72x72.png',
      96: 'icons/96x96.png',
      128: 'icons/128x128.png'
    },
    action: {
      default_icon: {
        16: 'icons/16x16.png',
        32: 'icons/32x32.png'
      }
    },
    permissions: ['tabs', 'activeTab', 'scripting', 'storage'],
    host_permissions: ['*://slides.com/*'],
    web_accessible_resources: [
      {
        resources: ['icons/*.png', 'options/toggle-toolbar-overlay.gif', 'injected.js'],
        matches: ['https://slides.com/*'],
        use_dynamic_url: true
      }
    ]
  }
})
