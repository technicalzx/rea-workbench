# Initial validation record

Date: 2026-10-15. This record describes executed checks at project creation, not a certification or a promise that every upstream model/provider remains available.

## Local Windows checks

- Node.js 24.19.0, REA 6.5.0, OpenCode 1.19.0.
- `npm run check`: syntax and limited baseline source checks passed.
- `npm test`: seven test cases passed, including project persistence, traversal/symlink containment, secret handling, subprocess arguments/concurrency/output limits, interrupted-state recovery, and local HTTP request protections.
- `node scripts/smoke.js`: actual REA JavaScript analysis of a synthetic application completed and emitted parseable evidence; installed OpenCode binary started.
- `npm audit --audit-level=high`: zero known vulnerabilities reported for the installed lockfile on the validation date.
- `npm run sbom`: generated a CycloneDX inventory. This is not an independent license audit.
- Local Ghidra 12.1.4 with a full Temurin JDK 21.0.12.1+1 passed REA readiness checks. A read-only REA inspection of Windows `whoami.exe` completed successfully during installation. No general Windows native parity is inferred from that check.
- OpenCode returned visible synthetic answer text through the operator's own OmniRoute key and the explicitly selected `openrouter/cohere/north-mini-code:free` route. That operator-run result does not guarantee other users' provider access or ongoing free availability.
- OpenCode completed read-only `rea_binary_session` MCP calls. A narrowly permissioned synthetic follow-up was stopped after repeated retries of truncated output; no target execution was enabled. Model tool behavior and approval of follow-up file reads still require operator review.
- Browser smoke check: loaded the dashboard, saved research notes, ran synthetic JavaScript analysis, and displayed completed status and an evidence SHA-256. No accessibility certification or full browser matrix was performed.
- Staged source was checked for the operator's known keys and home paths before initial upload. Automated GitHub secret scanning supplements this narrow check; neither establishes that arbitrary future uploads are safe.

## CI and limitations

The repository defines tests and a real synthetic REA smoke run for Linux Node 22/24, Windows Node 24 and macOS Node 24, plus dependency audit and SBOM generation. CodeQL and Gitleaks run separately. Consult the [Actions page](https://github.com/AbiHurairah-OpenSource/rea-workbench/actions) for the exact commit and current job conclusions; a queued job is not a passing result.

Native-engine checks and live model calls are not included in contribution CI. Independent security review, fuzzing, destructive recovery tests, malware isolation, remote/team deployment and a complete standards assessment remain outstanding.
