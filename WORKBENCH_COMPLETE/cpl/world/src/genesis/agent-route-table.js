// agent-route-table.js — WALLMERIA/EPL v0.1
// ============================================================================
// Portable agent route registry. Features ask for `agent://gsk` + capability;
// the table resolves that to the active runtime adapter. No feature should need
// to know Craig's localhost or private tunnel directly.
(function () {
  function parseAgentUri(uri) {
    if (!uri || typeof uri !== 'string') return null;
    var m = uri.match(/^agent:\/\/([a-z0-9_-]+)$/i);
    return m ? { uri: uri, id: m[1].toLowerCase() } : null;
  }

  function clone(obj) { try { return JSON.parse(JSON.stringify(obj)); } catch (_) { return obj; } }

  function install(Genesis) {
    if (!Genesis) return;
    if (Genesis.AgentRouteTable) return;
    if (!Genesis.RuntimeManifest && typeof require !== 'undefined') {
      try { require('./runtime-manifest').install(Genesis); } catch (_) {}
    }

    var routes = new Map();
    var mutations = 0;

    function register(uri, record) {
      var parsed = parseAgentUri(uri);
      if (!parsed) return { ok: false, error: 'bad-agent-uri' };
      var rec = Object.assign({ uri: uri, id: parsed.id, capabilities: [], adapters: {}, registeredAt: Date.now() }, record || {});
      rec.uri = uri;
      rec.id = parsed.id;
      routes.set(uri, rec);
      mutations++;
      return { ok: true, uri: uri, record: rec };
    }

    function installFromManifest(manifest) {
      manifest = manifest || (Genesis.RuntimeManifest && Genesis.RuntimeManifest.current ? Genesis.RuntimeManifest.current() : null);
      if (!manifest || !manifest.routes) return 0;
      var count = 0;
      for (var uri in manifest.routes) {
        if (!Object.prototype.hasOwnProperty.call(manifest.routes, uri)) continue;
        if (register(uri, manifest.routes[uri]).ok) count++;
      }
      return count;
    }

    function resolve(uri, channel) {
      var rec = routes.get(uri) || null;
      if (!rec) return null;
      if (!channel) return rec;
      var adapter = rec.adapters && rec.adapters[channel] ? rec.adapters[channel] : null;
      if (!adapter && rec.adapters && rec.adapters.default) adapter = rec.adapters.default;
      return adapter ? Object.assign({ uri: uri, channel: channel }, adapter) : null;
    }

    function resolveEndpoint(uri, channel) {
      var r = resolve(uri, channel);
      return r && r.endpoint ? r.endpoint : '';
    }

    function unregister(uri) { var ok = routes.delete(uri); if (ok) mutations++; return ok; }
    function has(uri) { return routes.has(uri); }
    function list() { return Array.from(routes.keys()); }
    function snapshot() {
      var out = {};
      routes.forEach(function (v, k) { out[k] = clone(v); });
      return out;
    }
    function summary() {
      return { count: routes.size, mutations: mutations, routes: list(), productReady: !!(Genesis.RuntimeManifest && Genesis.RuntimeManifest.current && Genesis.RuntimeManifest.current().productReady) };
    }

    var Table = {
      parseAgentUri: parseAgentUri,
      register: register,
      unregister: unregister,
      installFromManifest: installFromManifest,
      resolve: resolve,
      resolveEndpoint: resolveEndpoint,
      has: has,
      list: list,
      snapshot: snapshot,
      summary: summary
    };
    Genesis.AgentRouteTable = Table;
    installFromManifest();

    if (typeof Genesis.registerModule === 'function') {
      Genesis.registerModule('agent-route-table', { status: 'validated', path: './src/genesis/agent-route-table.js', gun: 'EPL' });
    }
  }

  if (typeof module !== 'undefined' && module.exports) module.exports = { install: install, parseAgentUri: parseAgentUri };
  if (typeof window !== 'undefined' && window.Genesis) install(window.Genesis);
})();
