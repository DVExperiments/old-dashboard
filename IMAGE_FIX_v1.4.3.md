# DVExperiments v1.4.3 — Image recovery patch

This small patch addresses missing project thumbnails without changing project discovery or the generated catalogue.

## Install
Upload `assets/site.js`, `index.html` and `project.html` to the same paths in your DVExperiments dashboard repository, replacing those files. Commit, wait for Pages and hard-refresh (Ctrl+Shift+R).

## Fixes
- Restores bundled SVG cover artwork for known projects when catalogue refresh provides a different or missing image URL.
- Provides a default site-hosted artwork when an image returns 404, cannot load or is blocked.
- Preserves working remote covers for new projects rather than replacing them globally.
- Updates HTML query strings so browsers fetch the new JavaScript.

## Note
A missing image that is **supposed** to be custom artwork from a project repository may still need its `cover` path corrected in that repository's `dv-project.json`. This patch shows the safe fallback meanwhile. See `docs/PROJECT_METADATA.md` for cover path format. No GitHub Actions change is necessary.
