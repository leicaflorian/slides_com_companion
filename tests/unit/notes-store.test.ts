import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { NotesStore } from '@/shared/notes-store'

describe('NotesStore', () => {
  let bridge: HTMLScriptElement

  beforeEach(() => {
    bridge = document.createElement('script')
    bridge.id = 'slc-injected-script'
    document.body.appendChild(bridge)
  })

  afterEach(() => {
    bridge.remove()
  })

  function respond(deckId: string, notes: Record<string, string>) {
    bridge.dispatchEvent(new CustomEvent('getNotes-response', { detail: { deckId, notes } }))
  }

  it('loads the notes of its deck', async () => {
    const onGet = vi.fn()
    bridge.addEventListener('getNotes', (e) => onGet((e as CustomEvent).detail))

    const loaded = new NotesStore('1').load()
    respond('1', { a: 'Ciao' })

    expect(onGet).toHaveBeenCalledWith({ deckId: '1' })
    expect(await loaded).toEqual({ a: 'Ciao' })
  })

  it('ignores the answer for another deck', async () => {
    const loaded = new NotesStore('1').load()
    const onLoaded = vi.fn()
    void loaded.then(onLoaded)

    respond('2', { b: 'x' })
    await Promise.resolve()
    expect(onLoaded).not.toHaveBeenCalled()

    respond('1', { a: 'Ciao' })
    expect(await loaded).toEqual({ a: 'Ciao' })
  })

  it('saves the note of one slide of its deck', () => {
    const onSet = vi.fn()
    bridge.addEventListener('setNote', (e) => onSet((e as CustomEvent).detail))

    new NotesStore('1').save('a', 'x')

    expect(onSet).toHaveBeenCalledWith({ deckId: '1', slideId: 'a', text: 'x' })
  })
})
