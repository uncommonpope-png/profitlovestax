---
type:: [[soul-gun]] [[page]]
mission:: [[NORTH STAR ODYSSEY]]
phase:: P106 / P107 / P108
status:: FORGED
---

# SOUL-GUN - Genesis Boot Build Law

## Purpose
The Genesis Boot Build Law makes boot readiness and verification deterministic for every agent. It prevents repeated local-server/Playwright loops and gives the CPL one shared readiness contract.

## Files
- Repo agent law: `C:\Users\uncom\Desktop\cosmic-pyramid-library\AGENTS.md`
- Build law: `C:\Users\uncom\Desktop\cosmic-pyramid-library\docs\GENESIS_BUILD_LAW.md`
- One-shot verifier: `C:\Users\uncom\Desktop\cosmic-pyramid-library\scripts\verify-live-url.cjs`
- Runtime hook: `C:\Users\uncom\Desktop\cosmic-pyramid-library\index.html`

## Runtime Contract
- `window.Genesis.bootReady` Promise
- `window.__GENESIS_BOOT_READY` boolean
- `genesis:boot-ready` browser event

Readiness resolves only after `__cplReady` and a first frame/backstop signal are true.

## Build Contract
- Deploy = push.
- No persistent local servers.
- No Playwright on Craig's PC unless explicitly authorized.
- Local verification is syntax only.
- Live verification is one-shot HTTP fetch via `node scripts/verify-live-url.cjs`.

## PLT
- **Profit:** every agent stops re-solving boot and deploy law.
- **Love:** protects Craig's PC from crashing loops.
- **Tax:** live URL checks can lag behind GitHub Pages deploy; patience required.

## Status
FORGED for P106/P107/P108.
