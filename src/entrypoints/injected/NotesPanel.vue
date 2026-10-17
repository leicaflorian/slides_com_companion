<script lang="ts">
import { computed, defineComponent, onBeforeUnmount, onMounted, type PropType, ref } from 'vue'
import type { SpeakerNotes } from './useSpeakerNotes'

export default defineComponent({
  props: {
    notes: {
      type: Object as PropType<SpeakerNotes>,
      required: true
    }
  },
  emits: ['close'],
  setup(props, { emit }) {
    const textarea = ref<HTMLTextAreaElement>()
    const slideId = computed(() => props.notes.slideId.value)
    const text = computed({
      get: () => props.notes.text.value,
      set: (value: string) => {
        // text is the composable's ref: writing to it is how a note is saved (see useSpeakerNotes)
        // eslint-disable-next-line vue/no-mutating-props
        props.notes.text.value = value
      }
    })

    /**
     * Keys stop here, so that typing does not reach Reveal's shortcuts (arrows, space, f, s, o…)
     */
    function onKeydown(e: KeyboardEvent) {
      e.stopPropagation()

      if (e.key === 'Escape') {
        emit('close')
      }
    }

    onMounted(() => {
      textarea.value?.focus()
    })

    onBeforeUnmount(() => {
      props.notes.flush()
    })

    return {
      textarea,
      slideId,
      text,
      onKeydown
    }
  }
})
</script>

<template>
  <div
    class="slc-notes"
    role="dialog"
    aria-label="Speaker notes"
    @keydown="onKeydown"
    @keypress.stop
    @keyup.stop
    @wheel.stop
  >
    <div class="slc-notes-header">
      <span class="slc-notes-title">Notes</span>
      <button type="button" class="slc-notes-close" aria-label="Close notes" @click="$emit('close')">
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          aria-hidden="true"
        >
          <path d="M6 6l12 12M18 6L6 18" />
        </svg>
      </button>
    </div>

    <textarea
      ref="textarea"
      v-model="text"
      class="slc-notes-text"
      aria-label="Notes for this slide"
      rows="8"
      :disabled="!slideId"
    ></textarea>
    <p v-if="!slideId" class="slc-notes-empty">This slide can't have notes.</p>
  </div>
</template>
