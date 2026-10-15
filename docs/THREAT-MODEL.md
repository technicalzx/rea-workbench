# Threat model

Scope: Workbench 0.1, a trusted user on one computer. Assets include API keys, project files, proprietary samples, model prompts, evidence, and the host account. Attackers may control a target file, an external webpage visited in the browser, a malicious dependency, a model response, or a contribution. Code already executing as the same OS user is outside the application's isolation boundary.

| Threat | Current mitigation | Residual risk / verification |
| --- | --- | --- |
| Website drives local privileged API | Bind 127.0.0.1; exact Host and Origin; Fetch Metadata checks; random per-process token; JSON-only mutations; no CORS | Local malicious processes can read the page token. Never expose the port. HTTP integration tests cover the web boundary. |
| Command injection through target/operation | Fixed operation allowlist, absolute target resolution, spawn argument arrays, no shell | REA/Ghidra parser bugs and malicious target content remain. Use isolation for unknown binaries. |
| Project traversal / linked artifact escape | UUID identifiers, realpath containment, fixed artifact filenames | Same-user modification between check and open is not fully prevented. Host permissions remain necessary. |
| Credential leakage | Environment-only key; generated agent config references env; dashboard returns only presence; static child environments remove secret variables | Model context and user notes may contain sensitive data; users must review cloud requests and exports. No arbitrary-content secret scanner is promised. |
| Script injection in project/model text | textContent/value only; local assets; CSP blocks inline scripts and framing | Browser extensions and a compromised host remain trusted dependencies. |
| Excessive output / CPU / memory | Single runner, streaming/backpressure, 128 MiB combined output budget, ten-minute wrapper timeout | Not hard OS resource isolation. Provider descendants may survive forced wrapper termination. |
| Prompt injection in artifacts | Generated agent instructions treat targets as data; every tool permission asks; sharing disabled | Prompts are not a security boundary. OpenCode/global config and model behavior must be reviewed. |
| Dependency/CI compromise | Exact direct versions, lockfile, lifecycle scripts disabled, explicit OpenCode preparation, full-SHA actions, least-privilege workflows, dependency audit | Upstream signed provenance is not independently verified. Registry integrity alone does not prove code is benign. |
| Evidence alteration or accidental sharing | Output hash and per-run status; explicit download; raw evidence excluded from summary export | Editable local hash and metadata can be changed by the same user; exports retain user notes/scope. |
| Data loss or local disclosure | Atomic metadata writes; archive instead of permanent deletion; configurable external storage | No built-in encryption/backup/secure erase. Use host encryption, ACLs, and tested backups. |
| Untrusted pull request executes code | Hosted ephemeral CI, read-only token, no secrets on pull requests, no pull_request_target workflow | Review dependencies and workflows before merge; don't run contributor samples on maintainer hosts. |

Review this model whenever the supported commands, data flows, integration permissions, or network exposure change. For new vulnerabilities, follow SECURITY.md. Runtime sandboxing, authenticated multi-user hosting, signed evidence, external audits, and stronger process-tree containment are future work rather than current claims.
