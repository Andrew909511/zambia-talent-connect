# Zamwork GitHub Pages deployment

## First-time setup

The workflow deploys the repository that runs it (`GITHUB_REPOSITORY`), not a
hard-coded owner or repository. Confirm that repository matches **Lovable →
Project settings → Git**. Git sync and GitHub API access are separate connections;
local project files cannot establish the live sync status.

If Pages is absent, or still uses a branch-based publishing source, add a
repository Actions secret named **PAGES_ADMIN_TOKEN** in **GitHub → repository →
Settings → Secrets and variables → Actions**. Use a fine-grained personal access
token scoped to this repository with **Administration: read and write** and
**Pages: read and write**, or an equivalent GitHub App installation token.
Organization approval may be required. Never put the token in source or chat.

GitHub's normal `GITHUB_TOKEN` can deploy an initialized Pages site but cannot
enable a missing one. Adding `pages: write` alone does not solve first-time setup.

The initialization script first checks repository access, then handles an absent
site with `POST /repos/{owner}/{repo}/pages` and `{"build_type":"workflow"}`.
Existing branch-based sites are switched with `PUT` using the same payload.
It verifies the site before `actions/configure-pages` reads it. Other API failures
are reported with their status rather than treated as missing sites.

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
- The build, validator, and artifact upload all use **dist/client**. `index.html`
  must exist, `404.html` must match it, and `.nojekyll` and bundled assets must be
  present. The validator checks asset URLs against the actual Pages base path.
- Node **22.22.0**, npm **10.9.4**, package.json, and package-lock.json are unchanged.

## Verification

Local setup tests (mock GitHub responses and temporary artifact fixtures):

```sh
node --test .github/scripts/pages.test.mjs
```

Run the updated workflow after these changes reach GitHub. It performs the tests,
live repository/Pages verification and initialization, clean installation, a fresh
production build, output validation, artifact upload, deployment, and an HTTP
check of the returned Pages URL. Check both the build and deploy jobs.

The local tests do not prove GitHub credentials, repository settings, actual
production output, or a live deployment. Those remain unverified until the remote
workflow succeeds. GitHub repository plan, organization policy, and environment
protection rules may require administrator action.