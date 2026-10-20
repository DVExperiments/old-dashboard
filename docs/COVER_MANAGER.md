# Project Covers & Collection Management

## Fast route: use the Cover Manager

1. Visit `https://dvexperiments.github.io/manage.html` once this release is deployed.
2. Choose **Needs artwork** to see cards currently using category fallback art.
3. Choose an image on a project. JPG, PNG and WebP files are supported up to 15 MB. The browser centre-crops it into a 1200×675 WebP and **never uploads the original image to a server**.
4. Optionally select the category and featured status. Use **Check all images** to test for 404/broken URLs (requires a connection; network errors may be reported as failures).
5. Click **Export GitHub update ZIP** to get only the changed `data/project-curation.json` and any newly converted cover images.
6. Extract that ZIP locally. Copy `data/project-curation.json` to the matching folder in your dashboard repository; upload any WebP files into `assets/project-covers/`. Commit your changes.
7. Refresh the public site (Ctrl+F5 if necessary).

> The GitHub upload page will **not unpack** ZIP files. Extract locally and upload the files to their corresponding paths. If GitHub's upload UI does not preserve nested folders, open the target directory in the repository first and upload its files there.

## Alternative: manually assign an existing image

Open `data/project-curation.json`. In `projects`, create a lowercase repo-name key, for example:

```json
"my-new-project": {
  "category": "Creative Experiments",
  "cover": "assets/project-covers/my-new-project.webp",
  "featured": false
}
```

Upload the named image to `assets/project-covers/`. Use a relative path without a leading slash. Existing URLs with `https://` also work.

The file can override `title`, `category`, `cover`, `featured` and `imageAlt`. It does **not** override whether a project has a published GitHub Pages site; availability is detected from actual repositories. Display status is never faked.

## Category names

- Simulations & Worlds
- Tools & Utilities
- Games & Interactive
- Data & Visualisation
- Creative Experiments

Existing metadata categories like "Simulations", "Tools", "Games" or "Experiments" automatically map to the new names. Unrecognised categories appear under Creative Experiments, unless assigned explicitly in the curation file.

## Artwork precedence

1. Central cover assignment in `data/project-curation.json`.
2. Existing cover from project metadata, snapshot or bundled catalogue.
3. Category-specific fallback SVG. Broken URLs fall back visually in the browser.

A fallback cover means the card is intentionally waiting for custom art. A cover can still have a broken URL, so the manager has a separate on-demand image check.

## Auto-discovered repositories

The hub still checks public `DVExperiments` repositories via GitHub and reads optional `dv-project.json` metadata. The scheduled workflow refreshes `data/projects-catalogue.json`. Your local curation file has final say over how the hub presents cover artwork and categories.

## Privacy and access

`manage.html` is a public page that **prepares downloadable files**, not an authenticated administration backend. Do not enter secrets there; do not put private images or metadata in this public repository. The Cover Manager needs no tokens, passwords or external libraries.
