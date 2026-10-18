import { readFile, access } from 'node:fs/promises';
import { resolve, join } from 'node:path';
import { pathToFileURL } from 'node:url';

// This script runs only in GitHub Actions, never in the application runtime.
export async function initializePages({ repository, token, request = fetch }) {
  if (!/^[\w.-]+\/[\w.-]+$/.test(repository ?? '')) throw new Error('GITHUB_REPOSITORY must identify the repository running this workflow.');
  if (!token) throw new Error('A GitHub token is required to configure Pages.');
  const endpoint = `https://api.github.com/repos/${repository}`;
  async function api(path, method = 'GET', body) {
    const response = await request(`${endpoint}${path}`, {
      method,
      headers: {
        Accept: 'application/vnd.github+json',
        Authorization: `Bearer ${token}`,
        'X-GitHub-Api-Version': '2022-11-28',
        ...(body ? { 'Content-Type': 'application/json' } : {}),
      },
      ...(body ? { body: JSON.stringify(body) } : {}),
    });
    const text = await response.text();
    let data;
    try { data = JSON.parse(text); } catch { data = { message: text }; }
    return { status: response.status, ok: response.ok, data };
  }
  function requireSuccess(result, action) {
    if (!result.ok) throw new Error(`${action} failed [${result.status}]: ${result.data.message ?? 'Unknown GitHub error'}. To initialize or change Pages, set the repository Actions secret PAGES_ADMIN_TOKEN to a fine-grained token with repository Administration: write and Pages: write, or a GitHub App token with those permissions. GITHUB_TOKEN cannot initialize a missing Pages site.`);
    return result.data;
  }
  const repo = requireSuccess(await api(''), 'Repository access check');
  if (repo.full_name?.toLowerCase() !== repository.toLowerCase()) throw new Error('GitHub returned a different repository than the workflow target.');
  let site = await api('/pages');
  if (site.status === 404) {
    const created = await api('/pages', 'POST', { build_type: 'workflow' });
    // Another workflow or administrator can initialize the site concurrently.
    if (created.status !== 409) requireSuccess(created, 'Pages initialization');
    site = await api('/pages');
  }
  const pages = requireSuccess(site, 'Pages site verification');
  if (pages.build_type !== 'workflow') {
    requireSuccess(await api('/pages', 'PUT', { build_type: 'workflow' }), 'Switching Pages to GitHub Actions');
    const updated = requireSuccess(await api('/pages'), 'Pages source verification');
    if (updated.build_type !== 'workflow') throw new Error('Pages is not configured to deploy from GitHub Actions.');
    return updated;
  }
  return pages;
}

export async function validateArtifact(directory, basePath) {
  if (!basePath.startsWith('/') || !basePath.endsWith('/')) throw new Error('The Pages base path must start and end with /.');
  const html = await readFile(join(directory, 'index.html'), 'utf8');
  if (!html.trim()) throw new Error('dist/client/index.html is empty.');
  const fallback = await readFile(join(directory, '404.html'), 'utf8');
  if (fallback !== html) throw new Error('The Pages 404 fallback must match the SPA shell.');
  await access(join(directory, '.nojekyll'));
  const assets = [...html.matchAll(/(?:src|href)=["']([^"']+)["']/g)]
    .map((match) => match[1]).filter((url) => url.includes('/assets/') && !/^https?:\/\//.test(url));
  if (!assets.length) throw new Error('No bundled assets were found in the SPA shell.');
  for (const url of assets) {
    if (!url.startsWith(basePath)) throw new Error(`Asset does not use the Pages base path: ${url}`);
    const relative = decodeURIComponent(url.slice(basePath.length).split(/[?#]/)[0]);
    const path = resolve(directory, relative);
    if (!path.startsWith(`${resolve(directory)}/`)) throw new Error('Asset path escapes the deployment directory.');
    await access(path);
  }
  return assets.length;
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  try {
    if (process.argv[2] === 'initialize') {
      const site = await initializePages({ repository: process.env.GITHUB_REPOSITORY, token: process.env.GH_TOKEN });
      console.log(`Verified ${process.env.GITHUB_REPOSITORY}: Pages source=${site.build_type}, URL=${site.html_url}`);
    } else if (process.argv[2] === 'validate') {
      const count = await validateArtifact('dist/client', process.env.PAGES_BASE_PATH ?? '/');
      console.log(`Verified dist/client SPA shell, fallback, and ${count} bundled assets.`);
    } else throw new Error('Choose initialize or validate.');
  } catch (error) {
    console.error(error instanceof Error ? error.message : 'Pages setup failed.');
    process.exitCode = 1;
  }
}