// GENESIS ENGINE — In-World Console Live Tuner (P75)
// Persists console tuning commands and emits proof events for local/Sanctum-applied mood changes.

function clean(value, fallback) { return String(value || fallback || '').replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 40) || fallback; }

export function install(Genesis, worldState, saveWorldState, options = {}) {
  if (!Genesis || !worldState || typeof saveWorldState !== 'function') return null;
  const max = options.max || 40;
  worldState.liveTuning = worldState.liveTuning || { history: [], commands: [] };
  function tune(data = {}, context = {}) { const record = { at: Date.now(), mood: clean(data.mood, 'neutral').toLowerCase(), phase: clean(data.phase, 'VOID').toUpperCase(), source: context.source || data.source || 'in-world-console', applied: context.applied !== false }; worldState.liveTuning.current = record; worldState.liveTuning.history = [record, ...(worldState.liveTuning.history || [])].slice(0, max); saveWorldState(); try { window.dispatchEvent(new CustomEvent('genesis:world:tune', { detail: record })); } catch (_) {} return record; }
  function command(type, data = {}, outcome = 'sent') { const record = { at: Date.now(), type: clean(type, 'command'), data, outcome }; worldState.liveTuning.commands = [record, ...(worldState.liveTuning.commands || [])].slice(0, max); saveWorldState(); try { window.dispatchEvent(new CustomEvent('genesis:world:command', { detail: record })); } catch (_) {} return record; }
  const api = { tune, command, summary: () => worldState.liveTuning }; Genesis.WorldTuner = api; return api;
}

export default { install };
