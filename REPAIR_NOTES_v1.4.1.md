# DVExperiments v1.4.1 — Project Catalogue Reliability Repair

## Diagnosed in the supplied repository

The old `assets/project-sync.js` removed local entries linked to any DVExperiments GitHub repo whenever that repository did not appear in a GitHub discovery pass. An incomplete or temporarily filtered API result therefore caused existing cards to vanish; the project-detail page used the same list and displayed `404 / UNDISCOVERED`.

## Changes

- `assets/project-sync.js`: Preserve undiscovered known entries rather than treating their absence in a single GitHub response as proof of deletion. Reject a completely empty repo response. Still respect explicitly hidden repositories and `visible:false` metadata when successfully discovered.
- `assets/site.js`: Save successful catalogue results to `localStorage`; load previous results immediately and merge future refreshes without dropping known items. Works independently on homepage and project details.
- `assets/projects.js`: Add a bundled LUMIN fallback for first-time viewers and temporary API outages.
- `index.html` and `project.html`: Update JS asset version strings to bypass stale browser caches.

All other files, including the LUMIN iframe integration, styles, and homepage layout, are preserved.

## Installation

1. Keep a backup of the repository.
2. Extract the provided full-repository ZIP and upload its **contents** to the root of `DVExperiments/dvexperiments.github.io`, replacing same-named files. Do not create an extra nested folder.
3. Commit. Wait for GitHub Pages to finish publishing.
4. Hard refresh (`Ctrl+Shift+R`). Verify the homepage gallery and previously broken project details.

Alternatively, the patch-only ZIP includes the five changed files at their correct relative locations.

## Caveats

This prevents transient incomplete discovery from removing *known* entries; it cannot reveal never-before-seen repos while the GitHub API is unavailable. Visitor-local caches apply only to that visitor and browser. A future more durable option is generating a static catalogue in GitHub Actions.

Tests: `node --check` for changed JS files, and a Node VM simulation verifying partial and empty repository responses. This does not substitute for testing the deployed site.
