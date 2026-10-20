# DV Experiments v1.5 + v1.6 — Combined Collection and Cover Manager release

## What changed

- Curated featured-project shelf in the collection, without changing the existing NZ EcoSim hero and Live Lab.
- Unified five clear collection categories, with category counts and expanded search/filter options.
- Filter by Pages status and Browser/Desktop availability; sort by featured, recent update or name.
- Grid/list layout switch, remembered locally per browser.
- Central `data/project-curation.json` to override categories, names, featured flags and project cover images without editing source code for each project.
- Five visually coordinated SVG category fallbacks so new repositories do not show broken/missing artwork by default.
- `manage.html` Cover Manager: project inventory, custom/fallback distinction, optional broken-image checks, 16:9 1200×675 WebP conversion, featured/category edits, exportable JSON and ZIP of changed files.
- Project artwork is consistently resolved in gallery cards, detail pages and featured sections, including a fallback when an image URL breaks.
- Preserves auto-discovery from public GitHub repositories, saved GitHub Actions catalogue, local bundled projects, the Live Lab and dynamic project detail pages.
- Snapshot generator and live discovery now include `updatedAt` for more meaningful sort-by-recent.
- Updated local Pocket Pal display name to **Nimlets** while preserving the existing `pocket-pal` slug so older detail links continue to work.

## Important notes

The public manager never requests a token and **does not write to GitHub**. It generates files to upload after extracting its ZIP. GitHub's website does not automatically unzip archives you upload.

The ZIP attached to this release is a **full site**, with files at repository root (not nested in a version folder). Extract it and upload the contents to the root of `DVExperiments/dvexperiments.github.io` on the `main` branch. Preserve the `.github` folder. Existing repository-specific data could have evolved since the v1.4.3 saved baseline; compare before overwriting any newer changes.

## What to edit next time

- Homepage: `index.html`
- Styles: `assets/styles.css`, `assets/manager.css`
- Curated covers, categories, featured selection: `data/project-curation.json`
- Additional artwork: `assets/project-covers/`
- Cover audit and export UI: `manage.html`
- Automatic discovery: `assets/project-sync.js`
- GitHub Actions snapshot: `scripts/build_catalogue.py`

See `docs/COVER_MANAGER.md` for detailed steps.
