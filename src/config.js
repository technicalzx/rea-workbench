import { homedir } from 'node:os';
import { resolve, join } from 'node:path';
import { readFile, mkdir, writeFile, rename } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';

export const home = () => resolve(process.env.REAW_HOME || join(homedir(), '.rea-workbench'));
export async function readJson(file) { return JSON.parse(await readFile(file, 'utf8')); }
export async function atomicJson(file, value) {
  const temp = `${file}.${randomUUID()}.tmp`;
  await writeFile(temp, JSON.stringify(value, null, 2) + '\n', { mode: 0o600, flag: 'wx' });
  await rename(temp, file);
}
export function validateConfig(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('Configuration must be an object');
  const allowed = ['baseURL', 'model', 'ghidraDir', 'javaHome'];
  if (Object.keys(value).some(key => !allowed.includes(key))) throw new Error('Unknown configuration field; secrets belong in the environment');
  const baseURL = value.baseURL || 'http://127.0.0.1:20128/v1';
  const url = new URL(baseURL);
  if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password || url.search || url.hash) throw new Error('Invalid gateway URL');
  if (url.protocol !== 'https:' && !['127.0.0.1', 'localhost', '[::1]'].includes(url.hostname)) throw new Error('Remote gateways require HTTPS');
  for (const key of allowed) if (value[key] !== undefined && (typeof value[key] !== 'string' || value[key].length > 4096 || /[\r\n\0]/.test(value[key]))) throw new Error(`Invalid ${key}`);
  return { baseURL: baseURL.replace(/\/+$/, ''), model: value.model || '', ghidraDir: value.ghidraDir || '', javaHome: value.javaHome || '' };
}
export async function loadConfig() {
  let stored = {};
  try { stored = await readJson(join(home(), 'config.json')); } catch (e) { if (e.code !== 'ENOENT') throw e; }
  return validateConfig({ ...stored,
    ...(process.env.OMNIROUTE_BASE_URL ? { baseURL: process.env.OMNIROUTE_BASE_URL } : {}),
    ...(process.env.OMNIROUTE_MODEL ? { model: process.env.OMNIROUTE_MODEL } : {}),
    ...(process.env.GHIDRA_INSTALL_DIR ? { ghidraDir: process.env.GHIDRA_INSTALL_DIR } : {}),
    ...(process.env.JAVA_HOME ? { javaHome: process.env.JAVA_HOME } : {}) });
}
export async function saveConfig(value) {
  const validated = validateConfig(value);
  await mkdir(home(), { recursive: true, mode: 0o700 });
  await atomicJson(join(home(), 'config.json'), validated);
  return validated;
}
export function redact(text) {
  let result = String(text);
  const secrets = Object.entries(process.env).filter(([key, value]) => /KEY|TOKEN|SECRET|PASSWORD/i.test(key) && value?.length >= 6).map(([, value]) => value);
  for (const secret of secrets.sort((a, b) => b.length - a.length)) result = result.split(secret).join('[REDACTED]');
  return result;
}
