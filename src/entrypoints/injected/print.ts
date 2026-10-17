/**
 * Reveal.js switches to its print view on its own when the URL has this parameter.
 * Slides.com blocks `view: 'print'` in the config for free accounts, but not this.
 */
export const PRINT_PARAM = 'print-pdf'

const FULLSCREEN_PATH = /\/fullscreen\/?$/

function queryParts(url: URL): string[] {
  return url.search.slice(1).split('&').filter(Boolean)
}

function withQuery(url: URL, parts: string[]): string {
  url.search = parts.length ? '?' + parts.join('&') : ''

  return url.toString()
}

export function isPrintUrl(href: string): boolean {
  return queryParts(new URL(href)).some((part) => part.split('=')[0] === PRINT_PARAM)
}

export function printUrl(href: string): string {
  if (isPrintUrl(href)) {
    return href
  }

  const url = new URL(href)

  // the fullscreen view drops print-pdf as soon as the print layout is ready, the presentation page does not
  url.pathname = url.pathname.replace(FULLSCREEN_PATH, '')

  return withQuery(url, [...queryParts(url), PRINT_PARAM])
}
