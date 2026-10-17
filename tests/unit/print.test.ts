import { describe, expect, it } from 'vitest'
import { isPrintUrl, printUrl } from '@/entrypoints/injected/print'

describe('printUrl', () => {
  it('adds print-pdf to a url without query', () => {
    expect(printUrl('https://slides.com/u/d')).toBe('https://slides.com/u/d?print-pdf')
  })

  it('keeps the hash', () => {
    expect(printUrl('https://slides.com/u/d#/3')).toBe('https://slides.com/u/d?print-pdf#/3')
  })

  it('keeps the other parameters', () => {
    expect(printUrl('https://slides.com/u/d?token=x#/3')).toBe('https://slides.com/u/d?token=x&print-pdf#/3')
  })

  it('prints the fullscreen view from the presentation page', () => {
    expect(printUrl('https://slides.com/u/d/fullscreen#/3')).toBe('https://slides.com/u/d?print-pdf#/3')
  })

  it('prints the fullscreen view with a trailing slash and parameters', () => {
    expect(printUrl('https://slides.com/u/d/fullscreen/?token=x')).toBe('https://slides.com/u/d?token=x&print-pdf')
  })

  it('leaves a print url as it is', () => {
    expect(printUrl('https://slides.com/u/d?print-pdf#/3')).toBe('https://slides.com/u/d?print-pdf#/3')
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
