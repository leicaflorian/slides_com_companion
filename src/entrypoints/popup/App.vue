<script lang="ts">
import { browser } from 'wxt/browser'
import { defineComponent, onMounted, type Ref, ref, watch } from 'vue'
import { defaultSettings, type ValidSettings } from '@/shared/settings'

const ISSUES_URL = 'https://github.com/leicaflorian/slides_com_companion/issues/new'

/**
 * New GitHub issue with the extension version and the browser already filled in
 */
function issueUrl(): string {
  const body = [
    'What happened, and on which presentation (link)?',
    '',
    '',
    '---',
    `Extension version: ${browser.runtime.getManifest().version}`,
    `Browser: ${navigator.userAgent}`
  ].join('\n')

  return `${ISSUES_URL}?${new URLSearchParams({ body })}`
}

export default defineComponent({
  setup() {
    const settings: Ref<ValidSettings> = ref({ ...defaultSettings })

    watch(
      () => settings.value,
      () => {
        browser.storage.sync.set({ settings: settings.value })
      },
      { deep: true }
    )

    onMounted(() => {
      browser.storage.sync.get('settings', function (items) {
        let _settings = items.settings as ValidSettings | undefined

        console.log('loaded settings', _settings)

        if (!_settings) {
          _settings = { ...defaultSettings }
        }

        settings.value = _settings
      })
    })

    return {
      settings,
      issueUrl: issueUrl()
    }
  }
})
</script>

<template>
  <div style="width: 400px">
    <div class="row">
      <h4 class="px-4 py-2 text-white d-flex align-items-center" style="background-color: var(--primary)">
        <div class="flex-fill"><strong>Slides.com</strong> Companion</div>

        <!--        <a href="#" @click.prevent="resetOptions" class="btn btn-link text-white" title="Reset settings">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" fill="currentColor" width="20px">
                    <path
                        d="M480 256c0 123.4-100.5 223.9-223.9 223.9c-48.84 0-95.17-15.58-134.2-44.86c-14.12-10.59-16.97-30.66-6.375-44.81c10.59-14.12 30.62-16.94 44.81-6.375c27.84 20.91 61 31.94 95.88 31.94C344.3 415.8 416 344.1 416 256s-71.69-159.8-159.8-159.8c-37.46 0-73.09 13.49-101.3 36.64l45.12 45.14c17.01 17.02 4.955 46.1-19.1 46.1H35.17C24.58 224.1 16 215.5 16 204.9V59.04c0-24.04 29.07-36.08 46.07-19.07l47.6 47.63C149.9 52.71 201.5 32.11 256.1 32.11C379.5 32.11 480 132.6 480 256z"/>
                  </svg>
                </a>-->
      </h4>
    </div>

    <ul class="list-group list-group-flush">
      <li class="list-group-item form-check">
        <div class="form-switch mb-1">
          <input
            id="showToolbarOverlaySwitch"
            v-model="settings.showToolbarOverlay"
            class="form-check-input me-1"
            type="checkbox"
            value=""
          />
          <label class="form-check-label" for="firstCheckbox">Show toolbar overlay</label>
        </div>
        <img src="/options/toolbar.png" style="min-width: 250px" class="img-fluid border" />
      </li>
      <li class="list-group-item form-check">
        <div class="form-switch mb-1">
          <input id="debugSwitch" v-model="settings.debug" class="form-check-input me-1" type="checkbox" value="" />
          <label class="form-check-label" for="firstCheckbox">Debug</label>
        </div>
      </li>
    </ul>

    <div class="px-3 py-2 border-top small">
      <a :href="issueUrl" target="_blank" rel="noopener" class="link-secondary">Report a problem on GitHub</a>
    </div>
  </div>
</template>

<style lang="scss">
@import 'bootstrap/dist/css/bootstrap.min.css';

:root {
  --primary: #d75d73;
}

.form-check-input:checked {
  background-color: var(--primary);
  border-color: var(--primary);
}

.form-check-input:focus {
  border-color: var(--primary);
  box-shadow: 0 0 0 0.25rem rgba(215, 93, 115, 0.25);
}
</style>
