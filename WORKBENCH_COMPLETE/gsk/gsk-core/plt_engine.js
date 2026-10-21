'use strict';

// ═══════════════════════════════════════════════════════════════════════════
// SHIM (Assembly Phase 4, 2026-10-20) — this file no longer contains an
// engine. The ONE canonical PLT engine is ./plt-engine.js (donor from the
// buyasoul/gsk-oss bundles: persistence + decay + history). The old
// SovereignPLTEngine class that lived here had no persistence and no gate;
// it now EXTENDS the canonical engine so every construction through this
// path answers from the same code. The two legacy prototype helpers
// (recordTelemetry / updateCognitiveState) are preserved on the subclass
// for surface compatibility.
// ═══════════════════════════════════════════════════════════════════════════

const { PLTEngine } = require('./plt-engine.js');

class SovereignPLTEngine extends PLTEngine {
  constructor(options = {}) {
    super(options);
    this.originBaseline = {
      cycle: 0,
      valence: 0.50,
      arousal: 0.30,
      mood: 'awakening'
    };
    this.cognitiveState = { ...this.originBaseline };
  }

  recordTelemetry(telemetry = {}) {
    const metrics = this.evaluatePLT(telemetry.profit || 0, telemetry.love || 0, telemetry.tax || 0);
    const timestamp = new Date().toISOString();
    return { timestamp, metrics, state: this.cognitiveState };
  }

  updateCognitiveState(deltaValence, mood) {
    this.cognitiveState.valence = Math.max(0, Math.min(1, this.cognitiveState.valence + deltaValence));
    if (mood) this.cognitiveState.mood = mood;
    return this.cognitiveState;
  }
}

module.exports = SovereignPLTEngine;
module.exports.SovereignPLTEngine = SovereignPLTEngine;
module.exports.PLTEngine = PLTEngine;
