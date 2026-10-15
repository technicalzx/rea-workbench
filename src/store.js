import { mkdir, readdir, readFile, realpath, lstat } from 'node:fs/promises';
import { join, relative, isAbsolute } from 'node:path';
import { randomUUID } from 'node:crypto';
import { home, readJson, atomicJson } from './config.js';

const uuid = /^[a-f0-9]{8}(-[a-f0-9]{4}){3}-[a-f0-9]{12}$/;
export function validId(id) { if (typeof id !== 'string' || !uuid.test(id)) throw new Error('Invalid identifier'); return id; }
export const projectsRoot = () => join(home(), 'projects');
export const projectDir = id => join(projectsRoot(), validId(id));
export function text(value, name, max = 200) {
  if (typeof value !== 'string' || !value.trim() || value.length > max || value.includes('\0')) throw new Error(`Invalid ${name}`);
  return value.trim();
}
export async function contained(root, file) {
  const actualRoot = await realpath(root);
  const actual = await realpath(file);
  const rel = relative(actualRoot, actual);
  if (rel.startsWith('..') || isAbsolute(rel)) throw new Error('Path escapes project');
  return actual;
}
export async function createProject(input) {
  const name = text(input.name, 'name');
  const goal = text(input.goal, 'goal', 4000);
  if (input.authorized !== true) throw new Error('Record authorization for the target scope before creating a project');
  const scope = text(input.scope, 'authorization scope', 4000);
  const id = randomUUID(); const dir = projectDir(id);
  await mkdir(dir, { recursive: true, mode: 0o700 });
  for (const folder of ['targets', 'reports', 'runs']) await mkdir(join(dir, folder), { mode: 0o700 });
  const project = { schemaVersion: 1, id, name, goal, scope, status: 'active', createdAt: new Date().toISOString() };
  await atomicJson(join(dir, 'project.json'), project);
  await atomicJson(join(dir, 'notes.json'), { markdown: '', updatedAt: project.createdAt });
  return project;
}
export async function getProject(id) {
  const dir = projectDir(id);
  await contained(projectsRoot(), dir);
  return readJson(await contained(dir, join(dir, 'project.json')));
}
export async function listProjects() {
  await mkdir(projectsRoot(), { recursive: true, mode: 0o700 });
  const entries = await readdir(projectsRoot(), { withFileTypes: true });
  return (await Promise.all(entries.filter(e => e.isDirectory() && uuid.test(e.name)).map(e => getProject(e.name)))).sort((a,b) => b.createdAt.localeCompare(a.createdAt));
}
export async function updateProject(id, input) {
  const project = await getProject(id);
  if (input.status !== undefined) {
    if (!['active', 'archived'].includes(input.status)) throw new Error('Invalid project status');
    project.status = input.status;
    await atomicJson(join(projectDir(id), 'project.json'), project);
  }
  if (input.markdown !== undefined) {
    if (typeof input.markdown !== 'string' || input.markdown.length > 100000) throw new Error('Notes exceed 100 KB');
    await contained(projectDir(id), join(projectDir(id), 'notes.json'));
    await atomicJson(join(projectDir(id), 'notes.json'), { markdown: input.markdown, updatedAt: new Date().toISOString() });
  }
  return project;
}
export async function listRuns(id) {
  await getProject(id);
  const dir = await contained(projectDir(id), join(projectDir(id), 'runs'));
  const entries = await readdir(dir, { withFileTypes: true });
  return (await Promise.all(entries.filter(e => e.isDirectory() && uuid.test(e.name)).map(async e => readJson(await contained(dir, join(dir, e.name, 'run.json')))))).sort((a,b) => b.startedAt.localeCompare(a.startedAt));
}
export async function detail(id) {
  const project = await getProject(id);
  return { ...project, directory: projectDir(id), notes: await readJson(await contained(projectDir(id), join(projectDir(id), 'notes.json'))), runs: await listRuns(id) };
}
export async function exportProject(id) {
  const result = await detail(id);
  // Exports deliberately omit target bytes, absolute target paths, secrets and raw evidence.
  delete result.directory;
  result.runs = result.runs.map(({ id, kind, status, startedAt, finishedAt, evidenceSha256, exitCode }) => ({ id, kind, status, startedAt, finishedAt, evidenceSha256, exitCode }));
  return { format: 'rea-workbench-summary', version: 1, exportedAt: new Date().toISOString(), project: result };
}
export async function artifact(id, runId, type) {
  await getProject(id); validId(runId);
  if (!['evidence.json', 'stderr.log'].includes(type)) throw new Error('Unknown artifact');
  const file = await contained(projectDir(id), join(projectDir(id), 'runs', runId, type));
  if (!(await lstat(file)).isFile()) throw new Error('Not a regular file');
  return file;
}
