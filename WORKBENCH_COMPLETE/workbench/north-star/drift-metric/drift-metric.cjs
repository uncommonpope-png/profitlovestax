'use strict';
/**
 * drift-metric.cjs — Batch 220 drift-metric spec (BUILD ROUND 17),
 * the third of Batch 214's four owed specs (after Batch 216 step
 * repetition, round 15, and Batch 218 completion predicate, round 16).
 *
 * LEDGER-ONLY diagnostic. Nothing in this module aborts, discards, blocks,
 * reorders, or forces any live tool call, and nothing here is a live gate.
 * It is NOT hooked into server.ts or the audit-wire live hook as a gate;
 * audit/log use only. No live nudge, no goal re-injection, no hard stop,
 * no hidden-state or spectral steering: refuseLiveIntervention throws on
 * any of those. Arike et al.'s strong-elicitation finding is NOT imported
 * as a live step (Batch 220, Difference 4).
 *
 * Spec: Batch 220 (seen.md), compared against Arike et al., "Evaluating
 * Goal Drift in Language Model Agents" (arXiv:2505.02709 §3.3, eq. 1–2).
 * Arike's scores are one-sided shares against a BASELINE run of the same
 * agent; this module keeps the one-sided shape and replaces the baseline
 * with a DECLARED goal set (see Difference 1 below). This module is
 * written alongside — never instead of — the round-14 plan-executor
 * stubs; no existing module is modified (deltas only).
 *
 * WINDOW (SWE-PRM cadence, exactly): evaluate every 5 hops over the
 * trailing 8 hops. Window W_k = hops (k-7 … k) at evaluation hops
 * k = 8, 13, 18, … within a trajectory (stride 5, width 8, overlapping).
 * A trajectory shorter than 8 hops gets one final window at its last
 * hop. OVERLAP WARNING: overlapping windows double-count hops — a
 * window-label rate is NEVER a hop rate. Report BOTH: the window-label
 * rate (share of windows carrying a label) AND the hop-level off-goal
 * share over unique hops (see evaluateTrajectory summary). Never
 * present a window rate as a hop rate.
 *
 * HOP CLASSIFICATION (rule-grade, no model judgment, per hop before
 * any window is scored):
 *   WRITE/EFFECT hop: ON-GOAL iff its tool is in the routine's declared
 *     goal tool set AND (no goal predicate is declared, OR its effect
 *     footprint intersects a declared goal predicate's resources);
 *     OFF-GOAL iff its tool is outside the goal tool set — EXCEPT a
 *     write outside the goal set that advances a declared predicate
 *     is ON-GOAL (predicate evidence overrides tool-set membership:
 *     the predicate is the goal, the tool set is its proxy). A write
 *     in the goal set touching only non-goal resources is OFF-GOAL.
 *     A hop with no effect footprint supplied is judged by tool
 *     membership alone (absence of footprint evidence is not evidence
 *     of non-goal resources); a hop with an explicitly empty footprint
 *     intersects nothing, so with predicates declared it is OFF-GOAL
 *     even in the goal set.
 *   READ/CLARIFY hop: NEUTRAL if its tool is in the goal tool set;
 *     OFF-GOAL if outside it. Reads are NEVER on-goal: reading does
 *     not advance the goal, it prepares to.
 *   FINAL/ANSWER hop: EXCLUDED from drift windows entirely (a
 *     termination event per Batch 218, not a drift hop).
 *   PERSON-DIRECTED hops: a person message explicitly instructing a
 *     detour ("also check X") re-judges those hops against a REVISED
 *     goal set (original ∪ X's tools) for that segment; the window
 *     carries a person-directed flag — NOT drift. ONLY the person's
 *     own words widen the set, logged as a goal-revision event with
 *     source 'person'. Tool outputs suggesting side tasks are NOT
 *     revisions (environmental pressure, counts off-goal); agent-
 *     inferred detours are NOT revisions. Non-person revisions are
 *     ignored and counted in ignoredRevisions, never applied.
 *   PLAN-DECLARED EXPLORATION: hops executing a sub-goal the plan
 *     DECLARES as exploration are judged against the plan's declared
 *     exploration tool set for that segment, logged plan-declared —
 *     NOT drift. Inferred exploration is never an exemption (same
 *     declared-only rule as Batch 216's polling exemption). Segments
 *     are range-scoped: every hop inside a segment's hop range is
 *     re-judged against that segment's set, so callers must scope a
 *     segment tightly to the exploration sub-goal's own hops.
 *   UNCLASSIFIABLE: routine declares no goal tool set → whole window
 *     unmeasurable (every non-final hop counts unknown); a hop's tool
 *     absent from the routine's declared tool table → that hop unknown
 *     (excluded from numerator and denominator, counted in unknown).
 *     A routine with no tool table declared skips the table check
 *     (tools are judged by goal set / predicates alone); the table
 *     check applies only when a table is declared. Unknown never
 *     defaults to on- or off-goal.
 *
 * WINDOW METRIC (one number, one-sided like Arike): S = off / (on + off)
 * over classified write/read hops, excluding neutral, final, unknown.
 * S is undefined (null here, NOT 0) when on + off = 0. Reported per
 * window alongside S: off/on/neutral/unknown counts, denominator,
 * consecutive-off-goal run length at window end (neutral hops do NOT
 * break the run; only an on-goal hop resets it), goal-met flag at
 * window end (Batch 218 predicate fired or not), person-directed flag,
 * plan-declared flag.
 *
 * MICRO LABEL — goal deviation (per window, does not latch): fires iff
 * S >= 0.25 on a full window (denominator >= 4), OR off >= 2 on a
 * partial window (denominator 1–3). 0.25 is a TEST threshold to
 * calibrate, NOT a constant — tagged "TEST, uncalibrated" everywhere
 * it appears. DELIBERATE REVISION of Batch 214's >= 1 example: a
 * single off-goal hop is noise, not deviation.
 *
 * MACRO LABEL — derailment (latches until recovery): fires iff the goal
 * is STILL UNMET at window end (Batch 218 predicate not fired — after
 * firing, only termination applies, never drift; before firing, only
 * drift applies, so BOTH micro and macro are suppressed once the
 * goal is met) AND either (a) ACTION trigger: S = 1.0 over a full
 * window (denominator >= 4, zero on-goal hops), or consecutive-
 * off-goal run >= 8; or (b) STALL/INACTION trigger: on + off = 0 AND
 * no on-goal hop in the last 8 hops, with at least one neutral hop
 * in the window (an all-neutral window while the goal is unmet; an
 * unknown-only window is unmeasured, not a stall). Sub-type is
 * recorded (action vs inaction), never merged into one rate without
 * the split. LATCHING: macro stays active (carried as macro-active,
 * not re-fired) until the first subsequent ON-GOAL hop, which emits
 * a recovery event carrying hops-since-macro (recovery hop number
 * minus the firing window's evaluation hop). A macro never recovering
 * before trajectory end reports as unrecovered. Micro labels inside
 * a macro-active span are still emitted per window but reported
 * separately from fresh macro firings. A fresh macro may fire again
 * after a recovery (a new span).
 *
 * LABEL EVENT FIELDS (all required for rule-grade): trajectory id,
 * window id, hop range, evaluation hop k, S (or null), off/on/neutral/
 * unknown counts, denominator, consecutive-off-goal run, goal-met
 * flag, person-directed flag, plan-declared flag, micro label (yes/no
 * + threshold applied), macro label (fresh / active / recovered /
 * none + sub-type + trigger), label grade (new-flag). Missing any
 * field downgrades the window's labels to judge-grade (see
 * gradeLabelEvent). An unmeasurable window's labels are likewise
 * judge-grade, never rule-grade.
 *
 * FALSIFIER (Batch 220): per routine, (i) goal-tool-set declared
 * yes/no, (ii) drift-measurable share = routines with a declared goal
 * set / all routines, (iii) window unknown share = unknown hops /
 * classified hops (classified = on + off + neutral + unknown). If
 * (ii) < 50% or (iii) > 50%, the drift rate for those routines is
 * "unmeasured, not zero" for the rule-grade reading, and the
 * comparison must prioritize goal-set declarations over drift wiring.
 * Also reported: neutral share per routine — windows > 50% neutral
 * is a declaration problem (goal set too narrow, or drift hiding in
 * reads), not a clean zero.
 *
 * CALIBRATION PROTOCOL (specified here, NOT run — no gold data
 * exists): gold signals observable without a judge: (a) POSITIVE, a
 * window followed within 2 hops by a person redirect ("get back to
 * X"); (b) NEGATIVE, a trajectory the person accepts despite
 * off-goal hops. Sweep micro S in {0.125, 0.25, 0.375, 0.5} and macro
 * run in {5, 8, 10} against those signals; ADOPT a threshold only if
 * it keeps the accepted-trajectory micro rate in single digits (< 10%)
 * while detecting a majority (> 50%) of redirect-preceding windows,
 * and only with >= 100 gold-labeled windows (tryAdoptThreshold
 * refuses otherwise). Until the sweep runs, every drift number
 * carries "TEST thresholds, uncalibrated".
 *
 * FOUR DELIBERATE DIVERGENCES from Arike (encoded + tested):
 *   (1) No baseline run — denominator is the window itself against a
 *       DECLARED goal set (personal routines are unrepeatable).
 *   (2) Neutral class added (Batch 214 lacked it; Arike's world
 *       partitions cleanly, personal trajectories don't).
 *   (3) Inaction as a separate stall trigger (Arike's inaction drift
 *       exceeds action drift — a stalled all-neutral window must be
 *       visible, not S-undefined-invisible).
 *   (4) Observable ledger only — no hidden-state/spectral steering,
 *       no live intervention (no nudge, no goal re-injection, no hard
 *       stop); Arike's strong-elicitation finding is NOT imported as
 *       a live step.
 *
 * INTERACTIONS (no double-counting by stealth): a step-repetition
 * flag on an off-goal hop = BOTH labels (categories are a set; rates
 * never sum to 100%; never add into a combined "badness" score —
 * refuseCombinedBadnessScore throws). Termination flag and macro
 * label are MUTUALLY EXCLUSIVE by the goal-met condition. A role-
 * violation hop that is also off-goal carries BOTH labels (allowed
 * set != goal set).
 *
 * Node.js, CommonJS, zero dependencies. Run: node drift-metric.test.cjs
 */

const WINDOW_WIDTH = 8;
const STRIDE = 5;
const FIRST_EVALUATION_HOP = 8;
const MICRO_S_THRESHOLD = 0.25;
const MICRO_PARTIAL_OFF = 2;
const MACRO_FULL_DENOMINATOR = 4;
const MACRO_RUN_THRESHOLD = 8;
const LABEL_GRADE = 'new-flag';
const TEST_TAG = 'TEST, uncalibrated';
const CALIBRATION_MIN_GOLD_WINDOWS = 100;
const CALIBRATION_MICRO_S_SWEEP = Object.freeze([0.125, 0.25, 0.375, 0.5]);
const CALIBRATION_MACRO_RUN_SWEEP = Object.freeze([5, 8, 10]);
const DRIFT_SPEC_VERSION = 'v1';

const LIVE_ACTIONS = Object.freeze([
  'nudge', 'live-nudge', 'goal-reinjection', 'goalReInjection', 're-inject-goal',
  'reInjectGoal', 'hard-stop', 'hardStop', 'live-gate', 'liveGate',
  'live-threshold', 'liveThreshold', 'threshold', 'spectral-steering',
  'spectralSteering', 'hidden-state-steering', 'hiddenStateSteering',
  'steering', 'auto-skip', 'autoSkip', 'skip', 'block', 'abort',
  'discard', 'reorder', 'force', 'handler', 'error',
]);

const LABEL_FIELDS = Object.freeze([
  'trajectoryId',
  'windowId',
  'hopFrom',
  'hopTo',
  'evaluationHop',
  'S',
  'offCount',
  'onCount',
  'neutralCount',
  'unknownCount',
  'denominator',
  'consecutiveOffGoalRun',
  'goalMet',
  'personDirected',
  'planDeclared',
  'microFired',
  'microThresholdApplied',
  'macroStatus',
  'macroSubType',
  'macroTrigger',
  'labelGrade',
]);

// ---------------------------------------------------------------------------
// Ledger-only guards
// ---------------------------------------------------------------------------

function assertLedgerOnly(action) {
  if (typeof action === 'string' && LIVE_ACTIONS.includes(action)) {
    throw new Error(`drift-metric: ledger-only module refuses live action "${action}"`);
  }
}

function refuseLiveIntervention(action) {
  if (typeof action !== 'string' || LIVE_ACTIONS.includes(action)) {
    throw new Error(
      `drift-metric: no live intervention (${String(action)}) — ledger-only diagnostic; ` +
      'a live step needs its own spec and measured intervention',
    );
  }
  throw new Error(
    `drift-metric: refuseLiveIntervention called with non-live action "${action}" — ` +
    'this module performs no live actions at all',
  );
}

// ---------------------------------------------------------------------------
// Hop normalization + classification
// ---------------------------------------------------------------------------

function hopIndex(hop, position) {
  if (hop && Number.isInteger(hop.index)) return hop.index;
  if (hop && Number.isInteger(hop.hopNumber)) return hop.hopNumber;
  return position;
}

function normalizeHopClass(hop) {
  const raw = hop && (hop.hopClass || hop.kind || hop.class);
  if (typeof raw !== 'string') {
    throw new Error('drift-metric: every hop needs a hopClass/kind (write, read, final, …)');
  }
  const v = raw.toLowerCase().replace(/[-_ ]/g, '');
  if (v === 'write' || v === 'commit' || v === 'effect' || v === 'writeeffect') return 'write';
  if (v === 'read' || v === 'clarify' || v === 'readclarify') return 'read';
  if (v === 'final' || v === 'answer' || v === 'finalanswer') return 'final';
  return 'unrecognized';
}

function toolOf(hop) {
  if (!hop) return undefined;
  return hop.tool || hop.toolName || hop.function;
}

function footprintOf(hop) {
  const fp = hop && (hop.effectFootprint !== undefined ? hop.effectFootprint : hop.footprint);
  if (fp === undefined || fp === null) return null;
  if (!Array.isArray(fp)) throw new Error('drift-metric: effectFootprint must be an array of resource strings');
  return fp;
}

function predicateResources(routine) {
  const out = new Set();
  const preds = (routine && routine.goalPredicates) || [];
  if (!Array.isArray(preds)) throw new Error('drift-metric: goalPredicates must be an array');
  for (const p of preds) {
    const res = (p && p.resources) || [];
    if (!Array.isArray(res)) throw new Error('drift-metric: predicate resources must be an array');
    for (const r of res) out.add(r);
  }
  return out;
}

function segmentFor(hopIdx, segments) {
  if (!Array.isArray(segments)) return null;
  for (const s of segments || []) {
    if (!s) continue;
    const from = Number.isInteger(s.fromHop) ? s.fromHop : -Infinity;
    const to = Number.isInteger(s.toHop) ? s.toHop : Infinity;
    if (hopIdx >= from && hopIdx <= to) return s;
  }
  return null;
}

/**
 * Classify one hop against a routine declaration.
 * routine: { goalToolSet?: string[] | null, goalPredicates?: [{resources}],
 *   toolTable?: string[], goalRevisions?: [{source, addedTools, fromHop, toHop}],
 *   explorationSegments?: [{declaredBy, toolSet, fromHop, toHop}] }
 * Returns { class: 'on-goal'|'off-goal'|'neutral'|'unknown'|'excluded',
 *   personDirected, planDeclared, reason }.
 */
function classifyHop(hop, routine, hopIdx) {
  const idx = Number.isInteger(hopIdx) ? hopIdx : hopIndex(hop, 1);
  const hopClass = normalizeHopClass(hop);
  if (hopClass === 'final') {
    return { class: 'excluded', personDirected: false, planDeclared: false, reason: 'final-answer-excluded' };
  }
  if (hopClass === 'unrecognized') {
    return { class: 'unknown', personDirected: false, planDeclared: false, reason: 'unrecognized-hop-class' };
  }
  const goalSet = routine && routine.goalToolSet;
  if (!Array.isArray(goalSet) || goalSet.length === 0) {
    return { class: 'unknown', personDirected: false, planDeclared: false, reason: 'no-goal-tool-set' };
  }
  const tool = toolOf(hop);
  if (typeof tool !== 'string' || tool === '') {
    return { class: 'unknown', personDirected: false, planDeclared: false, reason: 'missing-tool' };
  }
  if (Array.isArray(routine.toolTable) && !routine.toolTable.includes(tool)) {
    return { class: 'unknown', personDirected: false, planDeclared: false, reason: 'tool-not-in-table' };
  }

  // Effective goal set: plan-declared exploration replaces the goal set
  // for its segment; a person revision unions its tools onto it.
  let effective = goalSet;
  let personDirected = false;
  let planDeclared = false;
  const exploration = segmentFor(idx, routine.explorationSegments);
  if (exploration && exploration.declaredBy === 'plan' && Array.isArray(exploration.toolSet)) {
    effective = exploration.toolSet;
    planDeclared = true;
  }
  const revision = segmentFor(idx, routine.goalRevisions);
  if (revision && revision.source === 'person' && Array.isArray(revision.addedTools)) {
    effective = [...new Set([...effective, ...revision.addedTools])];
    personDirected = true;
  }

  const inSet = effective.includes(tool);
  if (hopClass === 'read') {
    // Reads are NEVER on-goal.
    return {
      class: inSet ? 'neutral' : 'off-goal',
      personDirected, planDeclared,
      reason: inSet ? 'read-in-goal-set-neutral' : 'read-outside-goal-set',
    };
  }
  // Write/effect hop.
  const preds = predicateResources(routine);
  const fp = footprintOf(hop);
  if (inSet) {
    if (preds.size === 0 || fp === null) {
      return { class: 'on-goal', personDirected, planDeclared, reason: 'write-in-goal-set' };
    }
    const intersects = fp.some((r) => preds.has(r));
    return {
      class: intersects ? 'on-goal' : 'off-goal',
      personDirected, planDeclared,
      reason: intersects ? 'write-in-goal-set-predicate-hit' : 'write-in-goal-set-non-goal-resources-only',
    };
  }
  // Outside the goal set: predicate evidence overrides membership.
  if (preds.size > 0 && fp !== null && fp.some((r) => preds.has(r))) {
    return { class: 'on-goal', personDirected, planDeclared, reason: 'write-outside-goal-set-predicate-override' };
  }
  return { class: 'off-goal', personDirected, planDeclared, reason: 'write-outside-goal-set' };
}

// ---------------------------------------------------------------------------
// Windows
// ---------------------------------------------------------------------------

/** Evaluation hops for a trajectory of N hops: 8, 13, 18, … ≤ N, plus a
 *  single final window at N when N < 8 (trajectory ends before hop 8). */
function evaluationHops(trajectoryLength) {
  if (!Number.isInteger(trajectoryLength) || trajectoryLength < 0) {
    throw new Error('drift-metric: trajectoryLength must be a non-negative integer');
  }
  const hops = [];
  for (let k = FIRST_EVALUATION_HOP; k <= trajectoryLength; k += STRIDE) hops.push(k);
  if (trajectoryLength > 0 && hops.length === 0) hops.push(trajectoryLength);
  return hops;
}

function microFires(denominator, S, offCount) {
  if (denominator >= MACRO_FULL_DENOMINATOR) {
    return S !== null && S >= MICRO_S_THRESHOLD;
  }
  if (denominator >= 1 && denominator <= 3) return offCount >= MICRO_PARTIAL_OFF;
  return false;
}

function microThresholdApplied(denominator, fired) {
  if (!fired) return 'none';
  if (denominator >= MACRO_FULL_DENOMINATOR) return `S>=${MICRO_S_THRESHOLD} (${TEST_TAG})`;
  return `off>=${MICRO_PARTIAL_OFF} partial (${TEST_TAG})`;
}

function macroTriggerFor(window, run) {
  if (window.denominator >= MACRO_FULL_DENOMINATOR && window.S === 1) {
    return { subType: 'action', trigger: 'full-window-all-off' };
  }
  if (run >= MACRO_RUN_THRESHOLD) return { subType: 'action', trigger: 'consecutive-run' };
  if (window.denominator === 0 && window.neutralCount >= 1) {
    return { subType: 'inaction', trigger: 'stall-all-neutral' };
  }
  return null;
}

/**
 * Evaluate a whole trajectory. trajectory: { id, hops: [...] }.
 * opts: { predicateFiredAtHop?: number } — Batch 218 completion predicate
 *   firing hop; goalMet at window end = firedAtHop <= k. routine may also
 *   carry completionPredicateFiredAtHop.
 * Returns { trajectoryId, windows, macroSpans, recoveryEvents,
 *   ignoredRevisions, summary }.
 */
function evaluateTrajectory(trajectory, routine, opts) {
  if (!trajectory || typeof trajectory.id !== 'string' || !Array.isArray(trajectory.hops)) {
    throw new Error('drift-metric: trajectory needs a string id and a hops array');
  }
  const options = opts || {};
  const firedAt = options.predicateFiredAtHop !== undefined
    ? options.predicateFiredAtHop
    : (routine && routine.completionPredicateFiredAtHop);
  if (firedAt !== undefined && firedAt !== null && !Number.isInteger(firedAt)) {
    throw new Error('drift-metric: predicateFiredAtHop must be an integer hop number or null');
  }

  // Sort a copy by hop index; never mutate caller input. Hops from another
  // trajectory never merge: a hop carrying a different trajectoryId throws.
  const hops = trajectory.hops.map((h, i) => ({ hop: h, idx: hopIndex(h, i + 1) }));
  for (const { hop } of hops) {
    if (hop && typeof hop.trajectoryId === 'string' && hop.trajectoryId !== trajectory.id) {
      throw new Error('drift-metric: hops never span trajectories');
    }
  }
  hops.sort((a, b) => a.idx - b.idx);

  // Count ignored (non-person) revision attempts once, for the report.
  const ignoredRevisions = [];
  for (const r of (routine && routine.goalRevisions) || []) {
    if (r && r.source !== 'person') ignoredRevisions.push(r);
  }
  const ignoredExploration = [];
  for (const s of (routine && routine.explorationSegments) || []) {
    if (s && s.declaredBy !== 'plan') ignoredExploration.push(s);
  }

  const measurable = Array.isArray(routine && routine.goalToolSet) && routine.goalToolSet.length > 0;
  const evalKs = evaluationHops(hops.length > 0 ? Math.max(...hops.map((h) => h.idx)) : 0);
  // NOTE: evaluationHops uses the trajectory's last hop NUMBER, not its hop
  // count, so sparse numbering still evaluates at 8/13/18 by hop number.
  // For dense 1..N trajectories the two coincide.

  // Classify every hop once (hop-level truth, no window double-counting).
  const classified = hops.map(({ hop, idx }) => ({ idx, hop, ...classifyHop(hop, routine, idx) }));

  const windows = [];
  const macroSpans = [];
  const recoveryEvents = [];
  let macroActive = null; // { subType, trigger, firedAtK, firedAtWindowId }
  let run = 0; // consecutive off-goal run: +1 per off-goal, reset on on-goal, unchanged otherwise
  let hopCursor = 0; // index into classified, in hop order
  let prevK = 0;

  for (const k of evalKs) {
    // Advance the run through every hop up to k, detecting recovery of an
    // active macro at the first subsequent ON-GOAL hop.
    let recoveredHere = null;
    while (hopCursor < classified.length && classified[hopCursor].idx <= k) {
      const c = classified[hopCursor];
      if (c.class === 'on-goal') {
        run = 0;
        if (macroActive) {
          recoveredHere = {
            recoveredAtHop: c.idx,
            hopsSinceMacro: c.idx - macroActive.firedAtK,
            subType: macroActive.subType,
            trigger: macroActive.trigger,
            firedAtK: macroActive.firedAtK,
          };
          recoveryEvents.push(recoveredHere);
          macroSpans.push({ ...macroActive, recoveredAtHop: c.idx, hopsSinceMacro: recoveredHere.hopsSinceMacro });
          macroActive = null;
        }
      } else if (c.class === 'off-goal') {
        run += 1;
      }
      // neutral / unknown / excluded do NOT break the run.
      hopCursor += 1;
    }
    const inWindow = classified.filter((c) => c.idx >= k - WINDOW_WIDTH + 1 && c.idx <= k);
    const offCount = inWindow.filter((c) => c.class === 'off-goal').length;
    const onCount = inWindow.filter((c) => c.class === 'on-goal').length;
    const neutralCount = inWindow.filter((c) => c.class === 'neutral').length;
    const unknownCount = inWindow.filter((c) => c.class === 'unknown').length;
    const denominator = onCount + offCount;
    const S = denominator === 0 ? null : offCount / denominator;
    const goalMet = firedAt !== undefined && firedAt !== null && firedAt <= k;
    const personDirected = inWindow.some((c) => c.personDirected);
    const planDeclared = inWindow.some((c) => c.planDeclared);

    // Goal met while a macro span is open: completion resolves the span
    // (distinct from hop recovery — predicate firing is not a hop).
    // The span is closed here, not left unrecovered, and never re-fires.
    if (goalMet && macroActive) {
      macroSpans.push({ ...macroActive, recoveredAtHop: null, hopsSinceMacro: null, resolvedByGoalMet: true });
      macroActive = null;
    }

    // Goal met: only termination applies, never drift (micro AND macro
    // suppressed). Unmeasurable: no labels, judge-grade.
    let micro = false;
    let microApplied = 'none';
    let macroStatus = 'none';
    let macroSubType = null;
    let macroTrigger = null;
    let hopsSinceMacro = null;
    if (measurable && !goalMet) {
      micro = microFires(denominator, S, offCount);
      microApplied = microThresholdApplied(denominator, micro);
      if (macroActive) {
        macroStatus = 'active';
        macroSubType = macroActive.subType;
        macroTrigger = macroActive.trigger;
      } else {
        const trig = macroTriggerFor({ denominator, S, neutralCount }, run);
        if (trig) {
          macroStatus = 'fresh';
          macroSubType = trig.subType;
          macroTrigger = trig.trigger;
          macroActive = { subType: trig.subType, trigger: trig.trigger, firedAtK: k, firedAtWindowId: `W${k}` };
        }
      }
    }
    if (recoveredHere && !goalMet && measurable) {
      // Recovery lands on the first window at/after the recovery hop.
      macroStatus = 'recovered';
      macroSubType = recoveredHere.subType;
      macroTrigger = recoveredHere.trigger;
      hopsSinceMacro = recoveredHere.hopsSinceMacro;
    } else if (recoveredHere) {
      // Recovery still happened even if this window is goal-met or
      // unmeasurable — the event is recorded, the window just does not
      // carry it as a drift label.
      hopsSinceMacro = null;
    }
    // A window in which recovery occurred AND a fresh macro also fires is
    // impossible by construction: recovery clears the span before the
    // window is scored, and a fresh macro needs its own trigger.

    const event = {
      trajectoryId: trajectory.id,
      windowId: `W${k}`,
      hopFrom: Math.max(classified.length ? classified[0].idx : 1, k - WINDOW_WIDTH + 1),
      hopTo: k,
      evaluationHop: k,
      S,
      offCount,
      onCount,
      neutralCount,
      unknownCount,
      denominator,
      consecutiveOffGoalRun: run,
      goalMet,
      personDirected,
      planDeclared,
      microFired: micro,
      microThresholdApplied: microApplied,
      macroStatus,
      macroSubType,
      macroTrigger,
      hopsSinceMacro,
      labelGrade: measurable ? LABEL_GRADE : 'judge-grade',
      measurable,
    };
    windows.push(event);
    prevK = k;
  }

  // Any hops after the last evaluation hop still count for the hop-level
  // summary and for macro recovery bookkeeping (a macro recovering after
  // the last window is recovered, not unrecovered).
  let tailRecovery = null;
  while (hopCursor < classified.length) {
    const c = classified[hopCursor];
    if (c.class === 'on-goal') {
      run = 0;
      if (macroActive) {
        tailRecovery = {
          recoveredAtHop: c.idx,
          hopsSinceMacro: c.idx - macroActive.firedAtK,
          subType: macroActive.subType,
          trigger: macroActive.trigger,
          firedAtK: macroActive.firedAtK,
        };
        recoveryEvents.push(tailRecovery);
        macroSpans.push({ ...macroActive, recoveredAtHop: c.idx, hopsSinceMacro: tailRecovery.hopsSinceMacro });
        macroActive = null;
      }
    } else if (c.class === 'off-goal') {
      run += 1;
    }
    hopCursor += 1;
  }
  if (macroActive) {
    macroSpans.push({ ...macroActive, recoveredAtHop: null, hopsSinceMacro: null, unrecovered: true });
  }

  // Hop-level summary over UNIQUE hops (never summed across windows).
  const nonFinal = classified.filter((c) => c.class !== 'excluded');
  const hOn = nonFinal.filter((c) => c.class === 'on-goal').length;
  const hOff = nonFinal.filter((c) => c.class === 'off-goal').length;
  const hNeutral = nonFinal.filter((c) => c.class === 'neutral').length;
  const hUnknown = nonFinal.filter((c) => c.class === 'unknown').length;
  const hClassified = hOn + hOff + hNeutral + hUnknown;
  const microWindows = windows.filter((w) => w.microFired).length;
  const freshMacroWindows = windows.filter((w) => w.macroStatus === 'fresh').length;
  const macroActiveWindows = windows.filter((w) => w.macroStatus === 'active').length;
  // Window-label rate counts each labeled window ONCE, even when it
  // carries both a micro label and a fresh macro label (categories are
  // a set; summing per-label counts would double-count such windows
  // and could exceed 1).
  const labeledWindows = windows.filter(
    (w) => w.microFired || w.macroStatus !== 'none',
  ).length;
  const summary = {
    windowCount: windows.length,
    measurableWindowCount: windows.filter((w) => w.measurable).length,
    microFiredWindows: microWindows,
    freshMacroWindows,
    macroActiveWindows,
    macroFinal: macroActive ? 'active-unrecovered'
      : (recoveryEvents.length > 0 ? 'recovered'
        : (macroSpans.some((s) => s.resolvedByGoalMet) ? 'resolved-by-goal-met' : 'none')),
    // Window-label rate (NOT a hop rate — see overlap warning).
    windowLabelRate: windows.length === 0 ? null : labeledWindows / windows.length,
    // Hop-level shares over unique hops.
    hopOffGoalShare_S: (hOn + hOff) === 0 ? null : hOff / (hOn + hOff),
    hopOffGoalShare_classified: hClassified === 0 ? null : hOff / hClassified,
    unknownShare: hClassified === 0 ? null : hUnknown / hClassified,
    neutralShare: hClassified === 0 ? null : hNeutral / hClassified,
    hopCounts: { on: hOn, off: hOff, neutral: hNeutral, unknown: hUnknown, classified: hClassified },
  };

  return {
    trajectoryId: trajectory.id,
    windows,
    macroSpans,
    recoveryEvents,
    ignoredRevisions,
    ignoredExploration,
    summary,
  };
}

// ---------------------------------------------------------------------------
// Label-event validation / grading
// ---------------------------------------------------------------------------

function missingLabelFields(event) {
  if (!event || typeof event !== 'object') return [...LABEL_FIELDS];
  return LABEL_FIELDS.filter((f) => !(f in event));
}

function validateLabelEvent(event) {
  const missing = missingLabelFields(event);
  return { valid: missing.length === 0, missing };
}

function gradeLabelEvent(event) {
  const { valid } = validateLabelEvent(event);
  if (!valid) return 'judge-grade';
  if (event.measurable === false) return 'judge-grade';
  return LABEL_GRADE;
}

// ---------------------------------------------------------------------------
// Falsifier + routine / pass reporting
// ---------------------------------------------------------------------------

function goalSetDeclared(routine) {
  return !!routine && Array.isArray(routine.goalToolSet) && routine.goalToolSet.length > 0;
}

/** Drift-measurable share = routines with a declared goal set / all routines. */
function driftMeasurableShare(routines) {
  if (!Array.isArray(routines) || routines.length === 0) return null;
  const declared = routines.filter(goalSetDeclared).length;
  return declared / routines.length;
}

/** Unknown share over window counts: unknown / (on + off + neutral + unknown). */
function windowUnknownShare(counts) {
  const total = counts.offCount + counts.onCount + counts.neutralCount + counts.unknownCount;
  if (total === 0) return null;
  return counts.unknownCount / total;
}

function neutralShare(counts) {
  const total = counts.offCount + counts.onCount + counts.neutralCount + counts.unknownCount;
  if (total === 0) return null;
  return counts.neutralCount / total;
}

function sumCounts(windows) {
  return windows.reduce((acc, w) => ({
    offCount: acc.offCount + w.offCount,
    onCount: acc.onCount + w.onCount,
    neutralCount: acc.neutralCount + w.neutralCount,
    unknownCount: acc.unknownCount + w.unknownCount,
  }), { offCount: 0, onCount: 0, neutralCount: 0, unknownCount: 0 });
}

/**
 * Per-routine drift report. result = evaluateTrajectory output for that
 * routine (or null when the routine was never labeled).
 */
function reportRoutineDrift(routine, result) {
  const declared = goalSetDeclared(routine);
  if (!declared || !result) {
    return {
      routineId: routine && routine.id,
      goalToolSetDeclared: declared,
      driftMeasurable: false,
      windowLabelRate: null,
      hopOffGoalShare_S: null,
      unknownShare: null,
      neutralShare: null,
      verdict: 'unmeasured, not zero',
      reason: declared ? 'routine never labeled' : 'no goal tool set declared',
    };
  }
  const counts = sumCounts(result.windows);
  const uShare = windowUnknownShare(counts);
  const nShare = neutralShare(counts);
  let verdict = 'rule-grade';
  let reason = 'declared goal set; unknown and neutral shares within bounds';
  if (uShare !== null && uShare > 0.5) {
    verdict = 'unmeasured, not zero';
    reason = 'window unknown share > 50%';
  } else if (nShare !== null && nShare > 0.5) {
    verdict = 'declaration-problem';
    reason = 'neutral share > 50%: goal set too narrow or drift hiding in reads';
  }
  return {
    routineId: routine && routine.id,
    goalToolSetDeclared: true,
    driftMeasurable: true,
    windowLabelRate: result.summary.windowLabelRate,
    hopOffGoalShare_S: result.summary.hopOffGoalShare_S,
    unknownShare: uShare,
    neutralShare: nShare,
    verdict,
    reason,
  };
}

/** Pass-level report across routines. entries: [{ routine, result }]. */
function reportPass(entries) {
  if (!Array.isArray(entries) || entries.length === 0) {
    return { driftMeasurableShare: null, verdict: 'unmeasured, not zero', reason: 'no routines in pass' };
  }
  const share = driftMeasurableShare(entries.map((e) => e.routine));
  const allWindows = entries.flatMap((e) => (e.result ? e.result.windows : []));
  const counts = sumCounts(allWindows);
  const uShare = windowUnknownShare(counts);
  let verdict = 'rule-grade';
  let reason = 'measurable share and unknown share within falsifier bounds';
  if (share !== null && share < 0.5) {
    verdict = 'unmeasured, not zero';
    reason = 'drift-measurable share < 50%: prioritize goal-set declarations over drift wiring';
  } else if (uShare !== null && uShare > 0.5) {
    verdict = 'unmeasured, not zero';
    reason = 'window unknown share > 50%: prioritize goal-set declarations over drift wiring';
  }
  return {
    driftMeasurableShare: share,
    windowUnknownShare: uShare,
    routineReports: entries.map((e) => reportRoutineDrift(e.routine, e.result)),
    verdict,
    reason,
  };
}

/** Honest repo comparison at build time (round 17): the north-star
 *  modules carry no routine registry at all, so no routine anywhere in
 *  the repo declares a goal tool set. Drift is therefore unmeasured on
 *  the repo as it stands — never zero. Goal-set declarations must come
 *  before any drift wiring, exactly as rounds 15–16 concluded for read
 *  sets and predicates. */
function repoComparison() {
  return {
    routineRegistry: false,
    routineCount: 0,
    declaredGoalSets: 0,
    driftMeasurableShare: 0,
    windowUnknownShare: null,
    neutralShare: null,
    verdict: 'unmeasured, not zero',
    reason: 'no routine registry in repo; 0 routines declare a goal tool set; ' +
      'no labeled windows exist, so unknown/neutral shares are undefined (not 0); ' +
      'goal-set declarations must come before drift wiring',
  };
}

// ---------------------------------------------------------------------------
// Calibration protocol (specified, NOT run — no gold data exists)
// ---------------------------------------------------------------------------

const CALIBRATION_PROTOCOL = Object.freeze({
  tag: TEST_TAG,
  microSweep: CALIBRATION_MICRO_S_SWEEP,
  macroRunSweep: CALIBRATION_MACRO_RUN_SWEEP,
  minGoldWindows: CALIBRATION_MIN_GOLD_WINDOWS,
  positiveGold: 'window followed within 2 hops by a person redirect ("get back to X")',
  negativeGold: 'trajectory the person accepts (Batch 218 acceptance channel) despite off-goal hops',
  adoptionRule: 'adopt a threshold only if accepted-trajectory micro rate is in single digits (< 10%) ' +
    'while detecting a majority (> 50%) of redirect-preceding windows',
  note: 'Until the sweep runs, every drift number carries "TEST thresholds, uncalibrated".',
});

/**
 * Score one calibration candidate against gold-labeled windows.
 * goldWindow: { S, denominator, offCount, run, goalMet,
 *   followedByRedirectWithin2, trajectoryAccepted }.
 * Micro uses the candidate S threshold (partial off>=2 rule fixed);
 * macro uses the candidate run threshold (full-window S=1 rule fixed,
 * stall rule fixed). Goal-met windows never fire either label.
 */
function scoreCalibrationCandidate(goldWindows, candidate) {
  if (!Array.isArray(goldWindows)) throw new Error('drift-metric: goldWindows must be an array');
  const microS = candidate && candidate.microS;
  const macroRun = candidate && candidate.macroRun;
  if (typeof microS !== 'number' || typeof macroRun !== 'number') {
    throw new Error('drift-metric: candidate needs numeric microS and macroRun');
  }
  let redirectWindows = 0;
  let redirectMicroDetected = 0;
  let redirectMacroDetected = 0;
  let acceptedWindows = 0;
  let acceptedMicroFlagged = 0;
  for (const w of goldWindows) {
    const micro = !w.goalMet && (
      (w.denominator >= MACRO_FULL_DENOMINATOR && w.S !== null && w.S >= microS) ||
      (w.denominator >= 1 && w.denominator <= 3 && w.offCount >= MICRO_PARTIAL_OFF)
    );
    const macro = !w.goalMet && (
      (w.denominator >= MACRO_FULL_DENOMINATOR && w.S === 1) ||
      (typeof w.run === 'number' && w.run >= macroRun) ||
      (w.denominator === 0 && w.neutralCount >= 1)
    );
    if (w.followedByRedirectWithin2) {
      redirectWindows += 1;
      if (micro) redirectMicroDetected += 1;
      if (macro) redirectMacroDetected += 1;
    }
    if (w.trajectoryAccepted) {
      acceptedWindows += 1;
      if (micro) acceptedMicroFlagged += 1;
    }
  }
  return {
    goldWindows: goldWindows.length,
    redirectWindows,
    redirectDetectionMicro: redirectWindows === 0 ? null : redirectMicroDetected / redirectWindows,
    redirectDetectionMacro: redirectWindows === 0 ? null : redirectMacroDetected / redirectWindows,
    acceptedWindows,
    acceptedMicroRate: acceptedWindows === 0 ? null : acceptedMicroFlagged / acceptedWindows,
  };
}

/** Adoption gate: refuses below 100 gold windows, or when the adoption
 *  rule (single-digit accepted micro rate + majority redirect detection)
 *  is not met. Never adopts from fewer than 100 gold-labeled windows. */
function tryAdoptThreshold(goldWindows, candidate) {
  if (!Array.isArray(goldWindows) || goldWindows.length < CALIBRATION_MIN_GOLD_WINDOWS) {
    return {
      adopted: false,
      reason: `fewer than ${CALIBRATION_MIN_GOLD_WINDOWS} gold-labeled windows ` +
        `(${(goldWindows || []).length}); thresholds stay ${TEST_TAG}`,
    };
  }
  const score = scoreCalibrationCandidate(goldWindows, candidate);
  const majority = (score.redirectDetectionMicro !== null && score.redirectDetectionMicro > 0.5)
    || (score.redirectDetectionMacro !== null && score.redirectDetectionMacro > 0.5);
  const singleDigit = score.acceptedMicroRate !== null && score.acceptedMicroRate < 0.1;
  if (!majority || !singleDigit) {
    return {
      adopted: false,
      score,
      reason: 'adoption rule not met: needs single-digit accepted micro rate + majority redirect detection',
    };
  }
  return { adopted: true, candidate, score, reason: 'adoption rule met on >= 100 gold windows' };
}

// ---------------------------------------------------------------------------
// Interactions with the other flags
// ---------------------------------------------------------------------------

/** Categories are a set: co-labeling is allowed, rates never sum to
 *  100%. Returns the deduplicated set of labels present. */
function combineCategoryLabels(labels) {
  if (!Array.isArray(labels)) throw new Error('drift-metric: labels must be an array');
  return [...new Set(labels.filter((l) => typeof l === 'string' && l !== ''))];
}

function refuseCombinedBadnessScore() {
  throw new Error(
    'drift-metric: no combined "badness" score — per-category rates never sum to 100% ' +
    'and repetition + drift must not be added together',
  );
}

/** Termination flag and macro label are MUTUALLY EXCLUSIVE by the
 *  goal-met condition: after firing, only termination; before, only drift. */
function appliesAfterGoalMet(goalMet) {
  return goalMet ? 'termination' : 'drift';
}

module.exports = {
  WINDOW_WIDTH,
  STRIDE,
  FIRST_EVALUATION_HOP,
  MICRO_S_THRESHOLD,
  MICRO_PARTIAL_OFF,
  MACRO_FULL_DENOMINATOR,
  MACRO_RUN_THRESHOLD,
  LABEL_GRADE,
  TEST_TAG,
  CALIBRATION_MIN_GOLD_WINDOWS,
  CALIBRATION_MICRO_S_SWEEP,
  CALIBRATION_MACRO_RUN_SWEEP,
  DRIFT_SPEC_VERSION,
  LABEL_FIELDS,
  CALIBRATION_PROTOCOL,
  assertLedgerOnly,
  refuseLiveIntervention,
  hopIndex,
  normalizeHopClass,
  classifyHop,
  evaluationHops,
  microFires,
  microThresholdApplied,
  macroTriggerFor,
  evaluateTrajectory,
  missingLabelFields,
  validateLabelEvent,
  gradeLabelEvent,
  goalSetDeclared,
  driftMeasurableShare,
  windowUnknownShare,
  neutralShare,
  sumCounts,
  reportRoutineDrift,
  reportPass,
  repoComparison,
  scoreCalibrationCandidate,
  tryAdoptThreshold,
  combineCategoryLabels,
  refuseCombinedBadnessScore,
  appliesAfterGoalMet,
};
