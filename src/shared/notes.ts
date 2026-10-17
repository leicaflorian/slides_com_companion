/**
 * Speaker notes written in the extension, for each slide of a deck, by the slide's key: its data-id or,
 * on decks whose slides have none, its position (see useSpeakerNotes).
 * Without a subscription Slides.com neither saves notes nor sends them to the page.
 */
export type DeckNotes = Record<string, string>

// where applyNotes keeps the note Slides.com put on the slide, to restore it
const ORIGINAL_NOTES = 'data-slc-original-notes'

const ESCAPES: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;'
}

export function notesKey(deckId: string): string {
  return `notes:${deckId}`
}

/**
 * The notes plugin shows data-notes with innerHTML, so a note is escaped to be read as typed
 */
export function escapeNotes(text: string): string {
  return text.replace(/[&<>"']/g, (char) => ESCAPES[char] ?? char)
}

export function withNote(notes: DeckNotes, slideId: string, text: string): DeckNotes {
  const others = { ...notes }

  delete others[slideId]

  return text.trim() ? { ...others, [slideId]: text } : others
}

/**
 * Writes the notes in data-notes, where the speaker view reads them.
 * A slide without an own note keeps the note Slides.com gave it, if any.
 */
export function applyNotes(
  slides: Iterable<Element>,
  notes: DeckNotes,
  slideKey: (slide: Element) => string | undefined = (slide) => slide.getAttribute('data-id') ?? undefined
): void {
  for (const slide of slides) {
    const slideId = slideKey(slide)

    if (!slideId) {
      continue
    }

    // recorded on the first call only, before data-notes holds an own note; empty when there was none
    if (!slide.hasAttribute(ORIGINAL_NOTES)) {
      slide.setAttribute(ORIGINAL_NOTES, slide.getAttribute('data-notes') ?? '')
    }

    const note = notes[slideId]
    const original = slide.getAttribute(ORIGINAL_NOTES)

    if (note !== undefined) {
      slide.setAttribute('data-notes', escapeNotes(note))
    } else if (original) {
      slide.setAttribute('data-notes', original)
    } else {
      slide.removeAttribute('data-notes')
    }
  }
}
