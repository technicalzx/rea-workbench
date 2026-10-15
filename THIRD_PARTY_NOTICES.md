# Third-party components

Workbench integrates upstream software without vendoring its source. Package managers install dependencies under their original terms. Preserve package LICENSE and notice files when redistributing installed bundles; an upstream link alone does not replace a required notice.

| Component | Role | License / source |
| --- | --- | --- |
| rea-agents 6.5.0 | CLI, MCP, static/native analysis adapters | MIT, Copyright (c) 2026 morluto; https://github.com/morluto/rea |
| opencode-ai 1.19.0 | AI agent | MIT; https://github.com/anomalyco/opencode |
| OmniRoute | User-installed optional gateway | MIT; https://github.com/diegosouzapw/OmniRoute |
| Ghidra | User-installed optional engine | Apache-2.0 and bundled notices; https://github.com/NationalSecurityAgency/ghidra |
| JDK | User-installed optional runtime | Depends on distribution; review that distribution's licenses |

Transitive dependencies have their own terms. `npm run sbom` emits a CycloneDX inventory of the installed dependency tree. Verify licenses and notices before distributing bundled executables. This project currently distributes original source and a lockfile, not a bundled Ghidra/JDK installation.

Analysis targets, model weights, AI accounts, and generated outputs are not relicensed by Workbench's MIT license. Review their applicable rights and terms before use or redistribution.
