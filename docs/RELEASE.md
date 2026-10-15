# Release checklist

1. Review changes, authorization/data boundaries, platform support, upstream licenses and the threat model.
2. Update package version, lockfile and CHANGELOG.md. Select supported versions in SECURITY.md.
3. Run `npm ci`, `npm run prepare:agent`, `npm run check`, `npm test`, and `npm audit --audit-level=high`. Investigate all advisories; document any accepted exception with scope, owner and expiry.
4. Run a real JavaScript static analysis, configured native-engine smoke test, model response, and OpenCode-to-REA MCP check for integration changes. Record exact versions and untested platforms.
5. Run `npm run sbom`. Review dependency licenses/notices. If distributing a bundle, include all required third-party texts and account for optional native binaries and JDK/engine dependencies.
6. Review the staged Git tree for keys, home paths, target artifacts, generated configurations, logs, environment files and private evidence. Run the secret scanner against release history.
7. Require a maintainer's human review. Confirm repository branch rules, least privilege, MFA, and security-reporting settings. Passing CI alone is insufficient.
8. Create a versioned source tag and release notes with behavior, compatibility, validation, limitations, advisories and upgrade instructions. Generate SHA-256 checksums for distributed artifacts.
9. Publish only reviewed artifacts. Signed attestations/provenance require an implemented and verified workflow before making supply-chain level claims.
10. Keep the source/tag, validation record, SBOM and checksums. Monitor upstream advisories and handle reports through SECURITY.md.

No npm package publishing or automatic public release is configured in v0.1. GitHub hosts the source; users install its locked dependencies themselves.
