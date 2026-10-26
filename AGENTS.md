<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

- Keep the home presentation in a dedicated component, with search state and listing interactions owned by the existing index route, so visual refreshes preserve working account and search flows.
- Use global semantic theme tokens and the shared Button component for new branded UI so all pages retain a consistent identity.
- Keep npm's committed package-lock.json synchronized with package.json and use npm 10.9.4 on Node 22.12+ in CI because current TanStack Start packages do not support Node 20.
- Gate GitHub Pages SPA-shell output and disabled Nitro behind GITHUB_PAGES_BUILD so static hosting works without changing Lovable's server deployment; derive router basepath from Vite's BASE_URL for subpath navigation.
- Use standard configure-pages/upload-pages-artifact/deploy-pages actions with automatic Pages enablement disabled; enable Pages manually, derive Vite's base from Pages metadata, and validate dist/client before upload so deployment never requires site-creation privileges or a personal access token.
