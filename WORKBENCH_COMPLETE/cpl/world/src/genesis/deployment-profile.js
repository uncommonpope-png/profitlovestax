// deployment-profile.js — P56/P112 Runtime Deployment Profiles
// ============================================================================
// Defines static/dev-local/desktop/docker/vps/relay policies and can refresh the
// EPL runtime manifest + route table without hardcoding Craig's PC.
(function () {
  function install(Genesis) {
    if (!Genesis) return;
    if (Genesis.DeploymentProfile) return;
    var profiles = {
      'dev-local': { name: 'dev-local', secureRequired: false, allowLocalhost: true, allowPrivate: true, pna: 'development', productReady: false },
      'static': { name: 'static', secureRequired: true, allowLocalhost: false, allowPrivate: false, pna: 'blocked', productReady: false },
      'desktop': { name: 'desktop', secureRequired: false, allowLocalhost: true, allowPrivate: true, pna: 'packaged', productReady: true },
      'docker': { name: 'docker', secureRequired: true, allowLocalhost: false, allowPrivate: false, pna: 'host-profile', productReady: true },
      'vps': { name: 'vps', secureRequired: true, allowLocalhost: false, allowPrivate: false, pna: 'host-profile', productReady: true },
      'relay': { name: 'relay', secureRequired: true, allowLocalhost: false, allowPrivate: false, pna: 'relay', productReady: true }
    };
    var current = 'static';
    function clone(o) { try { return JSON.parse(JSON.stringify(o)); } catch (_) { return o; } }
    function define(name, policy) { if (!name || !policy) return false; profiles[name] = Object.assign({ name: name }, policy); return true; }
    function set(name, opts) {
      if (!profiles[name]) return { ok: false, error: 'unknown-profile:' + name };
      current = name;
      opts = opts || {};
      if (Genesis.RuntimeManifest && Genesis.RuntimeManifest.set) {
        Genesis.RuntimeManifest.set({ profile: name, endpoints: opts.endpoints || {}, auth: opts.auth || {} });
        if (Genesis.AgentRouteTable && Genesis.AgentRouteTable.installFromManifest) Genesis.AgentRouteTable.installFromManifest(Genesis.RuntimeManifest.current());
        if (Genesis.TransportAdapter && Genesis.TransportAdapter.installFromRouteTable) Genesis.TransportAdapter.installFromRouteTable();
      }
      return { ok: true, profile: name, policy: policy() };
    }
    function policy(name) { return clone(profiles[name || current] || profiles.static); }
    function manifestConfig(name, endpoints, auth) { return { profile: name || current, endpoints: endpoints || {}, auth: auth || {}, policy: policy(name || current) }; }
    function isProductProfile(name) { var p = profiles[name || current]; return !!(p && p.productReady); }
    function summary() { return { current: current, policy: policy(), profiles: Object.keys(profiles), productReady: isProductProfile() }; }
    var API = { define: define, set: set, policy: policy, manifestConfig: manifestConfig, isProductProfile: isProductProfile, summary: summary };
    Genesis.DeploymentProfile = API;
    try { if (Genesis.RuntimeManifest && Genesis.RuntimeManifest.current) current = Genesis.RuntimeManifest.current().profile || current; } catch (_) {}
    if (typeof Genesis.registerModule === 'function') Genesis.registerModule('deployment-profile', { status: 'validated', path: './src/genesis/deployment-profile.js', gun: 'HOST' });
  }
  if (typeof module !== 'undefined' && module.exports) module.exports = { install: install };
  if (typeof window !== 'undefined' && window.Genesis) install(window.Genesis);
})();
