# Toolbox Spell Checker

A static browser-based spelling checker. No Python, server, API key, or build step is required.

## Run locally
Open `index.html` in a modern browser.

## Publish with GitHub Pages
1. Create a GitHub repository.
2. Upload the contents of this folder to the repository root (so `index.html` is at the root).
3. In **Settings → Pages**, select **Deploy from a branch**, choose `main` and `/(root)`, then save.
4. Wait for the Pages deployment and open the published URL.

All app scripts and the dictionary are bundled under `assets/`; no CDN or API calls are required.

## Current limitations
- Text checking and CSV import/export are supported.
- Native `.xlsx` and `.xls` workbook parsing is not enabled; CSV can be opened in Excel.
- Dictionary-based suggestions are heuristic and may not always rank the intended correction first.
- Personal dictionary entries are stored in the current browser's local storage.
