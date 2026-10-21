// skill-tree.js — P95/P157 Skill Tree Live In Engine Loop
// ============================================================================
// Self-evolving skill tree substrate. Engine events grant XP; prerequisites gate
// unlocks; scheduler tick emits recommendations. No autonomous mutation.
(function () {
  function install(Genesis) {
    if (!Genesis) return;
    if (Genesis.SkillTree) return;
    var FLAG = '__GENESIS_SKILL_TREE';
    var skills = new Map();
    var xp = new Map();
    var unlocked = new Set();
    var recommendations = [];
    function flagOn() { try { return (typeof window === 'undefined') || window[FLAG] !== false; } catch (_) { return true; } }
    function define(id, spec) { if (!id) return false; skills.set(id, Object.assign({ id: id, name: id, prereq: [], threshold: 1, tags: [] }, spec || {})); return true; }
    function getXp(id) { return xp.get(id) || 0; }
    function prereqMet(spec) { return (spec.prereq || []).every(function (p) { return unlocked.has(p); }); }
    function isUnlocked(id) { return unlocked.has(id); }
    function grant(id, amount, reason) { if (!skills.has(id)) define(id, { threshold: 1 }); amount = typeof amount === 'number' ? amount : 1; xp.set(id, getXp(id) + amount); var spec = skills.get(id); var didUnlock = false; if (!unlocked.has(id) && getXp(id) >= spec.threshold && prereqMet(spec)) { unlocked.add(id); didUnlock = true; try { if (Genesis.EventBridge && Genesis.EventBridge.emit) Genesis.EventBridge.emit('skill:unlocked', { id: id, reason: reason || 'xp', xp: getXp(id) }); } catch (_) {} } return { ok: true, id: id, xp: getXp(id), unlocked: unlocked.has(id), didUnlock: didUnlock }; }
    function recommend(ctx) { var list = []; skills.forEach(function (spec, id) { if (!unlocked.has(id) && prereqMet(spec)) list.push({ id: id, name: spec.name, xp: getXp(id), threshold: spec.threshold, progress: Math.min(1, getXp(id) / spec.threshold), tags: spec.tags || [] }); }); list.sort(function (a, b) { return b.progress - a.progress; }); var r = list[0] || null; if (r) { recommendations.push(Object.assign({ at: Date.now() }, r)); if (recommendations.length > 30) recommendations.shift(); } return r; }
    function seed() { define('observe-world', { name: 'Observe World', threshold: 1, tags: ['perception'] }); define('consequence-audit', { name: 'Consequence Audit', threshold: 2, prereq: ['observe-world'], tags: ['audit'] }); define('portable-route', { name: 'Portable Route', threshold: 2, tags: ['wallmeria'] }); define('citizen-reflection', { name: 'Citizen Reflection', threshold: 2, prereq: ['observe-world'], tags: ['citizen'] }); define('grounded-action', { name: 'Grounded Action', threshold: 2, tags: ['grounding'] }); }
    function onEvent(evt) { if (!flagOn() || !evt) return; if (evt.type === 'agent:plan') grant('observe-world', 1, evt.type); if (evt.type === 'agent:react') grant('citizen-reflection', 1, evt.type); if (evt.type === 'consequence-audit:ready') grant('consequence-audit', 1, evt.type); if (evt.type === 'engine-health:proof') grant('portable-route', 1, evt.type); if (evt.type === 'grounding:validated') grant('grounded-action', 1, evt.type); }
    function tick() { var r = recommend({}); if (r && Genesis.EventBridge && Genesis.EventBridge.emit) Genesis.EventBridge.emit('skill:recommendation', r); return r; }
    seed();
    if (Genesis.EventBridge && Genesis.EventBridge.on) Genesis.EventBridge.on('*', onEvent);
    if (Genesis.EngineScheduler && Genesis.EngineScheduler.defineTick) Genesis.EngineScheduler.defineTick('skill-tree', tick, function () { return flagOn(); });
    var API = { define: define, grant: grant, recommend: recommend, tick: tick, isUnlocked: isUnlocked, unlocked: function () { return Array.from(unlocked); }, skills: function () { return Array.from(skills.keys()); }, summary: function () { return { enabled: flagOn(), skills: skills.size, unlocked: unlocked.size, recommendations: recommendations.length }; } };
    Genesis.SkillTree = API;
    if (typeof Genesis.registerModule === 'function') Genesis.registerModule('skill-tree', { status: 'validated', path: './src/genesis/skill-tree.js', gun: 'ST' });
  }
  if (typeof module !== 'undefined' && module.exports) module.exports = { install: install };
  if (typeof window !== 'undefined' && window.Genesis) install(window.Genesis);
})();
