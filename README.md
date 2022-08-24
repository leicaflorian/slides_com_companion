# Slides.com Companion

Chrome/Edge extension that aims to add a few missing features (free) to Slides.com presentations.
Currently, allows the download of any presentation as a PDF file using the print command of the browser.

Other features are planned to be added in the future, like speaker notes, multi-screen presentation, and more.

# How to run locally

- `npm install`
- `npm run build` - This will compile the assets inside the `dist` folder.

### Chrome

- Navigate to [chrome://extensions](chrome://extensions) and enable **Developer Mode**.
- Click on `Load Unpacked Extension` and select the `dist` folder.

### Edge

- Navigate to [edge://extensions](edge://extensions) and enable **Developer Mode**.
- Click on `Load Unpacked Extension` and select the `dist` folder.

# Development

Assets can be built using the `npm run build` command.

These can also be built individually as follows:

### Background

- `npm run build:bg` - Builds the background script.
- `npm run build:bg-watch` - Builds the background script in watch mode.build:content":

### Content

- `npm run build:content` - Builds the content script.
- `npm run build:content-watch` - Builds the content script in watch mode.

### Popup

- `npm run build:popup` - Builds the popup script.
- `npm run build:popup-watch` - Builds the popup script in watch mode.

