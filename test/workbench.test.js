import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, writeFile, mkdir, readFile, symlink } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import http from 'node:http';
import { createProject, listProjects, projectDir, getProject, updateProject, exportProject, contained, detail } from '../src/store.js';
import { saveConfig, loadConfig, redact } from '../src/config.js';
import { analysisArgs, Runner, hashFile } from '../src/runner.js';
import { openCodeConfig, providerEnv } from '../src/integrations.js';
import { startServer } from '../src/server.js';

const sandbox = await mkdtemp(join(tmpdir(), 'reaw-test-'));
process.env.REAW_HOME = join(sandbox, 'workspace');
const input = { name: '<script>research</script>', goal: 'Understand a parser', scope: 'Static inspection of our own fixture', authorized: true };

test('project persistence, notes, archive and summary export', async () => {
  const project = await createProject(input);
  assert.equal((await listProjects())[0].id, project.id);
  await updateProject(project.id, { markdown: 'Evidence is pending.', status: 'archived' });
  const saved = await detail(project.id);
  assert.equal(saved.notes.markdown, 'Evidence is pending.'); assert.equal(saved.status, 'archived');
  const exported = await exportProject(project.id);
  assert.equal(exported.project.directory, undefined); assert.equal(exported.project.name, input.name);
  await assert.rejects(getProject('../../etc'), /identifier/);
  await assert.rejects(createProject({ ...input, authorized: false }), /authorization/);
});
test('path containment rejects traversal and symbolic link escapes', async t => {
  const inside = join(sandbox, 'inside'); const outside = join(sandbox, 'outside');
  await mkdir(inside); await mkdir(outside);
  await assert.rejects(contained(inside, outside), /escapes/);
  try { await symlink(outside, join(inside, 'link'), process.platform === 'win32' ? 'junction' : 'dir'); }
  catch (error) { if (error.code === 'EPERM') { t.skip('Host does not permit test symlinks'); return; } throw error; }
  await assert.rejects(contained(inside, join(inside, 'link')), /escapes/);
});
test('configuration validation, secret exclusion and exact secret redaction', async () => {
  await assert.rejects(saveConfig({ baseURL: 'http://example.com/v1' }), /HTTPS/);
  await assert.rejects(saveConfig({ apiKey: 'do-not-store' }), /Unknown/);
  await assert.rejects(saveConfig({ baseURL: 'https://user:password@example.com/v1' }), /URL/);
  await saveConfig({ baseURL: 'http://127.0.0.1:20128/v1', model: 'local-test' });
  assert.equal((await loadConfig()).model, 'local-test');
  process.env.OMNIROUTE_API_KEY = 'test-only-never-real-key';
  assert.equal(redact('value=test-only-never-real-key'), 'value=[REDACTED]');
  assert.equal(providerEnv(await loadConfig()).OMNIROUTE_API_KEY, undefined);
  assert.equal(providerEnv(await loadConfig(), true).OMNIROUTE_API_KEY, process.env.OMNIROUTE_API_KEY);
  const config = openCodeConfig(await loadConfig());
  assert.equal(config.share, 'disabled'); assert.equal(config.permission.bash, 'ask');
  assert.equal(config.provider.omniroute.options.apiKey, '{env:OMNIROUTE_API_KEY}');
  assert.ok(!JSON.stringify(config).includes(process.env.OMNIROUTE_API_KEY));
  delete process.env.OMNIROUTE_API_KEY;
});
test('analysis arguments are an allowlist and never interpret shell syntax', () => {
  const target = 'C:\\research\\a; echo injected.exe';
  assert.deepEqual(analysisArgs('native', target), ['inspect', target, '--provider', 'ghidra', '--format', 'json']);
  assert.throws(() => analysisArgs('shell', target), /Unsupported/);
  assert.throws(() => analysisArgs('__proto__', target), /Unsupported/);
});
test('runner preserves real process output, hashes evidence and enforces concurrency', async () => {
  const project = await createProject(input);
  const fixture = join(sandbox, 'fixture.mjs'); const target = join(sandbox, 'target.js');
  await writeFile(target, 'export const answer = 42;');
  await writeFile(fixture, 'setTimeout(() => { console.log(JSON.stringify({observed:true})); console.error("progress"); }, 80);');
  const runner = new Runner({ entry: () => fixture });
  const run = await runner.start(project.id, { kind: 'javascript', target });
  await assert.rejects(runner.start(project.id, { kind: 'javascript', target }), /already/);
  const result = await runner.pending;
  assert.equal(result.status, 'completed'); assert.equal(runner.busy, false);
  const evidence = join(projectDir(project.id), 'runs', run.id, 'evidence.json');
  assert.equal(result.evidenceSha256, await hashFile(evidence));
  assert.equal(JSON.parse(await readFile(evidence, 'utf8')).observed, true);
  await updateProject(project.id, { status: 'archived' });
  await assert.rejects(runner.start(project.id, { kind: 'javascript', target }), /archived/);
});
test('runner reports failure, output budget and interrupted state recovery', async () => {
  const project = await createProject(input); const fixture = join(sandbox, 'fail.mjs'); const target = join(sandbox, 'target.js');
  await writeFile(fixture, 'process.stdout.write("x".repeat(10000));process.exitCode=7;');
  const runner = new Runner({ entry: () => fixture, maxBytes: 512 });
  await runner.start(project.id, { kind: 'javascript', target });
  const result = await runner.pending; assert.equal(result.status, 'failed'); assert.match(result.error, /Output limit/);
  const runFile = join(projectDir(project.id), 'runs', result.id, 'run.json');
  await writeFile(runFile, JSON.stringify({ ...result, status: 'running' })); await runner.recover();
  assert.equal((await detail(project.id)).runs[0].status, 'interrupted');
});
test('local HTTP API blocks cross-origin requests, DNS rebinding, missing tokens and invalid inputs', async () => {
  const { server, origin } = await startServer({ port: 0 });
  try {
    const page = await fetch(origin); const html = await page.text();
    const token = /name="workbench-token" content="([a-f0-9]+)"/.exec(html)[1];
    assert.match(page.headers.get('content-security-policy'), /frame-ancestors 'none'/);
    assert.equal((await fetch(`${origin}/api/projects`)).status, 401);
    const headers = { 'x-workbench-token': token, 'content-type': 'application/json' };
    assert.equal((await fetch(`${origin}/api/projects`, { headers: { ...headers, Origin: 'https://evil.example' } })).status, 403);
    const rebound = await new Promise((resolve, reject) => { const req = http.get(`${origin}/api/projects`, { headers: { ...headers, Host: 'evil.example' } }, res => { res.resume(); resolve(res.statusCode); }); req.on('error', reject); });
    assert.equal(rebound, 403);
    const created = await fetch(`${origin}/api/projects`, { method: 'POST', headers, body: JSON.stringify(input) });
    assert.equal(created.status, 201); const project = await created.json();
    assert.equal((await fetch(`${origin}/api/projects/${project.id}`, { headers })).status, 200);
    const rejected = await fetch(`${origin}/api/config`, { method: 'POST', headers, body: JSON.stringify({ baseURL: 'http://evil.example/v1' }) }); assert.equal(rejected.status, 400);
    assert.equal((await fetch(`${origin}/api/projects`, { method: 'POST', headers, body: 'x'.repeat(132000) })).status, 400);
    assert.equal((await fetch(`${origin}/api/projects`, { method: 'DELETE', headers })).status, 405);
    assert.equal((await fetch(`${origin}/api/projects`, { method: 'POST', headers: { 'x-workbench-token': token }, body: '{}' })).status, 415);
    assert.equal((await fetch(`${origin}/not-an-asset`)).status, 404);
  } finally { await new Promise(resolve => server.close(resolve)); }
});
