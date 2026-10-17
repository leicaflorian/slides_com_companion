/**
 * Reveal.js switches to its print view on its own when the URL has this parameter.
 * Slides.com blocks `view: 'print'` in the config for free accounts, but not this.
 */
export const PRINT_PARAM = 'print-pdf'

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

  url.pathname = fullscreenPath(url.pathname)

  return withQuery(url, [...queryParts(url), PRINT_PARAM])
}

/**
 * Only the fullscreen view prints just the slides: the presentation page prints the rest of the page too.
 * Deck URLs are /<user>/<deck>[/<view>], e.g. /u/d, /u/d/fullscreen, /u/d/live.
 */
function fullscreenPath(pathname: string): string {
  const [user, deck] = pathname.split('/').filter(Boolean)

  return user && deck ? `/${user}/${deck}/fullscreen` : pathname
}
