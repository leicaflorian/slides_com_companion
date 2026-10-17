import { Log } from './log'
import type { DeckNotes } from './notes'

/**
 * The notes of a deck, read and saved by the content script (see content/notes-bridge.ts)
 */
export class NotesStore {
  private eventListenerTarget = document.getElementById('slc-injected-script')

  constructor(private deckId: string) {}

  load(): Promise<DeckNotes> {
    Log.info('Loading the notes of deck', this.deckId)

    return new Promise((resolve) => {
      const onResponse = (e: Event) => {
        const details = (e as CustomEvent).detail

        if (details?.deckId === this.deckId) {
          this.eventListenerTarget?.removeEventListener('getNotes-response', onResponse)
          resolve(details.notes ?? {})
        }
      }

      this.eventListenerTarget?.addEventListener('getNotes-response', onResponse)
      this.eventListenerTarget?.dispatchEvent(new CustomEvent('getNotes', { detail: { deckId: this.deckId } }))
    })
  }

  // the content script merges it into the stored notes (see content/notes-bridge.ts)
  save(slideId: string, text: string): void {
    Log.info('Saving a note of deck', this.deckId)

    this.eventListenerTarget?.dispatchEvent(
      new CustomEvent('setNote', { detail: { deckId: this.deckId, slideId, text } })
    )
  }
}
