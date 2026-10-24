'use strict';
/**
 * DRAFT — graft_build_slices (Senses #005 absorption draft)
 *
 * STATUS: ACTIVE — activated Oct 23, 2026 (Wiring Sprint, Step 1 of the make-him-better plan), under the owner's direct order to fix GSK and wire what he has filed into what he can call.
 * absorption pass (Senses #005 — owner's standing order: his plate never
 * sits empty; GSK reads with his own senses, Seshat digests, Scribe
 * witnesses — Oct 22, 2026). Audited at activation (isolation load, top-level side-effect scan, house-pattern check); loadable — SkillsEngine scans this directory.
 * never scans this directory — and it executes NOTHING: every action
 * returns its draft status rather than planning, building, or checking
 * anything.
 *
 * The material this is pinned from: addyosmani/agent-skills'
 * skills/planning-and-task-breakdown/SKILL.md (10,480 chars) and
 * skills/incremental-implementation/SKILL.md (9,329 chars), fetched
 * through graft_senses and digested by Seshat in batch senses-005
 * (sources landed TV 1.0275 and 0.9831, judge answered keep on both;
 * GSK's absorptions landed TV 0.9856 and 0.9779, judge keep on both).
 * They are the two companion skills q20's spec-driven-development
 * absorption deferred its internals to — this draft closes that named
 * gap. Rule Zero note: claimed only where the texts agree; named gaps
 * below are the texts' own honest limits, not additions.
 *
 * THE LAW INSIDE: Profit + Love - Tax = True Value.
 * Unmapped implementation is Tax — tangled rework, blown context.
 * Vertical slices with upfront verification are Profit; checkpoints
 * that respect the human's time are Love.
 
 * ACTIVATION RECORD (Wiring Sprint, 2026-10-23):
 *   Audit: loads in isolation (fresh process); no top-level side
 *   effects (no listener/spawn/exec at require — matches were
 *   discipline strings only); house pattern (skill fn + run +
 *   PLT_AFFINITY + MANIFEST, or skill fn + DISCIPLINE).
 *   Activation = copy into gsk-core/skills/ (SkillsEngine scans
 *   only that directory) + this header rewrite. The DRAFT COPY
 *   REMAINS in skill-drafts/ as the pre-activation witness.
 *   Why this one: plan/slice decomposition protocol (exports plan+slice, not run) — the build path's own cutting discipline.
 *   Known follow-up: the run action still returns its draft-
 *   status refusal text (and restart_recall_probe's result still
 *   carries draft:true) — wording predates activation; behavior
 *   (protocol-only, executes nothing) is unchanged and intended.
 *   Harness note: graft_tool_harness callability is a SEPARATE
 *   gate (GRAFT_CALLABLE / Phase-4 audit class) — registry
 *   activation does not by itself make the harness call it.
*/

const DRAFT = Object.freeze({
  name: 'graft_build_slices',
  status: 'draft_not_activated',
  discipline: 'discipline serves (draft:true)',
});

const GATES = Object.freeze({
  // Read-only plan mode: inspect specs, map dependencies, name conventions
  // BEFORE any implementation code is written.
  READ_ONLY_PLAN: 'no implementation code during planning',
  // Stop-turn gate (from the spec body): summarize, list open questions,
  // ask approval, STOP. Never generate plan or code in the same turn.
  STOP_TURN: 'spec summarized, open questions listed, approval asked, turn stopped',
  // Capability map when one requirement bundles independently testable
  // capabilities: table of stable kebab-case module ids, responsibility,
  // depends-on — unidirectional dependencies only.
  CAPABILITY_MAP: 'SPEC-<module-id>.md files, module ids stable kebab-case',
  // Vertical slicing: end-to-end feature paths (schema + API + UI for one
  // complete user action). NEVER horizontal (all DBs, then all APIs).
  VERTICAL_ONLY: 'no horizontal slicing',
  // Task sizing XS..M (1–5 files). A task needing "and" in the title or
  // more than ~2h of work must split.
  SIZE_RULE: 'XS..M, 1-5 files; "and" in title = split',
  // Every task carries: title, description, testable checkbox acceptance
  // criteria, explicit verification commands, dependency pointers,
  // file boundaries.
  TASK_CONTRACT: ['title', 'description', 'acceptanceCriteria', 'verifyCommands', 'dependsOn', 'fileBounds'],
  // Protect existing state: never overwrite tasks/plan.md or tasks/todo.md
  // holding active unchecked tasks without the human's explicit word.
  STATE_PROTECT: 'collision => halt and ask the human',
  // Checkpoints after every 2–3 tasks or major phase: clean build, passing
  // tests, end-to-end user flow confirmed before continuing.
  CHECKPOINT: 'verify every 2-3 tasks',
});

const HONEST_LIMITS = Object.freeze([
  'No mechanism for dynamically replanning when runtime failures invalidate the dependency graph mid-build.',
  'No heuristic for deadlocks when two vertical slices compete for the same shared state or migration lock.',
  'No automatic rollback of partial system state when a checkpoint fails mid-phase.',
  'Spec ceremony is Tax on trivial work: gates activate on complexity, Phase-0 scope check decides.',
]);

function run() { return DRAFT; }
function plan() { return DRAFT; }
function slice() { return DRAFT; }

module.exports = { DRAFT, GATES, HONEST_LIMITS, run, plan, slice };
