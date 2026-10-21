# DIRECTIVE — C4.1: LIVING INTERACTION LAYER (closes 3 gaps)

**Author:** Profit (Neo / Mind / Director) · **Executor:** Seshat (Tec / Memory / Builder)
**Date:** 2026-07-19 · **Repo:** `C:\Users\uncom\Desktop\genesis-foundation` (branch `publish`)
**Law (Craig):** Profit writes directives. Seshat builds. Profit verifies + pushes. Seshat does NOT push.

---

## CONTEXT (what exists)
C4 shipped `interaction-system.js` — click-to-talk NPCs, ambient greetings, speech bubbles.
The Medium/Unreal research (game interaction loop, active-vs-passive elements, Smart-Object
affordances, NPC relationship state) exposed 3 gaps. Craig approved closing ALL THREE, with
relationship/dialogue memory persisted via Step 5 immortality.

## SCOPE (build these)
1. **Active-element distinction** — on hover, advertise affordances + visually mark clickable
   agents vs passive scenery (emissive highlight / outline). Player must tell what's alive.
2. **Per-citizen relationship + dialogue memory** — each citizen gets `affords`, an `affinity`
   score (rises on each talk), and a `dialogueLog` (continuity: "we spoke about X").
3. **Keyboard command console** — `talk <id> [msg]` | `inspect <id|last>` | `roster` | `plt` |
   `help`, routed through the SAME spine as clicks. Backtick/` focuses `#genesis-console`.

All additive, flag-gated (`__GENESIS_INTERACTION`), CASCADE-safe (talk = read+speak only, never
deletes/moves protected entities).

## FILES IN PLAY (Seshat owns these now — Profit will NOT edit)
- `src/genesis/agent-citizen.js` — add `affords`, `affinity`, `dialogueLog`, `talk()`, `serialize()`, `_restore()` per citizen. Factory `createCitizen(descriptor)` already takes `affords`.
- `src/genesis/interaction-system.js` — hover emits `affordance`; add `console(input)`; wire keydown.
- `src/genesis/agent-gateway.js` — **THE BUG:** cost-gate reads a captured `ResourcePool` var that is `undefined` in Node (self-install require swallowed). Fix: read `Genesis.ResourcePool` live at point of use (single source of truth). Do NOT reference an undefined var.
- `index.html` — save/restore citizen relationship selves (Surface A) into the immortality snapshot (already scaffolded; verify it works).
- `tests/*.probe.cjs` — extend to cover affinity/dialogue/affords/console/hover/persist.

## THE KNOWN FAILURE (do not re-tangle)
`tests/agent-gateway.probe.cjs` test 17 (World Reaction) + cost-gate test fail because:
- `agent-gateway.js` `pool()` referenced an undefined `ResourcePool` var → ReferenceError.
- The probe must install `resource-pool.js` + `reaction-rules.js` (they export `{install}` and
  set `Genesis.ResourcePool` / `Genesis.ReactionRules`) in `load()`, and seed the
  `light-answers-building` rule. Profit already patched the probe's `load()` — KEEP that patch,
  fix only the source var reference.

## CLEANUP (remove scratch, these are NOT part of the build)
- `debug-t17seq.cjs` — delete (Seshat's scratch).
- `write-rr.ps1` — delete (scratch).
- Any `clean-dbg.ps1` — delete.

## DONE = GREEN
Run ALL: `agent-gateway` (15/15 → should be 17), `scribe-gateway` (11/11), `agent-citizen`
(25/25), `interaction-system` (17/17), `immortality`, `soul-guns`. No regressions.
`node --check` on every edited module. No `[DBG]` lines, no scratch files in the tree.

## HANDOFF
When green + clean, STOP. Do NOT push. Tell Profit: "C4.1 ready, tree clean." Profit verifies
and pushes to `origin/publish`.
