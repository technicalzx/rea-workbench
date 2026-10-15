# Secure development and standards mapping

Assessment date: 2026-10-15. This is an implementation-oriented mapping and gap register, not a certificate, legal opinion, full framework assessment, or claim of regulatory compliance. The initial target is a small local open-source project. Reassess after each material release and when jurisdiction, distribution, data, or deployment changes.

## Sources and scope

- [NIST SP 800-218 SSDF 1.1](https://csrc.nist.gov/pubs/sp/800/218/final): secure development lifecycle practices.
- [OpenSSF OSPS Baseline v2026.08.28](https://baseline.openssf.org/): project security maturity and governance. This is the baseline version selected at project creation; review its exact controls when performing a formal assessment.
- [OWASP ASVS 5.0.0](https://owasp.org/projects/asvs): selected application-control themes for input validation, command injection prevention, browser request boundaries, output handling, and secret protection. No ASVS level is claimed.
- [SLSA 1.2](https://slsa.dev/spec/v1.2/): supply-chain improvement and provenance planning. No SLSA level is claimed.
- CycloneDX SBOM output through npm: inventory and dependency transparency, not proof that every binary or runtime dependency is safe or correctly licensed.

## Practices, evidence, and gaps

| Area / reference | Implemented evidence | Remaining work / owner |
| --- | --- | --- |
| SSDF PO.1, PO.4: security requirements and checks | CONTRIBUTING.md lifecycle, AGENTS.md, threat model, tests and CI definitions | Maintainer reviews requirements and accepts risk per release |
| SSDF PO.2: responsibilities | GOVERNANCE.md, SECURITY.md | Recruit additional maintainers and verify access/MFA settings |
| SSDF PO.3, PO.5: tooling and development environments | Lockfile, disabled install scripts, scoped CI token permissions, no PR secrets | Independently assess tool provenance, developer workstation security and hosted runner configuration |
| SSDF PS.1: protect code | Review policy, CODEOWNERS, dependency update config | Verify branch protection, mandatory reviews and MFA in repository/account settings; documents alone do not enforce them |
| SSDF PS.2, PS.3: release integrity and archival | Release checklist, checksum/SBOM procedures, Git history | First maintainer-reviewed release, signed provenance and verification instructions |
| SSDF PW.1, PW.2: secure design review | Architecture and threat model | Independent review before network/cloud/team features |
| SSDF PW.4: reuse components | Pinned REA/OpenCode, third-party notices, npm audit | Review transitive advisories and licenses for every distributed bundle |
| SSDF PW.5, PW.7, PW.8: implementation and verification | Argument arrays, validation, CSP, token checks, behavior/security tests, CodeQL workflow | Fuzzing, independent penetration testing, broader OS integration matrix |
| SSDF PW.9: secure defaults | Local binding, permission prompts, disabled agent sharing, no automatic paid model selection | Validate merged OpenCode/global gateway settings on each installation |
| SSDF RV.1–RV.3: vulnerability response | SECURITY.md reporting and triage process, regression-test requirement | Exercise the process, track response metrics and root-cause records |
| OSPS access, build/release, documentation, governance and vulnerability-management themes | Repository policies, tests, pinned actions, least privilege, issue templates, changelog | Complete versioned control-by-control assessment and verify GitHub settings; no blanket OSPS conformance claim |
| ASVS input/output and execution boundaries | Fixed static command kinds, path containment, JSON limits, text rendering and tests | Full requirement selection and independent control assessment |
| ASVS session/request boundaries and secrets | Per-process request token, loopback binding, Host/Origin checks, environment secrets | Multi-user authentication, RBAC and remote TLS are absent; remote deployment unsupported |
| SLSA source/build transparency | Public Git history, pinned workflow actions, lockfile, release/SBOM instructions | Provenance generation, signing/verification and hardened builders before any level claim |

## Regulatory applicability review

Standards are not regulations. Applicable obligations depend on where the software is distributed, whether it is used commercially, what data is processed, and which targets are examined. There is no universal compliance setting that removes these obligations.

For deployments handling personal data, review applicable privacy law, retention, access, deletion, breach response, processor terms, and international transfers before sending evidence to a cloud model. For an EU-facing deployment, consult the official [GDPR text](https://eur-lex.europa.eu/eli/reg/2016/679/oj) and obtain advice on the specific facts. Workbench has no consent register, DSAR workflow, processor contract, or cross-border-transfer mechanism.

For distribution of products with digital elements, assess the [EU Cyber Resilience Act](https://eur-lex.europa.eu/eli/reg/2024/2847/oj) and any relevant national obligations, scope, roles, dates, and open-source provisions. This repository does not assert that a particular exemption, duty, or application date applies to every contributor or user.

Also assess authorization, copyright, software licenses, contract terms, vulnerability disclosure rules, and any restrictions on reverse engineering in the relevant jurisdiction. Workbench supplies no legal permission to inspect a third-party target. Record that review in each investigation's scope and keep sensitive evidence private.

## Release review record

Each release should record: framework versions used, controls reviewed, automated and manual evidence, unresolved gaps, accountable owner, accepted risks, and next review date. Keep operational claims distinct from planned work. A completed checklist does not create a third-party certification.
