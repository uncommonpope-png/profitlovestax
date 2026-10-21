# Godmode ULTRA REVIEW — adversarial pass (Soul Note v1 + Soul Gun v1)

**Skill:** god-mode-research · **Phase:** ULTRA REVIEW · **Date:** 2026-07-18
**Targets:** `SOUL-NOTE - AI Agents in Game Engines (GSK Mission).md`, `SOUL-GUN - GSK-as-Game-Agent.md`

Round 1: N parallel reviewers (narrow scope). Round 2: cross-review. Round 3: survivors.

---

## ROUND 1 — FINDINGS

### Reviewer A — Accuracy / Source Fidelity
- **[Medium]** v1 Soul Note cites NVIDIA ACE example games as "PUBG Ally, Total War PHARAOH" — CORRECT
  (verified: PUBG: BATTLEGROUNDS 'Ally' NPC, Total War: PHARAOH AI teammates). ✓ No fix.
- **[Low]** v1 says ACE = "on-device C/C++ companions" — verified (lightweight open-source C/C++ framework). ✓
- **[Medium]** v1 MISSING: the payload's 5 roles were mapped, but the "AI agent that PLAYS games" axis
  (Craig's follow-up links: SIMA 2, NitroGen, GamingAgent) was NOT in the original payload OR the v1 note.
  → This is a 3rd agent category the research exposes. v2 must add it. (Severity: Medium — it's the
  axis closest to Craig's "he lives in the engine" vision.)

### Reviewer B — Gap / Completeness
- **[High]** v1 Soul Gun lists 5 roles but ALL are "build/production pipeline" roles. It omits the
  INHABITANT role (GSK plays/reasons/learns in the world) — the exact thing VISION-GSK-LIVES-IN-ENGINE
  describes. → Add **GSK-Inhabitant** (6th role) mapping to SIMA 2. Severity: High (it's the vision's core).
- **[High]** v1 Soul Gun references `gsk-voice-system`, `agent_communication_bus`, `procedural_building_spawner`
  as if they exist — but does NOT note the stub has NO command channel. Seshaty's gap #2 (no command vocab)
  is unfixed. → v2 must state: command channel is DESIGNED-NOT-BUILT; Step 2 owns it; Summer's 52 tools
  are the candidate vocabulary. Severity: High (accuracy of "what exists vs what's planned").
- **[Medium]** v1 Soul Gun PLT framing claims "one sovereign agent replaces 5 scattered SaaS tools" — but
  with the 6th (inhabitant) role added, it's 6. Cosmetic.

### Reviewer C — Architecture / REDBUTTON Safety
- **[Medium]** v1 Soul Note says "engine sends context; GSK returns edit intent; EngineScheduler applies" —
  but CASCADE decoupling (player can't prompt-inject GSK to death) is only mentioned under Support role.
  Should be a GLOBAL safety note applying to ALL 6 roles (esp. Inhabitant, where the player interacts live).
  → v2: add "CASCADE decoupling is load-bearing for every role, not optional." Severity: Medium.
- **[Low]** v1 correctly keeps GSK sovereign (no in-page LLM). ✓ No regression vs REDBUTTON.

### Reviewer D — Pattern Fit (vs mined guns)
- **[Low]** v1 Soul Gun frontmatter `phase:: B6` but master index lists it under "GSK-in-Engine" section
  (not a B-phase). Consistent enough; align label to "GSK-in-Engine" in v2. Cosmetic.
- **[Medium]** The stub's real API (`registerAgent`, `GenesisKernel.register('agent://gsk')`,
  `EngineScheduler.defineTick('agent-gateway', tick, predicate)`) is NOT referenced in v1 Soul Gun.
  → v2 should cite the actual spine functions so the spec is grounded, not hypothetical. Severity: Medium.

---

## ROUND 2 — CROSS-REVIEW (try to disprove each other)
- Reviewer B's [High] (missing Inhabitant role) DISPROVES Reviewer A's assumption that the 5 roles are
  exhaustive. CONFIRMED: 6 roles needed. A's [Medium] (missing play-games axis) is the SAME root cause.
- Reviewer D's [Medium] (cite real API) strengthens Reviewer B's [High] (accuracy of built-vs-planned):
  grounding the spec in `agent-gateway.js` makes the "command channel not built" gap explicit and verifiable.
- Reviewer C's [Medium] (CASCADE global) is UNCONTESTED — survives.

## ROUND 3 — SURVIVORS (must-fix for v2)
1. [High] Add GSK-Inhabitant (6th role) — maps to SIMA 2. (B + A)
2. [High] Mark command channel as DESIGNED-NOT-BUILT; cite Summer 52-tool taxonomy as candidate vocab; Step 2 owns it. (B + D)
3. [Medium] Add Axis 3 (play-games agents: SIMA 2 / NitroGen / GamingAgent) to Soul Note. (A)
4. [Medium] Global CASCADE decoupling note across all roles. (C)
5. [Medium] Cite real stub API (`registerAgent`, `GenesisKernel.register`, `EngineScheduler.defineTick`). (D)
6. [Low] Cosmetic: 6 roles in PLT; align phase label.

---

*Ultra Review complete. 6 findings (2 High, 3 Medium, 1 Low). All addressed in v2 specs below.*
