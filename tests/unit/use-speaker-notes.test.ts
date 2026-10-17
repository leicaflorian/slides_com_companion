import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { DeckNotes } from '@/shared/notes'
import type { NotesStore } from '@/shared/notes-store'
import { useSpeakerNotes } from '@/entrypoints/injected/useSpeakerNotes'

function fakeReveal(slideIds: (string | undefined)[]) {
  const root = document.createElement('div')
  const slides = slideIds.map((id) => {
    const section = document.createElement('section')
    if (id) {
      section.setAttribute('data-id', id)
    }
    root.appendChild(section)

    return section
  })
  const listeners: Record<string, (() => void)[]> = {}
  let current = slides[0]

  return {
    slides,
    on: (type: string, listener: () => void) => (listeners[type] ??= []).push(listener),
    getSlides: () => slides,
    getCurrentSlide: () => current,
    getIndices: (slide = current) => ({ h: slides.indexOf(slide!), v: 0 }),
    getRevealElement: () => root,
    dispatchEvent: vi.fn(),
    goTo(index: number) {
      current = slides[index]
      listeners.slidechanged?.forEach((listener) => listener())
    }
  }
}

function fakeStore(stored: DeckNotes) {
  return { load: vi.fn(() => Promise.resolve(stored)), save: vi.fn() }
}

describe('useSpeakerNotes', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.spyOn(console, 'info').mockImplementation(() => {})
    vi.stubGlobal('SLConfig', { deck: { id: 395083 } })
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.unstubAllGlobals()
  })

  async function setup(stored: DeckNotes = {}) {
    const reveal = fakeReveal(['a', 'b'])
    const store = fakeStore(stored)
    const notes = useSpeakerNotes(reveal, store as unknown as NotesStore)
    await vi.waitFor(() => expect(notes.available.value).toBe(true))

    return { reveal, store, notes }
  }

  it('loads the notes and writes them in data-notes', async () => {
    const { reveal, notes } = await setup({ a: 'Ciao', b: 'Due' })

    expect(reveal.slides[0]!.getAttribute('data-notes')).toBe('Ciao')
    expect(reveal.slides[1]!.getAttribute('data-notes')).toBe('Due')
    expect(notes.slideId.value).toBe('a')
    expect(notes.text.value).toBe('Ciao')
  })

  it('does nothing in the print view', async () => {
    vi.stubGlobal('location', { href: 'https://slides.com/news/deck/fullscreen?print-pdf' })
    const reveal = fakeReveal(['a'])
    const store = fakeStore({ a: 'Ciao' })

    const notes = useSpeakerNotes(reveal, store as unknown as NotesStore)
    await vi.runAllTimersAsync()

    expect(notes.available.value).toBe(false)
    expect(store.load).not.toHaveBeenCalled()
    expect(reveal.slides[0]!.hasAttribute('data-notes')).toBe(false)
  })

  it('does nothing without a deck id', async () => {
    vi.stubGlobal('SLConfig', undefined)
    const reveal = fakeReveal(['a'])
    const store = fakeStore({ a: 'Ciao' })

    const notes = useSpeakerNotes(reveal, store as unknown as NotesStore)
    await vi.runAllTimersAsync()

    expect(notes.available.value).toBe(false)
    expect(store.load).not.toHaveBeenCalled()
  })

  it('saves 500 ms after the last change and updates the speaker view', async () => {
    const { reveal, store, notes } = await setup()

    notes.text.value = 'Ciao'
    vi.advanceTimersByTime(499)
    expect(store.save).not.toHaveBeenCalled()

    vi.advanceTimersByTime(1)
    expect(store.save).toHaveBeenCalledOnce()
    expect(store.save).toHaveBeenCalledWith('a', 'Ciao')
    expect(reveal.slides[0]!.getAttribute('data-notes')).toBe('Ciao')
    expect(reveal.dispatchEvent).toHaveBeenCalledWith({ target: reveal.getRevealElement(), type: 'resumed' })
  })

  it('saves a pending note on the slide it was written on when the slide changes', async () => {
    const { reveal, store, notes } = await setup({ b: 'Due' })

    notes.text.value = 'Ciao'
    vi.advanceTimersByTime(100)
    reveal.goTo(1)

    expect(store.save).toHaveBeenCalledOnce()
    expect(store.save).toHaveBeenCalledWith('a', 'Ciao')
    expect(reveal.slides[1]!.getAttribute('data-notes')).toBe('Due')
    expect(notes.slideId.value).toBe('b')
    expect(notes.text.value).toBe('Due')

    vi.advanceTimersByTime(500)
    expect(store.save).toHaveBeenCalledOnce()
  })

  it('saves a pending note when the page goes away', async () => {
    const { store, notes } = await setup()

    notes.text.value = 'Ciao'
    window.dispatchEvent(new Event('pagehide'))

    expect(store.save).toHaveBeenCalledWith('a', 'Ciao')
  })

  it('keys the notes by position on a deck without slide ids', async () => {
    const reveal = fakeReveal([undefined, undefined])
    const store = fakeStore({ '1/0': 'Due' })
    const notes = useSpeakerNotes(reveal, store as unknown as NotesStore)
    await vi.waitFor(() => expect(notes.available.value).toBe(true))

    expect(notes.slideId.value).toBe('0/0')
    expect(reveal.slides[1]!.getAttribute('data-notes')).toBe('Due')

    notes.text.value = 'Uno'
    notes.flush()
    expect(store.save).toHaveBeenCalledWith('0/0', 'Uno')
    expect(reveal.slides[0]!.getAttribute('data-notes')).toBe('Uno')
  })

  it('does not save on flush without changes', async () => {
    const { store, notes } = await setup({ a: 'Ciao' })

    notes.flush()

    expect(store.save).not.toHaveBeenCalled()
  })
})
