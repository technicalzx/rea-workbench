# Customize your workbench

## Change gateway or model

In **Gateway & diagnostics**, set an OpenAI-compatible `/v1` URL and a model ID returned by that gateway. Put the matching credential in `OMNIROUTE_API_KEY` in the launching environment, not the form. Restart the dashboard after changing its environment. Environment variables override saved settings.

For example, a compatible local inference server can use a loopback `/v1` endpoint and its own authentication requirements. Workbench currently requires a nonempty key variable for agent/model discovery; if the local server accepts a placeholder, follow that server's documentation. It never generates a working upstream key.

Choose **Focused** for fewer REA schemas in model context, or **Full** for all REA tools directly. Existing sessions/configurations do not update retroactively: restart the agent with `node bin/reaw.js agent PROJECT_ID` after saving changes.

Model IDs do not establish tool support, answer quality, zero cost, or permission to use an account. Test a harmless text response and read-only tool call before starting a real investigation. If a model sends only reasoning without a visible answer, choose a compatible model or investigate that gateway's protocol mapping. If a gateway route fails, inspect its own routing and account configuration; Workbench does not change accounts or silently substitute a paid model.

## Change project storage

Stop the dashboard and CLI jobs, back up `~/.rea-workbench`, copy it to a private local destination, and set `REAW_HOME` to that destination before restarting. Preserve host file permissions and keep targets/reports out of public Git. Generated OpenCode files contain absolute installed-tool paths; regenerate them using the `agent` command on a new computer.

## Extend with a developer or AI assistant

Describe one feature, its intended inputs/outputs, supported platforms, and acceptance tests in an issue. Supply synthetic examples with known rights rather than private binaries or credentials. Ask the contributor to follow AGENTS.md and update the threat model for new authority or data flows.

Example task:

> Add a project search box that filters saved project names and goals locally. Do not add network services or upload project data. Keep text rendering safe and keyboard usable, and test search behavior with synthetic projects.

To add an analysis kind, define its static command in `src/runner.js`, extend the UI select and tests, document native prerequisites, and test the real installed provider. Do not pass an arbitrary shell command through the HTTP API. For runtime execution, cloud hosting, plugins, or team accounts, agree on a separate design and security boundary first.
