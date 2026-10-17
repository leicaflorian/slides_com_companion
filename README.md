# Slides.com Companion

![Slides.com Companion: print, save as PDF and open the speaker view on any Slides.com presentation](.github/assets/og-image.png)

A free Chrome/Edge extension that adds a few missing features to [Slides.com](https://slides.com) presentations.

[**Install from the Chrome Web Store**](https://chrome.google.com/webstore/detail/slidescom-downloader/bciknjamldhnbbckmgbchmkdcalngnco)

## Features

When you open a Slides.com presentation, a small dark tab appears on the right edge of the slides. Hover over it (or reach it with the keyboard) to open the toolbar:

- **Print / Save as PDF** – reloads the presentation's fullscreen view in Reveal.js's own print view (`/fullscreen?print-pdf`), so only the slides are printed, and opens the browser print dialog, so you can save every slide as a PDF. When the dialog closes, the page goes back to the slide you were on.
- **Speaker View** – opens the Reveal.js speaker notes window, with the current and next slide, your notes and a timer.
- **Notes** – write speaker notes for the current slide, even without a Slides.com subscription. They show up in the speaker view, also while it is open. The notes are saved in your browser (`chrome.storage.local`), not on Slides.com: they stay on this computer and are lost if you remove the extension. Where Slides.com already shares its own notes, a slide shows yours if you wrote one and theirs otherwise.

From the extension popup (the icon in the browser toolbar) you can show or hide the toolbar, and report a problem on GitHub.

The extension icon is coloured when the current tab contains a presentation, and greyed out everywhere else.

More features are planned (e.g. multi-screen presentation).

## How it works

Slides.com is built on [Reveal.js](https://revealjs.com/), and exposes the `Reveal` and `SL` objects on `window`. The extension uses them to drive the presentation. Because Chrome content scripts run in an isolated world and cannot see the page's globals, the code is split into four parts:

```
src/
  entrypoints/
    background.ts        enables the action on tabs with a presentation, injects the toolbar script
    content/             waits for the presentation, bridges settings and notes, toolbar styles
    print-view.content.ts keeps Slides.com's fullscreen view in print view (MAIN world, document_start)
    injected/            runs in the page (MAIN world): Vue toolbar, notes panel and Reveal's notes plugin
    popup/               settings
  background/            background logic (icon state)
  shared/                settings, notes, print URLs and logging
public/                  icons and popup images
tests/
  unit/                  Vitest
  e2e/                   Playwright
  fixtures/presentation/ saved presentation
```

The flow on a Slides.com page:

1. **Background** (`src/entrypoints/background.ts`, logic in `src/background/tab-state.ts`) listens for tab changes. On `slides.com` it checks the DOM for a Reveal.js deck (fullscreen or embedded) and updates the icon accordingly.
2. **Content script** (`src/entrypoints/content/index.ts`) waits until `.reveal-viewport > .reveal` exists. If it had to wait (e.g. a password‑protected deck that needed a login), it reloads the page once. It then adds a `<script id="slc-injected-script">` element used as a message bus, and asks the background to inject the page script.
3. **Background** injects `injected.js` into the page's `MAIN` world, in the tab that asked for it, with `browser.scripting.executeScript`.
4. **Injected script** (`src/entrypoints/injected/index.ts`) waits for `window.Reveal` to be ready, registers the Reveal.js notes plugin and mounts `App.vue` (the toolbar).
5. **Settings** are stored in `browser.storage.sync` under `settings`. The page cannot access that API, so the `Settings` class (`src/shared/settings.ts`) dispatches `getSettings` / `setSettings` events on the bus element, and the content script answers and forwards `settingsChanged` whenever the popup changes a value.
6. **Notes** are stored in `browser.storage.local` under `notes:<deck id>` (`SLConfig.deck.id`), as `{ <slide key>: text }`: the slide's `data-id`, or its position `h/v` on older decks whose slides have no `data-id` (there, adding or moving slides in Slides.com leaves the notes on their positions). `NotesStore` (`src/shared/notes-store.ts`) reads them with a `getNotes` event and saves the note of one slide with a `setNote` event on the bus element; `src/entrypoints/content/notes-bridge.ts` answers and merges each note into the stored ones, one save at a time, so two tabs of the same deck keep each other's notes. `useSpeakerNotes` (`src/entrypoints/injected/useSpeakerNotes.ts`) writes them, escaped, into each slide's `data-notes`, where the notes plugin reads them, saves the note being written 500 ms after the last key (and right away on a slide change, on Print and when the page goes away), and fires Reveal's `resumed` event so an open speaker view shows it. In print view (`?print-pdf`) the notes are left out.

## Development

Built with [WXT](https://wxt.dev), [Vue 3](https://vuejs.org/) and TypeScript. Requires Node 22 (`nvm use` reads `.nvmrc`).

```bash
npm install
npm run dev      # opens Chrome with the extension loaded and reloads it on change
```

To load a production build by hand:

1. `npm run build`, which writes the extension to `.output/chrome-mv3`.
2. Open `chrome://extensions` (or `edge://extensions`) and turn on **Developer mode**.
3. Click **Load unpacked** and select `.output/chrome-mv3`.

Then open any presentation on slides.com.

Useful places to debug:

- **Background** – *Inspect views: service worker* on the extension card.
- **Content and injected scripts** – the DevTools console of the Slides.com tab. The extension's logs start with `SLC -`.
- **Popup** – right‑click the extension icon and choose **Inspect popup**.

### Scripts

| Script                      | What it does                                                                       |
| --------------------------- | ---------------------------------------------------------------------------------- |
| `npm run dev`               | Development mode with auto-reload                                                  |
| `npm run build`             | Production build in `.output/chrome-mv3`                                           |
| `npm run zip`               | Zip for the Chrome Web Store in `.output/`                                         |
| `npm run lint`              | ESLint                                                                             |
| `npm run format`            | Prettier                                                                           |
| `npm run typecheck`         | `vue-tsc`                                                                          |
| `npm test`                  | Unit tests (Vitest)                                                                |
| `npm run test:e2e`          | Builds, then runs the e2e tests (Playwright) on a saved presentation               |
| `npm run snapshot -- <url> [name]` | Saves a public page as an e2e fixture in `tests/fixtures/<name>`          |
| `npm run icons`             | Exports the PNG icons in `public/icons/` from the SVGs in `Chrome Web Store/icon/` |
| `npm run toolbar-image`     | Exports `public/options/toolbar.png`, the toolbar image shown in the popup        |
| `npm run og-image`          | Renders `.github/assets/og-image.png` from `og-image.html`                         |
| `npm run store-assets`      | Renders the Chrome Web Store screenshots and promo tiles in `.output/store-assets/` (needs the network) |

The e2e tests need Playwright's Chromium: `npx playwright install chromium`.

### Adding a toolbar button

1. Add the button and its handler in `src/entrypoints/injected/App.vue`. Code there runs in the page, so it can use `window.Reveal` and `window.SL`.
2. If the feature needs a setting, add it to `ValidSettings` and `defaultSettings` in `src/shared/settings.ts` and add a switch in `src/entrypoints/popup/App.vue`.
3. If it needs a browser API, handle it in the content script or background and talk to it through the `slc-injected-script` events or `browser.runtime.sendMessage`.

### Releasing

1. Bump `version` in `package.json` (the manifest takes it from there) and run `npm install --package-lock-only`.
   Add the version's entry to `CHANGELOG.md`.
2. Run `npm run zip`.
3. Upload the zip from `.output/` on the Chrome Web Store developer dashboard.

What changed in each version is in [CHANGELOG.md](CHANGELOG.md).

## License

[MIT](LICENSE)

---

<p align="center">
  Made by
  <a href="https://leicaflorianrobert.dev"><img src=".github/assets/lfr-badge.png" alt="lfr_" width="24" height="24" align="center"></a>
  <a href="https://leicaflorianrobert.dev">Leica Florian Robert</a>
</p>
