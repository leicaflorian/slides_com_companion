<script lang="ts">
import { defineComponent, onMounted, type Ref, ref } from 'vue'
import { Settings, type ValidSettings } from '@/shared/settings'
import { isPrintUrl, normalUrl, printUrl } from './print'

const PRINTING_FROM_BUTTON = 'slc-print-from-button'

export default defineComponent({
  setup() {
    const toolbar = ref()
    const active = ref(false)
    const settingsInstance = new Settings()
    const settings: Ref<ValidSettings | undefined> = ref()

    settingsInstance.addListener('settingsLoaded', (newSettings: ValidSettings) => {
      settings.value = newSettings
    })

    settingsInstance.addListener('settingsChanged', (newSettings: ValidSettings) => {
      settings.value = newSettings
    })

    /**
     * Slides.com no longer lets Reveal be set up again in print view, so the presentation
     * is reloaded with ?print-pdf and onMounted prints it
     */
    function onPrintClick() {
      sessionStorage.setItem(PRINTING_FROM_BUTTON, '1')
      window.location.assign(printUrl(window.location.href))
    }

    function onSpeakerViewClick() {
      window.Reveal.getPlugin('notes').open()
    }

    function afterPrinting() {
      // back to the presentation only if the print view was opened by the button
      if (sessionStorage.getItem(PRINTING_FROM_BUTTON)) {
        sessionStorage.removeItem(PRINTING_FROM_BUTTON)
        window.location.replace(normalUrl(window.location.href))
      }
    }

    function triggerPrint() {
      window.addEventListener('afterprint', afterPrinting)

      // Wait for the initial animation to complete before printing
      setTimeout(() => {
        window.print()
      }, 500)
    }

    onMounted(() => {
      if (isPrintUrl(window.location.href)) {
        triggerPrint()
      }
    })

    return {
      active,
      toolbar,
      settings,
      onPrintClick,
      onSpeakerViewClick
    }
  }
})
</script>

<template>
  <div
    v-if="settings && settings.showToolbarOverlay"
    ref="toolbar"
    class="toolbar"
    :class="{ active: active }"
    @mouseover="active = true"
    @mouseout="active = false"
  >
    <div class="toolbar-content">
      <div class="icon icon-static">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 512" style="fill: currentColor">
          <path
            d="M192 448c-8.188 0-16.38-3.125-22.62-9.375l-160-160c-12.5-12.5-12.5-32.75 0-45.25l160-160c12.5-12.5 32.75-12.5 45.25 0s12.5 32.75 0 45.25L77.25 256l137.4 137.4c12.5 12.5 12.5 32.75 0 45.25C208.4 444.9 200.2 448 192 448z"
          />
        </svg>
      </div>

      <button class="btn" @click="onPrintClick">
        <i class="icon">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" fill="currentColor">
            <path
              d="M448 192H64C28.65 192 0 220.7 0 256v96c0 17.67 14.33 32 32 32h32v96c0 17.67 14.33 32 32 32h320c17.67 0 32-14.33 32-32v-96h32c17.67 0 32-14.33 32-32V256C512 220.7 483.3 192 448 192zM384 448H128v-96h256V448zM432 296c-13.25 0-24-10.75-24-24c0-13.27 10.75-24 24-24s24 10.73 24 24C456 285.3 445.3 296 432 296zM128 64h229.5L384 90.51V160h64V77.25c0-8.484-3.375-16.62-9.375-22.62l-45.25-45.25C387.4 3.375 379.2 0 370.8 0H96C78.34 0 64 14.33 64 32v128h64V64z"
            />
          </svg>
        </i>

        <span class="title">Print</span>
      </button>
      <button class="btn" @click="onSpeakerViewClick">
        <i class="icon">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" fill="currentColor">
            <path
              d="M0 219.2v212.5c0 14.25 11.62 26.25 26.5 27C75.32 461.2 180.2 471.3 240 511.9V245.2C181.4 205.5 79.99 194.8 29.84 192C13.59 191.1 0 203.6 0 219.2zM482.2 192c-50.09 2.848-151.3 13.47-209.1 53.09C272.1 245.2 272 245.3 272 245.5v266.5c60.04-40.39 164.7-50.76 213.5-53.28C500.4 457.9 512 445.9 512 431.7V219.2C512 203.6 498.4 191.1 482.2 192zM352 96c0-53-43-96-96-96S160 43 160 96s43 96 96 96S352 149 352 96z"
            />
          </svg>
        </i>

        <span class="title">Speaker View</span>
      </button>
    </div>
  </div>
</template>
