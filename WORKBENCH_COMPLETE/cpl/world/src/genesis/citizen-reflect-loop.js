// citizen-reflect-loop.js — P82/P148 Perceive→Plan→Act→Reflect closure
// ============================================================================
// Adds the missing REFLECT stage to the citizen loop. It listens to agent events,
// records reflections, and optionally writes CitizenAI episodes.
(function () {
  function install(Genesis) {
    if (!Genesis) return;
    if (Genesis.CitizenReflectLoop) return;
    var FLAG = '__GENESIS_CITIZEN_REFLECT_LOOP';
    var reflections = new Map();
    function flagOn() { try { return (typeof window === 'undefined') || window[FLAG] !== false; } catch (_) { return true; } }
    function push(id, rec) { if (!id) return null; if (!reflections.has(id)) reflections.set(id, []); var list = reflections.get(id); list.push(rec); if (list.length > 30) list.shift(); return rec; }
    function reflect(id, eventType, payload) {
      if (!flagOn()) return null;
      payload = payload || {};
      var rec = { id: id, eventType: eventType, at: Date.now(), behavior: payload.behavior || null, band: payload.band || null, note: summarize(eventType, payload) };
      push(id, rec);
      try { if (Genesis.CitizenAI && Genesis.CitizenAI.addEpisode) Genesis.CitizenAI.addEpisode(id, 'reflection', rec.note, [id], payload.pos || null, payload.band === 'HOSTILE' ? 'negative' : 'neutral', ['reflect', eventType]); } catch (_) {}
      return rec;
    }
    function summarize(type, p) { if (type === 'agent:plan') return 'Planned ' + (p.behavior || 'unknown') + ' under ' + (p.band || 'unknown') + ' trust'; if (type === 'agent:react') return 'Reacted as ' + (p.behavior || 'unknown') + ' with trust band ' + (p.band || 'unknown'); if (type === 'agent:say') return 'Spoke: ' + String(p.text || '').slice(0, 80); return 'Observed ' + type; }
    function onEvent(evt) { var p = (evt && evt.payload) || {}; var id = p.id || p.agentId || null; if (id && evt.type && evt.type.indexOf('agent:') === 0) reflect(id, evt.type, p); }
    function last(id) { var list = reflections.get(id) || []; return list[list.length - 1] || null; }
    function list(id) { return (reflections.get(id) || []).slice(); }
    function tick() { return { reflected: Array.from(reflections.keys()).length }; }
    if (Genesis.EventBridge && Genesis.EventBridge.on) Genesis.EventBridge.on('*', onEvent);
    if (Genesis.EngineScheduler && Genesis.EngineScheduler.defineTick) Genesis.EngineScheduler.defineTick('citizen-reflect-loop', tick, function () { return flagOn(); });
    var API = { reflect: reflect, last: last, list: list, tick: tick, summary: function () { var total = 0; reflections.forEach(function (v) { total += v.length; }); return { enabled: flagOn(), citizens: reflections.size, reflections: total }; } };
    Genesis.CitizenReflectLoop = API;
    if (typeof Genesis.registerModule === 'function') Genesis.registerModule('citizen-reflect-loop', { status: 'validated', path: './src/genesis/citizen-reflect-loop.js', gun: 'FSM' });
  }
  if (typeof module !== 'undefined' && module.exports) module.exports = { install: install };
  if (typeof window !== 'undefined' && window.Genesis) install(window.Genesis);
})();
