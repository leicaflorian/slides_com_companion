<script lang="ts">
import {  defineComponent, onMounted, Ref, ref, watch } from 'vue'
import { defaultSettings, ValidSettings } from '../composables/Settings'

export default defineComponent({
  setup () {
    const settings: Ref<ValidSettings> = ref({ ...defaultSettings })

    watch(() => settings.value, () => {
      chrome.storage.sync.set({ 'settings': settings.value })
    }, { deep: true })

    onMounted(() => {
      chrome.storage.sync.get('settings', function (items) {
        let _settings = items.settings

        console.log('loaded settings', _settings)

        if (!_settings) {
          _settings = { ...defaultSettings }
        }

        settings.value = _settings
      })
    })

    return {
      settings
    }
  }
})
</script>

<template>
  <div style="width: 400px">
    <div class="row">
      <h4 class="px-4 py-2 text-white d-flex align-items-center" style="background-color: var(--primary)">
        <div class="flex-fill">
          <strong>Slides.com</strong> Companion
        </div>

        <!--        <a href="#" @click.prevent="resetOptions" class="btn btn-link text-white" title="Reset settings">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" fill="currentColor" width="20px">
                    <path
                        d="M480 256c0 123.4-100.5 223.9-223.9 223.9c-48.84 0-95.17-15.58-134.2-44.86c-14.12-10.59-16.97-30.66-6.375-44.81c10.59-14.12 30.62-16.94 44.81-6.375c27.84 20.91 61 31.94 95.88 31.94C344.3 415.8 416 344.1 416 256s-71.69-159.8-159.8-159.8c-37.46 0-73.09 13.49-101.3 36.64l45.12 45.14c17.01 17.02 4.955 46.1-19.1 46.1H35.17C24.58 224.1 16 215.5 16 204.9V59.04c0-24.04 29.07-36.08 46.07-19.07l47.6 47.63C149.9 52.71 201.5 32.11 256.1 32.11C379.5 32.11 480 132.6 480 256z"/>
                  </svg>
                </a>-->
      </h4>
    </div>

    <ul class="list-group list-group-flush">
      <li class="list-group-item form-check ">
        <div class="form-switch mb-1">
          <input class="form-check-input me-1" type="checkbox" value="" id="showToolbarOverlaySwitch"
                 v-model="settings.showToolbarOverlay">
          <label class="form-check-label" for="firstCheckbox">Show toolbar overlay</label>
        </div>
        <img src="/assets/options/toggle-toolbar-overlay.gif" style="min-width: 250px;" class="img-fluid border">
      </li>
      <li class="list-group-item form-check ">
        <div class="form-switch mb-1">
          <input class="form-check-input me-1" type="checkbox" value="" id="debugSwitch"
                 v-model="settings.debug">
          <label class="form-check-label" for="firstCheckbox">Debug</label>
        </div>
      </li>
    </ul>
  </div>
</template>

<style lang="scss">
@import "../../node_modules/bootstrap/dist/css/bootstrap.min.css";

:root {
  --primary: #e6637c;
}

</style>
