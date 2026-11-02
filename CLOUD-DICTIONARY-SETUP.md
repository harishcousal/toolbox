# Shared Dictionary — GitHub Actions setup

The published dictionary lives in `assets/data/custom-dictionary.json`. The Spell Checker and manager page read this public JSON file. No GitHub credential is sent to or stored in browser code.

## What happens when a word is added

1. The Spell Checker saves the word in the current browser's personal dictionary immediately.
2. It opens a prefilled GitHub issue for the shared dictionary.
3. Sign in to GitHub as `harishcousal`, review the request, and submit the issue.
4. GitHub Actions checks the issue author's account, validates the request, updates the JSON file, and closes the issue.
5. GitHub Pages publishes the updated dictionary. The app reads the shared list on its next page load.

The manager supports add, replace, and remove requests. The page is public to view; only `harishcousal` can submit accepted changes.

## One-time repository setup

1. Copy the files from this project into the root of the existing `harishcousal/toolbox` repository, preserving folder structure.
2. In GitHub, open **Settings → Actions → General → Workflow permissions**. Allow read and write permissions if repository policy requires it.
3. Ensure GitHub Actions and GitHub Issues are enabled.
4. Confirm the allowlist is `harishcousal` in `.github/workflows/update-shared-dictionary.yml`.
5. Commit and push the files to the repository's default branch. Keep the existing GitHub Pages deployment source.

## URLs

- Spell Checker: `https://harishcousal.github.io/toolbox/`
- Shared Dictionary Manager: `https://harishcousal.github.io/toolbox/library-vault/`
- Public JSON: `https://harishcousal.github.io/toolbox/assets/data/custom-dictionary.json`

## Security and limitations

- No personal access token or GitHub token is embedded in JavaScript.
- The workflow uses GitHub's `GITHUB_TOKEN` inside the Actions runner only.
- Anyone can view the dictionary and manager page. Only the allowlisted GitHub account can change the published file.
- A change is published only after the issue is submitted, the workflow succeeds, and GitHub Pages refreshes.
- Words added through the Spell Checker are saved locally immediately, even if the GitHub issue is not submitted.
- This is a single-owner approval workflow, not anonymous public editing. Anonymous write access would require an authenticated backend or exposing a credential, neither of which is used here.
