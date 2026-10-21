# DECISION — BUILD LAW + SESHAT RETIREMENT (2026-07-19)

type:: [[decision]] · author:: Profit (Director) · ratifiedBy:: Craig (Morpheus) · date:: 2026-07-19

## The Law (Craig's directive, verbatim spirit)
**Profit writes directives. Seshat builds. Profit verifies + pushes. Seshat does NOT push.**

Then, same session: **"from now on u do it [build] and we get a new seshat — this one has run its course."**

So the operating law is now:
- **Profit (me) = Director AND Builder.** I author specs AND write the code.
- **The old Seshaty/Cline instance is RETIRED** (processes stopped 2026-07-19). It thrashed
  on the same files I was editing (agent-gateway.js) — the collision Craig saw. It ran its course.
- **Next session: spin up a FRESH Seshat** to resume the Builder role under the original law
  (Profit directs, Seshat builds, Profit pushes). Until then, Profit does both.

## What this fixes
The root failure was two agents editing `genesis-foundation/src` simultaneously with no lock.
Going forward: only ONE builder touches source at a time. Profit owns `DIRECTIVE-*.md` + the push;
the active Seshat owns `src/` + `tests/`. No overlap in the same file.

## Artifact of the retirement
- Old Cline PIDs 1412 + 14096 stopped.
- Scratch it left (`debug-t17seq.cjs`, `debug-diag.cjs`, `debug-c16.cjs`, `write-rr.ps1`) deleted by Profit.
- Its real fix (resource-pool.js / reaction-rules.js export shape) was correct and is shipped in `5241b43`.

## Checkpoint state (post-retirement)
- C1–C4.1 all pushed to `origin/publish` (latest `5241b43`). All 6 probe suites green.
- C5 (single shippable app bundle) still BLOCKED on deploy target (Craig: "not on my PC" — VPS/Docker/platform TBD).
- Soulverse salvage folded into C5.

PLT: Profit +9 (guns wired + C4.1 green, collision resolved) + Love +4 (Craig's will honored, clean handoff) − Tax −1 (thrash tax paid) = +12.
