import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
const roots = ['bin', 'src', 'web', 'test', 'scripts'];
let failed = false;
for (const root of roots) for (const entry of await readdir(root)) {
  if (!entry.endsWith('.js')) continue;
  const file = join(root, entry); const result = spawnSync(process.execPath, ['--check', file], { encoding: 'utf8' });
  if (result.status !== 0) { console.error(result.stderr); failed = true; }
  const source = await readFile(file, 'utf8');
  if (root !== 'scripts' && (source.includes('shell: true') || source.includes('innerHTML =') || source.includes('eval('))) { console.error(`Unsafe execution or rendering pattern in ${file}`); failed = true; }
}
if (failed) process.exitCode = 1; else console.log('Syntax and baseline source checks passed. This is not a security audit.');
