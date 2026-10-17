<script lang="ts">
import { defineComponent, onMounted, type Ref, ref } from 'vue'
import { Settings, type ValidSettings } from '@/shared/settings'
import { isPrintUrl, printUrl } from '@/shared/print'

const PRINTING_FROM_BUTTON = 'slc-print-from-button'

interface PrintFlag {
  printUrl: string
  returnUrl: string
}

function readPrintFlag(): PrintFlag | undefined {
  try {
    return JSON.parse(sessionStorage.getItem(PRINTING_FROM_BUTTON) ?? '') as PrintFlag
  } catch {
    return undefined
  }
}

export default defineComponent({
  setup() {
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
      if (isPrintUrl(window.location.href)) {
        triggerPrint()
        return
      }

      const flag: PrintFlag = { printUrl: printUrl(window.location.href), returnUrl: window.location.href }

      sessionStorage.setItem(PRINTING_FROM_BUTTON, JSON.stringify(flag))
      window.location.assign(flag.printUrl)
    }

    function onSpeakerViewClick() {
      window.Reveal.getPlugin('notes').open()
    }

    function afterPrinting() {
      // back to where the button was clicked, only if the print view was opened by the button
      if (returnUrl) {
        window.location.replace(returnUrl)
      }
    }

    function triggerPrint() {
      window.addEventListener('afterprint', afterPrinting)

      // Wait for the initial animation to complete before printing
      setTimeout(() => {
        window.print()
      }, 500)
    }

    // the button stores the print URL it opens and the page to return to; read once and cleared
    // on every load, so a print that never finished cannot send a later ?print-pdf page back
    const flag = readPrintFlag()
    const returnUrl = flag?.printUrl === window.location.href ? flag.returnUrl : undefined
    sessionStorage.removeItem(PRINTING_FROM_BUTTON)

    onMounted(() => {
      if (isPrintUrl(window.location.href)) {
        triggerPrint()
      }
    })

    return {
      settings,
      onPrintClick,
      onSpeakerViewClick
    }
  }
})
</script>

<template>
  <div v-if="settings && settings.showToolbarOverlay" class="slc-toolbar">
    <span class="slc-chevron" aria-hidden="true">
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2.5"
        stroke-linecap="round"
        stroke-linejoin="round"
      >
        <path d="M15 6l-6 6 6 6" />
      </svg>
    </span>

    <button type="button" class="slc-button" aria-label="Print / Save as PDF" @click="onPrintClick">
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
        aria-hidden="true"
      >
        <path d="M6 9V3h12v6" />
        <rect x="3" y="9" width="18" height="8" rx="2" />
        <rect x="7" y="14" width="10" height="7" rx="1" />
      </svg>
      <span class="slc-label">Print</span>
    </button>

    <button type="button" class="slc-button" aria-label="Speaker View" @click="onSpeakerViewClick">
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
        aria-hidden="true"
      >
        <rect x="2" y="4" width="13" height="10" rx="1.5" />
        <rect x="17" y="6" width="5" height="6" rx="1" />
        <path d="M5 18h14M8 21h8" />
      </svg>
      <span class="slc-label">Speaker</span>
    </button>
  </div>
</template>
