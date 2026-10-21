// transport-adapter.js — WALLMERIA/EPL v0.1
// ============================================================================
// Transport adapter registry for runtime routes. This file does not force a
// network call. It classifies configured transports and exposes optional request
// / connect helpers so hosted/desktop/docker profiles can plug in safely later.
(function () {
  function safeString(v) { return (v == null) ? '' : String(v).trim(); }
  function classify(endpoint) {
    endpoint = safeString(endpoint);
    if (!endpoint) return { configured: false, developmentHarness: false, productReady: false, reason: 'missing' };
    try {
      var u = new URL(endpoint);
      var host = u.hostname;
      var local = /^(localhost|127(?:\.\d{1,3}){3}|0\.0\.0\.0|\[::1\]|::1)$/i.test(host);
      var privateHost = /^(10(?:\.\d{1,3}){3}|192\.168(?:\.\d{1,3}){2}|172\.(1[6-9]|2\d|3[0-1])(?:\.\d{1,3}){2})$/.test(host);
      var tunnel = /(^|\.)abc-tunnel\.us$/i.test(host);
      var secure = u.protocol === 'https:' || u.protocol === 'wss:';
      var developmentHarness = local || privateHost || tunnel;
      return { configured: true, endpoint: endpoint, protocol: u.protocol, host: host, secure: secure, local: local, privateHost: privateHost, craigTunnel: tunnel, developmentHarness: developmentHarness, productReady: secure && !developmentHarness, reason: developmentHarness ? 'development-harness' : (secure ? 'product-route' : 'insecure-route') };
    } catch (_) {
      return { configured: false, developmentHarness: false, productReady: false, reason: 'bad-url' };
    }
  }

  function makeAdapter(id, config) {
    config = config || {};
    var kind = config.kind || 'unknown';
    var endpoint = safeString(config.endpoint || '');
    var meta = classify(endpoint);
    if (kind === 'embedded') meta = { configured: true, endpoint: '', productReady: !!config.productReady, developmentHarness: false, reason: 'embedded' };
    return {
      id: id,
      kind: kind,
      endpoint: endpoint,
      productReady: !!meta.productReady,
      developmentHarness: !!meta.developmentHarness,
      health: function () {
        return { ok: meta.configured, id: id, kind: kind, endpoint: endpoint, status: meta.reason, productReady: !!meta.productReady, developmentHarness: !!meta.developmentHarness };
      },
      request: function (path, options) {
        if (kind !== 'http') return Promise.resolve({ ok: false, error: 'not-http-adapter' });
        if (!endpoint) return Promise.resolve({ ok: false, error: 'missing-endpoint' });
        if (typeof fetch === 'undefined') return Promise.resolve({ ok: false, error: 'fetch-unavailable' });
        var url = endpoint.replace(/\/$/, '') + (path || '');
        return fetch(url, options || {});
      },
      connect: function () {
        if (kind !== 'websocket') return { ok: false, error: 'not-websocket-adapter' };
        if (!endpoint) return { ok: false, error: 'missing-endpoint' };
        if (typeof WebSocket === 'undefined') return { ok: false, error: 'websocket-unavailable' };
        try { return { ok: true, socket: new WebSocket(endpoint) }; } catch (e) { return { ok: false, error: (e && e.message) || 'connect-failed' }; }
      }
    };
  }

  function install(Genesis) {
    if (!Genesis) return;
    if (Genesis.TransportAdapter) return;
    if (!Genesis.AgentRouteTable && typeof require !== 'undefined') {
      try { require('./agent-route-table').install(Genesis); } catch (_) {}
    }
    var adapters = new Map();

    function key(uri, channel) { return uri + '#' + (channel || 'default'); }
    function register(uri, channel, config) {
      if (!uri || !channel) return { ok: false, error: 'missing-uri-channel' };
      var id = key(uri, channel);
      var adapter = makeAdapter(id, config || {});
      adapters.set(id, adapter);
      return { ok: true, id: id, adapter: adapter };
    }
    function installFromRouteTable() {
      var table = Genesis.AgentRouteTable;
      if (!table || typeof table.snapshot !== 'function') return 0;
      var snap = table.snapshot();
      var count = 0;
      Object.keys(snap).forEach(function (uri) {
        var rec = snap[uri];
        Object.keys((rec && rec.adapters) || {}).forEach(function (channel) {
          if (register(uri, channel, rec.adapters[channel]).ok) count++;
        });
      });
      return count;
    }
    function get(uri, channel) { return adapters.get(key(uri, channel)) || null; }
    function health(uri, channel) {
      if (uri && channel) {
        var a = get(uri, channel);
        return a ? a.health() : { ok: false, id: key(uri, channel), status: 'missing-adapter' };
      }
      var out = [];
      adapters.forEach(function (a) { out.push(a.health()); });
      return out;
    }
    function summary() {
      var h = health();
      var productReady = h.length > 0 && h.every(function (x) { return x.productReady || x.status === 'embedded'; });
      return { count: adapters.size, productReady: productReady, adapters: h };
    }
    var API = { classify: classify, makeAdapter: makeAdapter, register: register, installFromRouteTable: installFromRouteTable, get: get, health: health, summary: summary };
    Genesis.TransportAdapter = API;
    installFromRouteTable();
    if (typeof Genesis.registerModule === 'function') {
      Genesis.registerModule('transport-adapter', { status: 'validated', path: './src/genesis/transport-adapter.js', gun: 'EPL' });
    }
  }

  if (typeof module !== 'undefined' && module.exports) module.exports = { install: install, classify: classify, makeAdapter: makeAdapter };
  if (typeof window !== 'undefined' && window.Genesis) install(window.Genesis);
})();
