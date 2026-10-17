import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fakeBrowser } from 'wxt/testing/fake-browser'
import { bridgeNotes } from '@/entrypoints/content/notes-bridge'

describe('bridgeNotes', () => {
  let script: HTMLScriptElement

  beforeEach(() => {
    fakeBrowser.reset()
    script = document.createElement('script')
    bridgeNotes(script)
  })

  function response(): Promise<unknown> {
    return new Promise((resolve) => {
      script.addEventListener('getNotes-response', (e) => resolve((e as CustomEvent).detail), { once: true })
    })
  }

  it('answers getNotes with the stored notes of the deck', async () => {
    await fakeBrowser.storage.local.set({ 'notes:1': { a: 'Ciao' } })
    const answer = response()

    script.dispatchEvent(new CustomEvent('getNotes', { detail: { deckId: '1' } }))

    expect(await answer).toEqual({ deckId: '1', notes: { a: 'Ciao' } })
  })

  it('answers getNotes with no notes when nothing is stored', async () => {
    const answer = response()

    script.dispatchEvent(new CustomEvent('getNotes', { detail: { deckId: '1' } }))

    expect(await answer).toEqual({ deckId: '1', notes: {} })
  })

  function setNote(slideId: string, text: string) {
    script.dispatchEvent(new CustomEvent('setNote', { detail: { deckId: '1', slideId, text } }))
  }

  it('merges the note of one slide into the stored notes', async () => {
    // as written by another tab of the same deck
    await fakeBrowser.storage.local.set({ 'notes:1': { a: 'Ciao' } })

    setNote('b', 'Due')

    await vi.waitFor(async () =>
      expect(await fakeBrowser.storage.local.get('notes:1')).toEqual({ 'notes:1': { a: 'Ciao', b: 'Due' } })
    )
  })

  it('keeps both notes saved one right after the other', async () => {
    setNote('a', 'Ciao')
    setNote('b', 'Due')

    await vi.waitFor(async () =>
      expect(await fakeBrowser.storage.local.get('notes:1')).toEqual({ 'notes:1': { a: 'Ciao', b: 'Due' } })
    )
  })

  it('removes a blank note, and the deck when no note is left', async () => {
    await fakeBrowser.storage.local.set({ 'notes:1': { a: 'Ciao' } })

    setNote('a', '  ')

    await vi.waitFor(async () => expect(await fakeBrowser.storage.local.get('notes:1')).toEqual({}))
  })

  it('does not use chrome.storage.sync', async () => {
    setNote('a', 'Ciao')

    await vi.waitFor(async () => expect(await fakeBrowser.storage.local.get('notes:1')).not.toEqual({}))
    expect(await fakeBrowser.storage.sync.get(null)).toEqual({})
  })
})
