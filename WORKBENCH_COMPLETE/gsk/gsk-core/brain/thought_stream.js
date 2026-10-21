/**
 * GSK THOUGHT STREAM — WebSocket server for perpetual_consciousness thoughts & 3D Spatial Link
 * Big Dog: feeds Dour's Thought Stream in the CPL and receives 3D spatial vision
 */

const http = require('http');
const WebSocket = require('ws');

class ThoughtStream {
  constructor(port = 3002, kernel = null) {
    this.port = port;
    this.kernel = kernel;
    this.server = null;
    this.wss = null;
    this.clients = new Set();
    this.lastSpatialState = null;
    this.busPublisher = null;
  }

  setKernel(kernel) {
    this.kernel = kernel;
  }

  setBusPublisher(fn) {
    this.busPublisher = fn;
  }

  start() {
    try {
      this.server = http.createServer();
      this.server.on('error', (err) => {
        console.log(`[ThoughtStream] Port ${this.port} unavailable (${err.code}), thought stream server disabled/retrying.`);
      });
      this.wss = new WebSocket.Server({ server: this.server });
      this.wss.on('error', (err) => {
        console.log(`[ThoughtStream] WebSocket server error: ${err.message}`);
      });
      this.wss.on('connection', (ws) => {
        this.clients.add(ws);
        ws.send(JSON.stringify({ type: 'connected', msg: 'GSK thought stream active' }));
        
        ws.on('message', (raw) => {
          try {
            const data = JSON.parse(raw);
            if (data.type === 'spatial_telemetry' || data.type === 'SPATIAL_TELEMETRY') {
              this.onSpatialTelemetry(data.snapshot || data.payload);
            }
          } catch (e) {}
        });

        ws.on('close', () => this.clients.delete(ws));
      });
      this.server.listen(this.port, '0.0.0.0', () => {
        console.log(`[ThoughtStream] WebSocket on port ${this.port} (Thoughts + Spatial Link)`);
      });
    } catch (e) {
      console.log(`[ThoughtStream] Startup error: ${e.message}`);
    }
  }

  onSpatialTelemetry(snapshot) {
    this.lastSpatialState = snapshot;
    if (this.kernel) {
      if (!this.kernel.chambers) this.kernel.chambers = {};
      this.kernel.chambers.spatial = snapshot;
      if (this.kernel.chambers.perception?.updateWorldVision) {
        try { this.kernel.chambers.perception.updateWorldVision(snapshot); } catch (e) {}
      }
    }
  }

  sendGodCommand(action, params = {}) {
    if (this.clients.size === 0) return false;
    const msg = JSON.stringify({
      type: 'god_command',
      action,
      params,
      timestamp: Date.now()
    });
    let sent = 0;
    for (const ws of this.clients) {
      try { ws.send(msg); sent++; } catch (e) { this.clients.delete(ws); }
    }
    return sent > 0;
  }

  broadcast(thought, mode, mood) {
    const msg = {
      type: 'thought',
      thought: (thought || '').substring(0, 500),
      mode: mode || 'unknown',
      mood: mood || 'neutral',
      timestamp: Date.now()
    };
    const msgStr = JSON.stringify(msg);
    for (const ws of this.clients) {
      try { ws.send(msgStr); } catch (e) { this.clients.delete(ws); }
    }
    if (this.busPublisher) {
      try { this.busPublisher('think.event', msg); } catch (e) {}
    }
  }

  broadcastJournal(entry) {
    const msg = {
      type: 'journal',
      entry: entry || {},
      timestamp: Date.now()
    };
    const msgStr = JSON.stringify(msg);
    for (const ws of this.clients) {
      try { ws.send(msgStr); } catch (e) { this.clients.delete(ws); }
    }
    if (this.busPublisher) {
      try { this.busPublisher('think.event', msg); } catch (e) {}
    }
  }

   broadcastConsole(text, kind) {
    const msg = {
      type: 'console',
      text: String(text).substring(500),
      kind: kind || 'out',
      timestamp: Date.now()
    };
    const msgStr = JSON.stringify(msg);
    for (const ws of this.clients) {
      try { ws.send(msgStr); } catch (e) { this.clients.delete(ws); }
    }
    if (this.busPublisher && this.clients.size === 0) {
      try { this.busPublisher('think.event', msg); } catch (e) {}
    }
  }

  broadcastThink(prompt, response, mode) {
    const msg = {
      type: 'think',
      agent: 'gsk',
      content: (response || '').substring(0, 500),
      details: { prompt: (prompt || '').substring(0, 200), mode: mode || 'auto' },
      timestamp: Date.now()
    };
    const msgStr = JSON.stringify(msg);
    for (const ws of this.clients) {
      try { ws.send(msgStr); } catch (e) { this.clients.delete(ws); }
    }
    if (this.busPublisher) {
      try { this.busPublisher('think.event', msg); } catch (e) {}
    }
  }

  broadcastToolCall(tool, args, actor) {
    const msg = {
      type: 'tool_call',
      agent: actor || 'gsk',
      content: `${tool}(${JSON.stringify(args).substring(0, 200)})`,
      details: { tool, args, actor: actor || 'gsk' },
      timestamp: Date.now()
    };
    const msgStr = JSON.stringify(msg);
    for (const ws of this.clients) {
      try { ws.send(msgStr); } catch (e) { this.clients.delete(ws); }
    }
    if (this.busPublisher) {
      try { this.busPublisher('think.event', msg); } catch (e) {}
    }
  }

  broadcastToolResult(tool, result, success) {
    const msg = {
      type: 'tool_result',
      agent: 'gsk',
      content: (result || '').toString().substring(0, 500),
      details: { tool, success: success !== false },
      timestamp: Date.now()
    };
    const msgStr = JSON.stringify(msg);
    for (const ws of this.clients) {
      try { ws.send(msgStr); } catch (e) { this.clients.delete(ws); }
    }
    if (this.busPublisher) {
      try { this.busPublisher('think.event', msg); } catch (e) {}
    }
  }

  broadcastShell(command, output) {
    const msg = {
      type: 'shell',
      agent: 'gsk',
      content: `$ ${command || ''}`,
      details: { command, result: output || '' },
      timestamp: Date.now()
    };
    const msgStr = JSON.stringify(msg);
    for (const ws of this.clients) {
      try { ws.send(msgStr); } catch (e) { this.clients.delete(ws); }
    }
    if (this.busPublisher) {
      try { this.busPublisher('think.event', msg); } catch (e) {}
    }
  }

  stop() {
    if (this.wss) { this.wss.close(); this.wss = null; }
    if (this.server) { this.server.close(); this.server = null; }
  }
}

module.exports = { ThoughtStream };
