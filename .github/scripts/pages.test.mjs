import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { initializePages, validateArtifact } from './pages.mjs';

function mockApi(responses) {
  const calls = [];
  return { calls, request: async (url, options) => {
    calls.push({ url, ...options });
    const next = responses.shift();
    assert.ok(next, 'Unexpected GitHub request');
    return new Response(JSON.stringify(next[1]), { status: next[0] });
  } };
}
const repo = [200, { full_name: 'owner/zamwork' }];
const pages = [200, { build_type: 'workflow', html_url: 'https://owner.github.io/zamwork/' }];
const options = { repository: 'owner/zamwork', token: 'test-token' };

test('missing Pages site is created using workflow source before verification', async () => {
  const api = mockApi([repo, [404, { message: 'Not Found' }], [201, pages[1]], pages]);
  await initializePages({ ...options, request: api.request });
  assert.deepEqual(api.calls.map((call) => call.method), ['GET', 'GET', 'POST', 'GET']);
  assert.deepEqual(JSON.parse(api.calls[2].body), { build_type: 'workflow' });
  assert.equal(api.calls[2].url, 'https://api.github.com/repos/owner/zamwork/pages');
});
test('existing Actions site is preserved without a write', async () => {
  const api = mockApi([repo, pages]);
  await initializePages({ ...options, request: api.request });
  assert.deepEqual(api.calls.map((call) => call.method), ['GET', 'GET']);
});
test('legacy branch source is changed to Actions and verified', async () => {
  const api = mockApi([repo, [200, { build_type: 'legacy', source: { branch: 'gh-pages', path: '/' } }], [200, pages[1]], pages]);
  await initializePages({ ...options, request: api.request });
  assert.equal(api.calls[2].method, 'PUT');
  assert.deepEqual(JSON.parse(api.calls[2].body), { build_type: 'workflow' });
});
test('inaccessible repository is not mistaken for missing Pages', async () => {
  const api = mockApi([[404, { message: 'Not Found' }]]);
  await assert.rejects(initializePages({ ...options, request: api.request }), /Repository access check failed \[404\]/);
  assert.equal(api.calls.length, 1);
});
test('missing initialization permission explains the required token', async () => {
  const api = mockApi([repo, [404, {}], [403, { message: 'Resource not accessible by integration' }]]);
  await assert.rejects(initializePages({ ...options, request: api.request }), /PAGES_ADMIN_TOKEN.*Administration: write and Pages: write/);
});
test('concurrent initialization verifies the existing site after conflict', async () => {
  const api = mockApi([repo, [404, {}], [409, {}], pages]);
  const site = await initializePages({ ...options, request: api.request });
  assert.equal(site.build_type, 'workflow');
});
test('non-404 Pages errors are surfaced without creating a new site', async () => {
  const api = mockApi([repo, [403, { message: 'Forbidden' }]]);
  await assert.rejects(initializePages({ ...options, request: api.request }), /Pages site verification failed \[403\]/);
  assert.equal(api.calls.length, 2);
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