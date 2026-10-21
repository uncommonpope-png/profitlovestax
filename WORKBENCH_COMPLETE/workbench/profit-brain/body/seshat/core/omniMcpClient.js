'use strict';

/**
 * OMNIROUTE MCP CLIENT — Full-featured client for OmniRoute's MCP server.
 *
 * Connects to the MCP server at http://localhost:20128 via:
 *   1. JSON-RPC over Streamable HTTP transport (/api/mcp/stream) — the canonical MCP way
 *   2. Direct REST API calls for image/video generation endpoints
 *
 * Key capabilities:
 *   - List & call all 104 MCP tools (routing, cache, compression, memory, skills, etc.)
 *   - Direct REST API calls for image/video/audio generation
 *   - Web fetch with screenshots
 *   - Model catalog queries (filter by image/video/audio/chat capabilities)
 *
 * Usage:
 *   const mcp = new OmniMcpClient();
 *   await mcp.init();                    // initialize the MCP session
 *   const tools = await mcp.listTools();  // discover all available tools
 *   const result = await mcp.callTool('omniroute_route_request', { ... });  // call a tool
 *   const img = await mcp.generateImage('flux', 'a cat'); // REST API
 */

const OMNIROUTE_BASE = process.env.OMNIROUTE_URL || process.env.OMNIROUTE_BASE_URL || 'http://127.0.0.1:20128';

function omniAuthKey() {
    return process.env.OMNIROUTE_API_KEY || process.env.GSK_BRAIN_API_KEY || process.env.NINE_ROUTER_API_KEY || '';
}

function omniAuthHeaders(extra = {}) {
    const headers = { 'Content-Type': 'application/json', ...extra };
    const key = omniAuthKey();
    if (key) {
        headers['Authorization'] = 'Bearer ' + key;
        headers['x-api-key'] = key;
    }
    return headers;
}

class OmniMcpClient {
  constructor() {
    this.baseUrl = OMNIROUTE_BASE;
    this.sessionId = null;
    this.initialized = false;
  }

  // ─── MCP JSON-RPC Transport (Streamable HTTP) ────────────────

  /**
   * Initialize a session with the MCP server via Streamable HTTP transport.
   * Returns the session ID from the mcp-session-id response header.
   */
  async init() {
    const initMsg = {
      jsonrpc: '2.0',
      id: 1,
      method: 'initialize',
      params: {
        protocolVersion: '2025-03-26',
        capabilities: {
          tools: {},
          prompts: {},
          resources: {},
        },
        clientInfo: {
          name: 'profit-mcp-client',
          version: '1.0.0',
        },
      },
    };

    const res = await fetch(`${this.baseUrl}/api/mcp/stream`, {
      method: 'POST',
      headers: omniAuthHeaders({
        Accept: 'application/json, text/event-stream',
        'mcp-session-id': '',
      }),
      body: JSON.stringify(initMsg),
    });

    if (!res.ok) {
      throw new Error(`MCP init failed: ${res.status} ${res.statusText}`);
    }

    // Extract session ID from response headers
    const sessionId = res.headers.get('mcp-session-id');
    if (sessionId) {
      this.sessionId = sessionId;
    }

    // For streamable-http, the response may be JSON (non-streaming) or SSE (streaming)
    const contentType = res.headers.get('content-type') || '';
    let result;

    if (contentType.includes('text/event-stream')) {
      // SSE response — parse the event stream
      const text = await res.text();
      result = this._parseSse(text);
    } else {
      // Direct JSON response
      result = await res.json();
    }

    if (result.error) {
      throw new Error(`MCP init error: ${result.error.message || result.error}`);
    }

    this.initialized = true;
    return result;
  }

  /**
   * Send a JSON-RPC request to the MCP server.
   * Handles both SSE and direct JSON responses.
   */
  async _sendRpc(method, params = {}) {
    if (!this.initialized) {
      await this.init();
    }

    const msg = {
      jsonrpc: '2.0',
      id: Date.now(),
      method,
      params,
    };

    const headers = omniAuthHeaders({
      Accept: 'application/json, text/event-stream',
    });

    if (this.sessionId) {
      headers['mcp-session-id'] = this.sessionId;
    }

    const res = await fetch(`${this.baseUrl}/api/mcp/stream`, {
      method: 'POST',
      headers,
      body: JSON.stringify(msg),
    });

    if (!res.ok) {
      throw new Error(`MCP ${method} failed: ${res.status} ${res.statusText}`);
    }

    // Check for new session ID
    const newSessionId = res.headers.get('mcp-session-id');
    if (newSessionId && newSessionId !== this.sessionId) {
      this.sessionId = newSessionId;
    }

    const contentType = res.headers.get('content-type') || '';

    if (contentType.includes('text/event-stream')) {
      const text = await res.text();
      return this._parseSse(text);
    }

    return res.json();
  }

  /**
   * Parse SSE event stream to extract the JSON-RPC result.
   */
  _parseSse(raw) {
    const blocks = raw.split(/\r?\n\r?\n/);
    for (const block of blocks) {
      const lines = block.split(/\r?\n/);
      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const payload = line.slice(6).trim();
          if (!payload || payload === '[DONE]') continue;
          try {
            const parsed = JSON.parse(payload);
            if (parsed.result !== undefined || parsed.error !== undefined) {
              return parsed;
            }
          } catch {
            // skip non-JSON data lines
          }
        }
      }
    }
    return {};
  }

  /**
   * List all available MCP tools with their schemas and scopes.
   */
  async listTools() {
    const result = await this._sendRpc('tools/list');
    if (result.error) {
      throw new Error(`Failed to list tools: ${result.error.message}`);
    }
    return result.result?.tools || [];
  }

  /**
   * Call an MCP tool by name with arguments.
   * Returns { content: [...], isError?: boolean }
   */
  async callTool(toolName, args = {}) {
    const result = await this._sendRpc('tools/call', {
      name: toolName,
      arguments: args,
    });

    if (result.error) {
      throw new Error(`Tool ${toolName} error: ${JSON.stringify(result.error)}`);
    }

    return result.result;
  }

  // ─── Direct REST API Endpoints (OpenAI-compatible) ──────────

  /**
   * Generate images via POST /v1/images/generations
   * Returns the OpenAI-format response with image data.
   *
   * @param {string} model - provider/model (e.g. "pollinations/flux")
   * @param {string} prompt - text description
   * @param {object} opts - { n, size, response_format, quality, style }
   */
  async generateImage(model, prompt, opts = {}) {
    const body = {
      model,
      prompt,
      n: opts.n || 1,
      ...(opts.size && { size: opts.size }),
      ...(opts.response_format && { response_format: opts.response_format }),
      ...(opts.quality && { quality: opts.quality }),
      ...(opts.style && { style: opts.style }),
      ...(opts.image_url && { image_url: opts.image_url }),
      ...(opts.image && { image: opts.image }),
      ...(opts.image_urls && { image_urls: opts.image_urls }),
      ...(opts.image_urls && { image_urls: opts.image_urls }),
    };

    const res = await fetch(`${this.baseUrl}/v1/images/generations`, {
      method: 'POST',
      headers: omniAuthHeaders(),
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Image generation failed: ${res.status} ${err}`);
    }

    return res.json();
  }

  /**
   * List available image generation models via GET /v1/images/generations
   */
  async listImageModels() {
    const res = await fetch(`${this.baseUrl}/v1/images/generations`, {
      method: 'GET',
      headers: omniAuthHeaders(),
    });

    if (!res.ok) {
      throw new Error(`Failed to list image models: ${res.status}`);
    }

    return res.json();
  }

  /**
   * Generate videos via POST /v1/videos/generations
   * Returns a task object with a task_id for polling status (for async providers).
   *
   * Poll video status with: GET /v1/videos/generations/{task_id} or the provider's statusUrl.
   *
   * @param {string} model - provider/model (e.g. "pollinations/default")
   * @param {string} prompt - text description
   * @param {object} opts - { duration, size, num_frames, ... }
   */
  async generateVideo(model, prompt, opts = {}) {
    const body = {
      model,
      prompt,
      ...(opts.duration && { duration: opts.duration }),
      ...(opts.size && { size: opts.size }),
      ...(opts.num_frames && { num_frames: opts.num_frames }),
      ...opts,
    };

    const res = await fetch(`${this.baseUrl}/v1/videos/generations`, {
      method: 'POST',
      headers: omniAuthHeaders(),
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Video generation failed: ${res.status} ${err}`);
    }

    return res.json();
  }

  /**
   * List available video generation models via GET /v1/videos/generations
   */
  async listVideoModels() {
    const res = await fetch(`${this.baseUrl}/v1/videos/generations`, {
      method: 'GET',
      headers: omniAuthHeaders(),
    });

    if (!res.ok) {
      throw new Error(`Failed to list video models: ${res.status}`);
    }

    return res.json();
  }

  /**
   * Send a chat completion request through OmniRoute routing.
   * This wraps the /v1/chat/completions endpoint with intelligent routing.
   */
  async chatCompletion(model, messages, opts = {}) {
    const body = {
      model,
      messages,
      ...(opts.stream !== undefined && { stream: opts.stream }),
      ...(opts.max_tokens && { max_tokens: opts.max_tokens }),
      ...(opts.temperature && { temperature: opts.temperature }),
      ...(opts.combo && { 'x-combo': opts.combo }),
      ...(opts.budget && { 'x-budget': opts.budget }),
    };

    const res = await fetch(`${this.baseUrl}/v1/chat/completions`, {
      method: 'POST',
      headers: omniAuthHeaders(),
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Chat completion failed: ${res.status} ${err}`);
    }

    return res.json();
  }

  /**
   * Fetch an image as base64 using the web fetch tool (screenshot mode)
   * Uses the MCP tool omniroute_web_fetch
   */
  async webFetch(url, format = 'markdown', opts = {}) {
    return await this.callTool('omniroute_web_fetch', {
      url,
      format,
      ...(opts.provider && { provider: opts.provider }),
      ...(opts.include_metadata !== undefined && { include_metadata: opts.include_metadata }),
      ...(opts.depth !== undefined && { depth: opts.depth }),
      ...(opts.wait_for_selector && { wait_for_selector: opts.wait_for_selector }),
    });
  }

  /**
   * List models from catalog via MCP tool, filtered by capability.
   * capabilities: "chat", "embedding", "image", "audio", "video", "rerank", "moderation"
   */
  async listModelsCatalog(provider, capability) {
    const args = {};
    if (provider) args.provider = provider;
    if (capability) args.capability = capability;
    return await this.callTool('omniroute_list_models_catalog', args);
  }

  /**
   * Get OmniRoute server health status via MCP tool.
   */
  async getHealth() {
    return await this.callTool('omniroute_get_health', {});
  }

  /**
   * Check API quota for providers via MCP tool.
   */
  async checkQuota(provider) {
    return await this.callTool('omniroute_check_quota', provider ? { provider } : {});
  }

  /**
   * Route a request through OmniRoute's intelligent routing via MCP tool.
   * This sends a chat completion through the routing pipeline.
   */
  async routeRequest(model, messages, opts = {}) {
    const args = {
      model,
      messages,
      ...(opts.combo && { combo: opts.combo }),
      ...(opts.budget && { budget: opts.budget }),
      ...(opts.role && { role: opts.role }),
      ...(opts.stream !== undefined && { stream: opts.stream }),
    };
    return await this.callTool('omniroute_route_request', args);
  }

  /**
   * Search the web via MCP tool.
   */
  async webSearch(query, opts = {}) {
    const args = {
      query,
      ...(opts.max_results && { max_results: opts.max_results }),
      ...(opts.search_type && { search_type: opts.search_type }),
      ...(opts.provider && { provider: opts.provider }),
    };
    return await this.callTool('omniroute_web_search', args);
  }

  /**
   * Read a video from a URL by fetching it.
   * For video files, downloads the raw bytes.
   */
  async readVideoFromUrl(url) {
    const res = await fetch(url, {
      method: 'GET',
      headers: {
        Accept: 'video/*',
      },
    });

    if (!res.ok) {
      throw new Error(`Failed to fetch video: ${res.status} ${res.statusText}`);
    }

    const arrayBuffer = await res.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Get content type and size
    const contentType = res.headers.get('content-type') || 'application/octet-stream';
    const contentLength = res.headers.get('content-length');

    return {
      contentType,
      size: buffer.length,
      sizeReadable: `${(buffer.length / 1024 / 1024).toFixed(2)} MB`,
      buffer,
      // Return a data URL preview for small videos
      dataUrl: buffer.length < 1024 * 1024 ? `data:${contentType};base64,${buffer.toString('base64')}` : null,
    };
  }

  /**
   * Get MCP server status.
   */
  async getStatus() {
    const res = await fetch(`${this.baseUrl}/api/mcp/status`, {
      method: 'GET',
      headers: omniAuthHeaders(),
    });

    if (!res.ok) {
      throw new Error(`Failed to get MCP status: ${res.status}`);
    }

    return res.json();
  }

  /**
   * Close the MCP session.
   */
  async close() {
    if (this.sessionId) {
      await fetch(`${this.baseUrl}/api/mcp/stream`, {
        method: 'DELETE',
        headers: omniAuthHeaders({ 'mcp-session-id': this.sessionId }),
      });
    }
    this.initialized = false;
    this.sessionId = null;
  }
}

module.exports = { OmniMcpClient };
