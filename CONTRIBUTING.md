# Contributing

Start with a GitHub issue describing the user problem, target platform, expected behavior, and a small acceptance example. Do not upload private targets, keys, proprietary samples, or sensitive reports.

## Development lifecycle

1. **Scope:** define the feature, authorization boundary, data handled, failure modes, platform support, and acceptance checks. For security-sensitive features, update the threat model first.
2. **Design:** keep transport, storage, subprocess integration, and UI separate. Record meaningful tradeoffs in docs/ARCHITECTURE.md or a design proposal. Prefer minimal dependencies and explicit configuration.
3. **Build:** branch from main. Use small commits, clear names, input validation, parameterized subprocess arguments, and no secrets. AI-assisted contributions are welcome; the contributor reviews and owns the submitted change.
4. **Verify:** run syntax checks, behavior/security tests, dependency audit, and relevant real integration checks. Add regression tests for defects and document untested platforms. UI changes need desktop and mobile checks with keyboard labels and focus behavior.
5. **Review:** open a PR explaining problem, behavior, test evidence, risks, and compatibility. A maintainer reviews security boundaries and dependency updates. Do not treat generated code or passing CI as independent security review.
6. **Release:** follow docs/RELEASE.md. Use semantic versioning, a changelog, dependency/SBOM checks, checksums, and explicit limitations. Publish no target artifacts or credentials.
7. **Maintain:** triage vulnerabilities privately; reproduce, fix, test, release, and document root causes. Remove unsupported versions explicitly.

## Local development

Use Node 24.x >=24.11 (or another supported REA runtime). Run `npm ci`, `npm run prepare:agent`, `npm run check`, and `npm test`. `npm audit --audit-level=high` must pass or a reviewed, time-bound advisory assessment must explain the exception. Avoid changing dependency ranges without updating the lockfile.

The tests use temporary synthetic fixtures. A native Ghidra or live model test is an operator-run check requiring the matching tools and your own API account. Never put real credentials in CI or run untrusted contribution targets on a maintainer's machine.

## Review expectations

Changes that affect authentication, files, commands, model routing, dependency installation, or network exposure need a clear security explanation. Core committers should use MFA, least privilege, and protected branches. The repository owner must configure enforcement; source documents alone do not enforce GitHub settings.

Be respectful, credit original authors, and submit code you have the right to license under MIT. A contributor's sign-off can record Developer Certificate of Origin 1.1 agreement: https://developercertificate.org/. A sign-off is a contributor's own statement, not a maintainer's substitute for review.
