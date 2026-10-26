import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, rm, readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { validateArtifact } from './pages.mjs';

test('deployment never initializes Pages or requests an administrator token', async () => {
  const workflow = await readFile(new URL('../workflows/main.yml', import.meta.url), 'utf8');
  const script = await readFile(new URL('./pages.mjs', import.meta.url), 'utf8');
  assert.match(workflow, /uses: actions\/configure-pages@v5\s+with:[\s\S]*?enablement: false/);
  assert.doesNotMatch(workflow, /PAGES_ADMIN_TOKEN|GH_TOKEN|pages\.mjs initialize/);
  assert.doesNotMatch(script, /initializePages|api\.github\.com|Authorization|fetch\(/);
});

test('artifact uses dist/client files and the actual repository base path', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'zamwork-pages-'));
  try {
    await mkdir(join(directory, 'assets'));
    await writeFile(join(directory, 'assets/app.js'), 'export {};');
    const html = '<script type="module" src="/renamed-repository/assets/app.js"></script>';
    await Promise.all(['index.html', '404.html'].map((file) => writeFile(join(directory, file), html)));
    await writeFile(join(directory, '.nojekyll'), '');
    assert.equal(await validateArtifact(directory, '/renamed-repository/'), 1);
    await assert.rejects(validateArtifact(directory, '/wrong-repository/'), /does not use the Pages base path/);
    await rm(join(directory, 'assets/app.js'));
    await assert.rejects(validateArtifact(directory, '/renamed-repository/'), /ENOENT/);
  } finally { await rm(directory, { recursive: true, force: true }); }
});