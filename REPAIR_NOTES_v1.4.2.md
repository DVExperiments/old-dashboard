# DVExperiments v1.4.2 — Catalogue stability and LUMIN art

## Changes
- Generates `data/projects-catalogue.json` in GitHub Actions (every 6 hours or on demand), so new visitors do not rely solely on the per-browser GitHub API response.
- The dashboard loads the generated snapshot before optional live discovery and retains browser-cached and bundled entries.
- Restores bundled LUMIN cover `assets/lumin-cover.svg` and prevents a failed remote image path from overwriting it.
- Preserves the existing site, styles, LUMIN detail embed and previous repository metadata.

## Upload / install
1. For a full replacement, extract the FULL ZIP and upload its contents to the repository root. For minimal changes, use the PATCH ZIP and preserve folder paths, including `.github/workflows/` (hidden folders may not show in some unzip tools).
2. Ensure Repository Settings > Actions > General > Workflow permissions permits Read and write permissions, or the workflow will build but fail to commit.
3. On GitHub open Actions > Refresh project catalogue > Run workflow. Wait for success. This creates/updates `data/projects-catalogue.json` with the public repositories currently detected by GitHub.
4. Reload https://dvexperiments.github.io/ using Ctrl+Shift+R and check the project count, LUMIN artwork and project detail links.

## Important
The included initial `data/projects-catalogue.json` is intentionally empty because this offline build environment cannot fetch the live GitHub repository list. **Run the workflow once after uploading** to generate the authoritative catalogue. Until that succeeds, only bundled, cached, and live-discovered projects appear.
This does not recover private, archived, forked, disabled, or metadata-hidden projects; those require manual visibility changes.
