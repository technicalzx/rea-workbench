# Security policy

## Supported versions

Only the latest 0.1.x version receives security fixes. This is early software, without an independent security audit or a response-time guarantee.

## Reporting

Use GitHub's **Report a vulnerability** action in the repository Security tab when private vulnerability reporting is enabled. If it is unavailable, open an issue asking for a private reporting channel without exploit details, credentials, private targets, or personal data. The maintainer should acknowledge reports within seven days when available, agree on disclosure timing, and track the fix privately until disclosure.

Provide the version, operating system, reproduction using a harmless fixture, impact, affected boundary, and suggested mitigation. Never test against other users' data or third-party systems without authorization.

## Operating assumptions

Workbench serves one trusted local OS user and binds only to 127.0.0.1. Do not expose it through a tunnel, public interface, or shared host. The browser token and Host/Origin controls mitigate remote web attacks; they do not protect against hostile code already running as your OS user.

Store API keys in the process environment or a protected explicitly selected environment file. Use disk encryption, account permissions, and encrypted backups for investigation data. POSIX mode flags do not establish a private Windows DACL: configure Windows ACLs on your storage directory. Only approve agent actions you understand. Local operation does not prevent selected evidence from being sent to a cloud model.

The runner kills its REA wrapper on timeout/output-limit failure. REA supervises its own native providers. Workbench does not independently guarantee process-tree termination on every OS; check for surviving providers after forced failure. Do not analyze malware outside an OS-level isolated environment. Parser vulnerabilities and resource exhaustion remain possible.

No credentials, account bypasses, restrictions bypasses, or license circumvention are supplied by this project.
