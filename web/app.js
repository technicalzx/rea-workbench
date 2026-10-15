const $ = selector => document.querySelector(selector);
const token = $('meta[name="workbench-token"]').content;
let active = null; let timer; let dirtyNotes = false;
async function api(path, method = 'GET', body) {
  const response = await fetch(`/api${path}`, { method, headers: { 'x-workbench-token': token, ...(body === undefined ? {} : { 'content-type': 'application/json' }) }, ...(body === undefined ? {} : { body: JSON.stringify(body) }) });
  if (!response.ok) { const error = await response.json(); throw new Error(error.error || `HTTP ${response.status}`); }
  return response;
}
async function json(path, method, body) { return (await api(path, method, body)).json(); }
function notice(message, error = false) { $('#message').textContent = message; $('#message').className = error ? 'error' : ''; }
function panel(name) { for (const item of ['welcome', 'create-panel', 'project-panel', 'settings-panel']) $(`#${item}`).hidden = item !== name; clearTimeout(timer); }
function action(fn) { return async event => { event?.preventDefault(); try { await fn(event); } catch (error) { notice(error.message, true); } }; }
async function refreshList() {
  const projects = await json('/projects'); $('#projects').replaceChildren();
  for (const project of projects) {
    const button = document.createElement('button'); button.textContent = `${project.status === 'archived' ? '◌ ' : ''}${project.name}`; button.className = active?.id === project.id ? 'selected' : '';
    button.onclick = action(async () => { if (dirtyNotes && !confirm('Discard unsaved notes?')) return; dirtyNotes = false; await showProject(project.id); }); $('#projects').append(button);
  }
}
async function download(response, filename) {
  const url = URL.createObjectURL(await response.blob()); const link = document.createElement('a'); link.href = url; link.download = filename; link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
}
async function showProject(id, polling = false) {
  const wasRunning = active?.id === id && active.runs?.some(run => run.status === 'running');
  active = await json(`/projects/${id}`); panel('project-panel');
  if (wasRunning && !active.runs.some(run => run.status === 'running')) notice('Analysis finished. Review its status, evidence, and diagnostics below.');
  $('#project-name').textContent = active.name; $('#project-goal').textContent = active.goal; $('#scope').textContent = active.scope; $('#directory').textContent = active.directory;
  $('#project-status').textContent = active.status === 'active' ? 'ACTIVE INVESTIGATION' : 'ARCHIVED INVESTIGATION';
  $('#archive').textContent = active.status === 'active' ? 'Archive' : 'Restore';
  $('#agent-command').textContent = `node bin/reaw.js agent ${active.id}`;
  if (!polling || !dirtyNotes) $('#notes').value = active.notes.markdown;
  $('#runs').replaceChildren();
  if (!active.runs.length) $('#runs').textContent = 'No analysis runs yet. Choose an artifact to begin.';
  for (const run of active.runs) {
    const row = document.createElement('div'); row.className = 'run'; const info = document.createElement('div'); const title = document.createElement('strong'); title.textContent = `${run.kind} / ${run.status}`; info.append(title);
    for (const value of [new Date(run.startedAt).toLocaleString(), run.target, run.error, run.evidenceSha256 ? `SHA-256 ${run.evidenceSha256}` : null].filter(Boolean)) { const small = document.createElement('small'); small.textContent = value; info.append(small); }
    const actions = document.createElement('div'); actions.className = 'run-actions';
    if (run.status !== 'running') for (const [type, label] of [['evidence.json', 'Evidence'], ['stderr.log', 'Log']]) {
      const button = document.createElement('button'); button.textContent = label; button.onclick = action(async () => download(await api(`/projects/${id}/artifact?run=${run.id}&type=${type}`), `${run.id}-${type}`)); actions.append(button);
    }
    row.append(info, actions); $('#runs').append(row);
  }
  $('#run-form button').disabled = active.status !== 'active' || active.runs.some(r => r.status === 'running');
  await refreshList();
  if (active.runs.some(r => r.status === 'running')) timer = setTimeout(action(() => showProject(id, true)), 2000);
}
$('#new-project').onclick = () => panel('create-panel');
$('#create-form').onsubmit = action(async event => {
  const form = new FormData(event.target); const project = await json('/projects', 'POST', { name: form.get('name'), goal: form.get('goal'), scope: form.get('scope'), authorized: form.get('authorized') === 'on' });
  event.target.reset(); dirtyNotes = false; await showProject(project.id); notice('Investigation created.');
});
$('#run-form').onsubmit = action(async event => { const form = new FormData(event.target); await json(`/projects/${active.id}/runs`, 'POST', { kind: form.get('kind'), target: form.get('target') }); notice('Analysis started. Evidence is being saved locally.'); await showProject(active.id, true); });
$('#notes').oninput = () => { dirtyNotes = true; };
$('#save-notes').onclick = action(async () => { await json(`/projects/${active.id}`, 'PATCH', { markdown: $('#notes').value }); dirtyNotes = false; notice('Notes saved.'); });
$('#archive').onclick = action(async () => { await json(`/projects/${active.id}`, 'PATCH', { status: active.status === 'active' ? 'archived' : 'active' }); await showProject(active.id, true); });
$('#export').onclick = action(async () => { notice('Export includes scope and notes. Review them for sensitive data before sharing.'); await download(await api(`/projects/${active.id}/export`), `investigation-${active.id}.json`); });
$('#settings-toggle').onclick = action(async () => { panel('settings-panel'); const config = await json('/config'); for (const key of ['baseURL', 'model', 'ghidraDir', 'javaHome', 'toolProfile']) $('#settings-form').elements[key].value = config[key]; $('#key-status').textContent = config.apiKeyConfigured ? 'Gateway key is set in the server environment.' : 'Set OMNIROUTE_API_KEY in the server environment, then restart the dashboard.'; });
$('#settings-form').onsubmit = action(async event => { const values = Object.fromEntries(new FormData(event.target)); await json('/config', 'POST', values); notice('Configuration saved.'); });
$('#load-models').onclick = action(async () => { const models = await json('/models'); $('#model-list').replaceChildren(); for (const model of models) { const option = document.createElement('option'); option.value = model.id; $('#model-list').append(option); } notice(`${models.length} models loaded. Select one by its ID; verify its cost and terms in OmniRoute.`); });
$('#doctor').onclick = action(async () => { $('#diagnostics').textContent = 'Checking dependencies and gateway…'; $('#diagnostics').textContent = JSON.stringify(await json('/doctor'), null, 2); });
window.addEventListener('beforeunload', event => { if (dirtyNotes) { event.preventDefault(); event.returnValue = ''; } });
action(refreshList)();
