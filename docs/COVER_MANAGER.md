# Cover Management (v1.6.1) — local tool

The cover manager is **not** part of the public GitHub Pages site anymore.

1. Download `DVExperiments_Local_Cover_Manager_v1.6.1.zip` and extract it to a folder **outside your public GitHub repository**.
2. On Windows, double-click `START_COVER_MANAGER.bat`. On macOS/Linux, run `python3 start_manager.py` inside the extracted folder. Python 3 is the only dependency; the standard library hosts the page on `127.0.0.1` (localhost) and the browser does the image work.
3. In your browser's local manager, choose **Sync published mapping** to pull `data/project-curation.json` from the deployed public site, or **Import mapping JSON** to select your own copy. Import the current mapping before editing so previous cover assignments are preserved.
4. The manager can discover new public GitHub repositories, audit image URLs, change featured flags and categories, and turn selected JPG/PNG/WebP covers into 1200×675 WebP.
5. Select **Export GitHub update ZIP**. Extract this tiny ZIP and upload its files to the **same paths** in your GitHub repository (`data/project-curation.json`, `assets/project-covers/*.webp`). Do not upload the ZIP as one archive.
6. Commit and refresh the public site.

### Old public `/manage.html` cleanup

The v1.6.1 website ZIP overwrites `/manage.html` with a harmless unavailable page and the old manager JS/CSS with empty stubs. This immediately disables the old editor when the new files deploy. GitHub's upload interface does not delete files already in the repository. To get a real HTTP 404, use GitHub's file editor to **delete** `manage.html`, `assets/manager.js`, and `assets/manager.css` after uploading the new site. There is no need to delete `assets/collection.js` or `data/project-curation.json` — the public gallery needs both.

### Cover resolution

1. Curated mapping in `data/project-curation.json`.
2. Art from project metadata or saved project catalogue.
3. Category-specific SVG fallback, with browser error fallback for broken URLs.

The local manager is read-only until it exports downloaded files. Only a person with repository write access can publish changes. No token, password or GitHub sign-in is needed by the tool. Localhost access itself is not authentication; keep the manager folder private, and never store private information in a public repository.
