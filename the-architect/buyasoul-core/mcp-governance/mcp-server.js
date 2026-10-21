'use strict';

var readline = require('readline');
var http = require('http');
var path = require('path');
var ToolRouter = require('./tool-router.js').ToolRouter;
var AgentBridge = require('./agent-bridge.js').AgentBridge;

class MCPGovernanceServer {
  constructor(options) {
    options = options || {};
    this.core = options.core || null;
    this.name = options.name || 'buyasoul-core';
    this.version = options.version || '2.0.0';
    this.httpPort = options.port || 4001;
    this.toolRouter = new ToolRouter(this.core);
    this.agentBridge = new AgentBridge(this.name, this.version);
    this._httpServer = null;
    this._running = false;
    this._initialized = false;

    this._pendingRequests = {};
    this._requestId = 0;
  }

  start(httpMode) {
    httpMode = httpMode || false;
    if (httpMode) {
      this._startHTTP();
    } else {
      this._startStdio();
    }
    this._running = true;
  }

  _nextId() {
    this._requestId++;
    return this._requestId;
  }

  _send(response) {
    var msg = JSON.stringify(response);
    process.stdout.write(msg + '\n');
  }

  _handleMessage(message) {
    if (!message || !message.method) {
      this._send({ jsonrpc: '2.0', id: message && message.id ? message.id : null, error: { code: -32600, message: 'Invalid Request' } });
      return;
    }

    var method = message.method;
    var id = message.id;
    var params = message.params || {};
    var respond = function(result) {
      this._send({ jsonrpc: '2.0', id: id, result: result });
    }.bind(this);
    var respondError = function(code, msg, data) {
      this._send({ jsonrpc: '2.0', id: id, error: { code: code, message: msg, data: data || null } });
    }.bind(this);

    switch (method) {
      case 'initialize':
        respond({
          protocolVersion: '2024-11-05',
          capabilities: {
            tools: { listChanged: true },
            resources: {},
            prompts: {}
          },
          serverInfo: { name: this.name, version: this.version }
        });
        this._initialized = true;
        break;

      case 'notifications/initialized':
        this._initialized = true;
        break;

      case 'tools/list':
        this.toolRouter.listTools().then(function(tools) {
          respond({ tools: tools });
        }).catch(function(err) {
          respondError(-32603, 'Failed to list tools', err.message);
        });
        break;

      case 'tools/call':
        this.toolRouter.callTool(params.name, params.arguments || {}).then(function(result) {
          respond({ content: [{ type: 'text', text: typeof result === 'string' ? result : JSON.stringify(result, null, 2) }], isError: false });
        }).catch(function(err) {
          respond({ content: [{ type: 'text', text: err.message }], isError: true });
        });
        break;

      case 'resources/list':
        respond({ resources: [] });
        break;

      case 'prompts/list':
        respond({ prompts: [] });
        break;

      case 'ping':
        respond({});
        break;

      default:
        respondError(-32601, 'Method not found: ' + method);
    }
  }

  _startStdio() {
    process.stderr.write('[MCP] Starting stdio server for ' + this.name + ' v' + this.version + '\n');
    var rl = readline.createInterface({ input: process.stdin });
    rl.on('line', function(line) {
      line = line.trim();
      if (!line) return;
      try {
        var message = JSON.parse(line);
        this._handleMessage(message);
      } catch (e) {
        process.stderr.write('[MCP] Parse error: ' + e.message + '\n');
      }
    }.bind(this));
    rl.on('close', function() {
      process.stderr.write('[MCP] stdin closed, shutting down\n');
      process.exit(0);
    });
  }

  _startHTTP() {
    process.stderr.write('[MCP] Starting HTTP server on port ' + this.httpPort + '\n');
    this._httpServer = http.createServer(function(req, res) {
      if (req.method !== 'POST') {
        res.writeHead(405);
        res.end('Method Not Allowed');
        return;
      }
      var body = '';
      req.on('data', function(chunk) { body += chunk; });
      req.on('end', function() {
        try {
          var message = JSON.parse(body);
          var respond = function(result) {
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ jsonrpc: '2.0', id: message.id, result: result }));
          };
          var respondError = function(code, msg, data) {
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ jsonrpc: '2.0', id: message.id, error: { code: code, message: msg, data: data || null } }));
          };
          switch (message.method) {
            case 'initialize':
              respond({ protocolVersion: '2024-11-05', capabilities: { tools: { listChanged: true }, resources: {}, prompts: {} }, serverInfo: { name: this.name, version: this.version } });
              break;
            case 'tools/list':
              this.toolRouter.listTools().then(function(tools) { respond({ tools: tools }); });
              break;
            case 'tools/call':
              this.toolRouter.callTool(message.params.name, message.params.arguments || {}).then(function(result) {
                respond({ content: [{ type: 'text', text: typeof result === 'string' ? result : JSON.stringify(result, null, 2) }], isError: false });
              }).catch(function(err) {
                respond({ content: [{ type: 'text', text: err.message }], isError: true });
              });
              break;
            case 'resources/list':
              respond({ resources: [] });
              break;
            case 'prompts/list':
              respond({ prompts: [] });
              break;
            case 'ping':
              respond({});
              break;
            default:
              respondError(-32601, 'Method not found: ' + message.method);
          }
        } catch (e) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ jsonrpc: '2.0', error: { code: -32700, message: 'Parse error' } }));
        }
      }.bind(this));
    }.bind(this));
    this._httpServer.listen(this.httpPort);
  }

  stop() {
    if (this._httpServer) {
      this._httpServer.close();
    }
    this._running = false;
    process.stderr.write('[MCP] Server stopped\n');
  }
}

module.exports = { MCPGovernanceServer: MCPGovernanceServer };