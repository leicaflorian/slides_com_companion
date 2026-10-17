import { type Ref, ref, watch } from 'vue'
import { applyNotes, type DeckNotes, withNote } from '@/shared/notes'
import { NotesStore } from '@/shared/notes-store'
import { isPrintUrl } from '@/shared/print'

declare global {
  interface Window {
    SLConfig?: { deck?: { id?: string | number } }
  }
}

const SAVE_DELAY = 500

export interface SpeakerNotes {
  // false in print view, without SLConfig.deck.id, or until the notes are loaded
  available: Ref<boolean>
  // key of the current slide: its data-id, or its position "h/v" on decks whose slides have none
  slideId: Ref<string | undefined>
  // note of the current slide; writing to it schedules the save
  text: Ref<string>
  // saves now if a save is pending
  flush(): void
}

interface PendingSave {
  slideId: string
  text: string
  timer: ReturnType<typeof setTimeout>
}

/**
 * Puts the notes stored by the extension in data-notes, where Reveal's notes plugin reads them,
 * and saves the note of the current slide as it is written
 */
export function useSpeakerNotes(reveal = window.Reveal, store?: NotesStore): SpeakerNotes {
  const available = ref(false)
  const slideId = ref<string>()
  const text = ref('')
  const deckId = window.SLConfig?.deck?.id
  let notes: DeckNotes = {}
  let pending: PendingSave | undefined

  function slideKey(slide: Element): string {
    if (slide.hasAttribute('data-id')) {
      return slide.getAttribute('data-id') as string
    }

    const { h, v } = reveal.getIndices(slide)

    return `${h}/${v ?? 0}`
  }

  function applyAll() {
    applyNotes(reveal.getSlides(), notes, slideKey)
  }

  function showCurrentSlide() {
    const slide = reveal.getCurrentSlide()

    slideId.value = slide ? slideKey(slide) : undefined
    text.value = slideId.value ? (notes[slideId.value] ?? '') : ''
  }

  function save(id: string, note: string) {
    notes = withNote(notes, id, note)
    store?.save(id, note)
    applyAll()
    // one of the events on which the notes plugin sends the current notes to an open speaker view
    reveal.dispatchEvent({ target: reveal.getRevealElement(), type: 'resumed' })
  }

  function flush() {
    if (!pending) {
      return
    }

    const { slideId: id, text: note, timer } = pending

    clearTimeout(timer)
    pending = undefined
    save(id, note)
  }

  if (deckId === undefined || isPrintUrl(window.location.href)) {
    return { available, slideId, text, flush }
  }

  store ??= new NotesStore(String(deckId))

  // a reload, a closed tab or the Print button must not drop the last 500 ms of writing
  window.addEventListener('pagehide', flush)
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') {
      flush()
    }
  })

  // sync, so that showing another slide's note is never taken for an edit
  watch(
    text,
    (note) => {
      const id = slideId.value

      if (!available.value || !id || note === (pending?.slideId === id ? pending.text : (notes[id] ?? ''))) {
        return
      }

      if (pending) {
        clearTimeout(pending.timer)
      }

      pending = { slideId: id, text: note, timer: setTimeout(flush, SAVE_DELAY) }
    },
    { flush: 'sync' }
  )

  void store.load().then((loaded) => {
    notes = loaded
    applyAll()
    showCurrentSlide()
    available.value = true

    reveal.on('slidechanged', () => {
      flush()
      showCurrentSlide()
    })
  })

  return { available, slideId, text, flush }
}
