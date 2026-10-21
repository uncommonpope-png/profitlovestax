// engine-health.js — WALLMERIA/EPL v0.1
// ============================================================================
// Health contract for a sellable Genesis/GSK engine. It reports whether runtime
// routes are product-real or still development harnesses tied to Craig's PC.
(function () {
  var WALLS = [
    { phase: 'P14', title: 'Verify GSK health', uri: 'agent://gsk', channel: 'mcp' },
    { phase: 'P53', title: 'Tunnel GSK MCP https', uri: 'agent://gsk', channel: 'mcp' },
    { phase: 'P54', title: 'Tunnel Sanctum wss', uri: 'agent://sanctum', channel: 'lobby' },
    { phase: 'P55', title: 'Bearer auth', capability: 'auth' },
    { phase: 'P56', title: 'Origin allowlist + PNA', capability: 'policy' },
    { phase: 'P57', title: 'Set public window vars', capability: 'manifest' },
    { phase: 'P86', title: 'Shared Sanctum lobby', uri: 'agent://sanctum', channel: 'lobby' },
    { phase: 'P109', title: 'Tunnel GSK MCP (https)', uri: 'agent://gsk', channel: 'mcp' },
    { phase: 'P110', title: 'Tunnel Sanctum (wss)', uri: 'agent://sanctum', channel: 'lobby' },
    { phase: 'P111', title: 'Bearer auth', capability: 'auth' },
    { phase: 'P112', title: 'Origin allowlist + PNA', capability: 'policy' },
    { phase: 'P113', title: 'Public window vars', capability: 'manifest' },
    { phase: 'P153', title: 'Shared Sanctum lobby', uri: 'agent://sanctum', channel: 'lobby' },
    { phase: 'P176', title: 'MCP-local routing', capability: 'route-table' }
  ];

  function installDeps(Genesis) {
    if (!Genesis.RuntimeManifest && typeof require !== 'undefined') { try { require('./runtime-manifest').install(Genesis); } catch (_) {} }
    if (!Genesis.AgentRouteTable && typeof require !== 'undefined') { try { require('./agent-route-table').install(Genesis); } catch (_) {} }
    if (!Genesis.TransportAdapter && typeof require !== 'undefined') { try { require('./transport-adapter').install(Genesis); } catch (_) {} }
  }

  function install(Genesis) {
    if (!Genesis) return;
    if (Genesis.EngineHealth) return;
    installDeps(Genesis);

    function manifest() { return Genesis.RuntimeManifest && Genesis.RuntimeManifest.current ? Genesis.RuntimeManifest.current() : null; }
    function adapterHealth(uri, channel) {
      if (!Genesis.TransportAdapter || typeof Genesis.TransportAdapter.health !== 'function') return { ok: false, status: 'transport-adapter-missing' };
      return Genesis.TransportAdapter.health(uri, channel);
    }
    function routeExists(uri, channel) {
      if (!Genesis.AgentRouteTable || typeof Genesis.AgentRouteTable.resolve !== 'function') return null;
      return Genesis.AgentRouteTable.resolve(uri, channel);
    }
    function wallState(def) {
      var m = manifest() || {};
      if (def.uri) {
        var route = routeExists(def.uri, def.channel);
        if (!route) return Object.assign({}, def, { state: 'blocked', reason: 'missing-engine-route' });
        var h = adapterHealth(def.uri, def.channel);
        if (!h.ok) return Object.assign({}, def, { state: 'blocked', reason: h.status || 'adapter-not-configured' });
        if (h.developmentHarness) return Object.assign({}, def, { state: 'wallmeria', reason: 'development-harness-not-product-real', endpoint: h.endpoint });
        if (!h.productReady) return Object.assign({}, def, { state: 'blocked', reason: h.status || 'not-product-ready', endpoint: h.endpoint });
        return Object.assign({}, def, { state: 'unblocked', reason: 'product-route', endpoint: h.endpoint });
      }
      if (def.capability === 'auth') {
        var auth = m.auth || {};
        var authReady = (Genesis.AuthProvider && Genesis.AuthProvider.summary && Genesis.AuthProvider.summary().bearerPresent) || auth.provider !== 'none';
        return Object.assign({}, def, { state: authReady ? 'unblocked' : 'wallmeria', reason: authReady ? 'auth-provider-configured' : 'engine-auth-provider-needed' });
      }
      if (def.capability === 'policy') {
        var profileReady = !!(Genesis.DeploymentProfile && Genesis.DeploymentProfile.policy && Genesis.DeploymentProfile.policy()) || (m.profile && m.profile !== 'dev-local');
        return Object.assign({}, def, { state: profileReady ? 'unblocked' : 'wallmeria', reason: profileReady ? 'deployment-policy-profile-configured' : 'deployment-policy-profile-needed' });
      }
      if (def.capability === 'manifest') {
        return Object.assign({}, def, { state: m && m.version ? 'unblocked' : 'blocked', reason: m && m.version ? 'runtime-manifest-present' : 'runtime-manifest-missing' });
      }
      if (def.capability === 'route-table') {
        var ok = !!(Genesis.AgentRouteTable && Genesis.AgentRouteTable.has && Genesis.AgentRouteTable.has('agent://gsk'));
        return Object.assign({}, def, { state: ok ? 'unblocked' : 'blocked', reason: ok ? 'route-table-present' : 'route-table-missing' });
      }
      return Object.assign({}, def, { state: 'blocked', reason: 'unknown-wall' });
    }
    function wallReport() { return WALLS.map(wallState); }
    function check() {
      var m = manifest() || {};
      var walls = wallReport();
      var standing = walls.filter(function (w) { return w.state !== 'unblocked'; });
      return {
        ok: standing.length === 0,
        productReady: !!m.productReady && standing.length === 0,
        profile: m.profile || 'unknown',
        dependsOnCraigPC: !!m.dependsOnCraigPC,
        wallCount: walls.length,
        standingWalls: standing.length,
        walls: walls,
        manifest: Genesis.RuntimeManifest && Genesis.RuntimeManifest.summary ? Genesis.RuntimeManifest.summary() : null,
        routes: Genesis.AgentRouteTable && Genesis.AgentRouteTable.summary ? Genesis.AgentRouteTable.summary() : null,
        transports: Genesis.TransportAdapter && Genesis.TransportAdapter.summary ? Genesis.TransportAdapter.summary() : null
      };
    }
    function isProductReal() { return check().productReady; }
    function proveRoutes() {
      var c = check();
      var required = [
        { uri: 'agent://gsk', channel: 'mcp' },
        { uri: 'agent://gsk', channel: 'thoughts' },
        { uri: 'agent://sanctum', channel: 'lobby' }
      ];
      var routes = required.map(function (r) {
        var h = adapterHealth(r.uri, r.channel);
        return { uri: r.uri, channel: r.channel, ok: !!(h && h.ok), productReady: !!(h && h.productReady), developmentHarness: !!(h && h.developmentHarness), endpoint: h && h.endpoint, status: h && h.status };
      });
      var ok = routes.every(function (r) { return r.ok; }) && !!(Genesis.AgentRouteTable && Genesis.AgentRouteTable.has && Genesis.AgentRouteTable.has('agent://gsk'));
      var productReady = ok && routes.every(function (r) { return r.productReady; }) && !c.dependsOnCraigPC;
      var proof = { ok: ok, productReady: productReady, profile: c.profile, routes: routes, standingWalls: c.standingWalls, at: Date.now() };
      try { if (Genesis.EventBridge && Genesis.EventBridge.emit) Genesis.EventBridge.emit('engine-health:proof', proof); } catch (_) {}
      return proof;
    }
    function summary() {
      var c = check();
      return { ok: c.ok, productReady: c.productReady, profile: c.profile, dependsOnCraigPC: c.dependsOnCraigPC, standingWalls: c.standingWalls, wallCount: c.wallCount };
    }

    var API = { WALLS: WALLS.slice(), check: check, wallReport: wallReport, proveRoutes: proveRoutes, isProductReal: isProductReal, summary: summary };
    Genesis.EngineHealth = API;
    if (typeof Genesis.registerModule === 'function') {
      Genesis.registerModule('engine-health', { status: 'validated', path: './src/genesis/engine-health.js', gun: 'EPL' });
    }
  }

  if (typeof module !== 'undefined' && module.exports) module.exports = { install: install, WALLS: WALLS.slice() };
  if (typeof window !== 'undefined' && window.Genesis) install(window.Genesis);
})();
