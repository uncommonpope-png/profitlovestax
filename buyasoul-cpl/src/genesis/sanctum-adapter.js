// sanctum-adapter.js — P54/P110/P86/P153 Portable Sanctum Lobby Adapter
// ============================================================================
// Engine-owned lobby/websocket contract. Offline-safe; does not require Craig's
// PC. Resolves agent://sanctum through EPL and signs with AuthProvider.
(function () {
  function install(Genesis) {
    if (!Genesis) return;
    if (Genesis.SanctumAdapter) return;
    var status = 'idle', ws = null, lastError = null, presence = new Map(), outbox = [];
    function endpoint() {
      try { if (Genesis.AgentRouteTable && Genesis.AgentRouteTable.resolveEndpoint) return Genesis.AgentRouteTable.resolveEndpoint('agent://sanctum', 'lobby'); } catch (_) {}
      try { if (typeof window !== 'undefined' && window.resolveGenesisRuntimeEndpoint) return window.resolveGenesisRuntimeEndpoint('sanctum', ''); } catch (_) {}
      try { if (typeof window !== 'undefined' && window.SANCTUM_WS_ENDPOINT) return window.SANCTUM_WS_ENDPOINT; } catch (_) {}
      return '';
    }
    function signedEndpoint() { var url = endpoint(); return (Genesis.AuthProvider && Genesis.AuthProvider.signUrl) ? Genesis.AuthProvider.signUrl(url) : url; }
    function connect() {
      var url = signedEndpoint();
      if (!url) { status = 'offline'; lastError = 'missing-endpoint'; return { ok: false, error: lastError }; }
      if (typeof WebSocket === 'undefined') { status = 'offline'; lastError = 'websocket-unavailable'; return { ok: false, error: lastError, endpoint: url }; }
      try {
        ws = new WebSocket(url); status = 'connecting';
        ws.onopen = function () { status = 'connected'; flush(); };
        ws.onmessage = function (ev) { try { ingest(typeof ev.data === 'string' ? JSON.parse(ev.data) : ev.data); } catch (_) {} };
        ws.onerror = function () { status = 'error'; lastError = 'ws-error'; };
        ws.onclose = function () { status = 'offline'; ws = null; };
        return { ok: true, endpoint: url };
      } catch (e) { status = 'error'; lastError = (e && e.message) || 'connect-failed'; return { ok: false, error: lastError }; }
    }
    function ingest(msg) { if (!msg || typeof msg !== 'object') return null; if (msg.type === 'presence' && msg.id) presence.set(msg.id, Object.assign({ at: Date.now() }, msg)); return msg; }
    function send(msg) { if (!msg || typeof msg !== 'object') return { ok: false, error: 'bad-message' }; if (ws && status === 'connected') { try { ws.send(JSON.stringify(msg)); return { ok: true, sent: true }; } catch (e) { lastError = e.message; } } outbox.push(msg); if (outbox.length > 100) outbox.shift(); return { ok: true, queued: outbox.length }; }
    function flush() { while (outbox.length && ws && status === 'connected') { try { ws.send(JSON.stringify(outbox.shift())); } catch (_) { break; } } }
    function join(id, meta) { id = id || 'agent://gsk'; presence.set(id, { id: id, meta: meta || {}, at: Date.now(), local: true }); return send({ type: 'presence', id: id, meta: meta || {} }); }
    function leave(id) { presence.delete(id); return send({ type: 'leave', id: id }); }
    function roster() { return Array.from(presence.values()); }
    function summary() { return { status: status, endpoint: endpoint(), signed: signedEndpoint() !== endpoint(), presence: presence.size, queued: outbox.length, lastError: lastError }; }
    var API = { endpoint: endpoint, signedEndpoint: signedEndpoint, connect: connect, send: send, join: join, leave: leave, ingest: ingest, roster: roster, summary: summary };
    Genesis.SanctumAdapter = API;
    if (typeof Genesis.registerModule === 'function') Genesis.registerModule('sanctum-adapter', { status: 'validated', path: './src/genesis/sanctum-adapter.js', gun: 'HOST' });
  }
  if (typeof module !== 'undefined' && module.exports) module.exports = { install: install };
  if (typeof window !== 'undefined' && window.Genesis) install(window.Genesis);
})();
