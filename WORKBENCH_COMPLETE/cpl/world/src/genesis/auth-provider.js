// auth-provider.js — P55/P111 Engine Auth Provider
// ============================================================================
// Normalizes bearer/session auth for HTTP + WebSocket routes. No secrets are
// logged; token previews are redacted. This belongs to the engine host profile.
(function () {
  function install(Genesis) {
    if (!Genesis) return;
    if (Genesis.AuthProvider) return;
    var state = { provider: 'none', token: '', headerName: 'Authorization', queryName: 'token', updatedAt: 0 };
    function now() { return Date.now ? Date.now() : new Date().getTime(); }
    function redact(token) { token = token || ''; return token ? token.slice(0, 4) + '…' + token.slice(-2) : ''; }
    function configure(opts) {
      opts = opts || {};
      state.provider = opts.provider || (opts.token || opts.bearer ? 'bearer' : state.provider || 'none');
      state.token = opts.token || opts.bearer || state.token || '';
      state.headerName = opts.headerName || state.headerName || 'Authorization';
      state.queryName = opts.queryName || state.queryName || 'token';
      state.updatedAt = now();
      try {
        if (Genesis.RuntimeManifest && Genesis.RuntimeManifest.current) {
          var m = Genesis.RuntimeManifest.current();
          m.auth = { provider: state.provider, bearerPresent: !!state.token, tokenPreview: redact(state.token) };
        }
      } catch (_) {}
      return summary();
    }
    function setToken(token) { return configure({ provider: token ? 'bearer' : 'none', token: token || '' }); }
    function headers(extra) {
      var h = Object.assign({}, extra || {});
      if (state.provider === 'bearer' && state.token) h[state.headerName] = state.headerName.toLowerCase() === 'authorization' ? ('Bearer ' + state.token) : state.token;
      return h;
    }
    function signUrl(url) {
      if (!url || state.provider !== 'bearer' || !state.token) return url || '';
      try { var u = new URL(url); u.searchParams.set(state.queryName, state.token); return u.toString(); } catch (_) { return url; }
    }
    function verifyBearer(value) {
      if (!state.token) return { ok: false, error: 'no-token-configured' };
      value = value || '';
      if (value.indexOf('Bearer ') === 0) value = value.slice(7);
      return { ok: value === state.token };
    }
    function summary() { return { provider: state.provider, bearerPresent: !!state.token, tokenPreview: redact(state.token), headerName: state.headerName, queryName: state.queryName, updatedAt: state.updatedAt }; }

    var API = { configure: configure, setToken: setToken, headers: headers, signUrl: signUrl, verifyBearer: verifyBearer, summary: summary };
    Genesis.AuthProvider = API;
    try {
      var w = typeof window !== 'undefined' ? window : null;
      var token = (w && (w.GSK_API_KEY || (w.sessionStorage && w.sessionStorage.getItem && w.sessionStorage.getItem('cpl-soul-key')))) || '';
      if (token) configure({ provider: 'bearer', token: token });
    } catch (_) {}
    if (typeof Genesis.registerModule === 'function') Genesis.registerModule('auth-provider', { status: 'validated', path: './src/genesis/auth-provider.js', gun: 'AUTH' });
  }
  if (typeof module !== 'undefined' && module.exports) module.exports = { install: install };
  if (typeof window !== 'undefined' && window.Genesis) install(window.Genesis);
})();
