# Dictionary engine update

The spell checker now uses Typo.js with a Hunspell-compatible English dictionary. The app loads the engine and dictionary data from jsDelivr at runtime, so the first full-dictionary check requires an internet connection. If the CDN is unavailable, the app falls back to the built-in curated typo list; spelling coverage will be limited until the dictionary loads.

- Typo.js: https://github.com/cfinke/Typo.js
- English dictionary package: https://www.npmjs.com/package/dictionary-en
- The US/UK selector uses explicit regional spelling overrides on top of the shared English dictionary. This is a practical first iteration, not two independently sourced regional dictionaries.

Technical terms are protected through a small allowlist and the user's personal dictionary. Add domain-specific terms to `technicalWords` in `assets/js/app.js` as needed. Excel corrections remain conservative and only auto-apply the app's curated typo mappings; they do not blindly replace every spelling-engine suggestion.
