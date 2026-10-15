# Architecture and decisions

Workbench is a single-user local Node.js application, with no database or front-end build step. Its own HTTP/UI/storage code uses Node built-ins; the two pinned runtime dependencies supply REA and OpenCode.

## Boundaries

| Module | Responsibility |
| --- | --- |
| config.js | Private storage location, validated nonsecret settings, exact-value log redaction |
| store.js | UUID project paths, atomic JSON writes, notes, archives, summary exports, contained artifact access |
| integrations.js | Installed entry-point resolution, OpenCode configuration, sanitized child environments, gateway discovery |
| runner.js | Static analysis allowlist, one run at a time per runner, bounded output, subprocess lifecycle, evidence hashes |
| server.js | Local HTTP transport, browser token, Host/Origin/Fetch Metadata checks, fixed static assets, API routing |
| cli.js | Human/operator commands and opt-in environment-file loading |
| web/ | Framework-free UI; dynamic content is rendered with textContent |

The dashboard never receives an API key value. Model discovery uses the server process's key, sends it only to the configured gateway, rejects redirects, and returns only model IDs. Remote gateways require HTTPS. Local gateways may use loopback HTTP.

An OpenCode configuration is generated in each investigation using an environment variable reference for the key. The CLI launches OpenCode in that investigation directory; its own session storage is managed by OpenCode. Workbench notes and exports do not automatically collect agent session history.

Static REA children receive a copy of the environment with key/token/secret/password variables removed. Ghidra and Java paths are supplied explicitly. REA receives target paths as separate arguments with no shell. Workbench's static dashboard operations do not execute the analyzed target; the analysis engines themselves are executable software and parse untrusted input.

## Data integrity and limits

Configuration and metadata updates use temporary files and rename. Evidence is streamed with backpressure; one combined 128 MiB output budget and a ten-minute wrapper timeout bound each run. REA manages its own provider startup and shutdown. Failed or interrupted runs are retained and visibly marked.

Only one dashboard process should use a storage root. Concurrent CLI and dashboard analysis is not a distributed queue. Files are stored in plaintext and protected by host permissions, not application encryption. There is no multi-user authentication, RBAC, sync conflict resolution, remote job worker, or malware sandbox.

SHA-256 is calculated over saved evidence. It is not a digital signature, trusted timestamp, or append-only evidence ledger. Project summaries omit raw target/evidence data and absolute run target paths but retain user-written scope and notes, which may themselves contain sensitive information.

## Extension design

Add analysis commands through the operation allowlist, not an arbitrary command string. Extend the model transport by changing the compatible endpoint/provider configuration. Keep new UI operations behind the same request validation and project containment. New target execution, device control, cloud services, team access, or plugin loading require a design review and new threat coverage.

The choice of a local UI avoids hosting cost and prevents a hosted service from receiving everyone's binaries or API keys. Cloud model inference remains optional; a compatible local model server can replace the gateway endpoint. Remote collaboration requires a separately designed authenticated service and is tracked in the roadmap.
