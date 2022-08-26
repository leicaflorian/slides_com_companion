import App from './App.vue'
import RevealNotes from './revealPlugins/notes/notes.js'
import { createApp } from 'vue'
import { Log } from '../utilities/Log'

declare global {
  interface Window {
    Reveal: any
  }
}

/**
 * Slides.com internally uses [Reveal.js framework](https://revealjs.com/)
 * so we can access its API using the Reveal global object
 */
const Slides = window.Reveal

/**
 * start pinging until on the page does not appear a presentation
 * This may occur when a presentation is password protected and the user must first login
 */
function checkForSlides (): void {
  if (typeof window.Reveal === 'undefined') {
    Log.info('Slides not found, waiting for them to be available')
    
    setTimeout(checkForSlides, 500)
    return
  }
  
  Slides.on('ready', () => {
    Log.info('Starting Vue')
    
    // Register notes plugin to enable speaker view
    Slides.registerPlugin(RevealNotes)
    
    initVue()
  })
}

function initVue () {
  const parent = document.querySelector('.reveal-viewport > .reveal') as HTMLElement
  const vueContainer = document.createElement('div')
  
  if (!parent) {
    return
  }

  vueContainer.id = 'slides-extension'
  
  parent.appendChild(vueContainer)
  
  createApp(App).mount('#' + vueContainer.id)
}

checkForSlides()
