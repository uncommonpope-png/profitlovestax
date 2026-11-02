'use strict';
/**
 * plan-executor.cjs — level-wise plan executor rules.
 *
 * Design-form spec ported to code from north-star research batches
 * 169, 171, 173, 175, 177 (see README.md for the mapping).
 * Zero dependencies, CommonJS, runs with plain `node`.
 *
 * What this module does NOT do (honest limits, see README):
 * - No model/tool integration: task functions are caller-supplied.
 * - No live latency measurement: timestamps recorded here are from
 *   the caller-supplied task functions' execution, not from real
 *   tool telemetry. No live timing data has been collected.
 * - Neither GAP (Batch 169) nor ModeX (Batch 169) classifies
 *   uncertainty sources. This module does not claim otherwise.
 */

// ---------------------------------------------------------------- utils

/** Nearest-rank percentile. values: number[]. Returns null for empty input. */
function percentile(values, p) {
  if (!Array.isArray(values) || values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const rank = Math.ceil((p / 100) * sorted.length);
  return sorted[Math.max(0, Math.min(sorted.length - 1, rank - 1))];
}

function median(values) {
  if (!values.length) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

/**
 * Compute DAG execution levels (Batch 169, GAP).
 * levels = longest-path depth: level 0 = no incoming edges;
 * level i = dependencies all in earlier levels (depth = 1 + max dep depth).
 * Tasks in the same level may run in parallel.
 *
 * tasks: [{ id, dependsOn?: string[] }]
 * Returns { levels: string[][], levelOf: { [id]: number } }.
 * Throws on duplicate ids, unknown dependencies, or cycles.
 */
function computeLevels(tasks) {
  if (!Array.isArray(tasks)) throw new Error('computeLevels: tasks must be an array');
  const byId = new Map();
  for (const t of tasks) {
    if (!t || typeof t.id !== 'string') throw new Error('computeLevels: every task needs a string id');
    if (byId.has(t.id)) throw new Error(`computeLevels: duplicate task id "${t.id}"`);
    byId.set(t.id, t);
  }
  const levelOf = new Map();
  const visiting = new Set();
  function depth(id) {
    if (levelOf.has(id)) return levelOf.get(id);
    if (visiting.has(id)) throw new Error(`computeLevels: cycle involving "${id}"`);
    const task = byId.get(id);
    if (!task) throw new Error(`computeLevels: unknown dependency "${id}"`);
    visiting.add(id);
    const deps = task.dependsOn || task.depends || [];
    let d = 0;
    for (const dep of deps) {
      if (!byId.has(dep)) throw new Error(`computeLevels: task "${id}" depends on unknown task "${dep}"`);
      d = Math.max(d, depth(dep) + 1);
    }
    visiting.delete(id);
    levelOf.set(id, d);
    return d;
  }
  for (const id of byId.keys()) depth(id);
  const levels = [];
  for (const [id, d] of levelOf) {
    if (!levels[d]) levels[d] = [];
    levels[d].push(id);
  }
  // Preserve caller task order within each level for determinism.
  const order = new Map(tasks.map((t, i) => [t.id, i]));
  for (const level of levels) level.sort((a, b) => order.get(a) - order.get(b));
  return { levels, levelOf: Object.fromEntries(levelOf) };
}

// ------------------------------------------------- modal selection (169)

/**
 * Mode-collapse guardrail (Batch 169, ModeX §7, verbatim in substance):
 * modal selection NEVER replaces the verifier + provenance checks for
 * committing hops — it selects WHICH equivalent call to execute, and
 * the verify-before-commit rule still governs WHETHER to commit.
 * A gate that executes the modal call unverified because it is modal
 * has mistaken consensus for correctness.
 */
const MODAL_SELECTION_GUARDRAIL =
  'Mode-collapse warning: modal selection NEVER replaces verifier + provenance ' +
  'checks for committing hops. It selects WHICH equivalent call to execute, not ' +
  'WHETHER to commit. A gate that executes the modal call unverified because it ' +
  'is modal has mistaken consensus for correctness. Neither GAP nor ModeX ' +
  'classifies uncertainty sources.';

/**
 * Minimal ModeX-with-normalized-AST modal selection for the disputed-hop tier.
 * candidates: [{ id, ... }] descriptors of equivalent-candidate tool calls.
 * keyFn(candidate): normalized-AST key (caller-supplied normalization:
 * same tool + normalized args => same key; different tools or
 * non-equivalent args => different keys). Default key is a JSON
 * rendering of tool + args (no normalization — callers that need
 * case/date/number normalization MUST supply keyFn).
 *
 * With 0/1 normalized-AST adjacency, the modal cluster is the largest
 * equivalence class (tie -> first encountered with the largest class),
 * and the centroid (max weighted degree) is the first member of that
 * class, since every member of an exact-equivalence class has equal
 * degree. This is the exact-adjacency reduction of ModeX, NOT a full
 * spectral (Fiedler-vector / conductance-tau) implementation — see README.
 * Returns { selected, clusterIds, clusterSize, totalCandidates, warning }.
 */
function modalSelect(candidates, keyFn) {
  if (!Array.isArray(candidates) || candidates.length === 0) {
    return { selected: null, clusterIds: [], clusterSize: 0, totalCandidates: 0, warning: MODAL_SELECTION_GUARDRAIL };
  }
  const key = typeof keyFn === 'function'
    ? keyFn
    : (c) => JSON.stringify({ tool: c.tool, args: c.args });
  const clusters = new Map(); // key -> [candidates]
  for (const c of candidates) {
    const k = key(c);
    if (!clusters.has(k)) clusters.set(k, []);
    clusters.get(k).push(c);
  }
  let best = null;
  for (const group of clusters.values()) {
    if (!best || group.length > best.length) best = group;
  }
  return {
    selected: best[0],
    clusterIds: best.map((c) => c.id),
    clusterSize: best.length,
    totalCandidates: candidates.length,
    warning: MODAL_SELECTION_GUARDRAIL,
  };
}

// ------------------------------------------- per-tool latency / hedging

/**
 * Per-tool latency tracker: frozen baseline, hedge gates, stuck-call
 * rescue, breaker, and drift-gated recalibration.
 * Batches 173 (hedged reads, never-hedge-commits, 10% breaker),
 * 175 (100/400 tiers, frozen baseline, multi-path only),
 * 177 (abort-and-restart rescue, recalibration).
 */
class ToolLatencyTracker {
  constructor(tool) {
    this.tool = tool;
    this.observations = []; // every latency sample, in order
    this.frozenObservations = null;
    this.frozenP95 = null;
    this.frozenP99 = null;
    this.frozenVersion = 0;
    // Breaker window: calls observed since the current freeze.
    this.breakerWindowCalls = 0;
    this.breakerWindowExceedances = 0;
    this.breakerTripped = false;
    // Rescue window: same call stream, separate rescue counter.
    this.rescueCount = 0;
    this.rescueWindowCalls = 0;
    this.stuckMultiplier = 2; // 2x frozen p95; trips to 3x (Batch 177)
    this.hedgesIssued = 0;
    this.degradingLog = []; // retained across re-freezes
    this.consecutiveDriftWindows = 0;
  }

  get n() { return this.observations.length; }
  get frozenN() { return this.frozenObservations ? this.frozenObservations.length : 0; }
  /** Hedging eligibility tier (Batch 175): enabled at >= 100. */
  get hedgingEnabled() { return this.n >= 100; }
  /** Provisional tier: 100 <= n < 400. */
  get provisional() { return this.n >= 100 && this.n < 400; }
  /** Stable tier: n >= 400 (sample p95 rests on ~20 tail points). */
  get stable() { return this.n >= 400; }
  get hedgeRateVsFrozen() {
    return this.breakerWindowCalls > 0
      ? this.breakerWindowExceedances / this.breakerWindowCalls : 0;
  }
  get rescueRate() {
    return this.rescueWindowCalls > 0 ? this.rescueCount / this.rescueWindowCalls : 0;
  }
  /** Live breaker state: >10% over >=100 calls vs the FROZEN baseline. */
  get breakerActive() {
    return this.breakerWindowCalls >= 100 && this.hedgeRateVsFrozen > 0.10;
  }

  /** Record one latency sample (ms). Auto-freezes the first baseline at 100. */
  observe(ms) {
    if (typeof ms !== 'number' || !Number.isFinite(ms) || ms < 0) {
      throw new Error('observe: latency must be a finite non-negative number');
    }
    this.observations.push(ms);
    if (this.frozenP95 === null) {
      if (this.n >= 100) this.freezeBaseline();
    } else {
      this.breakerWindowCalls += 1;
      this.rescueWindowCalls += 1;
      if (ms > this.frozenP95) this.breakerWindowExceedances += 1;
      const was = this.breakerTripped;
      this.breakerTripped = this.breakerActive;
      if (this.breakerTripped && !was) {
        this.degradingLog.push({ kind: 'breaker-tripped', tool: this.tool, at: new Date().toISOString() });
      }
    }
    return this;
  }

  /**
   * Freeze the current observations as the baseline (sleep-job /
   * calibration event). Resets the breaker and rescue windows; the
   * degrading log is retained. T_stuck recomputes from the new baseline.
   */
  freezeBaseline() {
    this.frozenObservations = [...this.observations];
    this.frozenP95 = percentile(this.frozenObservations, 95);
    this.frozenP99 = percentile(this.frozenObservations, 99);
    this.frozenVersion += 1;
    this.breakerWindowCalls = 0;
    this.breakerWindowExceedances = 0;
    this.breakerTripped = false;
    this.rescueCount = 0;
    this.rescueWindowCalls = 0;
    this.stuckMultiplier = 2;
    this.consecutiveDriftWindows = 0;
    return { version: this.frozenVersion, frozenP95: this.frozenP95, frozenP99: this.frozenP99, frozenN: this.frozenN };
  }

  /**
   * Hedge decision (Batches 173 + 175). Three gates: eligibility
   * (multi-path read + n >= 100), trigger (frozen p95), breaker
   * (10% vs frozen baseline over >=100 calls). Never hedge commits
   * or writes. A tripped breaker disables only the duplicate hedge;
   * first attempts are unaffected (this decision says nothing about
   * whether the tool's first attempt runs).
   * opts: { kind: 'read'|'commit'|'write', paths: number, readOnly?: boolean }
   */
  shouldHedge(opts = {}) {
    const { kind, paths, readOnly } = opts;
    if (kind === 'commit' || kind === 'write') {
      return { hedge: false, reason: 'never-hedge-commits: committing hops are never hedged' };
    }
    if (kind !== 'read') {
      return { hedge: false, reason: 'hedging applies to reads only' };
    }
    if (readOnly === false) {
      return { hedge: false, reason: 'not read-only: hedging applies to idempotent reads only' };
    }
    if (typeof paths !== 'number' || paths < 2) {
      return { hedge: false, reason: 'single-path read: use the singleton stuck-call rule, not hedging (no independent second path)' };
    }
    if (!this.hedgingEnabled) {
      return { hedge: false, reason: `below 100-observation floor (${this.n} observations); p95 unknown, hedging disabled` };
    }
    if (this.breakerActive) {
      return { hedge: false, reason: 'breaker tripped: hedge rate vs frozen baseline exceeds 10% over >=100 calls; tool logged degrading' };
    }
    return { hedge: true, provisional: this.provisional, stable: this.stable, triggerMs: this.frozenP95, reason: 'multi-path read, frozen-baseline trigger' };
  }

  recordHedgeIssued() { this.hedgesIssued += 1; return this.hedgesIssued; }

  /**
   * Singleton stuck-call threshold (Batch 177):
   * T_stuck = max(multiplier x frozen p95, frozen p99) when the frozen
   * set has n >= 1000 (p99 rests on >=10 tail points); otherwise
   * multiplier x frozen p95. Multiplier is 2, tripped to 3 on rescue
   * rate > 2%. Null when no frozen baseline exists.
   */
  stuckThresholdMs() {
    if (this.frozenP95 === null) return null;
    const base = this.stuckMultiplier * this.frozenP95;
    if (this.frozenN >= 1000 && this.frozenP99 !== null) return Math.max(base, this.frozenP99);
    return base;
  }

  /**
   * Singleton stuck-call rescue evaluation (Batch 177). Rescue is
   * ABORT-AND-RESTART only — never a parallel duplicate. A parallel
   * duplicate on one resource is the retry-storm shape, not a hedge.
   * All gates required, in order; any failed gate = no rescue.
   * opts: { readOnly, idempotent, progressMade, abortAvailable,
   *         abortProven, attemptsUsed?, remainingBudgetMs? }
   * remainingBudgetMs omitted = treated as unbounded (documented).
   */
  evaluateStuckRescue(opts = {}) {
    const thresholdMs = this.stuckThresholdMs();
    if (thresholdMs === null) {
      return { rescue: false, mode: null, reason: 'no frozen baseline: stuck threshold cannot be computed' };
    }
    if (!(opts.readOnly && opts.idempotent)) {
      return { rescue: false, mode: null, reason: 'gate 1 failed: rescue requires a read-only, idempotent call (never-hedge-commits guard)' };
    }
    if (opts.progressMade) {
      return { rescue: false, mode: null, reason: 'gate 2 failed: progress already made — the call is slow, not stuck; never re-issue a call with partial output flowing' };
    }
    if (!(opts.abortAvailable && opts.abortProven)) {
      return { rescue: false, mode: null, reason: 'gate 3 failed: no true, proven abort for the first attempt — wait for the level timeout; an unproven abort counts as unavailable' };
    }
    if ((opts.attemptsUsed || 0) >= 1) {
      return { rescue: false, mode: null, reason: 'gate 4 failed: single re-issue only — max 2 attempts per logical call; a second rescue is a retry loop wearing a rescue label' };
    }
    const budget = opts.remainingBudgetMs === undefined ? Infinity : opts.remainingBudgetMs;
    if (budget < 2 * this.frozenP95) {
      return { rescue: false, mode: null, reason: 'gate 5 failed: budget fit — remaining level budget is below 2x frozen p95, a fresh attempt cannot fit' };
    }
    return { rescue: true, mode: 'abort-and-restart', thresholdMs, reason: 'all rescue gates pass; abort the first attempt, then restart once — never in parallel' };
  }

  /**
   * Record a rescue attempt. If the rescue rate exceeds 2% over
   * >=100 calls, trip the stuck threshold to 3x frozen p95 and log
   * the tool as degrading (Batch 177, gate 6).
   */
  recordRescue() {
    this.rescueCount += 1;
    let tripped = false;
    if (this.rescueWindowCalls >= 100 && this.rescueRate > 0.02 && this.stuckMultiplier !== 3) {
      this.stuckMultiplier = 3;
      tripped = true;
      this.degradingLog.push({ kind: 'rescue-rate-trip', tool: this.tool, rescueRate: this.rescueRate, at: new Date().toISOString() });
    }
    return { rescueRate: this.rescueRate, stuckMultiplier: this.stuckMultiplier, tripped };
  }

  /**
   * Weekly sleep-job recalibration check (Batch 177). newLatencies is
   * the new window's observations (the caller observes calls via
   * observe() as they happen; this check takes the window array for
   * its p95 computation and does not double-count it).
   * Re-freeze ONLY when: >=100 new calls AND (20% drift holding 2
   * consecutive windows OR a caller-supplied CUSUM alarm). The CUSUM
   * statistic itself is not computed here — the sleep job supplies
   * cusumAlarm (see README limits). Downward re-freeze is automatic
   * on a passed test; upward re-freeze is refused while the breaker
   * is tripped. A re-freeze resets the breaker window (the old trip
   * does not carry over) but the degrading log entry is retained.
   */
  weeklyRecalibrationCheck(newLatencies, opts = {}) {
    const { cusumAlarm = false } = opts;
    if (this.frozenP95 === null) {
      return { refrozen: false, reason: 'no frozen baseline to recalibrate from' };
    }
    if (!Array.isArray(newLatencies) || newLatencies.length < 100) {
      return { refrozen: false, reason: `fewer than 100 new calls (${Array.isArray(newLatencies) ? newLatencies.length : 0}); baseline stands` };
    }
    const newP95 = percentile(newLatencies, 95);
    const drift = Math.abs(newP95 - this.frozenP95) / this.frozenP95;
    if (drift <= 0.20) {
      this.consecutiveDriftWindows = 0;
      return { refrozen: false, reason: `drift ${(drift * 100).toFixed(1)}% within the 20% magnitude threshold; baseline stands` };
    }
    let persistence = false;
    if (cusumAlarm) {
      persistence = true;
    } else {
      this.consecutiveDriftWindows += 1;
      if (this.consecutiveDriftWindows < 2) {
        return { refrozen: false, reason: `drift ${(drift * 100).toFixed(1)}% holding ${this.consecutiveDriftWindows} of 2 consecutive windows; baseline stands` };
      }
      persistence = true;
    }
    if (!persistence) return { refrozen: false, reason: 'drift magnitude met but persistence not proven' };
    const direction = newP95 < this.frozenP95 ? 'downward' : 'upward';
    if (direction === 'upward' && this.breakerActive) {
      return { refrozen: false, reason: 'upward re-freeze refused while the breaker is tripped (hedge rate vs frozen baseline >10% over >=100 calls); upward re-freeze is a recorded sleep-job decision, never automatic during a trip' };
    }
    const oldP95 = this.frozenP95;
    this.frozenObservations = [...newLatencies];
    this.frozenP95 = newP95;
    this.frozenP99 = percentile(newLatencies, 99);
    this.frozenVersion += 1;
    this.breakerWindowCalls = 0;
    this.breakerWindowExceedances = 0;
    this.breakerTripped = false;
    this.rescueCount = 0;
    this.rescueWindowCalls = 0;
    this.stuckMultiplier = 2;
    this.consecutiveDriftWindows = 0;
    return { refrozen: true, direction, oldP95, newP95, version: this.frozenVersion, reason: `${direction} drift passed magnitude + persistence; baseline re-frozen` };
  }
}

// ------------------------------------------- replan-boundary audit (173)

/**
 * Batch 173 win statistic: early-exit wins only if the slowest-sibling
 * wait exceeds (planner-call duration + re-issue cost of discarded
 * siblings) on eligible levels. Otherwise waiting wins and Rule 2 stands.
 * Per-level form; the median form applies the same comparison to
 * median W across eligible levels (see PlanExecutor.audit).
 */
function earlyExitWins(waitMs, plannerCallMs, reissueCostMs) {
  return waitMs > (plannerCallMs + reissueCostMs);
}

// ---------------------------------------------------------- plan executor

/**
 * Level-wise plan executor (Batches 169, 171, 173).
 *
 * Task shape:
 *   { id: string,
 *     dependsOn?: string[],
 *     kind?: 'read' | 'commit' | 'write',   // default 'read'
 *     readOnly?: boolean,                    // default true for reads
 *     run: async (ctx) => value }
 *   ctx = { taskId, levelIndex, prefix } where prefix is the list of
 *   COMPLETED levels only: [{ level, taskIds, observations }] with
 *   observations = { [taskId]: { status: 'ok'|'error', value?, error? } }.
 *
 * Signal convention on a returned value object: if the returned value
 * is an object with boolean field `planInvalidating`, the task is the
 * level's invalidator (Batch 171 Rule 3 / Batch 173 audit field b).
 * If it has boolean field `earlyExit`, the task requests RULE 6
 * read-only early-exit. The whole value is kept as the observation.
 *
 * Rules enforced:
 * - Rule 1 (171): replan only at level boundaries, on a completed
 *   level's joint observation. The boundary hook is the replan point.
 * - Rule 2 (171): no mid-level replan, ever. requestReplan() during a
 *   running level returns an explicit refusal and changes nothing.
 * - Rule 3 (171): recoverable/fixable handling stays inside the level
 *   (task functions handle their own retries); plan-invalidating
 *   observations are decided at the boundary.
 * - Rule 4 (171): committed state is a precondition for replan. If any
 *   completed task committed, a boundary replan without
 *   `committedState` is refused.
 * - Rule 5 (171): abort is a separate path. abort() halts without
 *   replanning, produces NO prefix update for the incomplete level,
 *   and the next action would be a fresh plan from the last completed
 *   level's state (that fresh plan is the caller's, not this run's).
 * - Rule 6 (173): read-only early-exit is a THIRD path, distinct from
 *   boundary replan and abort. Gates: no committing hop in the level,
 *   every sibling a read, exiting task read-only; the level is marked
 *   INCOMPLETE with NO emitter prefix update, while the invalidator's
 *   observation remains usable as planner input. Logged as its own
 *   trace kind ('early-exit'). If any gate fails, the level runs to
 *   completion and Rule 2 applies — early-exit never degrades into
 *   mid-level replan by exception.
 *
 * Cancellation modelling limit: this executor runs caller-supplied
 * async functions to completion (Promise.allSettled per level). A
 * RULE 6 exit therefore records the notified-sibling intent and marks
 * the level incomplete; it does not kill in-flight JavaScript promises
 * (which cannot be killed). Real cancel tokens / checkpoints /
 * finalize-in-DAG-order are caller-side, per Charguéraud (Batch 173).
 */
class PlanExecutor {
  constructor(tasks, options = {}) {
    if (!Array.isArray(tasks) || tasks.length === 0) {
      throw new Error('PlanExecutor: tasks must be a non-empty array');
    }
    computeLevels(tasks); // validates ids, deps, cycles up front
    this.tasks = new Map(tasks.map((t) => [t.id, t]));
    this.onLevelBoundary = typeof options.onLevelBoundary === 'function' ? options.onLevelBoundary : null;
    this.phase = 'idle'; // idle | running-level | between-levels | completed | aborted
    this.completedIds = new Set();
    this.exitedIds = new Set(); // early-exited (incomplete) task ids: consumed, not completed
    this.droppedIds = new Set(); // dependents of exited tasks, dropped without replan
    this.prefix = []; // completed levels only
    this.audit = []; // Batch 173 four fields + win inputs, per level
    this.traces = []; // completed-level replan | early-exit | abort | dropped
    this.refusals = []; // mid-level replan, precondition, early-exit-gate refusals
    this.committedEffects = []; // ids of completed commit/write tasks
    this.aborted = false;
    this.abortReason = null;
    this.currentLevelIds = null;
    this.pendingEarlyExit = false;
    this.levelOrdinal = 0;
  }

  get isMidLevel() { return this.phase === 'running-level'; }

  /** Task read-only test: kind 'read' and readOnly not explicitly false. */
  static isReadOnly(task) {
    if (task.kind === 'commit' || task.kind === 'write') return false;
    return task.readOnly !== false;
  }

  /**
   * Replan probe / decision gate. During a running level this returns
   * an explicit refusal and records it; it never replans silently.
   * Actual remainder replacement happens via the boundary hook during
   * run(), which is the only replan point.
   */
  requestReplan() {
    if (this.phase === 'running-level') {
      const refusal = { allowed: false, reason: 'mid-level replan refused: level still in flight; replan only at level boundaries on completed joint observation' };
      this.refusals.push({ kind: 'mid-level-replan', ...refusal });
      return refusal;
    }
    if (this.phase === 'between-levels' || (this.phase === 'idle' && this.prefix.length > 0)) {
      return { allowed: true, reason: 'at a level boundary on a completed joint observation' };
    }
    if (this.phase === 'completed' || this.phase === 'aborted') {
      return { allowed: false, reason: `no replan from phase "${this.phase}"` };
    }
    return { allowed: false, reason: 'no completed joint observation yet; replan only at level boundaries' };
  }

  /** Emergency abort (Rule 5): separate path, halts without replanning. */
  abort(reason = 'emergency abort') {
    if (this.phase === 'completed' || this.phase === 'aborted') {
      return { aborted: this.aborted, replanned: false, reason: `already ${this.phase}` };
    }
    const wasMidLevel = this.phase === 'running-level';
    this.aborted = true;
    this.abortReason = reason;
    this.phase = 'aborted';
    this.traces.push({ kind: 'abort', reason, midLevel: wasMidLevel, levelIds: this.currentLevelIds ? [...this.currentLevelIds] : [] });
    return { aborted: true, replanned: false, reason };
  }

  /**
   * RULE 6 early-exit request, callable mid-level. Checks the level
   * gates against the CURRENT level; a failed gate returns a refusal
   * and the level runs to completion (never a mid-level replan).
   * Task-signal early-exit (returned `earlyExit` flag) is checked
   * against the same gates at level end.
   */
  requestEarlyExit() {
    if (this.phase !== 'running-level' || !this.currentLevelIds) {
      return { allowed: false, reason: 'early-exit requested outside a running level' };
    }
    const levelTasks = this.currentLevelIds.map((id) => this.tasks.get(id));
    if (levelTasks.some((t) => !PlanExecutor.isReadOnly(t))) {
      const refusal = { allowed: false, reason: 'RULE 6 gate failed: level contains a committing or non-read-only hop; level runs to completion' };
      this.refusals.push({ kind: 'early-exit-gate', ...refusal });
      return refusal;
    }
    this.pendingEarlyExit = true;
    return { allowed: true, reason: 'read-only level: early-exit armed; level will be marked incomplete with no prefix update' };
  }

  _remainingTasks() {
    return [...this.tasks.values()].filter(
      (t) => !this.completedIds.has(t.id) && !this.exitedIds.has(t.id) && !this.droppedIds.has(t.id));
  }

  /**
   * Apply a boundary replan: the new plan's unexecuted remainder
   * REPLACES the old DAG's unexecuted remainder only. Completed work
   * is untouched. Returns { applied, reason }.
   */
  _applyReplan(newTasks, committedState) {
    if (this.committedEffects.length > 0 && (committedState === undefined || committedState === null)) {
      const refusal = { applied: false, reason: 'committed-state precondition failed: a completed hop already committed; the replanned DAG must take the committed effect as given state (pass committedState)' };
      this.refusals.push({ kind: 'replan-precondition', ...refusal });
      return refusal;
    }
    if (!Array.isArray(newTasks)) {
      const refusal = { applied: false, reason: 'replan rejected: newTasks must be an array' };
      this.refusals.push({ kind: 'replan-invalid', ...refusal });
      return refusal;
    }
    const newIds = new Set();
    for (const t of newTasks) {
      if (!t || typeof t.id !== 'string' || newIds.has(t.id)) {
        const refusal = { applied: false, reason: `replan rejected: bad or duplicate new task id "${t && t.id}"` };
        this.refusals.push({ kind: 'replan-invalid', ...refusal });
        return refusal;
      }
      if (this.completedIds.has(t.id)) {
        const refusal = { applied: false, reason: `replan rejected: new task "${t.id}" collides with a completed task` };
        this.refusals.push({ kind: 'replan-invalid', ...refusal });
        return refusal;
      }
      newIds.add(t.id);
    }
    for (const t of newTasks) {
      for (const dep of (t.dependsOn || t.depends || [])) {
        if (!this.completedIds.has(dep) && !newIds.has(dep)) {
          const refusal = { applied: false, reason: `replan rejected: new task "${t.id}" depends on "${dep}", which is neither completed nor in the new plan` };
          this.refusals.push({ kind: 'replan-invalid', ...refusal });
          return refusal;
        }
      }
    }
    try {
      const effective = newTasks.map((t) => ({
        ...t,
        dependsOn: (t.dependsOn || t.depends || []).filter((d) => !this.completedIds.has(d)),
      }));
      computeLevels(effective);
    } catch (e) {
      const refusal = { applied: false, reason: `replan rejected: ${e.message}` };
      this.refusals.push({ kind: 'replan-invalid', ...refusal });
      return refusal;
    }
    for (const t of this._remainingTasks()) this.tasks.delete(t.id);
    for (const t of newTasks) this.tasks.set(t.id, t);
    this.traces.push({ kind: 'replan', newTaskIds: newTasks.map((t) => t.id), committedStateAcknowledged: committedState !== undefined && committedState !== null });
    return { applied: true, reason: 'unexecuted remainder replaced at a level boundary on completed joint observation' };
  }

  async run() {
    while (true) {
      if (this.aborted) break;
      const remaining = this._remainingTasks();
      if (remaining.length === 0) break;
      // First level of the remaining DAG (deps on completed tasks satisfied).
      const effective = remaining.map((t) => ({
        ...t,
        dependsOn: (t.dependsOn || t.depends || []).filter((d) => !this.completedIds.has(d)),
      }));
      let firstLevelIds;
      try {
        firstLevelIds = computeLevels(effective).levels[0];
      } catch (e) {
        // Remaining deps reference exited/dropped tasks: drop those tasks.
        const blocked = remaining.filter((t) =>
          (t.dependsOn || t.depends || []).some((d) => this.exitedIds.has(d) || this.droppedIds.has(d)));
        if (blocked.length === 0) throw e;
        for (const t of blocked) {
          this.droppedIds.add(t.id);
          this.traces.push({ kind: 'dropped-after-early-exit', taskId: t.id, reason: 'predecessor exited incomplete with no prefix update and no replan kept it' });
        }
        continue;
      }
      const levelTasks = firstLevelIds.map((id) => this.tasks.get(id));
      this.currentLevelIds = [...firstLevelIds];
      this.phase = 'running-level';
      this.pendingEarlyExit = false;
      const levelStart = Date.now();
      const siblingStarts = {};
      const siblingFinishes = {};
      for (const t of levelTasks) siblingStarts[t.id] = levelStart;
      const prefixSnapshot = this.prefix.map((lv) => ({ ...lv, observations: { ...lv.observations } }));
      const results = await Promise.all(levelTasks.map(async (t) => {
        const ctx = { taskId: t.id, levelIndex: this.levelOrdinal, prefix: prefixSnapshot, executor: this };
        try {
          const value = await t.run(ctx);
          siblingFinishes[t.id] = Date.now();
          return { id: t.id, status: 'ok', value };
        } catch (err) {
          siblingFinishes[t.id] = Date.now();
          return { id: t.id, status: 'error', error: String((err && err.message) || err) };
        }
      }));
      const levelCompletion = Date.now();
      const observations = {};
      for (const r of results) {
        observations[r.id] = r.status === 'ok' ? { status: 'ok', value: r.value } : { status: 'error', error: r.error };
      }
      const invalidator = results.find((r) =>
        r.status === 'ok' && r.value && typeof r.value === 'object' && r.value.planInvalidating === true);
      const invalidatorId = invalidator ? invalidator.id : null;
      const tInv = invalidatorId ? siblingFinishes[invalidatorId] : null;
      const waitMs = tInv !== null ? levelCompletion - tInv : 0;
      const levelDuration = Math.max(0, levelCompletion - levelStart);
      const waitFraction = levelDuration > 0 ? waitMs / levelDuration : 0;
      const earlyExitResult = results.find((r) =>
        r.status === 'ok' && r.value && typeof r.value === 'object' && r.value.earlyExit === true);
      const earlyExitSignalled = Boolean(earlyExitResult) || this.pendingEarlyExit;
      const exitingTask = earlyExitResult ? this.tasks.get(earlyExitResult.id) : null;
      const earlyExitGatesPass = earlyExitSignalled
        && levelTasks.every((t) => PlanExecutor.isReadOnly(t))
        && (!exitingTask || PlanExecutor.isReadOnly(exitingTask));
      const ordinal = this.levelOrdinal;
      this.levelOrdinal += 1;
      this.currentLevelIds = null;

      // Abort during this level: NO prefix update, level incomplete.
      if (this.aborted) {
        this.audit.push({
          level: ordinal, taskIds: firstLevelIds, traceKind: 'abort',
          siblingStarts, siblingFinishes, invalidatorId, tInvMs: tInv,
          levelCompletionMs: levelCompletion, waitMs, waitFraction,
          plannerCallMs: null, discardedWork: null,
        });
        break;
      }

      let jointObservation = null;
      if (earlyExitSignalled && earlyExitGatesPass) {
        // RULE 6: level INCOMPLETE, no prefix update. Invalidator
        // observation remains usable as planner input (not a prefix term).
        for (const t of levelTasks) this.exitedIds.add(t.id);
        const notifiedSiblingIds = firstLevelIds.filter((id) => !(earlyExitResult && id === earlyExitResult.id));
        this.audit.push({
          level: ordinal, taskIds: firstLevelIds, traceKind: 'early-exit',
          siblingStarts, siblingFinishes, invalidatorId, tInvMs: tInv,
          levelCompletionMs: levelCompletion, waitMs, waitFraction,
          plannerCallMs: null,
          discardedWork: { notifiedSiblingIds, alreadyCompletedCount: notifiedSiblingIds.length },
        });
        this.traces.push({
          kind: 'early-exit', level: ordinal, taskIds: firstLevelIds,
          invalidatorId, reason: 'read-only level exited early; no prefix update; invalidator observation kept as planner input only',
        });
        jointObservation = {
          level: ordinal, taskIds: firstLevelIds, observations,
          invalidatorId, earlyExit: true, traceKind: 'early-exit',
        };
      } else {
        if (earlyExitSignalled && !earlyExitGatesPass) {
          this.refusals.push({
            kind: 'early-exit-gate',
            allowed: false,
            reason: 'RULE 6 gate failed: level contains a committing or non-read-only hop; level ran to completion under Rule 2',
          });
        }
        // Completed level: prefix accumulates the JOINT observation only.
        for (const t of levelTasks) {
          this.completedIds.add(t.id);
          const obs = observations[t.id];
          if (obs.status === 'ok' && (t.kind === 'commit' || t.kind === 'write')) this.committedEffects.push(t.id);
        }
        const levelRecord = { level: ordinal, taskIds: [...firstLevelIds], observations };
        this.prefix.push(levelRecord);
        this.audit.push({
          level: ordinal, taskIds: firstLevelIds, traceKind: 'completed',
          siblingStarts, siblingFinishes, invalidatorId, tInvMs: tInv,
          levelCompletionMs: levelCompletion, waitMs, waitFraction,
          plannerCallMs: null, discardedWork: null,
        });
        jointObservation = {
          level: ordinal, taskIds: firstLevelIds, observations,
          invalidatorId, earlyExit: false, traceKind: 'completed',
        };
      }

      // Level boundary: the ONLY replan point.
      this.phase = 'between-levels';
      if (this.onLevelBoundary) {
        const plannerStart = Date.now();
        let hookResult = null;
        try {
          hookResult = await this.onLevelBoundary({
            levelIndex: ordinal, jointObservation,
            prefix: this.prefix.map((lv) => ({ ...lv, observations: { ...lv.observations } })),
            committedEffects: [...this.committedEffects], executor: this,
          });
        } catch (err) {
          hookResult = null;
          this.refusals.push({ kind: 'boundary-hook-error', reason: String((err && err.message) || err) });
        }
        const plannerCallMs = Date.now() - plannerStart;
        this.audit[this.audit.length - 1].plannerCallMs = plannerCallMs;
        if (hookResult && hookResult.replan) {
          this._applyReplan(hookResult.replan, hookResult.committedState);
        }
        if (this.aborted) break;
      }
    }
    if (!this.aborted) this.phase = 'completed';
    return {
      status: this.aborted ? 'aborted' : 'completed',
      abortReason: this.abortReason,
      prefix: this.prefix,
      audit: this.audit,
      traces: this.traces,
      refusals: this.refusals,
      completedTaskIds: [...this.completedIds],
      committedEffects: [...this.committedEffects],
      exitedTaskIds: [...this.exitedIds],
      droppedTaskIds: [...this.droppedIds],
    };
  }
}

module.exports = {
  percentile,
  median,
  computeLevels,
  MODAL_SELECTION_GUARDRAIL,
  modalSelect,
  ToolLatencyTracker,
  earlyExitWins,
  PlanExecutor,
};
