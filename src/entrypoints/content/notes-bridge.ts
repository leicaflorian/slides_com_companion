import { browser } from 'wxt/browser'
import { Log } from '@/shared/log'
import { type DeckNotes, notesKey, withNote } from '@/shared/notes'

interface NotesRequest {
  deckId: string
}

interface NoteRequest extends NotesRequest {
  slideId: string
  text: string
}

/**
 * Saves the note of one slide into the stored notes of the deck, so that two tabs of the same deck
 * (the presentation and its fullscreen view) never overwrite each other's notes
 */
async function saveNote({ deckId, slideId, text }: NoteRequest): Promise<void> {
  const key = notesKey(deckId)
  const data = await browser.storage.local.get(key)
  const notes = withNote((data[key] as DeckNotes | undefined) ?? {}, slideId, text)

  if (Object.keys(notes).length) {
    await browser.storage.local.set({ [key]: notes })
  } else {
    await browser.storage.local.remove(key)
  }
}

/**
 * The injected script runs in the page and cannot reach chrome.storage:
 * it asks for the notes of a deck, and saves the note of a slide, through events on the bridge script
 */
export function bridgeNotes(script: HTMLElement): void {
  // one save at a time: each one reads the notes the previous one wrote
  let saving = Promise.resolve()

  script.addEventListener('getNotes', async (e) => {
    const { deckId } = (e as CustomEvent<NotesRequest>).detail
    const key = notesKey(deckId)
    const data = await browser.storage.local.get(key)

    script.dispatchEvent(
      new CustomEvent('getNotes-response', {
        detail: { deckId, notes: (data[key] as DeckNotes | undefined) ?? {} }
      })
    )
  })

  script.addEventListener('setNote', (e) => {
    const request = (e as CustomEvent<NoteRequest>).detail

    saving = saving.then(() => saveNote(request)).catch((error) => Log.error('Saving a note failed', error))
  })
}
