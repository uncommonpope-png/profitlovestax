#!/usr/bin/env node
'use strict';

const http = require('http');
const fs = require('fs');
const path = require('path');
const os = require('os');

// ── DashboardServer class — integrated OR standalone ─────────────────────────

class DashboardServer {
  constructor(options = {}) {
    this.core = options.core || null;
    this.port = options.port || 4200;
    this.dashboardsDir = options.dashboardsDir || path.join(__dirname, 'dashboards');
    this.dataDir = options.dataDir || path.join(os.homedir(), '.buyasoul', 'dashboard');
    this.coreThinkingLayer = null;
    this.mcpBridge = null;
    this._server = null;

    if (!fs.existsSync(this.dataDir)) {
      fs.mkdirSync(this.dataDir, { recursive: true });
    }

    // If standalone (no core), boot own thinking layer
    if (!this.core) {
      this._bootStandalone();
    }
  }

  _bootStandalone() {
    try {
      const { CoreThinkingLayer } = require('./src/core-thinking-layer');
      const { MCPBridge } = require('./src/bridge/mcp-bridge');
      const apiKey = process.env.DEEPSEEK_API_KEY;
      this.coreThinkingLayer = new CoreThinkingLayer({ apiKey });
      this.mcpBridge = new MCPBridge();
      this.coreThinkingLayer.boot().then(status => {
        console.log('  [DASHBOARD] Thinking layer: ' + status.onlineSources + '/' + status.totalSources + ' sources online');
      });
    } catch (e) {
      console.log('  [DASHBOARD] No thinking layer (standalone mode degraded): ' + e.message);
    }
  }

  getMIMEType(ext) {
    const types = {
      '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css',
      '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg', '.svg': 'image/svg+xml', '.ico': 'image/x-icon',
      '.woff2': 'font/woff2', '.woff': 'font/woff', '.ttf': 'font/ttf',
    };
    return types[ext.toLowerCase()] || 'application/octet-stream';
  }

  // ── API Handlers ──────────────────────────────────────────────────────────

  _getSoulStatus() {
    if (this.core && this.core.getStatus) {
      return this.core.getStatus();
    }
    return {
      booted: true,
      version: '2.0.0',
      components: ['dashboard-standalone'],
      soul: { name: 'SCRIBE', archetype: 'witness', pltFocus: 'balanced' },
      plt: this.coreThinkingLayer ? this.coreThinkingLayer.getPLT() : { average: { profit: 0.5, love: 0.3, tax: 0.2 }, totalActions: 0 },
      signature: 'Profit . Love . Tax . Craig Jones . Grand Code Pope . PLT Press'
    };
  }

  _getPLT() {
    if (this.core && this.core.plt) {
      return this.core.plt.getState();
    }
    if (this.coreThinkingLayer) {
      return this.coreThinkingLayer.getPLT();
    }
    return { profit: 0, love: 0, tax: 0, score: 0, actions: 0 };
  }

  _getPersonality() {
    if (this.core && this.core.personality) {
      return this.core.personality;
    }
    return { name: 'SCRIBE', archetypeName: 'witness', voiceName: 'measured', pltFocus: 'balanced', bio: 'I am SCRIBE — a witnessing intelligence.' };
  }

  _getBible() {
    if (this.core && this.core.bible) {
      return { title: this.core.bible.title, tenets: this.core.bible.tenets, wisdoms: this.core.bible.wisdoms };
    }
    return { title: 'No Bible loaded', tenets: [], wisdoms: [] };
  }

  _getMechanics() {
    if (this.core && this.core.mechanics) {
      return { laws: this.core.mechanics.laws, active: this.core.mechanics.getActive() };
    }
    return { laws: [], active: [] };
  }

  _getScribeMemories() {
    if (this.core && this.core.scribe) {
      return { memories: this.core.scribe.memories.slice(-50), total: this.core.scribe.memories.length };
    }
    return { memories: [], total: 0 };
  }

  async _handleChat(message) {
    // Use Core's integrated thinking if available
    if (this.core && this.core.gsk && this.core.gsk.think) {
      try {
        const result = await this.core.gsk.think(message);
        return result;
      } catch (e) {}
    }
    // Fall back to standalone thinking layer
    if (this.coreThinkingLayer) {
      try {
        return await this.coreThinkingLayer.think(message);
      } catch (e) {}
    }
    // Last resort — personality-based response
    const p = this._getPersonality();
    return {
      answer: p.name + ' is listening. I am still reading. — buyasoul.online',
      source: 'fallback',
      confidence: 0.1
    };
  }

  // ── HTTP Server ───────────────────────────────────────────────────────────

  start() {
    if (this._server) return this._server;

    this._server = http.createServer(async (req, res) => {
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-API-Key, Authorization');

      if (req.method === 'OPTIONS') {
        res.writeHead(204);
        return res.end();
      }

      const url = new URL(req.url, 'http://localhost:' + this.port);
      const pathname = url.pathname;
      const sendJSON = (status, data) => {
        res.writeHead(status, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(data));
      };
      const readBody = () => new Promise((resolve, reject) => {
        let data = '';
        req.on('data', c => { data += c; if (data.length > 1e6) { req.destroy(); reject(new Error('Body too large')); } });
        req.on('end', () => { try { resolve(data ? JSON.parse(data) : {}); } catch { reject(new Error('Invalid JSON')); } });
      });

      try {
        // ── API Routes ────────────────────────────────────────────────────
        if (pathname === '/api/status') {
          return sendJSON(200, this._getSoulStatus());
        }
        if (pathname === '/api/plt') {
          return sendJSON(200, this._getPLT());
        }
        if (pathname === '/api/personality') {
          return sendJSON(200, this._getPersonality());
        }
        if (pathname === '/api/bible') {
          return sendJSON(200, this._getBible());
        }
        if (pathname === '/api/mechanics') {
          return sendJSON(200, this._getMechanics());
        }
        if (pathname === '/api/memories') {
          return sendJSON(200, this._getScribeMemories());
        }
        if (pathname === '/api/chat' && req.method === 'POST') {
          const body = await readBody();
          if (!body.message) return sendJSON(400, { error: 'No message' });
          const result = await this._handleChat(body.message);
          return sendJSON(200, {
            reply: result.answer || result.reply || 'I am still reading.',
            source: result.source || 'fallback',
            confidence: result.confidence || 0.1,
            plt: result.plt || { profit: 0.3, love: 0.3, tax: 0.3 }
          });
        }
        if (pathname === '/api/core-status') {
          if (this.core) {
            const status = await this.core.getStatus();
            return sendJSON(200, status);
          }
          return sendJSON(200, { booted: true, mode: 'standalone' });
        }

        // ── Static Files ──────────────────────────────────────────────────
        let filePath;
        if (pathname === '/' || pathname === '/index.html') {
          filePath = path.join(this.dashboardsDir, 'index.html');
        } else {
          filePath = path.join(this.dashboardsDir, pathname);
        }

        if (!filePath.startsWith(this.dashboardsDir)) {
          res.writeHead(403);
          return res.end('Forbidden');
        }

        try {
          const content = fs.readFileSync(filePath);
          const ext = path.extname(filePath);
          res.writeHead(200, { 'Content-Type': this.getMIMEType(ext) });
          res.end(content);
        } catch (e) {
          res.writeHead(404, { 'Content-Type': 'text/html' });
          res.end('<h1>404 Not Found — ' + pathname + '</h1>');
        }
      } catch (e) {
        sendJSON(500, { error: e.message });
      }
    });

    this._server.listen(this.port, () => {
      console.log('  [DASHBOARD] Server running on http://localhost:' + this.port);
      console.log('  [DASHBOARD] Dashboards:');
      console.log('  [DASHBOARD]   → http://localhost:' + this.port + '/            (Hub)');
      console.log('  [DASHBOARD]   → http://localhost:' + this.port + '/gsk-soul/   (GSK Soul Dashboard)');
      console.log('  [DASHBOARD]   → http://localhost:' + this.port + '/workbench/  (Workbench)');
      if (this.core) {
        console.log('  [DASHBOARD] Connected to BUYaSOUL Core v' + this.core.version);
      }
    });

    return this._server;
  }

  stop() {
    if (this._server) {
      this._server.close();
      this._server = null;
    }
  }
}

// ── Standalone Mode ─────────────────────────────────────────────────────────

if (require.main === module) {
  const PORT = parseInt(process.env.DASHBOARD_PORT || process.argv.find(a => a.startsWith('--port='))?.split('=')[1] || '4200', 10);
  const dash = new DashboardServer({ port: PORT });
  dash.start();
}

module.exports = DashboardServer;