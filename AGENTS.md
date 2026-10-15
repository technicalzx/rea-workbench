# Instructions for contributors and AI assistants

Read README.md, docs/ARCHITECTURE.md, docs/THREAT-MODEL.md and CONTRIBUTING.md before changing behavior.

- Keep Workbench independent from upstream REA, OmniRoute, and OpenCode. Do not impersonate their maintainers or remove their notices.
- Keep project data and secrets outside Git. Do not import personal laptop configurations, paths, tokens, accounts, or logs into public source.
- Preserve localhost binding, Host/Origin checks, token validation, output limits, argument-array subprocess calls, and path containment.
- New analysis kinds require an explicit allowlist entry, a documented authority boundary, and tests. Do not implement arbitrary shell commands from HTTP input or configuration.
- Static analysis processes do not receive cloud credentials. Never put credentials in agent config or generated reports.
- User/model content must be rendered as text. Do not use innerHTML, inline scripts, or remote CDN dependencies.
- Do not claim certifications, legal compliance, unlimited free access, or sandboxing that has not been demonstrated.
- Test meaningful behavior and failure cases. Run npm run check, npm test, npm audit --audit-level=high. Use real REA and OpenCode smoke tests when those integrations change; mocks do not establish native-provider readiness.
- Update standards mapping and threat model when security boundaries change. Describe material limitations in release notes.
- Use separate reviewed changes for cloud hosting, runtime instrumentation, team access, arbitrary plugins, or new network exposure.
