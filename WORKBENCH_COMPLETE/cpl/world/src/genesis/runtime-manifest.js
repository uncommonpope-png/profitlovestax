// runtime-manifest.js — WALLMERIA/EPL v0.1
// ============================================================================
// Engine Portability Layer (EPL) foundation. Converts legacy window endpoint
// globals into an engine-owned runtime manifest so Genesis can reason about
// routes without depending on Craig's PC, localhost, or a private tunnel.
//
// Law: additive only. This module DOES NOT remove window.GSK_ENDPOINT,
// window.GSK_WS_ENDPOINT, or window.SANCTUM_WS_ENDPOINT. It wraps them in a
// portable contract that later modules can resolve through `agent://...`.
(function () {
  var VERSION = 1;
  var DEFAULT_GSK_HTTP = 'http://localhost:3001';
  var DEFAULT_GSK_WS = 'ws://localhost:3002';
  var DEFAULT_SANCTUM_WS = 'ws://localhost:9001';
  var CRAIG_TUNNEL_RE = /(^|\.)abc-tunnel\.us$/i;
  var LOCAL_RE = /^(localhost|127(?:\.\d{1,3}){3}|0\.0\.0\.0|\[::1\]|::1)$/i;
  var PRIVATE_RE = /^(10(?:\.\d{1,3}){3}|192\.168(?:\.\d{1,3}){2}|172\.(1[6-9]|2\d|3[0-1])(?:\.\d{1,3}){2})$/;

  function now() { return Date.now ? Date.now() : new Date().getTime(); }
  function own(obj, key) { return Object.prototype.hasOwnProperty.call(obj, key); }
  function safeString(v) { return (v == null) ? '' : String(v).trim(); }
  function endpointValue(v) {
    if (!v) return '';
    if (typeof v === 'string') return v;
    if (typeof v === 'object') return v.endpoint || v.url || v.href || '';
    return String(v);
  }
  function firstEndpoint() {
    for (var i = 0; i < arguments.length; i++) {
      var v = endpointValue(arguments[i]);
      if (v) return v;
    }
    return '';
  }
  function clone(obj) { try { return JSON.parse(JSON.stringify(obj)); } catch (_) { return obj; } }
  function getWin() { try { return (typeof window !== 'undefined') ? window : null; } catch (_) { return null; } }
  function getLoc(env) {
    if (env && env.location) return env.location;
    var w = getWin();
    return w && w.location ? w.location : null;
  }
  function hostnameOf(url) {
    try { return new URL(url).hostname; } catch (_) { return ''; }
  }
  function isLocalHost(host) { return LOCAL_RE.test(safeString(host)); }
  function isPrivateHost(host) { return PRIVATE_RE.test(safeString(host)); }
  function isCraigTunnel(host) { return CRAIG_TUNNEL_RE.test(safeString(host)); }
  function isDevelopmentHost(host) { return isLocalHost(host) || isPrivateHost(host) || isCraigTunnel(host); }
  function isHttpChannel(channel) { return channel === 'mcp' || channel === 'http' || channel === 'gsk'; }
  function allowedProtocols(channel) { return isHttpChannel(channel) ? ['http:', 'https:'] : ['ws:', 'wss:']; }
  function pageIsLocal(loc) {
    var h = loc && loc.hostname ? loc.hostname : '';
    return !h || isLocalHost(h);
  }

  function normalizeEndpoint(value, channel, env) {
    value = safeString(value);
    if (!value) return { ok: false, endpoint: '', channel: channel, reason: 'missing' };
    try {
      var u = new URL(value);
      var allowed = allowedProtocols(channel);
      if (allowed.indexOf(u.protocol) === -1) {
        return { ok: false, endpoint: '', channel: channel, reason: 'bad-protocol:' + u.protocol };
      }
      var loc = getLoc(env);
      var localPage = pageIsLocal(loc);
      var secure = u.protocol === 'https:' || u.protocol === 'wss:';
      var local = isLocalHost(u.hostname);
      var privateHost = isPrivateHost(u.hostname);
      var craigTunnel = isCraigTunnel(u.hostname);
      var insecurePublic = !localPage && !secure;
      return {
        ok: !insecurePublic,
        endpoint: u.toString().replace(/\/$/, ''),
        channel: channel,
        protocol: u.protocol,
        hostname: u.hostname,
        secure: secure,
        local: local,
        privateHost: privateHost,
        craigTunnel: craigTunnel,
        developmentHarness: local || privateHost || craigTunnel,
        productReady: secure && !(local || privateHost || craigTunnel),
        reason: insecurePublic ? 'insecure-public-endpoint' : 'ok'
      };
    } catch (_) {
      return { ok: false, endpoint: '', channel: channel, reason: 'bad-url' };
    }
  }

  function normalizeAuth(input, win) {
    input = input || {};
    var token = safeString(input.token || input.bearer || (win && win.GSK_API_KEY) || '');
    return {
      provider: input.provider || (token ? 'bearer' : 'none'),
      bearerPresent: !!token,
      tokenPreview: token ? (token.slice(0, 4) + '…' + token.slice(-2)) : ''
    };
  }

  function inferProfile(input, endpoints, env) {
    input = input || {};
    if (input.profile) return input.profile;
    var loc = getLoc(env);
    if (input.embedded === true) return 'embedded';
    if (pageIsLocal(loc)) return 'dev-local';
    var anyProduct = endpoints.gsk.productReady || endpoints.thoughts.productReady || endpoints.sanctum.productReady;
    if (anyProduct) return 'hosted';
    return 'static';
  }

  function wallSignals(endpoints) {
    var list = [];
    Object.keys(endpoints).forEach(function (name) {
      var e = endpoints[name];
      if (!e.ok) list.push({ endpoint: name, reason: e.reason });
      if (e.developmentHarness) list.push({ endpoint: name, reason: 'development-harness', host: e.hostname });
    });
    return list;
  }

  function build(input, env) {
    input = input || {};
    env = env || {};
    var win = input.window || env.window || getWin();
    var raw = clone(input);
    var prior = (win && win.GENESIS_RUNTIME_MANIFEST && typeof win.GENESIS_RUNTIME_MANIFEST === 'object') ? win.GENESIS_RUNTIME_MANIFEST : {};
    var endpointsIn = Object.assign({}, prior.endpoints || {}, input.endpoints || {});

    var endpoints = {
      gsk: normalizeEndpoint(firstEndpoint(endpointsIn.gsk, endpointsIn.mcp, win && win.GSK_ENDPOINT, DEFAULT_GSK_HTTP), 'mcp', env),
      thoughts: normalizeEndpoint(firstEndpoint(endpointsIn.thoughts, endpointsIn.gskThoughts, win && win.GSK_WS_ENDPOINT, DEFAULT_GSK_WS), 'thoughts', env),
      sanctum: normalizeEndpoint(firstEndpoint(endpointsIn.sanctum, endpointsIn.lobby, win && win.SANCTUM_WS_ENDPOINT, DEFAULT_SANCTUM_WS), 'sanctum', env)
    };
    var auth = normalizeAuth(Object.assign({}, prior.auth || {}, input.auth || {}), win);
    var profile = inferProfile(Object.assign({}, prior, input), endpoints, env);
    var walls = wallSignals(endpoints);
    var dependsOnCraigPC = walls.some(function (w) { return w.reason === 'development-harness'; });
    var productReady = !dependsOnCraigPC && endpoints.gsk.productReady && endpoints.thoughts.productReady;
    var createdAt = now();

    var manifest = {
      version: VERSION,
      name: 'genesis-runtime-manifest',
      profile: profile,
      source: input.source || prior.source || 'runtime-manifest',
      createdAt: createdAt,
      productReady: productReady,
      dependsOnCraigPC: dependsOnCraigPC,
      endpoints: endpoints,
      auth: auth,
      routes: {
        'agent://gsk': {
          uri: 'agent://gsk',
          role: 'mind',
          capabilities: ['mcp', 'thoughts', 'observe', 'dispatch', 'learn'],
          adapters: {
            mcp: { kind: 'http', endpoint: endpoints.gsk.endpoint, productReady: endpoints.gsk.productReady },
            thoughts: { kind: 'websocket', endpoint: endpoints.thoughts.endpoint, productReady: endpoints.thoughts.productReady }
          }
        },
        'agent://scribe': {
          uri: 'agent://scribe',
          role: 'witness',
          capabilities: ['thoughts', 'witness'],
          adapters: {
            thoughts: { kind: 'websocket', endpoint: endpoints.thoughts.endpoint, productReady: endpoints.thoughts.productReady }
          }
        },
        'agent://sanctum': {
          uri: 'agent://sanctum',
          role: 'lobby',
          capabilities: ['lobby', 'presence'],
          adapters: {
            lobby: { kind: 'websocket', endpoint: endpoints.sanctum.endpoint, productReady: endpoints.sanctum.productReady }
          }
        }
      },
      diagnostics: {
        walls: walls,
        raw: raw && raw.window ? '[window omitted]' : raw,
        doctrine: 'WALLS_OF_WALLMERIA_EPL_V0_1'
      }
    };
    return manifest;
  }

  function createApi(Genesis) {
    var current = null;
    function set(input, env) {
      current = build(input || {}, env || {});
      var w = getWin();
      if (w) {
        w.GENESIS_RUNTIME_MANIFEST = current;
        w.GenesisRuntimeManifest = api;
      }
      return current;
    }
    function get() {
      if (!current) current = build({}, {});
      return current;
    }
    function endpoint(name) {
      var m = get();
      var e = m.endpoints && m.endpoints[name];
      return e ? e.endpoint : '';
    }
    function route(uri) {
      var m = get();
      return m.routes && m.routes[uri] ? m.routes[uri] : null;
    }
    function summary() {
      var m = get();
      return {
        version: m.version,
        profile: m.profile,
        productReady: m.productReady,
        dependsOnCraigPC: m.dependsOnCraigPC,
        endpoints: {
          gsk: m.endpoints.gsk.reason,
          thoughts: m.endpoints.thoughts.reason,
          sanctum: m.endpoints.sanctum.reason
        },
        wallCount: m.diagnostics.walls.length,
        routes: Object.keys(m.routes)
      };
    }
    var api = { VERSION: VERSION, build: build, set: set, current: get, endpoint: endpoint, route: route, summary: summary };
    return api;
  }

  function install(Genesis) {
    if (!Genesis) return;
    if (Genesis.RuntimeManifest) return;
    var api = createApi(Genesis);
    Genesis.RuntimeManifest = api;
    api.set({}, {});
    if (typeof Genesis.registerModule === 'function') {
      Genesis.registerModule('runtime-manifest', { status: 'validated', path: './src/genesis/runtime-manifest.js', gun: 'EPL' });
    }
  }

  if (typeof module !== 'undefined' && module.exports) module.exports = { install: install, build: build, normalizeEndpoint: normalizeEndpoint };
  if (typeof window !== 'undefined') {
    window.GenesisRuntimeManifestFactory = { install: install, build: build, normalizeEndpoint: normalizeEndpoint };
    if (window.Genesis) install(window.Genesis);
  }
})();
