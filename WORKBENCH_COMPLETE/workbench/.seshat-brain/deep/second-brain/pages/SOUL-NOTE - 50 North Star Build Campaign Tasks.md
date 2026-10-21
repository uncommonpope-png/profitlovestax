---
type:: [[soul-note]] [[north-star]] [[campaign]]
date:: 2026-07-20
status:: ACTIVE BUILD CAMPAIGN
source:: [[NORTH STAR ODYSSEY - 100 Phases to a Sovereign GSK]] · [[NORTH STAR ODYSSEY - EXPANSION PHASES P101-P198]]
---

# SOUL-NOTE - 50 North Star Build Campaign Tasks

## Campaign Law
Build → connect → syntax/live-safe verify → push → document → move on.

## Canon correction — Genesis Foundation pivot (2026-07-21)

Craig corrected the build direction: **Genesis Foundation / `buyasoul-ai/buyasoul-cpl` on branch `publish` is the canonical engine repo.** The earlier CPL-side commits remain useful provenance/source, but they were not the final target. The canonical port shipped as `genesis-foundation` commit **`3929492` — `Port North Star proof modules into Genesis Foundation`**, pushed to `origin/publish`. Pre-existing canonical `src/genesis/trust-ledger.js` was preserved/adapted, not overwritten. Pre-existing untracked `asset-map.cjs` and `pack-proof.cjs` were left untouched.

## Immediate blocker folded into campaign
`C:\Users\uncom\Desktop\cosmic-pyramid-library\index.html` is too large for safe deep edits. Therefore the first campaign task is a targeted module seam:

1. **P8-targeted · Genesis City Builder module** — DONE `4fb2a46` — `src/cpl/city-builder.js` builds governed outer city and disables broken inline P7 ring.
2. **P7 · City Expansion** — PARTIAL/DONE via City Builder — governed outer-city root, shared geometry/materials, cost declarations, sector/visibility registration.
3. **P103 · Asset Manifest Catalog** — DONE `0c106b1` — `asset_manifest.json` generated (621 assets / 694.098 MB), generator + loader.
4. **P104 · CDN + LOD streaming bridge** — DONE `4e575a5` — manifest assets registered with `StreamingManager`; true CDN target remains infra.
5. **P105 · Dead-asset purge proof audit** — DONE `c7c0674` — `asset_reference_audit.json` reports 115 referenced / 506 unreferenced candidates / 360.711 MB. No deletion executed.
6. **P106 · Probe-free verification** — DONE `3718ff1` — `scripts/verify-live-url.cjs` one-shot live URL check; no local server.
7. **P107 · Multi-agent boot contract** — DONE `3718ff1` — `Genesis.bootReady`, `__GENESIS_BOOT_READY`, `genesis:boot-ready`; repo `AGENTS.md`.
8. **P108 · Local-server ban** — DONE `3718ff1` — `docs/GENESIS_BUILD_LAW.md` ratifies deploy=push and no persistent local servers/Playwright.
9. **P37/P126 · Prophet archives** — DONE `eaca97d` — `src/genesis/prophet-archive.js` archives prophecy into `worldState.prophecyArchive` + `memoryEvents` and dispatches `genesis:prophet:archive`.
10. **P38/P142 · Consequence audit** — pending: full loop proof.
11. **P36/P140 · Builder yields real schematic** — CANON DONE `209db1f` — `src/genesis/builder-schematics.js` persists/re-materializes Builder schematics (port from CPL `8e28582`). Gun SCHEMATIC loaded.
12. **P47/P122 · Betrayal recall** — CANON DONE — `src/genesis/betrayal-recall.js` with specific event recording, dialogue templates per event type (theft/attack/betrayal/sabotage), gossip propagation to nearby FRIEND-band citizens, EventBridge hooks, and Immortality persistence. FLEE and THREATEN behaviors now reference specific betrayal events. Gun **RECALL** loaded. Probe 21/21.
13. **P48/P123 · Trust ledger** — CANON DONE `46e45ff/60e0442` + adapted in `3929492` — talks route through canonical `Genesis.TrustLedger.addTrustDelta()` and mirror proof into `worldState.trustLedger`.
14. **P49/P124 · Personality drift** — CANON DONE `3929492` — `src/genesis/personality-drift.js` persists HEXACO-style profiles, listens to trust events, and shifts dialogue tone.
15. **P51 · Litmus PASS** — CANON HOOK `3929492` — first reopen remains `PENDING_FIRST_REOPEN`; later checkpoint flips to PASS when previous surface hash exists.
16. **P52/P132 · Immortality audit** — CANON DONE `3929492` — `src/genesis/immortality-audit.js` persists Surface A/self + Surface B/world hashes and audit events.
17. **P65/P119 · Witness Recorder proof packs** — CANON DONE `3929492` — `src/genesis/witness-recorder.js` seals compact Genesis events into hash-chained proof packs.
18. **P69 · NPC GLB scale pass** — CANON DONE `3929492` — `src/genesis/npc-scale-pass.js` normalizes walker GLBs to `NPC_SIZE_REF`, grounds feet, and persists `npcScaleAudit`.
19. **P70 · Alive Angels fly+talk** — CANON DONE `3929492` — existing flight/talk system now persists `angelLifeStats` and emits `genesis:angel:life` for proof packs.
20. **P72/P127 · Scribe Library live books** — CANON DONE `3929492` — `src/genesis/scribe-live-books.js` renders hosted GSK memories or local live Genesis memory as clickable Scribe books.
21. **P73/P128 · Memory-as-Buildings** — CANON DONE `3929492` — memory buildings now fall back to local live Genesis memory, persist `memoryBuildings`, and emit proof events.
22. **P74/P129 · 36 Chambers hardening** — CANON DONE `3929492` — `src/genesis/chamber-hardening.js` maintains a 36-entry chamber ledger with enter/exit/feature proof events.
23. **P75 · In-World Console live tuner** — CANON DONE `3929492` — `src/genesis/world-tuner.js` persists tune history and local mood/phase apply even when Sanctum is offline.
24. **P76 · Drag interaction persist** — CANON DONE `209db1f` — `src/genesis/drag-persistence.js` saves/restores DragControls transforms across reload (port from CPL `cabf5f0`). Gun DRAG loaded.
25. **P77 · Ambient Drift cam** — CANON DONE `3929492` — `src/genesis/ambient-drift-camera.js` adds subtle idle NPC-camera breathing and bounded `camera:drift` proof events.
26. **P78 · Population audit** — CANON DONE `3929492` — `src/genesis/population-audit.js` samples visible/alive population counts every 8s into bounded proof state.
27. **P82/P148 · Citizen tick loop** — pending perceive→plan→act→reflect.
28. **P83/P149 · Affordance modeling** — pending.
29. **P84/P150 · Hallucination grounding KG** — pending.
30. **P90/P134 · Soul economy honesty** — pending.
31. **P91/P135 · Book storefront** — pending.
32. **P92/P136 · Merchant real purchase** — tracker says done in other repo; reconcile needed.
33. **P93/P137 · Trust-gated commerce** — pending.
34. **P95/P157 · Skill Tree live** — pending.
35. **P96/P158 · Self-questioning loop** — pending.
36. **P97/P159 · Architect gate on evolution** — pending.
37. **P101 · Deterministic boot barrier** — reconcile current live state.
38. **P102 · Synchronous spine install** — reconcile current live state.
39. **P121 · Episodic citizen memory** — tracker says done in other repo; reconcile needed.
40. **P125/P152 · Cross-world memory** — pending.
41. **P130 · Vector memory** — pending.
42. **P131/P166 · Memory distill** — pending.
43. **P138/P183 · PLT ledger/per-action audit** — CANON DONE `209db1f` — `src/genesis/plt-ledger.js` persists `worldState.pltLedger`, exposes `Genesis.PLT.record()`, hooks boot-ready and prophecy archive events (port from CPL `4caa572`). Gun PLT loaded.
44. **P145/P79 · Multiplayer state** — infra/architecture pending.
45. **P146/P80 · Voice chat** — infra pending.
46. **P147/P81 · AI Director pacing** — pending.
47. **P151/P87 · Dynamic events** — pending.
48. **P163 · Auto-soul-gun forgery** — pending.
49. **P167/P99 · Sovereign audit vs wilds.ai** — pending.
50. **P198 · Universal memory format** — pending.

## Infra-blocked set
P53-P57/P109-P113 hosted tunnel/auth/window vars, P61-P63/P115-P117 tool-arm/Web Forge/Long-Form Scribe live, P86/P153 Shared Sanctum lobby require hosted target/secrets.

## Hardest current task
The hardest active task was the monolith blocker: `src/cpl/city-builder.js` extraction seam. It is now shipped (`4fb2a46`) and becomes the pattern for every future CPL module extraction.
