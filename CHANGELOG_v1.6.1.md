# DV Experiments v1.6.1 — Local Cover Manager

- Retired the public `/manage.html` editor. Deployment now replaces it with a static unavailable page and replaces its public scripts/styles with inert stubs. Optional manual deletion yields a true 404.
- Removed all public Cover Manager links from `index.html` and `project.html`.
- Preserved v1.6 organisation, featured cards, search/filter/sort, grid/list view, GitHub project discovery, project detail pages, image fallback, and central mapping.
- Delivered the **local Cover Manager** as an entirely separate ZIP. Its Python standard-library launcher listens only on loopback, accepts no uploads/writes, and opens the browser automatically.
- Local tool provides manual JSON import, syncing of the published curation file, cover image auditing, category/featured edits, 16:9 WebP conversion, and ZIP/JSON export.
- Upgraded static asset cache keys to 1.6.1.

## Deployment

Extract the *website* ZIP into the GitHub repository root, preserving paths. Keep the separate local manager ZIP **off GitHub**. The public website cannot directly apply local image edits — export files and commit them to GitHub.
