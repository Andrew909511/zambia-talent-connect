import { readFile, access } from 'node:fs/promises';
import { resolve, join } from 'node:path';
import { pathToFileURL } from 'node:url';

// This script runs only in GitHub Actions, never in the application runtime.
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
    if (process.argv[2] === 'validate') {
      const count = await validateArtifact('dist/client', process.env.PAGES_BASE_PATH ?? '/');
      console.log(`Verified dist/client SPA shell, fallback, and ${count} bundled assets.`);
    } else throw new Error('Choose validate.');
  } catch (error) {
    console.error(error instanceof Error ? error.message : 'Pages setup failed.');
    process.exitCode = 1;
  }
}