# Zamwork refresh
- [x] Apply Facebook-inspired identity and welcoming home page.
- [x] Preserve search and registration entry points.
- [x] Verify desktop and mobile appearance and navigation.
- [x] Repair npm dependency resolution and regenerate npm lockfile; use Node.js 22 because current core dependencies require it.
- [x] Align GitHub Actions installation and verify clean npm install, npm ci, compilation and registration-page rendering.
- [x] Remove custom Pages API initialization and administrator-token requirements; use standard Pages actions with manual site enablement.
- [ ] Validate corrected workflow syntax and artifact tests without changing application features or dependencies.
- [ ] Enable Pages manually with GitHub Actions as the source if necessary (requires repository settings access).
- [ ] Confirm a fresh Pages production build and deployment in GitHub Actions (requires a remote workflow run; expected index is dist/client/index.html).