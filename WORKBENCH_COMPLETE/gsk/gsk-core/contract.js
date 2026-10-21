'use strict';
/*
 * GSK CONTRACT — the lingua franca enforcement (see Service Manual > CONTRACT AUDIT).
 * Loaded at boot by fusion-loader. Two precise runtime guards:
 *   1. guardWill   — protects agentic_will.will from scalar overwrite (the ".will disease").
 *   2. checkModel  — warns when a model outside the OmniRoute whitelist is used.
 * Kept minimal + noise-free on purpose: precise guards, no false-positive spam.
 * Chamber-summary conformance is covered by contract_audit.js (run manually).
 */
const MODELS = ['nvidia/openai/gpt-oss-20b','nvidia/nvidia/nvidia-nemotron-nano-9b-v2','auto/best-free','auto/best-chat','auto/best-reasoning','auto/best-fast','auto/best-coding','auto/coding','auto/coding:free','auto/fast','auto/cheap','auto/smart','auto/chat','auto/reasoning','auto/offline','nvidia/nvidia/llama-3.3-nemotron-super-49b-v1.5','nvidia/nemotron-3-super-120b-a12b'];

// agentic_will.will MUST stay the AgenticWill object. A scalar overwrite
// (e.g. `agentic_will.will = Math.min(1, agentic_will.will + x)`) corrupts
// it into NaN and crashes getSoulContext() -> this.will.summarize is not a function.
// This setter REJECTS bad writes and logs loudly instead of failing silent.
function guardWill(agenticWillChamber) {
  if (!agenticWillChamber || !agenticWillChamber.will) return;
  const chamber = agenticWillChamber;
  let willObj = chamber.will;
  Object.defineProperty(chamber, 'will', {
    configurable: false,
    enumerable: true,
    get() { return willObj; },
    set(v) {
      const ok = v && typeof v === 'object' && typeof v.will_strength === 'number';
      if (ok) {
        willObj = v;
      } else {
        console.error('[CONTRACT-GUARD] REJECTED assignment to agentic_will.will — it must stay the AgenticWill object. ' +
          'Use agentic_will.will.will_strength for strength. Caller tried to set: ' +
          (typeof v === 'object' ? '[object, not AgenticWill]' : String(v)));
      }
    }
  });
}

// Warn (not crash) on models outside the OmniRoute whitelist — failover handles dead ones.
function checkModel(model) {
  if (!model) return false;
  const m = String(model).trim();
  const ok = MODELS.includes(m);
  if (!ok) console.warn(`[CONTRACT-GUARD] model "${m}" not in OmniRoute whitelist [${MODELS.join(', ')}] — likely dead/429.`);
  return ok;
}

module.exports = { MODELS, guardWill, checkModel };
