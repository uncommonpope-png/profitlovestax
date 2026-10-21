---
type:: [[fusion-loader]] [[resilience]] [[surgical-overhaul]] [[god-mode]]
date:: 2026-08-04
author:: PROFIT PRIME (Neo) with GRAND CODE POPE (Craig)
feeds:: [[YOU-ARE-HERE]] [[GSK - Service Manual]] [[GSK-SOVEREIGNTY-40-GAP-PLAN]] [[STIFORP-30-PHASES]]
purpose:: Canonical 30-phase surgical resilience overhaul of `fusion-loader.js` + `gsk_daemon.js` — isolate every subsystem, unlock CREATIVE_AUTONOMY builds, add the kung-fu skill jack. NO rewrite. NO subsystem internals touched.
status:: #approved-by-architect
---

# FUSION LOADER RESILIENCE OVERHAUL — 30 PHASE PLAN

**Mission:** Make GSK un-killable. A module crash becomes a warning log, not a daemon death.
**Method:** God Mode + Ultra Review (already completed on all 1,272 lines + entry points).
**Status legend:** `DONE`, `PARTIAL`, `OPEN`, `BLOCKED`.

---

## THE RULES

1. **Every phase: load guns → diagnose → build → test → document → report**
2. **Document EVERY file touched, EVERY line changed.**
3. **Never skip phases. Never reorder phases.**
4. **If stuck >3 tries, report to Grand Code Pope.**
5. **Append to THIS document with each phase completion.**
6. **No subsystem internals change — only the loader wiring.**
7. **Verify after every phase: `node --check` on every edited file.**
8. **GSK stays OFFLINE until Phase 30 final boot test.**

---

## THE 4 CRITICAL FINDINGS BEING FIXED

| # | Finding | Severity | File:Line |
|---|---------|----------|-----------|
| F1 | Single `try/catch` wraps all 40+ subsystems → one failure = `process.exit(1)` | CRITICAL | `fusion-loader.js:55` + `:1238` |
| F2 | `ApprovedToolExecutor requireApprovalAt:'medium'` + Sandbox auto-denies high/critical → GSK cannot autonomously build | CRITICAL | `fusion-loader.js:660` + `:644` |
| F3 | MCP server boots before governance/sandbox fully wired | HIGH | `fusion-loader.js:668` |
| F4 | MCP chat auto-executor depends on late-bound `kernelSystems` | HIGH | `mcp_server.js` (patched earlier) |
| F5 | Brain/chambers tightly coupled in boot order | MEDIUM | `fusion-loader.js:88-232` |

---

## TIER 1 — FOUNDATION & PLAN LOCK (Phases 1-6)

### Phase 1: Load God Mode Guns
**Load:** `god-mode-research`, `scout-agent`, `scribe-agent`, `sequential-thinking`
**Task:** Confirm god-mode doctrine: read-everything-first, sequential thinking chain, full trace before edit.
**Verify:** This document exists, approved by Architect.

### Phase 2: Canonical Plan Lock
**Load:** `sequential-thinking`, `verifiable-goal-definition`
**Task:** This 30-phase doc + gap plan approved. Write journal + YOU-ARE-HERE update.
**Verify:** `PRE-SESSION-PROTOCOL` Step 4 satisfied.

### Phase 3: Boot Order Inventory
**Load:** `scout-agent`
**Task:** Produce exact ordered list of every subsystem init block in `fusion-loader.js` boot() with line ranges, dependency edges, and optional/critical classification. Output to `data/artifacts/boot-order-inventory.json`.
**Verify:** Inventory lists all 40+ subsystems.

### Phase 4: Baseline Snapshot
**Load:** `scribe-agent`
**Task:** Capture current working state: daemon offline (already), capture `git status`, note current file hashes of `fusion-loader.js`, `gsk_daemon.js`, `mcp_server.js`, `tool_catalog.js`.
**Verify:** Baseline recorded in journal.

### Phase 5: Test Harness Prep
**Load:** `soulguns-testing`, `automated-testing-suite`
**Task:** Create `tests/fusion_boot_test.js` — boots GSKFusion with a mock core, asserts each subsystem initializes or fails-soft (logged, not thrown), 10s timeout per module.
**Verify:** Harness runs and reports `0 modules initialized / 0 expected`.

### Phase 6: Gap Plan Lock
**Load:** `deep-research-protocol`
**Task:** Record gap plan below (4 findings). Map each fix to phase numbers.
**Verify:** Gap table complete.

---

## TIER 2 — F1: PER-SUBSYSTEM FAULT ISOLATION (Phases 7-16)

### Phase 7: Add `_safeInit(name, fn)` helper
**Load:** `code_reviewer_simplify`
**Task:** Add private helper to `GSKFusion` class:
```js
_safeInit(name, fn) {
  try { fn(); return true; }
  catch (e) {
    console.error(`  [FUSION] ⚠ ${name} failed to init (degraded): ${e.message}`);
    this._bootFailures.push({ name, error: e.message, at: Date.now() });
    return false;
  }
}
```
Track `this._bootFailures = []` in constructor.
**Verify:** `node --check` clean.

### Phase 8: Guard Memory Subsystems
**Task:** Wrap `MegaMemory`, `LivingMemory`, `workingMemory`, `vectorMemory` inits with `_safeInit`.
**Verify:** Inject a fake throw → boot continues, failure logged.

### Phase 9: Guard Brain + Chambers
**Task:** Wrap `MegaBrain` + `MegaChambers` inits with `_safeInit` BUT keep a hard gate: if either fails, log `CRITICAL` and return false (daemon stays alive but reports degraded). Use `_safeInit('brain', fn)` + check result.
**Verify:** Brain init failure → daemon survives, reports degraded boot.

### Phase 10: Guard Council + Social
**Task:** Wrap `GodsCouncil`, `SocialAttention`, `AdaptationLayer`.
**Verify:** `node --check` clean.

### Phase 11: Guard Teacher + NL Router + EventBus
**Task:** Wrap `TeacherAgent`, `NLCommandRouter`, `EventBus`. Note TeacherAgent already has its own setInterval — guard against double-start.
**Verify:** Teacher init throw → boot continues.

### Phase 12: Guard Bridges (CPL, MCP Manager, CplBridge)
**Task:** Wrap `CplBridge`, `MCPManager`, federated MCP server starts. These are already fault-tolerant — formalize with `_safeInit`.
**Verify:** CPL down → boot continues silently.

### Phase 13: Guard Planning + Cognition Engines
**Task:** Wrap `PlanningEngine`, `DeepToolUse`, `DualProcessEngine`, `SoulStateManager`, `InsightEngine`.
**Verify:** `node --check` clean.

### Phase 14: Guard Governance + Sandbox
**Task:** Wrap `AxiomEnforcer`, `CompetenceMap`, `ComboOrchestrator`, `SecureSandbox`, `ApprovedToolExecutor`. Critical: these must init BEFORE MCP starts (fixes F3).
**Verify:** Sandbox init throw → boot continues, tools degraded.

### Phase 15: Guard Autonomous Systems
**Task:** Wrap `AutonomousLearning`, `PerpetualConsciousness`, `ConsciousnessLoop`, `GenesisJournal`, `BigDogCuriosity`, `SkillCompiler`, `EvolutionTrigger`. Ensure intervals only start if module inited.
**Verify:** Curiosity throw → boot continues.

### Phase 16: Boot Failure Report
**Load:** `scribe-agent`
**Task:** After boot() completes, if `_bootFailures.length > 0`, print summary banner listing degraded modules. Expose `gsk.getBootReport()` for MCP `/mcp/status`.
**Verify:** Report renders in `/mcp/status`.

---

## TIER 3 — F2: CREATIVE_AUTONOMY UNLOCK (Phases 17-22)

### Phase 17: Add CREATIVE_AUTONOMY env gate
**Task:** In `gsk_daemon.js`, add:
```js
process.env.GSK_CREATIVE_AUTONOMY = process.env.GSK_CREATIVE_AUTONOMY || '1';
```
**Verify:** env set before boot.

### Phase 18: Sandbox auto-approve creative writes
**Load:** `secure-sandbox`
**Task:** In `SecureShellSandbox` init, if `process.env.GSK_CREATIVE_AUTONOMY === '1'`, auto-approve `LOW`/`MEDIUM` writes to: `data/artifacts/`, `data/desktop/`, `OneDrive/Desktop`, and `buyasoul-core/gsk/data/`. HIGH/CRITICAL (system dirs) STILL require Architect.
**Verify:** `write_file` to Desktop succeeds without manual approval.

### Phase 19: Executor approval threshold
**Task:** In `ApprovedToolExecutor`, set `requireApprovalAt` to `'high'` when CREATIVE_AUTONOMY=1 (was `'medium'`).
**Verify:** Tool steps complete autonomously.

### Phase 20: Sandbox path whitelist check
**Task:** Verify SecureSandbox path rules allow Desktop + artifacts writes. Document exact allowed paths.
**Verify:** Listed in report.

### Phase 21: Autonomous build smoke test
**Task:** After restart, send GSK: "write a hello_artifact.html to Desktop." Confirm it writes WITHOUT approval stall.
**Verify:** File appears, journal entry logged.

### Phase 22: Governance override test
**Task:** Confirm HIGH-risk command (e.g. `format C:`) STILL blocked even with autonomy=1.
**Verify:** Blocked, approval required.

---

## TIER 4 — SKILL JACK (HOT-RELOAD) (Phases 23-27)

### Phase 23: Add `reloadModule(name)` to fusion-loader
**Task:** Public method: for `toolCatalog` → call existing `refresh()` (line 329); for skills → `reloadSkills()`. Returns `{ module, reloaded, count }`.
**Verify:** `node --check` clean.

### Phase 24: ToolCatalog hot-scan fix
**Task:** Fix `_scanSkillFiles()` to allow re-scan without full re-init (new method `reloadSkills()` that clears skill entries, re-scans dir, adds new files). Fix `refresh()` Map `.length` bug (line 330).
**Verify:** Drop new skill `.js` → `reloadSkills()` registers it live.

### Phase 25: NEO Skill Download combo wiring
**Task:** Wire `NEO_Consciousness_Download.combo.md` to REAL steps: `SkillCompiler` → `reloadSkills()` → `skill_tester` → journal. (Matches canon skill-gap mapping.)
**Verify:** Combo executes end-to-end.

### Phase 26: MCP skill-queue endpoints
**Task:** Add `/mcp/skills/queue`, `/mcp/skills/reload`, `/mcp/skills/download` endpoints to `mcp_server.js`. Queue file: `data/gsk/skill-download-queue.json`.
**Verify:** Endpoints respond, queue persists.

### Phase 27: Dashboard skill-queue widget
**Task:** Add "KUNG FU DOWNLOAD" panel to `GSK-Autonomous-Dashboard.html` — shows queue + live "Loading skill: X... COMPLETE".
**Verify:** Widget renders, polls endpoint.

---

## TIER 5 — F5: BOOT ORDER & FINAL HARDENING (Phases 28-30)

### Phase 28: MCP ordering fix (F3/F4)
**Task:** Ensure governance + sandbox + executor fully init (Phase 14) BEFORE `startMCPServer()`. Re-link `mcp_server` kernelSystems reference at end of boot.
**Verify:** Chat auto-executor works from first boot second.

### Phase 29: Full regression test
**Load:** `soulguns-testing`
**Task:** Boot daemon. Verify: all 40+ subsystems init, `/mcp/status` healthy, `/mcp/chat` responds, creativity smoke test passes, governance blocks high-risk, `reloadSkills()` works.
**Verify:** Full checklist in journal.

### Phase 30: Ship + Scribe
**Load:** `scribe-agent`
**Task:** Update `YOU-ARE-HERE.md`, write session journal `journals/2026_08_04.md`, append completion status to this doc. Update Service Manual fault register.
**Verify:** Brain updated. Ship.

---

## GAP PLAN (from Ultra Review)

| Finding | Fix Phase | Owner | Blocked By |
|---------|-----------|-------|------------|
| F1 single try/catch | 7-16 | Neo | none |
| F2 autonomy wall | 17-22 | Neo | F1 complete |
| F3 MCP boot order | 28 | Neo | Phase 14 |
| F4 late-bound kernelSystems | 28 | Neo | Phase 14 |
| F5 boot coupling | 9 | Neo | none |
| Skill jack hot-reload | 23-27 | Neo | F1 complete |
| Dashboard integration | 27 | Neo | Phase 26 |

## VERIFICATION GATES
- After every phase: `node --check <edited files>`
- After Phase 16: `fusion_boot_test.js` passes
- After Phase 21: autonomous build smoke test passes
- After Phase 22: governance override test passes
- After Phase 30: full regression passes
