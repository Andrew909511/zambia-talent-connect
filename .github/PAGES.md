# Zamwork GitHub Pages deployment

## First-time setup

The workflow deploys the repository that runs it (`GITHUB_REPOSITORY`), not a
hard-coded owner or repository. Confirm that repository matches **Lovable →
Project settings → Git**. Git sync and GitHub API access are separate connections;
local project files cannot establish the live sync status.

Enable Pages manually in **GitHub → repository → Settings → Pages** and select
**GitHub Actions** under **Build and deployment → Source** before running the
workflow. If Pages is already enabled with this source, no setup is needed.

The workflow uses standard `actions/configure-pages`,
`actions/upload-pages-artifact`, and `actions/deploy-pages`. Automatic site
enablement is explicitly disabled. There is no custom Pages REST API logic,
administrator secret, or personal access token requirement. `GITHUB_TOKEN` is
used only by the standard actions for an already-enabled Pages site, with
`contents: read`, `pages: write`, and `id-token: write` permissions.

If `configure-pages` reports a missing site, enable it in Settings as above;
the workflow intentionally does not create it.

## Source, paths, and output

- Automatic deployment runs on pushes to **main**; manual runs use **Actions →
  Deploy Zamwork to GitHub Pages → Run workflow**. Select main for a production run.
  If Lovable syncs a different branch, merge into main or update the workflow's
  push branch to match the intended production branch.
- Pages publishing source is **GitHub Actions**, not a `gh-pages` branch.
- Vite's base comes from `configure-pages`'s actual `base_path`, with a trailing
  slash: project sites use `/repository/`; root sites and root custom domains use
  `/`. Router navigation already uses Vite's `BASE_URL`.
- `GITHUB_PAGES_BUILD=true` enables the existing static SPA build only for Pages.
  Lovable's server deployment remains unchanged.
- TanStack builds **dist/client**. The Pages-only preparation step stages that
  static website at **dist**, excluding server output. Validation and
  `actions/upload-pages-artifact@v4` use **dist**. `dist/index.html` must exist,
  `404.html` must match it, and `.nojekyll` and bundled assets must be present.
  The validator checks asset URLs against the actual Pages base path.
- Node **22.22.0**, npm **10.9.4**, package.json, and package-lock.json are unchanged.

## Verification

Local deployment-rule tests and temporary artifact fixtures:

```sh
node --test .github/scripts/pages.test.mjs
```

Run the updated workflow after these changes reach GitHub. It performs the tests,
standard Pages configuration, clean installation, a fresh
production build, output validation, artifact upload, deployment, and an HTTP
check of the returned Pages URL. Check both the build and deploy jobs.

This TanStack Start application initially outputs **dist/client/index.html**.
The Pages workflow prepares **dist/index.html** after the build without changing
application configuration. It validates the static output before staging it,
preserves the SPA shell as **dist/404.html**, then checks and uploads **dist**.

The local tests do not prove GitHub credentials, repository settings, actual
production output, or a live deployment. Those remain unverified until the remote
workflow succeeds. GitHub repository plan, organization policy, and environment
protection rules may require administrator action.