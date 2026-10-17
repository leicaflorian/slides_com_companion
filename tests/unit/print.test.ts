import { describe, expect, it } from 'vitest'
import { isPrintUrl, printUrl } from '@/shared/print'

describe('printUrl', () => {
  it('prints the presentation page from its fullscreen view', () => {
    expect(printUrl('https://slides.com/u/d')).toBe('https://slides.com/u/d/fullscreen?print-pdf')
  })

  it('keeps the hash', () => {
    expect(printUrl('https://slides.com/u/d#/3')).toBe('https://slides.com/u/d/fullscreen?print-pdf#/3')
  })

  it('keeps the other parameters', () => {
    expect(printUrl('https://slides.com/u/d?token=x#/3')).toBe('https://slides.com/u/d/fullscreen?token=x&print-pdf#/3')
  })

  it('stays on the fullscreen view', () => {
    expect(printUrl('https://slides.com/u/d/fullscreen?#/1')).toBe('https://slides.com/u/d/fullscreen?print-pdf#/1')
  })

  it('handles a trailing slash', () => {
    expect(printUrl('https://slides.com/u/d/fullscreen/')).toBe('https://slides.com/u/d/fullscreen?print-pdf')
  })

  it('uses the fullscreen view of other views of the deck', () => {
    expect(printUrl('https://slides.com/u/d/live')).toBe('https://slides.com/u/d/fullscreen?print-pdf')
  })

  it('leaves a print url as it is', () => {
    expect(printUrl('https://slides.com/u/d/fullscreen?print-pdf#/3')).toBe(
      'https://slides.com/u/d/fullscreen?print-pdf#/3'
    )
  })
})

describe('isPrintUrl', () => {
  it('is true with print-pdf alone', () => {
    expect(isPrintUrl('https://slides.com/u/d?print-pdf')).toBe(true)
  })

  it('is true with print-pdf after other parameters', () => {
    expect(isPrintUrl('https://slides.com/u/d?a=1&print-pdf#/2')).toBe(true)
  })

  it('is false without print-pdf', () => {
    expect(isPrintUrl('https://slides.com/u/d?a=1#/print-pdf')).toBe(false)
  })
})
