<div style="text-align: center">

![logo](Chrome%20Web%20Store/logo/logo_transp_wide.png "logo")

</div>

# Slides.com Companion

A free Chrome/Edge extension that adds a few missing features to [Slides.com](https://slides.com) presentations.

[**Install from the Chrome Web Store**](https://chrome.google.com/webstore/detail/slidescom-downloader/bciknjamldhnbbckmgbchmkdcalngnco)

## Features

When you open a Slides.com presentation, a small toolbar appears on the right edge of the slides. Hover over it to reveal:

- **Print / Save as PDF** – switches the presentation to Reveal.js print layout and opens the browser print dialog, so you can save every slide as a PDF. The page reloads once printing is done.
- **Speaker View** – opens the Reveal.js speaker notes window, with the current and next slide, your notes and a timer.

From the extension popup (the icon in the browser toolbar) you can:

- show or hide the toolbar overlay;
- toggle the **Debug** setting (stored, but not used yet).

The extension icon turns green with a **Print** badge when the current tab contains a presentation, and is greyed out everywhere else.

More features are planned (e.g. multi-screen presentation).

## How it works

Slides.com is built on [Reveal.js](https://revealjs.com/), and exposes the `Reveal` and `SL` objects on `window`. The extension uses them to drive the presentation. Because Chrome content scripts run in an isolated world and cannot see the page's globals, the code is split into four parts:

```
src/
├── background/   Service worker: enables/disables the toolbar icon and injects the page script
├── content/      Content script: waits for a presentation, then bridges settings to the page
├── injectable/   Script run in the page's MAIN world: registers the notes plugin and mounts the Vue toolbar
├── popup/        Vue popup with the settings
├── composables/  Settings class shared by the injected script (talks to the content script via DOM events)
└── utilities/    Logger
```

The flow on a Slides.com page:

1. **Background** (`src/background/index.ts`) listens for tab changes. On `slides.com` it checks the DOM for a Reveal.js deck (fullscreen or embedded) and updates the icon accordingly.
2. **Content script** (`src/content/index.ts`) waits until `.reveal-viewport > .reveal` exists. If it had to wait (e.g. a password‑protected deck that needed a login), it reloads the page once. It then adds a `<script id="slc-injected-script">` element used as a message bus, and asks the background to inject the page script.
3. **Background** injects `injectable/index.js` into the page's `MAIN` world with `chrome.scripting.executeScript`.
4. **Injectable** (`src/injectable/index.ts`) waits for `window.Reveal` to be ready, registers the Reveal.js notes plugin and mounts `App.vue` (the toolbar).
5. **Settings** are stored in `chrome.storage.sync`. The page cannot access that API, so the `Settings` class dispatches `getSettings` / `setSettings` events on the bus element, and the content script answers and forwards `settingsChanged` whenever the popup changes a value.

## Getting started

Requirements: Node.js and npm.

```bash
npm install
npm run dist
```

`npm run dist` cleans `dist/`, builds every part of the extension and copies `manifest.json` and `assets/` into it. The `dist/` folder is the unpacked extension.

> `npm run build` alone only compiles the scripts. It does not copy the manifest, so `dist/` cannot be loaded until you have run `npm run dist` at least once.

### Load the extension

**Chrome**

1. Open `chrome://extensions` and turn on **Developer mode**.
2. Click **Load unpacked** and select the `dist` folder.

**Edge**

1. Open `edge://extensions` and turn on **Developer mode**.
2. Click **Load unpacked** and select the `dist` folder.

Then open any presentation on slides.com.

## Development

### Workflow

1. Run `npm run dist` once.
2. Start a watcher for the part you are working on (see below).
3. After each rebuild, click the reload button on the extension card in `chrome://extensions` and refresh the Slides.com tab.

Useful places to debug:

- **Background** – *Inspect views: service worker* on the extension card.
- **Content and injected scripts** – the DevTools console of the Slides.com tab. The extension's logs start with `SLC -`.
- **Popup** – right‑click the extension icon and choose **Inspect popup**.

### Scripts

| Command | Description |
| --- | --- |
| `npm run dist` | Clean, build everything and copy static files into `dist/` |
| `npm run build` | Build background, content, popup and injectable scripts |
| `npm run build:bg` | Build the background service worker |
| `npm run build:content` | Build the content script |
| `npm run build:injectable` | Build the script injected into the page |
| `npm run build:popup` | Build the popup |
| `npm run build:options` | Build the options page (not used by the manifest yet) |
| `npm run watch:content` | Rebuild the content script on change |
| `npm run watch:injectable` | Rebuild the injected script on change |
| `npm run watch:popup` | Rebuild the popup on change |
| `npm run copy:static` | Copy `manifest.json` and `assets/` into `dist/` |
| `npm run clean` | Delete `dist/` |
| `npm run lint` | Run ESLint on `src/` |
| `npm test` | Run the Jest tests (with coverage) |

The build uses [Parcel](https://parceljs.org/); UI is written in [Vue 3](https://vuejs.org/) with TypeScript.

### Adding a toolbar button

1. Add the button and its handler in `src/injectable/App.vue`. Code there runs in the page, so it can use `window.Reveal` and `window.SL`.
2. If the feature needs a setting, add it to `ValidSettings` and `defaultSettings` in `src/composables/Settings.ts` and add a switch in `src/popup/App.vue`.
3. If it needs a Chrome API, handle it in the content script or background and talk to it through the `slc-injected-script` events or `chrome.runtime.sendMessage`.

### Releasing

1. Bump `version` in `manifest.json` (and `package.json`).
2. Run `npm run dist`.
3. Run `npm run create-ws-zip` to create `slides_com_companion.zip`.
4. Upload the zip on the Chrome Web Store developer dashboard.

## License

[MIT](LICENSE)
