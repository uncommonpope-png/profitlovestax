#!/usr/bin/env node
/**
 * Soul Architect MCP Server v1.0.0
 *
 * A Model Context Protocol (MCP) server exposing all 19 Soul Architect
 * superpowers as tools. Communicates via JSON-RPC 2.0 over stdio.
 *
 * SPEC: MCP 2024-11-05
 * TRANSPORT: stdio
 * LOGGING: stderr ONLY
 * OUTPUT: stdout JSON-RPC ONLY
 */

const SoulArchitect = require('../soul-architect.cjs');

// ── Constants ───────────────────────────────────────────────────────────────
const MCP_VERSION = '2024-11-05';
const SERVER_NAME = 'soul-architect-mcp';
const SERVER_VERSION = '1.0.0';

// ── Logger (stderr only) ────────────────────────────────────────────────────
function log(level, message, meta = {}) {
  const ts = new Date().toISOString();
  const entry = { ts, level, message, ...meta };
  process.stderr.write(JSON.stringify(entry) + '\n');
}

// ── JSON-RPC Helpers ──────────────────────────────────────────────────────
function sendResponse(id, result) {
  const response = { jsonrpc: '2.0', id, result };
  process.stdout.write(JSON.stringify(response) + '\n');
}

function sendError(id, code, message, data) {
  const errorObj = { code, message };
  if (data !== undefined) errorObj.data = data;
  const response = { jsonrpc: '2.0', id, error: errorObj };
  process.stdout.write(JSON.stringify(response) + '\n');
}

function sendNotification(method, params) {
  const notification = { jsonrpc: '2.0', method, params };
  process.stdout.write(JSON.stringify(notification) + '\n');
}

// ── Tool Definitions ────────────────────────────────────────────────────────
const TOOL_DEFINITIONS = [
  // ─── PATTERN-FORGE ────────────────────────────────────────────────────────
  {
    name: 'soul_architect_pattern_forge',
    description:
      'Generate architecture scaffolding from patterns (hexagonal, DDD, CQRS). ' +
      'USE WHEN: The user wants code scaffolding, architecture generation, or pattern-based system design.',
    inputSchema: {
      type: 'object',
      properties: {
        type: { type: 'string', description: 'Pattern type: hexagonal, ddd, cqrs' },
        config: { type: 'object', description: 'Generation configuration object' }
      },
      required: ['type', 'config']
    },
    outputSchema: {
      type: 'object',
      properties: {
        output: { type: 'object' },
        error: { type: 'string' }
      }
    },
    _meta: { 'anthropic/maxResultSizeChars': 50000 }
  },

  // ─── SYSTEM-DECOMPOSER ────────────────────────────────────────────────────
  {
    name: 'soul_architect_decompose',
    description:
      'Decompose a complex system description into subsystems, dependencies, and phases. ' +
      'USE WHEN: The user describes a large system and needs it broken into manageable pieces.',
    inputSchema: {
      type: 'object',
      properties: {
        description: { type: 'string', description: 'System description to decompose' }
      },
      required: ['description']
    },
    outputSchema: {
      type: 'object',
      properties: {
        output: { type: 'object' },
        error: { type: 'string' }
      }
    },
    _meta: { 'anthropic/maxResultSizeChars': 50000 }
  },

  // ─── DESIGN-SWARM ─────────────────────────────────────────────────────────
  {
    name: 'soul_architect_swarm_design',
    description:
      'Design a system using a multi-agent swarm of specialized architecture agents. ' +
      'USE WHEN: The user wants a complete system designed by a team of agents working together.',
    inputSchema: {
      type: 'object',
      properties: {
        system: { type: 'object', description: 'System configuration object' }
      },
      required: ['system']
    },
    outputSchema: {
      type: 'object',
      properties: {
        output: { type: 'object' },
        error: { type: 'string' }
      }
    },
    _meta: { 'anthropic/maxResultSizeChars': 50000 }
  },

  // ─── LEARN-ENGINE ─────────────────────────────────────────────────────────
  {
    name: 'soul_architect_recommend',
    description:
      'Get architecture recommendations based on learning and system description. ' +
      'USE WHEN: The user wants pattern recommendations for a system.',
    inputSchema: {
      type: 'object',
      properties: {
        description: { type: 'string', description: 'System description' }
      },
      required: ['description']
    },
    outputSchema: {
      type: 'object',
      properties: {
        output: { type: 'object' },
        error: { type: 'string' }
      }
    },
    _meta: { 'anthropic/maxResultSizeChars': 50000 }
  },

  // ─── MEMORY ───────────────────────────────────────────────────────────────
  {
    name: 'soul_architect_memory_add',
    description:
      'Store an architecture memory. ' +
      'USE WHEN: The user wants to remember, persist, or store design information.',
    inputSchema: {
      type: 'object',
      properties: {
        content: { type: 'string', description: 'The text content to store' },
        tags: { type: 'array', items: { type: 'string' }, description: 'Tags for the memory' }
      },
      required: ['content']
    },
    outputSchema: {
      type: 'object',
      properties: {
        output: { type: 'object' },
        error: { type: 'string' }
      }
    }
  },
  {
    name: 'soul_architect_memory_query',
    description:
      'Query architecture memories. ' +
      'USE WHEN: The user asks to recall, search, or find previously stored design knowledge.',
    inputSchema: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Search query' }
      },
      required: ['query']
    },
    outputSchema: {
      type: 'object',
      properties: {
        output: { type: 'object' },
        error: { type: 'string' }
      }
    },
    _meta: { 'anthropic/maxResultSizeChars': 50000 }
  },

  // ─── RAG ──────────────────────────────────────────────────────────────────
  {
    name: 'soul_architect_rag_query',
    description:
      'Query the architecture pattern knowledge base. ' +
      'USE WHEN: The user asks questions about architecture patterns or wants grounded answers.',
    inputSchema: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Question or query text' }
      },
      required: ['query']
    },
    outputSchema: {
      type: 'object',
      properties: {
        output: { type: 'object' },
        error: { type: 'string' }
      }
    },
    _meta: { 'anthropic/maxResultSizeChars': 50000 }
  },

  // ─── DOCUMENT ───────────────────────────────────────────────────────────────
  {
    name: 'soul_architect_document_generate',
    description:
      'Generate architecture documentation. ' +
      'USE WHEN: The user wants architecture docs, design reports, or system overview documents.',
    inputSchema: {
      type: 'object',
      properties: {
        title: { type: 'string', description: 'Document title' },
        sections: { type: 'array', items: { type: 'string' }, description: 'Section names' }
      },
      required: ['title']
    },
    outputSchema: {
      type: 'object',
      properties: {
        output: { type: 'object' },
        error: { type: 'string' }
      }
    },
    _meta: { 'anthropic/maxResultSizeChars': 50000 }
  },

  // ─── CODE ───────────────────────────────────────────────────────────────────
  {
    name: 'soul_architect_code_analyze',
    description:
      'Analyze code for architectural quality. ' +
      'USE WHEN: The user wants a review, audit, or quality assessment of existing code.',
    inputSchema: {
      type: 'object',
      properties: {
        code: { type: 'string', description: 'Source code to analyze' },
        language: { type: 'string', description: 'Language of the code' }
      },
      required: ['code']
    },
    outputSchema: {
      type: 'object',
      properties: {
        output: { type: 'object' },
        error: { type: 'string' }
      }
    },
    _meta: { 'anthropic/maxResultSizeChars': 50000 }
  },

  // ─── SECURITY ───────────────────────────────────────────────────────────────
  {
    name: 'soul_architect_security_scan',
    description:
      'Scan architecture for security issues. ' +
      'USE WHEN: The user wants to secure an architecture or check for vulnerabilities.',
    inputSchema: {
      type: 'object',
      properties: {
        target: { type: 'string', description: 'Code or description to scan' }
      },
      required: ['target']
    },
    outputSchema: {
      type: 'object',
      properties: {
        output: { type: 'object' },
        error: { type: 'string' }
      }
    }
  },

  // ─── OBSERVABILITY ──────────────────────────────────────────────────────────
  {
    name: 'soul_architect_health',
    description:
      'Get architecture health status. ' +
      'USE WHEN: The user wants to monitor architecture health or track metrics.',
    inputSchema: {
      type: 'object',
      properties: {}
    },
    outputSchema: {
      type: 'object',
      properties: {
        output: { type: 'object' },
        error: { type: 'string' }
      }
    }
  },

  // ─── META / ARCHITECT ───────────────────────────────────────────────────────
  {
    name: 'soul_architect_status',
    description:
      'Get Soul Architect status. ' +
      'USE WHEN: The user wants to see which powers are active, health, or mission history.',
    inputSchema: {
      type: 'object',
      properties: {}
    },
    outputSchema: {
      type: 'object',
      properties: {
        output: { type: 'object' },
        error: { type: 'string' }
      }
    },
    _meta: { 'anthropic/maxResultSizeChars': 50000 }
  },
  {
    name: 'soul_architect_swarm',
    description:
      'Execute missions in parallel across powers (swarm mode). ' +
      'USE WHEN: The user wants multiple independent tasks executed simultaneously for speed.',
    inputSchema: {
      type: 'object',
      properties: {
        missions: {
          type: 'array',
          items: { type: 'object' },
          description: 'Array of mission objects with power, description, and args'
        }
      },
      required: ['missions']
    },
    outputSchema: {
      type: 'object',
      properties: {
        output: { type: 'object' },
        error: { type: 'string' }
      }
    },
    _meta: { 'anthropic/maxResultSizeChars': 50000 }
  },
  {
    name: 'soul_architect_chain',
    description:
      'Execute missions sequentially, passing context (chain mode). ' +
      'USE WHEN: The user wants tasks to run in order where later steps depend on earlier results.',
    inputSchema: {
      type: 'object',
      properties: {
        missions: {
          type: 'array',
          items: { type: 'object' },
          description: 'Array of mission objects'
        },
        break_on_fail: { type: 'boolean', default: true, description: 'Stop chain on first failure' }
      },
      required: ['missions']
    },
    outputSchema: {
      type: 'object',
      properties: {
        output: { type: 'object' },
        error: { type: 'string' }
      }
    },
    _meta: { 'anthropic/maxResultSizeChars': 50000 }
  },
  {
    name: 'soul_architect_detect_power',
    description:
      'Auto-detect which power fits a description. ' +
      'USE WHEN: The user is unsure which tool to use and wants a recommendation.',
    inputSchema: {
      type: 'object',
      properties: {
        description: { type: 'string', description: 'Task description' }
      },
      required: ['description']
    },
    outputSchema: {
      type: 'object',
      properties: {
        output: { type: 'object' },
        error: { type: 'string' }
      }
    }
  }
];

// ── Tool Execution Map ──────────────────────────────────────────────────────
const TOOL_EXEC_MAP = {
  soul_architect_pattern_forge:   { power: 'PATTERN-FORGE',    desc: args => `Generate ${args.type} pattern` },
  soul_architect_decompose:       { power: 'SYSTEM-DECOMPOSER',desc: args => `Decompose: ${args.description?.slice(0, 60)}` },
  soul_architect_swarm_design:    { power: 'DESIGN-SWARM',     desc: args => `Swarm design: ${args.system?.name || 'system'}` },
  soul_architect_recommend:       { power: 'LEARN-ENGINE',     desc: args => `Recommend: ${args.description?.slice(0, 60)}` },
  soul_architect_memory_add:      { power: 'MEMORY',           desc: args => `Add memory: ${args.content?.slice(0, 60)}` },
  soul_architect_memory_query:    { power: 'MEMORY',           desc: args => `Query memory: ${args.query}` },
  soul_architect_rag_query:       { power: 'RAG',              desc: args => `RAG query: ${args.query}` },
  soul_architect_document_generate:{ power: 'DOCUMENT',         desc: args => `Document: ${args.title}` },
  soul_architect_code_analyze:    { power: 'CODE',             desc: () => 'Analyze code' },
  soul_architect_security_scan:   { power: 'SECURITY',         desc: () => 'Security scan' },
  soul_architect_health:          { power: 'OBSERVABILITY',    desc: () => 'Health check' }
};

// ── Server Class ────────────────────────────────────────────────────────────
class SoulMcpServer {
  constructor() {
    this.initialized = false;
    this.architects = new Map(); // sessionId -> SoulArchitect
    log('info', 'SoulMcpServer instantiated');
  }

  getArchitect(sessionId = 'default') {
    if (!this.architects.has(sessionId)) {
      const architect = new SoulArchitect({ outputDir: './output/architect' });
      this.architects.set(sessionId, architect);
      log('info', `SoulArchitect created for session ${sessionId}`);
    }
    return this.architects.get(sessionId);
  }

  // ── Handlers ────────────────────────────────────────────────────────────────

  async handleInitialize(id, params) {
    this.initialized = true;
    log('info', 'Initialized', { clientInfo: params?.clientInfo });

    return {
      protocolVersion: MCP_VERSION,
      capabilities: {
        tools: { listChanged: true }
      },
      serverInfo: {
        name: SERVER_NAME,
        version: SERVER_VERSION
      }
    };
  }

  async handleToolsList(id, params) {
    const cursor = params?.cursor;
    if (cursor) {
      return { tools: [], nextCursor: undefined };
    }

    return {
      tools: TOOL_DEFINITIONS.map(t => ({
        name: t.name,
        description: t.description,
        inputSchema: t.inputSchema,
        ...(t.outputSchema ? { outputSchema: t.outputSchema } : {}),
        ...(t._meta ? { _meta: t._meta } : {})
      }))
    };
  }

  async handleToolsCall(id, params) {
    const { name, arguments: args = {}, _meta = {} } = params;
    const sessionId = _meta?.sessionId || 'default';

    log('info', `Tool call: ${name}`, { sessionId, args: Object.keys(args) });

    const toolDef = TOOL_DEFINITIONS.find(t => t.name === name);
    if (!toolDef) {
      return this.makeErrorResult(`Unknown tool: ${name}.`);
    }

    try {
      // Meta tools that bypass execute()
      if (name === 'soul_architect_status') {
        const architect = this.getArchitect(sessionId);
        const result = architect.getEnhancedStatus();
        return this.makeSuccessResult(result, toolDef._meta);
      }

      if (name === 'soul_architect_swarm') {
        const architect = this.getArchitect(sessionId);
        const result = await architect.swarm(args.missions || []);
        return this.makeSuccessResult(result, toolDef._meta);
      }

      if (name === 'soul_architect_chain') {
        const architect = this.getArchitect(sessionId);
        const missions = (args.missions || []).map(m => ({
          ...m,
          breakOnFail: args.break_on_fail !== false
        }));
        const result = await architect.chain(missions);
        return this.makeSuccessResult(result, toolDef._meta);
      }

      if (name === 'soul_architect_detect_power') {
        const architect = this.getArchitect(sessionId);
        const detected = architect.detectPower(args.description);
        return this.makeSuccessResult({ detected_power: detected, description: args.description }, toolDef._meta);
      }

      // Standard power delegation
      const execMap = TOOL_EXEC_MAP[name];
      if (!execMap) {
        return this.makeErrorResult(`Tool ${name} exists but has no execution mapping.`);
      }

      const architect = this.getArchitect(sessionId);
      const description = typeof execMap.desc === 'function' ? execMap.desc(args) : execMap.desc;

      const mission = {
        power: execMap.power,
        description,
        ...args
      };

      const result = await architect.execute(mission);

      if (result.success === false || result.error) {
        return this.makeErrorResult(result.error || 'Execution failed', result, toolDef._meta);
      }

      return this.makeSuccessResult(result, toolDef._meta);
    } catch (err) {
      log('error', `Tool ${name} threw: ${err.message}`, { stack: err.stack });
      return this.makeErrorResult(err.message, { stack: err.stack }, toolDef._meta);
    }
  }

  // ── Result Helpers ─────────────────────────────────────────────────────────

  makeSuccessResult(data, meta = {}) {
    const content = [
      {
        type: 'text',
        text: typeof data === 'string' ? data : JSON.stringify(data, null, 2)
      }
    ];

    if (data && typeof data === 'object') {
      content.push({
        type: 'text',
        text: `\n---structured---\n${JSON.stringify(data)}`
      });
    }

    const result = {
      content,
      isError: false
    };

    if (meta && Object.keys(meta).length > 0) {
      result._meta = meta;
    }

    return result;
  }

  makeErrorResult(message, data = null, meta = {}) {
    const content = [
      {
        type: 'text',
        text: `Error: ${message}` + (data ? `\n\nDetails:\n${JSON.stringify(data, null, 2)}` : '')
      }
    ];

    const result = {
      content,
      isError: true
    };

    if (meta && Object.keys(meta).length > 0) {
      result._meta = meta;
    }

    return result;
  }

  // ── Request Router ─────────────────────────────────────────────────────────

  async processRequest(request) {
    const { id, method, params } = request;

    if (id === undefined) {
      if (method === 'notifications/initialized') {
        log('info', 'Client confirmed initialization');
        return null;
      }
      log('warn', `Unhandled notification: ${method}`);
      return null;
    }

    switch (method) {
      case 'initialize':
        return await this.handleInitialize(id, params);
      case 'tools/list':
        return await this.handleToolsList(id, params);
      case 'tools/call':
        return await this.handleToolsCall(id, params);
      default:
        return sendError(id, -32601, `Method not found: ${method}`);
    }
  }
}

// ── Main Entry ────────────────────────────────────────────────────────────────
async function main() {
  const server = new SoulMcpServer();

  process.stdin.setEncoding('utf8');

  let buffer = '';

  process.stdin.on('data', async (chunk) => {
    buffer += chunk;

    let lines = buffer.split('\n');
    buffer = lines.pop();

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;

      try {
        const request = JSON.parse(trimmed);

        if (request.jsonrpc !== '2.0') {
          log('warn', 'Received non-JSON-RPC 2.0 message', { raw: trimmed.slice(0, 200) });
          if (request.id !== undefined) {
            sendError(request.id, -32600, 'Invalid Request: expected jsonrpc 2.0');
          }
          continue;
        }

        log('debug', `→ ${request.method}`, { id: request.id });
        const result = await server.processRequest(request);

        if (request.id !== undefined && result !== null) {
          sendResponse(request.id, result);
          log('debug', `← ${request.method}`, { id: request.id });
        }
      } catch (err) {
        log('error', `Failed to process message: ${err.message}`, { raw: trimmed.slice(0, 200) });
        let id = null;
        try {
          const parsed = JSON.parse(trimmed);
          id = parsed.id;
        } catch {}
        if (id !== undefined && id !== null) {
          sendError(id, -32700, 'Parse error', err.message);
        }
      }
    }
  });

  process.stdin.on('end', () => {
    log('info', 'stdin closed — shutting down');
    process.exit(0);
  });

  process.stdin.on('error', (err) => {
    log('error', `stdin error: ${err.message}`);
    process.exit(1);
  });

  log('info', `Soul Architect MCP Server ready`, { version: SERVER_VERSION, mcpVersion: MCP_VERSION });
}

main().catch((err) => {
  log('fatal', `Server crashed: ${err.message}`, { stack: err.stack });
  process.exit(1);
});
