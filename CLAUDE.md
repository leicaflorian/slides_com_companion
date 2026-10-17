# CLAUDE.md

## Language

Everything in the repo is in English: code, comments, identifiers, test names, commit messages, the README and this file. The documentation in the vault stays in Italian. Conversation with the owner is in Italian.

## Superpowers

**Superpowers comes before anything else** (owner's rule). At the start of every conversation, and before any answer or action (even a clarifying question), invoke the `superpowers:using-superpowers` skill and follow the Superpowers skills that apply to the task. The plugin is enabled for the project in `.claude/settings.json`, which is versioned so that a cloud session finds it too. How it is used in this project is in the section *Superpowers in this project*, further below.

## Documentation

Project documentation is written as `.md` files in:

`/Users/florianleica/Library/CloudStorage/GoogleDrive-florian.leica@gmail.com/Il mio Drive/MyVault/Projects/Slides.com Companion (Extension)`

Start from `00 - Indice.md`. Do not create documentation in the repo (apart from this file and `README.md`).

## Superpowers in this project

- **Phases**: the work follows the phases of `04 - Piano di lavoro.md` in the vault (folder given in *Documentation*), one phase at a time. For each phase `brainstorming` writes `Fasi/<Fase N - Titolo>/Analisi.md` and `writing-plans` writes `Fasi/<Fase N - Titolo>/Piano.md`, in the project folder in the vault, using the templates `Template/Template - Analisi.md` and `Template/Template - Piano d'azione.md` (in the vault root). The files in `docs/superpowers/` are not used. In the templates the `←` line points to `[[Projects/Slides.com Companion (Extension)/00 - Indice|Indice]]` and the properties `aree`, `concetti`, `funzioni`, `tecnica` collect the project notes the phase touches. Product choices go in the *Da decidere* section of the analysis, each with a recommendation and a `**Risposta:**` line, and are not asked one at a time. `writing-plans` starts only when all the answers are in. During development, tick off the steps of `Piano.md` and update `stato` in the two notes (`in corso`, then `da controllare`). The items of `04 - Piano di lavoro.md` are ticked off only after the owner's review. The vault notes are not in git and are not committed. If the vault cannot be read (for example in a cloud session), stop and say so.
- **Worktree**: `using-git-worktrees` creates the worktree in `.worktrees/`, which is ignored by git, on a new branch starting from `dev`. `finishing-a-development-branch` brings the work back into `dev` with a local merge. No push and no pull request unless requested, and never merge into `main` (releases to the Chrome Web Store go from `main`, and the owner does them). The worktree lacks unversioned files, such as `node_modules`: run `npm install` before build and tests. The extension to try in Chrome is loaded from the worktree's build.
- **TDD**: test-first applies to the extension logic (icon and badge state in the background, the settings bridge, the injected toolbar). Behaviour on a presentation is verified with Playwright. The by-eye check on slides.com (printing to PDF, speaker view) is done by the owner. This is what `verification-before-completion` means here. Until Phase 0 is done there are no working tests: say what was verified and how.
- **Before a commit**: lint, typecheck and tests green (the exact commands are in `README.md`), and the vault documentation updated if the work changes what it describes (analysis, plan, decisions).

## Development

- **What it is**: a Chrome/Edge MV3 extension for slides.com. The background enables the action (green "Print" badge) on tabs with a presentation; the content script waits for the presentation, sets up a `<script id="slc-injected-script">` that bridges settings through custom events, and asks the background to run the injectable script in the MAIN world; the injectable registers Reveal's notes plugin (speaker view) and mounts a Vue toolbar that prints via `window.SL.util.setupReveal({ view: 'print' })`. The popup edits `settings` in `chrome.storage.sync`.
- **Stack today**: Vue 3 + TypeScript (strict), Bootstrap 5 in the popup, built with Parcel per entrypoint plus a hand-written `manifest.json` copied into `dist/` (`npm run dist`). Jest is configured but its only test does not pass.
- **Migration to WXT** (Phase 0, see `Fasi/Fase 0 - Migrazione a WXT/` in the vault): WXT + `@wxt-dev/module-vue`, Vitest with `wxt/testing`, Playwright for e2e, ESLint + Prettier. Once it is merged, update this section with the new layout and commands.
- **Node 22**: run `source ~/.nvm/nvm.sh && nvm use 22` before any `npm`/`npx` command (`nvm use` once `.nvmrc` exists).
- **Versions**: the published version is the one in `manifest.json` (today 1.3.5; `package.json` is out of sync until Phase 0).
- **Merging into `dev`**: the owner decides; for a phase branch prefer a squash merge with one English commit message.
