# Changelog

All notable changes to Slides.com Companion. The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and the version is the one in `package.json` and the manifest.

## [Unreleased] (1.6.0)

### Added

- Speaker notes, without a Slides.com subscription: a "Notes" button in the toolbar opens a panel where you write the note of the current slide. Notes show up in the speaker view, also while it is already open on another screen, and never end up in the PDF.
- Notes are saved in your browser (`chrome.storage.local`), by presentation and slide. They stay on this computer, are not uploaded to Slides.com and are deleted if you remove the extension. The presentation page and its fullscreen view share the same notes.
- On older presentations whose slides have no id, a note belongs to the slide's position: adding or moving slides in Slides.com leaves the notes where they were.
- Where Slides.com already shares its own notes, a slide shows yours if you wrote one, and theirs otherwise.

### Changed

- Store summary: "Print or save any Slides.com presentation as PDF and use the speaker view with your own notes, for free."

## [1.5.0] - 2026-10-18

### Added

- Popup: a "Report a problem on GitHub" link that opens a new GitHub issue prefilled with the extension version and the browser. Nothing is sent until you submit the issue.

### Changed

- A new toolbar: a dark tab on the right edge of the slides that opens on hover or keyboard focus, with clear icons, always-visible labels and the brand pink on the button under the mouse. It closes when the mouse leaves.
- Print / Save as PDF always uses the presentation's fullscreen view, so only the slides are printed, whether you start from the presentation page or from fullscreen.
- New extension icon: a slide with the toolbar docked on its edge. It fills the toolbar like other extensions' icons, and it is simply coloured on tabs with a presentation, without the green "Print" badge.
- Popup: brand pink header and switch, and a picture of the new toolbar instead of the old animation.
- Store summary: "Print or save any Slides.com presentation as PDF and open the speaker view, for free." The icon's tooltip reads "Slides.com Companion".

### Fixed

- Printing from the fullscreen view no longer closes the print dialog after a second.
- Clicking the "Show toolbar overlay" label now toggles its switch.

### Removed

- The "Debug" switch in the popup, which did nothing.
- The `activeTab` permission, which was not needed.

## 1.4.1 - 2026-10-17

Not published on the Chrome Web Store: its changes ship with 1.5.0.

### Fixed

- Print / Save as PDF works again. Slides.com no longer lets the presentation be set up a second time and blocks the print view for free accounts, so the Print button did nothing. It now reloads the presentation in Reveal.js's own print view (`?print-pdf`), opens the print dialog and goes back to the slide you were on when the dialog closes.

## 1.4.0 - 2026-10-17

Not published on the Chrome Web Store: its changes ship with 1.5.0.

### Fixed

- The default settings are saved under the key the popup reads.
- The toolbar script runs in the tab that asked for it, not in the last tab the extension looked at.

### Changed

- Rebuilt with WXT, with unit and end-to-end tests. Nothing changes for users.

## [1.3.5] - 2023-12-22

### Removed

- The `webNavigation` permission, which was not needed.

## [1.3.4] - 2023-12-21

### Changed

- New print mechanism, after changes on Slides.com.

## 1.3.2 - 2022-11-14

### Fixed

- The toolbar now appears on password-protected presentations: the page reloads once after you log in.

## 1.3.1 - 2022-10-25

### Fixed

- More reliable start on presentations that are already loaded when the extension starts.

## 1.3.0 - 2022-08-26

### Added

- Speaker View button: opens the Reveal.js speaker notes window, with the current and next slide, your notes and a timer.

### Changed

- New name: Slides.com Companion.

## [1.2.0] - 2022-08-25

First version on the Chrome Web Store, as "Slides.com".

### Added

- A toolbar on Slides.com presentations with a button to print them or save them as PDF with the browser's print command.
- Popup with a switch to show or hide the toolbar.
- The extension icon is coloured, with a "Print" badge, on tabs with a presentation.
- Works only on slides.com.

[Unreleased]: https://github.com/leicaflorian/slides_com_companion/compare/1.5.0...dev
[1.5.0]: https://github.com/leicaflorian/slides_com_companion/compare/1.3.5...1.5.0
[1.3.5]: https://github.com/leicaflorian/slides_com_companion/compare/v1.3.4...1.3.5
[1.3.4]: https://github.com/leicaflorian/slides_com_companion/releases/tag/v1.3.4
[1.2.0]: https://github.com/leicaflorian/slides_com_companion/releases/tag/1.2.0
