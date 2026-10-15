import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { spawn } from 'node:child_process';
import { loadConfig, redact } from './config.js';
const require = createRequire(import.meta.url);
export const reaEntry = () => require.resolve('rea-agents/scripts/rea.mjs');
export const openCodeEntry = () => {
  const file = require.resolve('opencode-ai/package.json');
  return join(dirname(file), require(file).bin.opencode);
};
export function providerEnv(config, includeKey = false) {
  const env = { ...process.env };
  // Static analysis does not need model or cloud credentials.
  for (const key of Object.keys(env)) if (/KEY|TOKEN|SECRET|PASSWORD/i.test(key)) delete env[key];
  if (config.ghidraDir) env.GHIDRA_INSTALL_DIR = config.ghidraDir;
  if (config.javaHome) env.JAVA_HOME = config.javaHome;
  if (includeKey && process.env.OMNIROUTE_API_KEY) env.OMNIROUTE_API_KEY = process.env.OMNIROUTE_API_KEY;
  return env;
}
export async function gatewayModels(config = null) {
  config ||= await loadConfig();
  const key = process.env.OMNIROUTE_API_KEY;
  if (!key) throw new Error('Set OMNIROUTE_API_KEY to your own gateway key');
  const response = await fetch(`${config.baseURL}/models`, { headers: { Authorization: `Bearer ${key}` }, signal: AbortSignal.timeout(10000), redirect: 'error' });
  if (!response.ok) throw new Error(`Gateway returned HTTP ${response.status}`);
  const data = await response.json();
  return (data.data || []).map(m => ({ id: String(m.id) }));
}
export function openCodeConfig(config) {
  if (!config.model) throw new Error('Choose a model explicitly before opening the AI agent');
  return {
    $schema: 'https://opencode.ai/config.json',
    model: `omniroute/${config.model}`, enabled_providers: ['omniroute'],
    share: 'disabled', autoupdate: false,
    provider: { omniroute: { npm: '@ai-sdk/openai-compatible', name: 'OmniRoute', options: { baseURL: config.baseURL, apiKey: '{env:OMNIROUTE_API_KEY}' }, models: { [config.model]: { name: config.model, tool_call: true } } } },
    mcp: { rea: { type: 'local', command: [process.execPath, reaEntry(), 'mcp'], environment: { ...(config.ghidraDir ? { GHIDRA_INSTALL_DIR: config.ghidraDir } : {}), ...(config.javaHome ? { JAVA_HOME: config.javaHome } : {}) }, enabled: true, timeout: 360000 } },
    permission: { '*': 'ask', read: 'ask', edit: 'ask', bash: 'ask', external_directory: 'ask', webfetch: 'ask', 'rea_*': 'ask' }
  };
}
export function capture(command, args, env, timeout = 30000) {
  return new Promise(resolve => {
    const child = spawn(command, args, { env, shell: false, windowsHide: true });
    let output = ''; let finished = false;
    const finish = result => { if (!finished) { finished = true; clearTimeout(timer); resolve(result); } };
    const timer = setTimeout(() => { child.kill(); finish({ ok: false, error: 'Timed out' }); }, timeout);
    child.stdout.on('data', b => { if (output.length < 2000000) output += b.toString(); });
    child.stderr.on('data', () => {});
    child.on('error', error => finish({ ok: false, error: redact(error.message) }));
    child.on('close', code => finish({ ok: code === 0, exitCode: code, output: redact(output) }));
  });
}
export async function doctor() {
  const config = await loadConfig();
  const [rea, agent, gateway] = await Promise.all([
    capture(process.execPath, [reaEntry(), 'doctor', '--provider', 'ghidra', '--json'], providerEnv(config), 45000),
    capture(openCodeEntry(), ['--version'], providerEnv(config), 15000),
    gatewayModels(config).then(models => ({ ok: true, modelCount: models.length, selectedModelAvailable: models.some(m => m.id === config.model) })).catch(e => ({ ok: false, error: redact(e.message) }))
  ]);
  return { config: { ...config, apiKeyConfigured: Boolean(process.env.OMNIROUTE_API_KEY) }, rea, agent, gateway };
}
