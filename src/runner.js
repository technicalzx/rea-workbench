import { spawn } from 'node:child_process';
import { createWriteStream, createReadStream } from 'node:fs';
import { mkdir, stat, realpath } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { randomUUID, createHash } from 'node:crypto';
import { once } from 'node:events';
import { loadConfig, atomicJson, redact } from './config.js';
import { getProject, projectDir, contained, text, listProjects, listRuns } from './store.js';
import { reaEntry, providerEnv } from './integrations.js';

export const operations = Object.freeze({ javascript: 'analyze-javascript-application', native: 'inspect', managed: 'inspect-managed-artifact', sqlite: 'inspect-sqlite-database' });
export async function hashFile(file) {
  const hash = createHash('sha256');
  for await (const chunk of createReadStream(file)) hash.update(chunk);
  return hash.digest('hex');
}
export function analysisArgs(kind, target) {
  if (!Object.hasOwn(operations, kind)) throw new Error('Unsupported analysis kind');
  return kind === 'native' ? ['inspect', target, '--provider', 'ghidra', '--format', 'json'] : [operations[kind], target, '--json'];
}
export class Runner {
  constructor({ entry = reaEntry, timeout = 600000, maxBytes = 128 * 1024 * 1024 } = {}) {
    this.entry = entry; this.timeout = timeout; this.maxBytes = maxBytes; this.busy = false; this.pending = null;
  }
  async recover() {
    for (const project of await listProjects()) for (const run of await listRuns(project.id)) {
      if (run.status === 'running') await atomicJson(join(projectDir(project.id), 'runs', run.id, 'run.json'), { ...run, status: 'interrupted', finishedAt: new Date().toISOString(), error: 'Workbench restarted before the run completed. Verify no orphan analysis process remains before retrying.' });
    }
  }
  async start(projectId, input) {
    if (this.busy) throw new Error('An analysis is already running; wait for it to finish');
    const project = await getProject(projectId);
    if (project.status !== 'active') throw new Error('Restore the archived project before analysis');
    const target = await realpath(resolve(text(input.target, 'target path', 4096)));
    const info = await stat(target);
    if (!info.isFile() && !info.isDirectory()) throw new Error('Target must be a file or directory');
    const args = analysisArgs(input.kind, target);
    const config = await loadConfig();
    const entry = this.entry();
    // Acquire before asynchronous writes to prevent concurrent request races.
    if (this.busy) throw new Error('An analysis is already running; wait for it to finish');
    this.busy = true;
    try {
      const id = randomUUID();
      const runsDir = await contained(projectDir(projectId), join(projectDir(projectId), 'runs'));
      const dir = join(runsDir, id); await mkdir(dir, { mode: 0o700 });
      const run = { id, projectId, kind: input.kind, target, status: 'running', startedAt: new Date().toISOString(), command: ['node', 'rea', ...args] };
      await atomicJson(join(dir, 'run.json'), run);
      this.pending = this.execute(run, dir, entry, args, providerEnv(config)).finally(() => { this.busy = false; });
      return run;
    } catch (error) { this.busy = false; throw error; }
  }
  async execute(run, dir, entry, args, env) {
    const stdoutFile = join(dir, 'evidence.json'); const stderrFile = join(dir, 'stderr.log');
    const out = createWriteStream(stdoutFile, { flags: 'wx', mode: 0o600 });
    const err = createWriteStream(stderrFile, { flags: 'wx', mode: 0o600 });
    let bytes = 0; let failure = null; let child;
    let timer;
    try {
      const exitCode = await new Promise(resolveExit => {
        child = spawn(process.execPath, [entry, ...args], { env, shell: false, windowsHide: true });
        const stop = message => { failure ||= message; child.kill(); };
        timer = setTimeout(() => stop('Analysis timed out; inspect the host for surviving provider processes before retrying'), this.timeout);
        // One output budget covers both streams. Pipe handles backpressure; excess kills the wrapper.
        for (const [source, destination] of [[child.stdout, out], [child.stderr, err]]) {
          source.on('data', chunk => {
            bytes += chunk.length;
            if (bytes > this.maxBytes) { stop('Output limit exceeded'); return; }
            if (!destination.write(chunk)) { source.pause(); destination.once('drain', () => source.resume()); }
          });
          destination.on('error', () => stop('Could not write analysis output'));
        }
        child.on('error', e => { failure = redact(e.message); resolveExit(null); });
        child.on('close', resolveExit);
      });
      clearTimeout(timer);
      const ended = Promise.all([once(out, 'finish'), once(err, 'finish')]); out.end(); err.end(); await ended;
      const evidenceSha256 = await hashFile(stdoutFile);
      const result = { ...run, status: failure || exitCode !== 0 ? 'failed' : 'completed', exitCode, finishedAt: new Date().toISOString(), evidenceSha256, outputBytes: bytes, ...(failure ? { error: failure } : {}) };
      await atomicJson(join(dir, 'run.json'), result);
      return result;
    } catch (error) {
      clearTimeout(timer); child?.kill(); out.destroy(); err.destroy();
      const result = { ...run, status: 'failed', finishedAt: new Date().toISOString(), error: redact(error.message) };
      await atomicJson(join(dir, 'run.json'), result); return result;
    }
  }
}
