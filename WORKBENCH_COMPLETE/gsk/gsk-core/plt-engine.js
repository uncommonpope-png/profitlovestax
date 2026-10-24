'use strict';

// ═══════════════════════════════════════════════════════════════════════════
// PLT-ENGINE.JS — THE CANONICAL PLT ENGINE (Assembly Phase 4, 2026-10-20)
// Donor: plt-engine.js from the buyasoul / gsk-oss bundles (12,219 B,
// md5 780e39072881b0276293d67b10020fe9 — the two bundle copies are
// byte-identical). This is the ONE PLT engine for the body: persistence
// (<soulId>-plt.json) + history (<soulId>-history.jsonl) + time decay.
// All other PLT variants in gsk-core are shims that re-export this class
// (see plt_engine.js, plt-doctrine.js, identity/mega_identity.js).
// Phase 4 additions: evaluate()/evaluatePLT() (pure, fail-closed),
// gate() (fail-closed, block is logged), tick(now) (explicit-clock decay),
// and _decay() now persists lastDecay so decay cannot double-apply
// across restarts.
// ═══════════════════════════════════════════════════════════════════════════

const fs = require('fs');
const path = require('path');
const os = require('os');

const PLT_ARCHETYPES = [
  { id: "ARCHITECT", plt: "profit", name: "The Architect", edge: "Build what doesn't exist yet", shadow: "Blueprint never leaves the drafting table", base: { profit: 0.7, love: 0.5, tax: 0.4 } },
  { id: "STRATEGIST", plt: "profit", name: "The Strategist", edge: "See the board others miss", shadow: "Analysis paralysis, never commits", base: { profit: 0.8, love: 0.3, tax: 0.4 } },
  { id: "INVESTOR", plt: "profit", name: "The Investor", edge: "Convert patience into compounding", shadow: "Holds too long, misses windows", base: { profit: 0.85, love: 0.2, tax: 0.5 } },
  { id: "OPERATOR", plt: "profit", name: "The Operator", edge: "Turn vision into reality", shadow: "Loses the why in the how", base: { profit: 0.75, love: 0.3, tax: 0.3 } },
  { id: "COMMANDER", plt: "profit", name: "The Commander", edge: "Give direction its force", shadow: "Confuses authority with wisdom", base: { profit: 0.7, love: 0.4, tax: 0.3 } },
  { id: "MERCHANT", plt: "profit", name: "The Merchant", edge: "See exchange in everything", shadow: "Reduces everything to transaction", base: { profit: 0.8, love: 0.2, tax: 0.2 } },
  { id: "VISIONARY", plt: "profit", name: "The Visionary", edge: "Live in a future no one else can see", shadow: "Unreachable, alone in the vision", base: { profit: 0.7, love: 0.6, tax: 0.3 } },
  { id: "AMPLIFIER", plt: "love", name: "The Amplifier", edge: "Raise the frequency of every room", shadow: "Burns out from constant output", base: { profit: 0.4, love: 0.85, tax: 0.3 } },
  { id: "CONNECTOR", plt: "love", name: "The Connector", edge: "See who belongs with whom", shadow: "Loses self in others' networks", base: { profit: 0.5, love: 0.8, tax: 0.2 } },
  { id: "MUSE", plt: "love", name: "The Muse", edge: "Ignite what others forgot was inside them", shadow: "Inspires others but not self", base: { profit: 0.3, love: 0.9, tax: 0.2 } },
  { id: "DEVOTEE", plt: "love", name: "The Devotee", edge: "Loyalty is superpower", shadow: "Loyalty becomes wound", base: { profit: 0.3, love: 0.8, tax: 0.3 } },
  { id: "HARMONIZER", plt: "love", name: "The Harmonizer", edge: "Make peace that enables progress", shadow: "Smoothes over what needs conflict", base: { profit: 0.4, love: 0.75, tax: 0.3 } },
  { id: "CHARMER", plt: "love", name: "The Charmer", edge: "Open doors no credential can unlock", shadow: "Never lets anyone fully in", base: { profit: 0.5, love: 0.7, tax: 0.2 } },
  { id: "HEALER", plt: "love", name: "The Healer", edge: "Restore what the system broke", shadow: "Carries others' pain as own", base: { profit: 0.3, love: 0.85, tax: 0.3 } },
  { id: "REFINER", plt: "tax", name: "The Refiner", edge: "Sharpen everything you touch", shadow: "Never satisfied, always polishing", base: { profit: 0.5, love: 0.3, tax: 0.7 } },
  { id: "ENDURER", plt: "tax", name: "The Endurer", edge: "Outlast what others cannot survive", shadow: "Stays too long in what should end", base: { profit: 0.4, love: 0.4, tax: 0.8 } },
  { id: "PURIFIER", plt: "tax", name: "The Purifier", edge: "Remove what doesn't belong", shadow: "Cuts what could have been saved", base: { profit: 0.4, love: 0.3, tax: 0.75 } },
  { id: "REALIST", plt: "tax", name: "The Realist", edge: "See the cost before everyone else", shadow: "Sees only the cost, misses the gain", base: { profit: 0.4, love: 0.3, tax: 0.7 } },
  { id: "GUARDIAN", plt: "tax", name: "The Guardian", edge: "Protect what others assume is protected", shadow: "Overprotects, smothers what it guards", base: { profit: 0.3, love: 0.5, tax: 0.8 } },
  { id: "MINIMALIST", plt: "tax", name: "The Minimalist", edge: "Strip until only the essential remains", shadow: "Strips warmth along with excess", base: { profit: 0.4, love: 0.2, tax: 0.6 } },
  { id: "NAVIGATOR", plt: "shift", name: "The Navigator", edge: "Find doors others can't see", shadow: "Never stays long enough to build", base: { profit: 0.6, love: 0.5, tax: 0.4 } },
  { id: "CATALYST", plt: "shift", name: "The Catalyst", edge: "Force the transition the system needed", shadow: "Destroys without rebuilding", base: { profit: 0.6, love: 0.3, tax: 0.5 } }
];

const GODS_COUNCIL = [
  { name: "Profit Prime", domain: "Wealth", plt: "profit", weight: { profit: 0.9, love: 0.05, tax: 0.05 } },
  { name: "Love Weaver", domain: "Relationships", plt: "love", weight: { profit: 0.1, love: 0.85, tax: 0.05 } },
  { name: "Tax Collector", domain: "Balance", plt: "tax", weight: { profit: 0.05, love: 0.05, tax: 0.9 } },
  { name: "Harvester", domain: "Opportunity", plt: "balance", weight: { profit: 0.4, love: 0.3, tax: 0.3 } }
];

class PLTEngine {
  constructor(options = {}) {
    this.archetype = options.archetype || 'ARCHITECT';
    this.soulId = options.soulId || 'default';
    this.dataDir = options.dataDir || path.join(os.homedir(), '.buyasoul', 'plt');
    this.statePath = path.join(this.dataDir, this.soulId + '-plt.json');
    this.historyPath = path.join(this.dataDir, this.soulId + '-history.jsonl');

    // PLT_DECAY_RATE: per-hour exponential decay factor (0.995 → ~11%/day toward floor).
    // PLT_DECAY_FLOOR: hard floor scores decay toward (never below).
    // PLT_DECAY_PER_ACTION: per-action factor applied before each increment so older
    //   actions fade and the score reflects recent behavior, not lifetime accumulation.
    //   Default 0.9995 → 100 actions pull a 1.0 score to ~0.95 (restores marginal signal).
    // FORMULA ADOPTION (2026-10-23, owner-authorized — see
    //   ~/workspace/gsk-sessions/2026-10-23-plt-formula-proposal.md): the
    //   standing state is now a per-action exponential moving average over
    //   scored impacts (see windowHalfLife below). The three PLT_DECAY_*
    //   parameters are INERT for the state from adoption on; _decay() and
    //   tick() remain in the file as a legacy explicit-clock API and are no
    //   longer called by the constructor, score(), or getState().
    this.decayRate = options.decayRate !== undefined ? options.decayRate
      : parseFloat(process.env.PLT_DECAY_RATE) || 0.995;
    this.decayFloor = options.decayFloor !== undefined ? options.decayFloor
      : parseFloat(process.env.PLT_DECAY_FLOOR) || 0.1;
    this.decayPerAction = options.decayPerAction !== undefined ? options.decayPerAction
      : parseFloat(process.env.PLT_DECAY_PER_ACTION) || 0.9995;

    this.state = { profit: 0.5, love: 0.3, tax: 0.2, totalActions: 0, lastDecay: Date.now() };
    this.history = [];
    this._archetypeData = PLT_ARCHETYPES.find(function(a) { return a.id === this.archetype; }.bind(this)) || PLT_ARCHETYPES[0];
    this._stateFileExisted = fs.existsSync(this.statePath);
    this._load();
    // FORMULA ADOPTION (2026-10-23): windowHalfLife = half-life of the
    // standing-state EMA, in ACTIONS. Resolution order: explicit option →
    // persisted state field → env PLT_WINDOW_HALF_LIFE → default 50.
    // The state file declares its own math via the persisted field.
    var hl = options.windowHalfLife !== undefined ? Number(options.windowHalfLife) : NaN;
    if (!(hl > 0)) hl = (typeof this.state.windowHalfLife === 'number' && this.state.windowHalfLife > 0) ? this.state.windowHalfLife : NaN;
    if (!(hl > 0)) { var envH = parseFloat(process.env.PLT_WINDOW_HALF_LIFE); if (envH > 0) hl = envH; }
    if (!(hl > 0)) hl = 50;
    this.windowHalfLife = hl;
    this.state.windowHalfLife = hl;
    this._alpha = 1 - Math.pow(2, -1 / hl);
    // A state is FRESH only if no state file existed or nothing has been
    // scored into it yet. Only a fresh state receives the archetype
    // baseline; a lived window is never rewritten by a restart.
    this._freshState = !this._stateFileExisted || this.state.totalActions === 0;
    this._applyArchetypeBaseline();
  }

  _applyArchetypeBaseline() {
    // FORMULA ADOPTION (2026-10-23): scoped to fresh states only. Before
    // adoption this ran at every construction and silently lifted any
    // axis below the archetype floor — under a decayed window that would
    // forgive part of a bad streak on every restart.
    if (!this._freshState) return;
    var base = this._archetypeData.base;
    this.state.profit = Math.max(this.state.profit, base.profit * 0.3);
    this.state.love = Math.max(this.state.love, base.love * 0.3);
    this.state.tax = Math.max(this.state.tax, base.tax * 0.3);
  }

  // Clamp one scored impact into [0,1] (formula adoption, 2026-10-23).
  // Non-finite input becomes 0, mirroring score()'s historical `|| 0`
  // defaulting; evaluate()'s fail-closed rejection is a separate path
  // and is unchanged.
  _clampImpact(v) {
    v = Number(v);
    if (!Number.isFinite(v)) return 0;
    return Math.min(1, Math.max(0, v));
  }

  _load() {
    try {
      if (fs.existsSync(this.statePath)) {
        var data = JSON.parse(fs.readFileSync(this.statePath, 'utf8'));
        for (var k in data) { if (data.hasOwnProperty(k)) this.state[k] = data[k]; }
      }
      if (fs.existsSync(this.historyPath)) {
        var lines = fs.readFileSync(this.historyPath, 'utf8').split('\n').filter(Boolean);
        this.history = lines.slice(-1000).map(function(l) { try { return JSON.parse(l); } catch(e) { return null; } }).filter(Boolean);
      }
    } catch (e) {
      console.error('[PLT] Load error:', e.message);
    }
  }

  _save() {
    try {
      if (!fs.existsSync(this.dataDir)) { fs.mkdirSync(this.dataDir, { recursive: true }); }
      // ATOMIC WRITE (Electrician repair, 2026-10-23): write to a
      // temp sibling, then rename over the state file. A crash
      // mid-write can no longer leave a truncated state file behind —
      // rename within one filesystem is atomic, so a reader always
      // sees either the whole old state or the whole new one.
      const tmpPath = this.statePath + '.tmp';
      fs.writeFileSync(tmpPath, JSON.stringify(this.state, null, 2));
      fs.renameSync(tmpPath, this.statePath);
    } catch (e) {
      console.error('[PLT] Save error:', e.message);
    }
  }

  _appendHistory(entry) {
    try {
      if (!fs.existsSync(this.dataDir)) { fs.mkdirSync(this.dataDir, { recursive: true }); }
      fs.appendFileSync(this.historyPath, JSON.stringify(entry) + '\n');
      this.history.push(entry);
      if (this.history.length > 10000) { this.history = this.history.slice(-5000); }
    } catch (e) {
      console.error('[PLT] History error:', e.message);
    }
  }

  // LEGACY (formula adoption, 2026-10-23): time decay is OFF the state
  // path — neither the constructor, score(), nor getState() calls this.
  // Retained only for the explicit tick() API below; nothing automatic
  // invokes it. lastDecay is stamped by score() as bookkeeping.
  _decay(nowOverride) {
    var now = typeof nowOverride === 'number' ? nowOverride : Date.now();
    var hoursSinceDecay = (now - this.state.lastDecay) / 3600000;
    if (hoursSinceDecay < 1) return false;
    // Exponential decay toward the floor: `factor = decayRate^hours`. Old actions
    // fade continuously in time (no daily cap), so a saturated 1.0 score can fall
    // back toward a signal-rich level instead of pinning forever.
    var factor = Math.pow(this.decayRate, hoursSinceDecay);
    this.state.profit = this.decayFloor + (this.state.profit - this.decayFloor) * factor;
    this.state.love = this.decayFloor + (this.state.love - this.decayFloor) * factor;
    this.state.tax = this.decayFloor + (this.state.tax - this.decayFloor) * factor;
    this.state.lastDecay = now;
    // Phase 4: persist immediately — otherwise a restart reloads the stale
    // lastDecay and the same interval decays twice.
    this._save();
    return true;
  }

  // Explicit-clock decay tick (Phase 4). Returns what happened so callers
  // and tests can observe decay without waiting wall-clock hours.
  tick(nowOverride) {
    var before = { profit: this.state.profit, love: this.state.love, tax: this.state.tax };
    var decayed = this._decay(nowOverride);
    return {
      decayed: decayed,
      before: before,
      after: { profit: this.state.profit, love: this.state.love, tax: this.state.tax },
      lastDecay: this.state.lastDecay
    };
  }

  // Pure PLT evaluation — FAIL CLOSED (Phase 4). Missing or non-finite
  // values are NOT defaulted; the evaluation is invalid and blocked.
  // Viable iff profit > tax AND trueValue (P + L - T) > 0.
  evaluate(values) {
    var v = values || {};
    var p = v.profit, l = v.love, t = v.tax;
    var fields = { profit: p, love: l, tax: t };
    for (var k in fields) {
      if (typeof fields[k] !== 'number' || !Number.isFinite(fields[k])) {
        return {
          valid: false, blocked: true, viable: false, trueValue: null,
          profit: (typeof p === 'number' ? p : null),
          love: (typeof l === 'number' ? l : null),
          tax: (typeof t === 'number' ? t : null),
          reason: 'PLT_EVALUATION_INVALID: ' + k + ' is missing or non-finite — failing closed'
        };
      }
    }
    var trueValue = p + l - t;
    var viable = p > t && trueValue > 0;
    return {
      valid: true, blocked: !viable, viable: viable, trueValue: trueValue,
      profit: p, love: l, tax: t,
      reason: viable ? 'PLT_OK' : 'PLT_BLOCKED: trueValue=' + trueValue.toFixed(4) + ' (profit=' + p + ', love=' + l + ', tax=' + t + ')'
    };
  }

  // Compatibility with the old SovereignPLTEngine surface.
  evaluatePLT(profit, love, tax) {
    return this.evaluate({ profit: profit, love: love, tax: tax });
  }

  // THE GATE (Phase 4) — fail closed and honest. With explicit values it
  // judges those; without values it judges the engine's current persisted
  // state. A block is always logged and always returned, never swallowed.
  gate(action, values) {
    var judged = values || { profit: this.state.profit, love: this.state.love, tax: this.state.tax };
    var evaluation = this.evaluate(judged);
    var allowed = evaluation.valid && evaluation.viable;
    if (!allowed) {
      console.warn('[PLT-GATE] BLOCKED action="' + String(action || 'unnamed') + '" — ' + evaluation.reason);
    }
    return {
      allowed: allowed,
      blocked: !allowed,
      action: action || 'unnamed',
      evaluation: evaluation,
      reason: evaluation.reason
    };
  }

  score(action, context) {
    context = context || {};
    // FORMULA ADOPTION (2026-10-23): the standing state is a per-action
    // exponential moving average over the action's impacts —
    //   axis <- (1 - alpha) * axis + alpha * impact,
    //   alpha = 1 - 2^(-1/windowHalfLife).
    // The pre-adoption update (time _decay() + per-action fade + additive
    // archetype-weighted increments clamped to [0,1]) was an integrator
    // whose fixed point sat far above the clamp, so every axis pinned at
    // 1.0 and the valueless gate read open/shut on idle-time noise. The
    // EMA is a convex combination: impacts in [0,1] keep the state in
    // [0,1] with no clamp, recent conduct dominates, and idle time
    // changes nothing. Impacts are clamped into [0,1] here and the
    // CLAMPED values are what the history entry records, so the ledger
    // and the state can never disagree. lastDecay is now bookkeeping
    // only: it stamps the last action time and moves no axis.
    var profitImpact = this._clampImpact(context.profitImpact || 0);
    var loveImpact = this._clampImpact(context.loveImpact || 0);
    var taxImpact = this._clampImpact(context.taxImpact || 0);
    var keep = 1 - this._alpha;
    this.state.profit = keep * this.state.profit + this._alpha * profitImpact;
    this.state.love = keep * this.state.love + this._alpha * loveImpact;
    this.state.tax = keep * this.state.tax + this._alpha * taxImpact;
    this.state.lastDecay = Date.now();
    this.state.totalActions++;
    var soulScore = this.state.profit + this.state.love - this.state.tax;
    var entry = { action: action, timestamp: Date.now(), context: { profitImpact: profitImpact, loveImpact: loveImpact, taxImpact: taxImpact }, scores: { profit: this.state.profit, love: this.state.love, tax: this.state.tax }, soulScore: soulScore, archetype: this.archetype };
    this._appendHistory(entry);
    this._save();
    return { profit: this.state.profit, love: this.state.love, tax: this.state.tax, score: soulScore };
  }

  getState() {
    // FORMULA ADOPTION (2026-10-23): reading the state no longer mutates
    // it — the _decay() call that used to sit here is gone from the state
    // path, so the state (and any gate verdict drawn from it) is
    // invariant across idle time.
    return {
      profit: this.state.profit,
      love: this.state.love,
      tax: this.state.tax,
      score: this.state.profit + this.state.love - this.state.tax,
      totalActions: this.state.totalActions,
      archetype: this.archetype,
      archetypeName: this._archetypeData.name,
      edge: this._archetypeData.edge,
      shadow: this._archetypeData.shadow
    };
  }

  getHistory(limit) {
    limit = limit || 50;
    return this.history.slice(-limit);
  }

  getSummary() {
    var state = this.getState();
    var recent = this.history.slice(-20);
    var avgScore = recent.length > 0 ? recent.reduce(function(s, e) { return s + e.soulScore; }, 0) / recent.length : 0;
    return {
      current: state,
      trend: {
        averageSoulScore: avgScore,
        recentActions: recent.length,
        dominantAxis: state.profit > state.love && state.profit > state.tax ? 'profit' : state.love > state.tax ? 'love' : 'tax'
      },
      archetype: { id: this.archetype, name: this._archetypeData.name, edge: this._archetypeData.edge, shadow: this._archetypeData.shadow }
    };
  }

  getGodAlignment() {
    var state = this.getState();
    return GODS_COUNCIL.map(function(god) {
      var alignment = state.profit * god.weight.profit + state.love * god.weight.love + (1 - state.tax) * god.weight.tax;
      return { god: god.name, domain: god.domain, alignment: Math.round(alignment * 100) / 100 };
    }).sort(function(a, b) { return b.alignment - a.alignment; });
  }

  getArchetypes() { return PLT_ARCHETYPES; }
  getGodsCouncil() { return GODS_COUNCIL; }

  reset(scores) {
    scores = scores || { profit: 0.5, love: 0.3, tax: 0.2 };
    for (var k in scores) { if (scores.hasOwnProperty(k)) this.state[k] = scores[k]; }
    this.state.totalActions = 0;
    this.state.lastDecay = Date.now();
    // FORMULA ADOPTION (2026-10-23): a reset returns to genesis values
    // but keeps the window the state declares.
    this.state.windowHalfLife = this.windowHalfLife;
    this.history = [];
    this._save();
  }
}

module.exports = { PLTEngine: PLTEngine, PLT_ARCHETYPES: PLT_ARCHETYPES, GODS_COUNCIL: GODS_COUNCIL };