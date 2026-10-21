/**
 * Power: API Gateway / Service Mesh
 *
 * Designs API gateways, configures routing, generates gateway configs,
 * and produces auth plugin stubs for edge security.
 *
 * Grafted from:
 * - Kong/kong (43,000★)
 * - envoyproxy/envoy (24,000★)
 * - traefik/traefik (63,000★)
 *
 * What it does:
 * - Designs gateway topology (edge → route → service)
 * - Generates Kong/Envoy/Traefik/Nginx config files
 * - Adds routes with path, method, upstream, and transforms
 * - Generates auth plugins (JWT, OAuth2, API Key, mTLS)
 */

const fs = require('fs');
const path = require('path');

class PowerApiGateway {
  constructor(config = {}) {
    this.config = config;
    this.state = {
      status: 'idle',
      gatewaysDesigned: 0,
      configsGenerated: 0,
      routesAdded: 0,
      authConfigsGenerated: 0,
      lastAction: null
    };
  }

  /**
   * Execute an API gateway mission
   * @param {Object} mission - { action, payload }
   */
  execute(mission) {
    const { action, payload } = mission;
    this.state.status = 'executing';
    this.state.lastAction = action;

    switch (action) {
      case 'design':
        return this.designGateway(payload.name, payload.upstreams, payload.outputPath);
      case 'config':
        return this.generateConfig(payload.type, payload.routes, payload.outputPath);
      case 'route':
        return this.addRoute(payload.gatewayConfig, payload.route, payload.type);
      case 'auth':
        return this.generateAuth(payload.authType, payload.config, payload.outputPath);
      default:
        throw new Error(`Unknown action: ${action}`);
    }
  }

  /**
   * Design a gateway topology document
   */
  designGateway(name, upstreams = [], outputPath) {
    const design = {
      name,
      edge: { type: 'gateway', ssl: true, rateLimiting: true },
      routes: [],
      upstreams: upstreams.map(u => ({
        name: u.name,
        url: u.url,
        healthCheck: u.healthCheck || '/health',
        retries: u.retries || 3,
        timeout: u.timeout || 30000,
        loadBalancing: u.loadBalancing || 'round-robin'
      })),
      plugins: ['rate-limiting', 'cors', 'logging'],
      auth: { enabled: false, type: null }
    };

    upstreams.forEach(u => {
      design.routes.push({
        path: u.routePrefix || `/api/${u.name}`,
        methods: u.methods || ['GET', 'POST', 'PUT', 'DELETE'],
        upstream: u.name,
        stripPath: u.stripPath !== false,
        transforms: u.transforms || []
      });
    });

    const lines = [`API Gateway Design: ${name}`, ''];
    lines.push('Edge Configuration:');
    lines.push(`  SSL: ${design.edge.ssl ? 'enabled' : 'disabled'}`);
    lines.push(`  Rate Limiting: ${design.edge.rateLimiting ? 'enabled' : 'disabled'}`);
    lines.push('');
    lines.push('Upstreams:');
    design.upstreams.forEach(u => {
      lines.push(`  ${u.name} → ${u.url} (retries=${u.retries}, timeout=${u.timeout}ms, lb=${u.loadBalancing})`);
    });
    lines.push('');
    lines.push('Routes:');
    design.routes.forEach(r => {
      lines.push(`  ${r.methods.join('|')} ${r.path} → ${r.upstream}`);
    });
    lines.push('');
    lines.push('Plugins:');
    design.plugins.forEach(p => lines.push(`  - ${p}`));

    const diagram = lines.join('\n');

    if (outputPath) {
      fs.writeFileSync(outputPath, JSON.stringify({ design, diagram }, null, 2), 'utf8');
    }

    this.state.gatewaysDesigned++;
    return { name, upstreams: design.upstreams.length, routes: design.routes.length, design, diagram, outputPath };
  }

  /**
   * Generate a gateway configuration file
   */
  generateConfig(type = 'kong', routes = [], outputPath) {
    let config = '';

    if (type === 'kong') {
      const services = routes.map(r => `  - name: ${r.name || 'service'}\n    url: ${r.upstreamUrl}\n    routes:\n      - name: ${r.name || 'route'}_route\n        paths:\n          - ${r.path}\n        methods:\n${(r.methods || ['GET']).map(m => `          - ${m}`).join('\n')}\n        strip_path: ${r.stripPath !== false ? 'true' : 'false'}`).join('\n');

      config = `_format_version: "3.0"\nservices:\n${services}\n`;
    }

    if (type === 'envoy') {
      const clusters = routes.map(r => `  - name: ${r.name}\n    connect_timeout: 5s\n    type: STRICT_DNS\n    lb_policy: ROUND_ROBIN\n    load_assignment:\n      cluster_name: ${r.name}\n      endpoints:\n        - lb_endpoints:\n          - endpoint:\n              address:\n                socket_address:\n                  address: ${r.host || '127.0.0.1'}\n                  port_value: ${r.port || 80}`).join('\n');

      const virtualHosts = routes.map(r => `            - match:\n                prefix: "${r.path}"\n              route:\n                cluster: ${r.name}`).join('\n');

      config = `static_resources:\n  listeners:\n    - name: listener_0\n      address:\n        socket_address:\n          address: 0.0.0.0\n          port_value: 8080\n      filter_chains:\n        - filters:\n            - name: envoy.filters.network.http_connection_manager\n              typed_config:\n                "@type": type.googleapis.com/envoy.extensions.filters.network.http_connection_manager.v3.HttpConnectionManager\n                stat_prefix: ingress_http\n                route_config:\n                  name: local_route\n                  virtual_hosts:\n                    - name: backend\n                      domains: ["*"]\n                      routes:\n${virtualHosts}\n                http_filters:\n                  - name: envoy.filters.http.router\n                    typed_config:\n                      "@type": type.googleapis.com/envoy.extensions.filters.http.router.v3.Router\n  clusters:\n${clusters}\n`;
    }

    if (type === 'traefik') {
      const routers = routes.map(r => `  ${r.name}:\n    rule: "PathPrefix(\`${r.path}\`)"\n    service: ${r.name}\n    entryPoints:\n      - web`).join('\n');
      const services = routes.map(r => `  ${r.name}:\n    loadBalancer:\n      servers:\n        - url: "${r.upstreamUrl}"`).join('\n');

      config = `http:\n  routers:\n${routers}\n  services:\n${services}\n`;
    }

    if (type === 'nginx') {
      const locations = routes.map(r => `    location ${r.path} {\n        proxy_pass ${r.upstreamUrl};\n        proxy_set_header Host $host;\n        proxy_set_header X-Real-IP $remote_addr;\n    }`).join('\n\n');

      config = `server {\n    listen 80;\n    server_name _;\n\n${locations}\n}\n`;
    }

    if (outputPath) {
      const ext = type === 'kong' ? 'yaml' : type === 'envoy' ? 'yaml' : type === 'traefik' ? 'yaml' : 'conf';
      fs.writeFileSync(outputPath.replace(/\.(ya?ml|conf|json)$/, '') + `.${ext}`, config, 'utf8');
    }

    this.state.configsGenerated++;
    return { type, routes: routes.length, config, outputPath };
  }

  /**
   * Add a route to an existing gateway config object
   */
  addRoute(gatewayConfig, route, type = 'kong') {
    const newRoute = {
      path: route.path,
      methods: route.methods || ['GET'],
      upstream: route.upstream,
      upstreamUrl: route.upstreamUrl,
      stripPath: route.stripPath !== false,
      name: route.name || `route_${Date.now()}`
    };

    if (type === 'kong') {
      const serviceEntry = `  - name: ${newRoute.name}\n    url: ${newRoute.upstreamUrl}\n    routes:\n      - name: ${newRoute.name}_route\n        paths:\n          - ${newRoute.path}\n        methods:\n${newRoute.methods.map(m => `          - ${m}`).join('\n')}\n        strip_path: ${newRoute.stripPath ? 'true' : 'false'}`;

      return {
        type: 'kong',
        appendedConfig: serviceEntry,
        route: newRoute,
        note: 'Append this service block to the kong.yaml services list'
      };
    }

    if (type === 'traefik') {
      const router = `  ${newRoute.name}:\n    rule: "PathPrefix(\`${newRoute.path}\`)"\n    service: ${newRoute.name}\n    entryPoints:\n      - web`;
      const service = `  ${newRoute.name}:\n    loadBalancer:\n      servers:\n        - url: "${newRoute.upstreamUrl}"`;

      return {
        type: 'traefik',
        appendedConfig: `${router}\n${service}`,
        route: newRoute,
        note: 'Append router to http.routers and service to http.services'
      };
    }

    if (type === 'nginx') {
      const location = `    location ${newRoute.path} {\n        proxy_pass ${newRoute.upstreamUrl};\n        proxy_set_header Host $host;\n        proxy_set_header X-Real-IP $remote_addr;\n    }`;

      return {
        type: 'nginx',
        appendedConfig: location,
        route: newRoute,
        note: 'Append this location block inside the server directive'
      };
    }

    return { type, route: newRoute, appendedConfig: JSON.stringify(newRoute, null, 2) };
  }

  /**
   * Generate an auth configuration / plugin stub
   */
  generateAuth(authType = 'jwt', config = {}, outputPath) {
    let code = '';
    let name = '';

    if (authType === 'jwt') {
      name = 'jwt-auth';
      code = `/**
 * JWT Authentication Plugin
 * Grafted from Kong JWT plugin patterns
 */

function jwtAuth(req, res, next) {
  const authHeader = req.headers['authorization'];
  if (!authHeader) {
    return res.status(401).json({ error: 'Missing Authorization header' });
  }

  const token = authHeader.replace('Bearer ', '');
  if (!token) {
    return res.status(401).json({ error: 'Missing token' });
  }

  try {
    // TODO: Verify with your JWT secret / JWKS endpoint
    const payload = verifyToken(token, '${config.secret || 'SECRET_KEY'}');
    req.user = payload;
    next();
  } catch (err) {
    return res.status(403).json({ error: 'Invalid token' });
  }
}

function verifyToken(token, secret) {
  // In production: use jsonwebtoken or jose library
  return { sub: 'user-id', roles: ['user'] };
}

module.exports = { jwtAuth, verifyToken };
`;
    }

    if (authType === 'apikey') {
      name = 'apikey-auth';
      code = `/**
 * API Key Authentication Plugin
 */

const validKeys = new Set(${JSON.stringify(config.keys || ['dev-key-123'])});

function apiKeyAuth(req, res, next) {
  const key = req.headers['x-api-key'] || req.query.apiKey;
  if (!key) {
    return res.status(401).json({ error: 'Missing API key' });
  }

  if (!validKeys.has(key)) {
    return res.status(403).json({ error: 'Invalid API key' });
  }

  req.apiKey = key;
  next();
}

module.exports = { apiKeyAuth };
`;
    }

    if (authType === 'oauth2') {
      name = 'oauth2-auth';
      code = `/**
 * OAuth2 / OIDC Authentication Plugin
 */

function oauth2Auth(req, res, next) {
  const authHeader = req.headers['authorization'];
  if (!authHeader) {
    return res.status(401).json({ error: 'Missing Authorization header' });
  }

  const token = authHeader.replace('Bearer ', '');
  // TODO: Introspect token at ${config.introspectionEndpoint || 'https://auth.example.com/oauth2/introspect'}
  const active = introspectToken(token);
  if (!active) {
    return res.status(403).json({ error: 'Token inactive or expired' });
  }

  req.token = token;
  next();
}

function introspectToken(token) {
  // In production: POST to introspection endpoint
  return true;
}

module.exports = { oauth2Auth, introspectToken };
`;
    }

    if (authType === 'mtls') {
      name = 'mtls-auth';
      code = `/**
 * Mutual TLS (mTLS) Authentication Plugin
 */

function mtlsAuth(req, res, next) {
  const cert = req.socket.getPeerCertificate();
  if (!cert || Object.keys(cert).length === 0) {
    return res.status(401).json({ error: 'Client certificate required' });
  }

  if (!cert.authorized) {
    return res.status(403).json({ error: 'Client certificate not authorized' });
  }

  req.clientCert = {
    subject: cert.subject,
    issuer: cert.issuer,
    fingerprint: cert.fingerprint
  };
  next();
}

module.exports = { mtlsAuth };
`;
    }

    if (outputPath) {
      fs.writeFileSync(outputPath, code, 'utf8');
    }

    this.state.authConfigsGenerated++;
    return { authType, name, code, outputPath };
  }

  /**
   * Get current power status
   */
  status() {
    return {
      power: 'ApiGateway',
      status: this.state.status,
      gatewaysDesigned: this.state.gatewaysDesigned,
      configsGenerated: this.state.configsGenerated,
      routesAdded: this.state.routesAdded,
      authConfigsGenerated: this.state.authConfigsGenerated,
      lastAction: this.state.lastAction,
      ready: true
    };
  }
}

module.exports = PowerApiGateway;

// CLI demo
if (require.main === module) {
  const power = new PowerApiGateway();

  console.log('🔌 Power: API Gateway');
  console.log('Status:', power.status());
  console.log('');

  // Design demo
  const design = power.designGateway('acme-gateway', [
    { name: 'user-service', url: 'http://user-service:8080', routePrefix: '/api/users' },
    { name: 'order-service', url: 'http://order-service:8080', routePrefix: '/api/orders', methods: ['GET', 'POST'] },
    { name: 'inventory-service', url: 'http://inventory-service:8080', routePrefix: '/api/inventory' }
  ]);
  console.log('✅ Gateway designed:', design.name);
  console.log('   Upstreams:', design.upstreams);
  console.log('   Routes:', design.routes);
  console.log('');
  console.log(design.diagram);

  // Config demo
  const kongConfig = power.generateConfig('kong', [
    { name: 'users', path: '/api/users', upstreamUrl: 'http://user-service:8080', methods: ['GET', 'POST', 'PUT', 'DELETE'] },
    { name: 'orders', path: '/api/orders', upstreamUrl: 'http://order-service:8080', methods: ['GET', 'POST'] }
  ]);
  console.log('✅ Kong config generated:', kongConfig.routes, 'routes');

  const traefikConfig = power.generateConfig('traefik', [
    { name: 'users', path: '/api/users', upstreamUrl: 'http://user-service:8080' }
  ]);
  console.log('✅ Traefik config generated');

  // Add route demo
  const newRoute = power.addRoute(kongConfig, { path: '/api/payments', upstreamUrl: 'http://payment-service:8080', methods: ['POST'], name: 'payments' }, 'kong');
  console.log('✅ Route added:', newRoute.route.name, '→', newRoute.route.path);

  // Auth demo
  const jwt = power.generateAuth('jwt', { secret: 'acme-secret' });
  console.log('✅ Auth plugin generated:', jwt.authType);
  const apiKey = power.generateAuth('apikey', { keys: ['prod-key-abc', 'prod-key-def'] });
  console.log('✅ Auth plugin generated:', apiKey.authType);

  console.log('');
  console.log('Final Status:', power.status());
}
