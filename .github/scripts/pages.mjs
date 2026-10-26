import { readFile, access, cp, mkdtemp, rename, rm, writeFile } from 'node:fs/promises';
import { resolve, join, dirname } from 'node:path';
import { pathToFileURL } from 'node:url';

// This script runs only in GitHub Actions, never in the application runtime.
export async function validateArtifact(directory, basePath) {
  if (!basePath.startsWith('/') || !basePath.endsWith('/')) throw new Error('The Pages base path must start and end with /.');
  const html = await readFile(join(directory, 'index.html'), 'utf8');
  if (!html.trim()) throw new Error('The Pages index.html is empty.');
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

// TanStack emits dist/client. Stage only that static website at dist for Pages.
export async function prepareArtifact(directory, basePath) {
  const output = resolve(directory);
  const staging = await mkdtemp(join(dirname(output), '.zamwork-pages-'));
  try {
    await cp(join(output, 'client'), staging, { recursive: true });
    const html = await readFile(join(staging, 'index.html'), 'utf8');
    await writeFile(join(staging, '404.html'), html);
    await writeFile(join(staging, '.nojekyll'), '');
    const count = await validateArtifact(staging, basePath);
    await rm(output, { recursive: true });
    await rename(staging, output);
    return count;
  } finally {
    await rm(staging, { recursive: true, force: true });
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  try {
    const mode = process.argv[2];
    if (mode !== 'prepare' && mode !== 'validate') throw new Error('Choose prepare or validate.');
    const operation = mode === 'prepare' ? prepareArtifact : validateArtifact;
    const count = await operation('dist', process.env.PAGES_BASE_PATH ?? '/');
    console.log(`Verified dist/index.html, SPA fallback, and ${count} bundled assets.`);
  } catch (error) {
    console.error(error instanceof Error ? error.message : 'Pages setup failed.');
    process.exitCode = 1;
  }
}