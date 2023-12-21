<script lang="ts">
import { defineComponent, onMounted, Ref, ref } from 'vue'
import { Settings, ValidSettings } from '../composables/Settings'

export default defineComponent({
  setup () {
    const toolbar = ref()
    const active = ref(false)
    const settingsInstance = new Settings()
    const settings: Ref<ValidSettings | undefined> = ref()

    settingsInstance.addListener('settingsLoaded', (newSettings) => {
      settings.value = newSettings
    })

    settingsInstance.addListener('settingsChanged', (newSettings) => {
      settings.value = newSettings
    })

    function onPrintClick () {
      // window.Reveal.configure({ view: 'print' })
      // window.Reveal.initialize().then(() => {
      // window.SL.view.init()
      window.SL.util.setupReveal({ view: 'print' })

      const slidesEl = document.querySelector('.slides') as HTMLElement

      if (slidesEl) {
        // remove the transform to avoid the slides to be cropped
        slidesEl.style.transform = ''
      }

      setTimeout(() => {
        window.print()
      }, 500)

      // wait for the rerendering of the view
      window.addEventListener('afterprint', function () {
        window.location.reload()
      })
    }

    function onSpeakerViewClick () {
      window.Reveal.getPlugin('notes').open()
    }

    function afterPrinting () {
      const searchParams = (new URL(window.location.toString())).searchParams

      if (searchParams.has('print-pdf')) {
        // window.history.back()
      }
    }

    function triggerPrint () {
      window.addEventListener('afterprint', afterPrinting)

      // Wait for the initial animation to complete before printing
      setTimeout(() => {
        window.print()
      }, 500)
    }

    onMounted(() => {
      const url = new URL(window.location.toString())
      const searchParams = url.searchParams

      if (searchParams.has('print-pdf')) {
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
  <div class="toolbar" ref="toolbar"
       :class="{'active': active}"
       @mouseover="active = true" @mouseout="active = false"
       v-if="settings && settings.showToolbarOverlay">
    <div class="toolbar-content">
      <div class="icon icon-static">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 512" style="fill: currentColor">
          <path
              d="M192 448c-8.188 0-16.38-3.125-22.62-9.375l-160-160c-12.5-12.5-12.5-32.75 0-45.25l160-160c12.5-12.5 32.75-12.5 45.25 0s12.5 32.75 0 45.25L77.25 256l137.4 137.4c12.5 12.5 12.5 32.75 0 45.25C208.4 444.9 200.2 448 192 448z"/>
        </svg>
      </div>

      <button @click="onPrintClick" class="btn">
        <i class="icon">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" fill="currentColor">
            <path
                d="M448 192H64C28.65 192 0 220.7 0 256v96c0 17.67 14.33 32 32 32h32v96c0 17.67 14.33 32 32 32h320c17.67 0 32-14.33 32-32v-96h32c17.67 0 32-14.33 32-32V256C512 220.7 483.3 192 448 192zM384 448H128v-96h256V448zM432 296c-13.25 0-24-10.75-24-24c0-13.27 10.75-24 24-24s24 10.73 24 24C456 285.3 445.3 296 432 296zM128 64h229.5L384 90.51V160h64V77.25c0-8.484-3.375-16.62-9.375-22.62l-45.25-45.25C387.4 3.375 379.2 0 370.8 0H96C78.34 0 64 14.33 64 32v128h64V64z"/>
          </svg>
        </i>

        <span class="title">Print</span>
      </button>
      <button @click="onSpeakerViewClick" class="btn">
        <i class="icon">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" fill="currentColor">
            <path
                d="M0 219.2v212.5c0 14.25 11.62 26.25 26.5 27C75.32 461.2 180.2 471.3 240 511.9V245.2C181.4 205.5 79.99 194.8 29.84 192C13.59 191.1 0 203.6 0 219.2zM482.2 192c-50.09 2.848-151.3 13.47-209.1 53.09C272.1 245.2 272 245.3 272 245.5v266.5c60.04-40.39 164.7-50.76 213.5-53.28C500.4 457.9 512 445.9 512 431.7V219.2C512 203.6 498.4 191.1 482.2 192zM352 96c0-53-43-96-96-96S160 43 160 96s43 96 96 96S352 149 352 96z"/>
          </svg>
        </i>

        <span class="title">Speaker View</span>
      </button>
    </div>
  </div>
</template>

<style lang="scss">
:root {
  --primary: #e6637c;
}

@media only print {
  #slides-extension {
    display: none;
  }
}

.reveal.has-dark-background {
  #slides-extension {
    .toolbar {
      background: rgba(255, 255, 255, .1);
    }

    .icon {
      color: white;
    }
  }
}

#slides-extension {
  position: absolute;
  top: 10px;
  right: 0;
  z-index: 99999999;

  * {
    box-sizing: border-box;
  }

  .btn {
    --size: 40px;
    --icon-size: 30px;

    height: var(--size);
    display: flex;
    align-items: center;
    justify-content: center;
    background: transparent;
    color: white;
    transition: all .2s;
    border: 1px solid transparent;
    position: relative;
    overflow: hidden;
    border-radius: .5rem;
    cursor: pointer;

    .icon {
      width: var(--icon-size);
      height: var(--icon-size);
    }

    .title {
      width: 100%;
      position: absolute;
      bottom: 0;
      left: 0;
      padding: 2px 0;
      font-size: .6rem;
      background: red;
      font-style: normal;
      opacity: 0;
      transform: translateY(100%);
      transition: all .2s;
      color: white;
    }

    &:hover {
      background-color: var(--primary);
      border-color: rgba(255, 255, 255, .5);

      .title {
        opacity: 1;
        transform: translateY(0);
      }
    }
  }

  .icon {
    width: 40px;
    height: 40px;
    display: inline-block;
    overflow: hidden;
    position: relative;
    transition: all .2s;

    &.icon-static {
      opacity: .2;
    }

    svg {
      width: 100%;
      height: 100%;
    }
  }

  .toolbar {
    padding: 1rem 0rem;
    transform: translateX(calc(100% - 40px));
    transition: all .3s ease-out;
    background: rgba(0, 0, 0, .1);
    display: flex;
    color: black;
    border-top-left-radius: 1rem;
    border-bottom-left-radius: 1rem;
    align-items: center;

    &.active {
      background: rgba(0, 0, 0, .5);
      transform: translateX(0);
      color: white;
      padding-left: 1rem;
    }

    .toolbar-content {
      padding: 0 1rem 0 0;
      display: flex;
      gap: 1rem;
    }
  }
}

</style>

