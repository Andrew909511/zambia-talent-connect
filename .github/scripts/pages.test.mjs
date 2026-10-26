import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, rm, readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { prepareArtifact, validateArtifact } from './pages.mjs';

test('deployment never initializes Pages or requests an administrator token', async () => {
  const workflow = await readFile(new URL('../workflows/main.yml', import.meta.url), 'utf8');
  const script = await readFile(new URL('./pages.mjs', import.meta.url), 'utf8');
  assert.match(workflow, /uses: actions\/configure-pages@v5\s+with:[\s\S]*?enablement: false/);
  assert.doesNotMatch(workflow, /PAGES_ADMIN_TOKEN|GH_TOKEN|pages\.mjs initialize/);
  assert.doesNotMatch(script, /initializePages|api\.github\.com|Authorization|fetch\(/);
});

test('artifact uses the actual repository base path', async () => {
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

test('Pages stages the static client at dist/index.html and preserves its SPA fallback', async () => {
  const root = await mkdtemp(join(tmpdir(), 'zamwork-staging-'));
  const directory = join(root, 'dist');
  try {
    await mkdir(join(directory, 'client', 'assets'), { recursive: true });
    await mkdir(join(directory, 'server'));
    await writeFile(join(directory, 'server', 'private.js'), 'server-only');
    await writeFile(join(directory, 'client', 'assets', 'app.js'), 'export {};');
    const html = '<script type="module" src="/zamwork/assets/app.js"></script>';
    await writeFile(join(directory, 'client', 'index.html'), html);
    assert.equal(await prepareArtifact(directory, '/zamwork/'), 1);
    assert.equal(await readFile(join(directory, 'index.html'), 'utf8'), html);
    assert.equal(await readFile(join(directory, '404.html'), 'utf8'), html);
    assert.equal(await readFile(join(directory, '.nojekyll'), 'utf8'), '');
    await assert.rejects(readFile(join(directory, 'server', 'private.js')), /ENOENT/);
    assert.equal(await validateArtifact(directory, '/zamwork/'), 1);
  } finally { await rm(root, { recursive: true, force: true }); }
});

test('invalid build output is rejected before replacing dist', async () => {
  const root = await mkdtemp(join(tmpdir(), 'zamwork-invalid-'));
  const directory = join(root, 'dist');
  try {
    await mkdir(join(directory, 'client'), { recursive: true });
    await writeFile(join(directory, 'client', 'index.html'), '');
    await assert.rejects(prepareArtifact(directory, '/'), /empty/);
    assert.equal(await readFile(join(directory, 'client', 'index.html'), 'utf8'), '');
  } finally { await rm(root, { recursive: true, force: true }); }
});

test('root Pages sites retain root asset paths', async () => {
  const root = await mkdtemp(join(tmpdir(), 'zamwork-root-'));
  const directory = join(root, 'dist');
  try {
    await mkdir(join(directory, 'client', 'assets'), { recursive: true });
    await writeFile(join(directory, 'client', 'assets', 'app.js'), 'export {};');
    await writeFile(join(directory, 'client', 'index.html'), '<script src="/assets/app.js"></script>');
    assert.equal(await prepareArtifact(directory, '/'), 1);
    assert.equal(await validateArtifact(directory, '/'), 1);
  } finally { await rm(root, { recursive: true, force: true }); }
});