import { createApp } from 'vue'
import App from './App.vue'

(function () {
  if (window.location.host !== 'slides.com') {
    return
  }
  
  const interval = setInterval(() => {
    console.log('trying to start vue')
    initializeVue()
  }, 400)
  
  function initializeVue () {
    const parent = document.querySelector('.reveal-viewport > .reveal') as HTMLElement
    const vueContainer = document.createElement('div')
    
    if (!parent) {
      return
    }
    
    clearInterval(interval)
    
    vueContainer.id = 'slides-extension'
    
    parent.appendChild(vueContainer)
    
    createApp(App).mount('#slides-extension')
  }
})()
