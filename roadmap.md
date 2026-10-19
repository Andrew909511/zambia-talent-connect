# Zamwork refresh
- [x] Apply Facebook-inspired identity and welcoming home page.
- [x] Preserve search and registration entry points.
- [x] Verify desktop and mobile appearance and navigation.
- [x] Repair npm dependency resolution and regenerate npm lockfile; use Node.js 22 because current core dependencies require it.
- [x] Align GitHub Actions installation and verify clean npm install, npm ci, compilation and registration-page rendering.
- [ ] Verify the connected GitHub repository and live Pages settings (blocked: no accessible GitHub API connection; Git sync settings are only visible in Lovable's Git settings).
- [x] Add API initialization for missing Pages sites, select the Actions source, and derive the build base path from Pages metadata.
- [x] Test Pages initialization and artifact validation without changing dependencies (8 tests passed).
- [ ] Confirm a fresh production build and deployment in GitHub Actions (blocked on repository access and a remote workflow run).