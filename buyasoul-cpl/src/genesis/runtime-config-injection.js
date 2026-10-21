// runtime-config-injection.js — P57/P113 Runtime Config Injection
// ============================================================================
// Generates the public runtime manifest (`genesis-runtime.js/json`) that a
// static CPL/Genesis surface loads before `cpl-config.js`. This is the missing
// Wallmeria bridge between an engine host profile and a buyer/browser runtime.
//
// Law: never expose secrets by default. No `noAuth`. Public config may say a
// bearer token is required, but it does not include the token unless an explicit
// desktop-only `exposeToken` option is passed.
(function () {
  var VERSION = 1;
  var PRODUCT_PROFILES = { docker: true, vps: true, relay: true, desktop: true };

  function safeString(v) { return (v == null) ? '' : String(v).trim(); }
  function trimSlash(v) { return safeString(v).replace(/\/+$/, ''); }
  function now() { return Date.now ? Date.now() : new Date().getTime(); }
  function clone(obj) { try { return JSON.parse(JSON.stringify(obj)); } catch (_) { return obj; } }
  function redact(token) { token = safeString(token); return token ? (token.slice(0, 4) + '…' + token.slice(-2)) : ''; }
  function isLocalOrPrivate(url) {
    try {
      var h = new URL(url).hostname;
      return /^(localhost|127(?:\.\d{1,3}){3}|0\.0\.0\.0|\[::1\]|::1)$/i.test(h) ||
        /^(10(?:\.\d{1,3}){3}|192\.168(?:\.\d{1,3}){2}|172\.(1[6-9]|2\d|3[0-1])(?:\.\d{1,3}){2})$/.test(h);
    } catch (_) { return true; }
  }
  function toWs(url) {
    url = trimSlash(url);
    if (!url) return '';
    return url.replace(/^https:/i, 'wss:').replace(/^http:/i, 'ws:');
  }
  function defaultEndpoints(baseUrl) {
    var base = trimSlash(baseUrl);
    return {
      gsk: base,
      thoughts: toWs(base) + '/thoughts',
      sanctum: toWs(base) + '/sanctum'
    };
  }
  function normalizeEndpoints(input) {
    input = input || {};
    var base = trimSlash(input.publicBaseUrl || input.baseUrl || input.origin || '');
    var defaults = base ? defaultEndpoints(base) : { gsk: '', thoughts: '', sanctum: '' };
    var e = Object.assign({}, defaults, input.endpoints || {});
    return { gsk: trimSlash(e.gsk), thoughts: trimSlash(e.thoughts), sanctum: trimSlash(e.sanctum) };
  }
  function makeAuth(input) {
    input = input || {};
    var token = safeString(input.token || input.bearer || (input.auth && (input.auth.token || input.auth.bearer)) || '');
    var requireAuth = input.requireAuth !== false;
    return {
      provider: requireAuth ? 'bearer' : 'none',
      bearerPresent: requireAuth,
      tokenPreview: redact(token),
      headerName: (input.auth && input.auth.headerName) || 'Authorization',
      queryName: (input.auth && input.auth.queryName) || 'token',
      exposeToken: !!input.exposeToken,
      token: token
    };
  }
  function build(input) {
    input = input || {};
    var profile = input.profile || 'docker';
    var endpoints = normalizeEndpoints(input);
    var auth = makeAuth(input);
    var policy = Object.assign({
      profile: profile,
      secureRequired: profile !== 'dev-local' && profile !== 'desktop',
      allowLocalhost: profile === 'dev-local' || profile === 'desktop',
      allowPrivate: profile === 'dev-local' || profile === 'desktop',
      pna: profile === 'dev-local' ? 'development' : (profile === 'desktop' ? 'packaged' : 'host-profile')
    }, input.policy || {});
    var productReady = !!PRODUCT_PROFILES[profile] && !!endpoints.gsk && !!endpoints.thoughts && !!endpoints.sanctum && auth.provider === 'bearer';
    if (policy.secureRequired) {
      productReady = productReady && /^https:\/\//i.test(endpoints.gsk) && /^wss:\/\//i.test(endpoints.thoughts) && /^wss:\/\//i.test(endpoints.sanctum) && !isLocalOrPrivate(endpoints.gsk) && !isLocalOrPrivate(endpoints.thoughts) && !isLocalOrPrivate(endpoints.sanctum);
    }
    return {
      version: VERSION,
      name: 'genesis-runtime-manifest',
      source: input.source || 'runtime-config-injection',
      profile: profile,
      createdAt: input.createdAt || now(),
      productReady: !!productReady,
      dependsOnCraigPC: endpoints.gsk ? isLocalOrPrivate(endpoints.gsk) : true,
      endpoints: endpoints,
      auth: auth,
      policy: policy,
      doctrine: 'WALLS_OF_WALLMERIA_RUNTIME_CONFIG_P57_P113'
    };
  }
  function publicManifest(config, opts) {
    opts = opts || {};
    var c = clone(config || build({}));
    c.auth = c.auth || {};
    var token = safeString(c.auth.token || '');
    if (!(opts.exposeToken || c.auth.exposeToken)) delete c.auth.token;
    else c.auth.token = token;
    c.auth.exposeToken = !!(opts.exposeToken || c.auth.exposeToken);
    return c;
  }
  function validate(config) {
    config = config || build({});
    var errors = [];
    var e = config.endpoints || {};
    if (!e.gsk) errors.push('missing-gsk-endpoint');
    if (!e.thoughts) errors.push('missing-thoughts-endpoint');
    if (!e.sanctum) errors.push('missing-sanctum-endpoint');
    if (config.policy && config.policy.secureRequired) {
      if (!/^https:\/\//i.test(e.gsk || '')) errors.push('gsk-must-be-https');
      if (!/^wss:\/\//i.test(e.thoughts || '')) errors.push('thoughts-must-be-wss');
      if (!/^wss:\/\//i.test(e.sanctum || '')) errors.push('sanctum-must-be-wss');
      if (isLocalOrPrivate(e.gsk) || isLocalOrPrivate(e.thoughts) || isLocalOrPrivate(e.sanctum)) errors.push('product-config-cannot-use-local-or-private-host');
    }
    if (!config.auth || config.auth.provider !== 'bearer') errors.push('bearer-auth-required');
    return { ok: errors.length === 0, errors: errors, productReady: !!config.productReady };
  }
  function renderJavaScript(config, opts) {
    opts = opts || {};
    var c = publicManifest(config, opts);
    var token = c.auth && c.auth.token ? c.auth.token : '';
    return [
      '(function(){',
      '  "use strict";',
      '  var manifest = ' + JSON.stringify(c) + ';',
      '  window.GENESIS_RUNTIME_MANIFEST = manifest;',
      '  window.GSK_ENDPOINT = manifest.endpoints.gsk || window.GSK_ENDPOINT || "";',
      '  window.GSK_WS_ENDPOINT = manifest.endpoints.thoughts || window.GSK_WS_ENDPOINT || "";',
      '  window.SANCTUM_WS_ENDPOINT = manifest.endpoints.sanctum || window.SANCTUM_WS_ENDPOINT || "";',
      token ? ('  window.GSK_API_KEY = window.GSK_API_KEY || ' + JSON.stringify(token) + ';') : '  window.GSK_API_KEY = window.GSK_API_KEY || "";',
      '  window.__GENESIS_RUNTIME_CONFIG_SOURCE = "runtime-config-injection";',
      '})();',
      ''
    ].join('\n');
  }
  function renderJson(config, opts) { return JSON.stringify(publicManifest(config, opts), null, 2) + '\n'; }
  function inject(target, config, opts) {
    target = target || (typeof window !== 'undefined' ? window : null);
    if (!target) return { ok: false, error: 'missing-target' };
    var c = publicManifest(config, opts || {});
    target.GENESIS_RUNTIME_MANIFEST = c;
    target.GSK_ENDPOINT = c.endpoints.gsk || target.GSK_ENDPOINT || '';
    target.GSK_WS_ENDPOINT = c.endpoints.thoughts || target.GSK_WS_ENDPOINT || '';
    target.SANCTUM_WS_ENDPOINT = c.endpoints.sanctum || target.SANCTUM_WS_ENDPOINT || '';
    if (c.auth && c.auth.token) target.GSK_API_KEY = target.GSK_API_KEY || c.auth.token;
    target.__GENESIS_RUNTIME_CONFIG_SOURCE = 'runtime-config-injection';
    return { ok: true, manifest: c };
  }
  function install(Genesis) {
    if (!Genesis) return;
    if (Genesis.RuntimeConfigInjection) return;
    var API = { VERSION: VERSION, build: build, publicManifest: publicManifest, validate: validate, renderJavaScript: renderJavaScript, renderJson: renderJson, inject: inject };
    Genesis.RuntimeConfigInjection = API;
    if (typeof Genesis.registerModule === 'function') Genesis.registerModule('runtime-config-injection', { status: 'validated', path: './src/genesis/runtime-config-injection.js', gun: 'HOST' });
  }

  if (typeof module !== 'undefined' && module.exports) module.exports = { install: install, build: build, publicManifest: publicManifest, validate: validate, renderJavaScript: renderJavaScript, renderJson: renderJson, inject: inject };
  if (typeof window !== 'undefined') {
    window.GenesisRuntimeConfigInjection = { install: install, build: build, publicManifest: publicManifest, validate: validate, renderJavaScript: renderJavaScript, renderJson: renderJson, inject: inject };
    if (window.Genesis) install(window.Genesis);
  }
})();
