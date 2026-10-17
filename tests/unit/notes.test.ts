import { describe, expect, it } from 'vitest'
import { applyNotes, escapeNotes, notesKey, withNote } from '@/shared/notes'

function slide(attributes: Record<string, string> = {}): HTMLElement {
  const section = document.createElement('section')

  for (const [name, value] of Object.entries(attributes)) {
    section.setAttribute(name, value)
  }

  return section
}

describe('notes', () => {
  it('keys the notes by deck', () => {
    expect(notesKey('395083')).toBe('notes:395083')
  })

  it('escapes HTML, as the notes plugin shows them with innerHTML', () => {
    expect(escapeNotes('Mostra <b>prima</b> & "dopo" l\'esempio')).toBe(
      'Mostra &lt;b&gt;prima&lt;/b&gt; &amp; &quot;dopo&quot; l&#39;esempio'
    )
  })

  it('keeps line breaks', () => {
    expect(escapeNotes('riga 1\nriga 2')).toBe('riga 1\nriga 2')
  })

  it('adds a note', () => {
    expect(withNote({}, 'a', 'Ciao')).toEqual({ a: 'Ciao' })
  })

  it('removes a blank note without changing the notes it was given', () => {
    const notes = { a: 'Ciao', b: 'x' }

    expect(withNote(notes, 'a', '  \n ')).toEqual({ b: 'x' })
    expect(notes).toEqual({ a: 'Ciao', b: 'x' })
  })

  it('writes the escaped note in data-notes', () => {
    const a = slide({ 'data-id': 'a' })

    applyNotes([a], { a: 'Mostra <b>prima</b>' })

    expect(a.getAttribute('data-notes')).toBe('Mostra &lt;b&gt;prima&lt;/b&gt;')
  })

  it('leaves a slide without a note without data-notes', () => {
    const b = slide({ 'data-id': 'b' })

    applyNotes([b], { a: 'Ciao' })

    expect(b.hasAttribute('data-notes')).toBe(false)
  })

  it('puts the Slides.com note back when the own note is removed', () => {
    const a = slide({ 'data-id': 'a', 'data-notes': 'Slides.com' })

    applyNotes([a], { a: 'Mia' })
    expect(a.getAttribute('data-notes')).toBe('Mia')

    applyNotes([a], {})
    expect(a.getAttribute('data-notes')).toBe('Slides.com')
  })

  it('keeps the Slides.com note when applied twice', () => {
    const a = slide({ 'data-id': 'a', 'data-notes': 'Slides.com' })

    applyNotes([a], { a: 'Mia' })
    applyNotes([a], { a: 'Mia' })

    expect(a.getAttribute('data-slc-original-notes')).toBe('Slides.com')
  })

  it('removes data-notes it wrote when the note is removed', () => {
    const a = slide({ 'data-id': 'a' })

    applyNotes([a], { a: 'Mia' })
    applyNotes([a], {})

    expect(a.hasAttribute('data-notes')).toBe(false)
  })

  it('keys the slides with the given function', () => {
    const first = slide()
    const second = slide()
    const keys = new Map<Element, string>([
      [first, '0/0'],
      [second, '1/0']
    ])

    applyNotes([first, second], { '1/0': 'Seconda' }, (s) => keys.get(s))

    expect(first.hasAttribute('data-notes')).toBe(false)
    expect(second.getAttribute('data-notes')).toBe('Seconda')
  })

  it('leaves slides without data-id alone', () => {
    const stack = slide({ 'data-notes': 'x' })

    applyNotes([stack], { a: 'Mia' })

    expect(stack.getAttribute('data-notes')).toBe('x')
    expect(stack.hasAttribute('data-slc-original-notes')).toBe(false)
  })
})
