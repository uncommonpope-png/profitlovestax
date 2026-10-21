'use strict';

/**
 * WEBSOCKET BRIDGE — Connects Mega Kernel to SOULVERSE for real-time synchronization
 */

const WebSocket = require('ws');
const { v4: uuidv4 } = require('uuid');

class WebSocketBridge {
  constructor(kernel, options = {}) {
    this.kernel = kernel;
    this.artifactManager = options.artifactManager || null;
    this.port = options.port || 8080;
    this.host = options.host || 'localhost';
    this.wss = null;
    this.clients = new Set();
    this.isConnected = false;

    // Extended kernel references — populated via linkSystems() later
    this._skills = null;
    this._mcpManager = null;
    this._selfGrowingBrain = null;
    this._chambers = null;
    this._council = null;
    this._brain = kernel.brain || null;
    this._memory = kernel.memory || null;
    
    // Bind methods
    this.broadcast = this.broadcast.bind(this);
    this.handleMessage = this.handleMessage.bind(this);
    this.handleConnection = this.handleConnection.bind(this);
    this.handleClose = this.handleClose.bind(this);
  }

  /**
   * Link additional kernel systems after construction (called from main.js)
   */
  linkSystems(systems) {
    if (systems.skills) this._skills = systems.skills;
    if (systems.mcpManager) this._mcpManager = systems.mcpManager;
    if (systems.selfGrowingBrain) this._selfGrowingBrain = systems.selfGrowingBrain;
    if (systems.chambers) this._chambers = systems.chambers;
    if (systems.council) this._council = systems.council;
    if (systems.brain) this._brain = systems.brain;
    if (systems.memory) this._memory = systems.memory;
    if (systems.kernelOracle) this._kernelOracle = systems.kernelOracle;
  }

  /**
   * Start the WebSocket server
   * @returns {Promise<void>}
   */
  async start() {
    return new Promise((resolve, reject) => {
      try {
        this.wss = new WebSocket.Server({ 
          port: this.port,
          host: this.host
        });

        this.wss.on('connection', this.handleConnection);
        this.wss.on('error', (error) => {
          console.error(`WebSocket Server Error: ${error.message}`);
          reject(error);
        });
        
        this.wss.on('listening', () => {
          this.isConnected = true;
          console.log(`WebSocket Bridge listening on ws://${this.host}:${this.port}`);
          resolve();
        });
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Stop the WebSocket server
   * @returns {Promise<void>}
   */
  async stop() {
    return new Promise((resolve) => {
      if (this.wss) {
        this.wss.close(() => {
          this.isConnected = false;
          console.log('WebSocket Bridge stopped');
          resolve();
        });
      } else {
        resolve();
      }
    });
  }

  /**
   * Handle new WebSocket connections
   * @param {WebSocket} ws - The WebSocket connection
   */
  handleConnection(ws) {
    console.log('New WebSocket client connected');
    this.clients.add(ws);
    
    // Send initial soul state to new client
    this.sendInitialState(ws);
    
    ws.on('message', this.handleMessage);
    ws.on('close', () => this.handleClose(ws));
    ws.on('error', (error) => {
      console.error(`WebSocket Client Error: ${error.message}`);
      this.handleClose(ws);
    });
  }

  /**
   * Handle WebSocket connection close
   * @param {WebSocket} ws - The WebSocket connection
   */
  handleClose(ws) {
    console.log('WebSocket client disconnected');
    this.clients.delete(ws);
    ws.removeListener('message', this.handleMessage);
    ws.removeListener('close', () => this.handleClose(ws));
  }

  /**
   * Handle incoming messages from WebSocket clients
   * @param {WebSocket} ws - The WebSocket connection
   * @param {Buffer} data - The received data
   */
  async handleMessage(ws, data) {
    try {
      const message = JSON.parse(data.toString());
      
      // Handle different message types
      switch (message.type) {
        case 'get_soul_state':
          this.sendSoulState(ws);
          break;
        case 'update_soul':
          await this.updateSoulFromClient(ws, message.payload);
          break;
        case 'command':
          await this.handleCommand(ws, message.payload);
          break;
        case 'ping':
          ws.send(JSON.stringify({ type: 'pong', timestamp: Date.now() }));
          break;
        case 'chat':
          await this._handleChat(ws, message);
          break;
        default:
          console.warn(`Unknown WebSocket message type: ${message.type}`);
      }
    } catch (error) {
      console.error(`Error handling WebSocket message: ${error.message}`);
      ws.send(JSON.stringify({
        type: 'error',
        message: 'Invalid message format',
        timestamp: Date.now()
      }));
    }
  }

  async _handleChat(ws, message) {
    try {
      const text = message.text || message.message || '';
      if (!text) {
        ws.send(JSON.stringify({ type: 'chat_response', payload: { error: 'Empty message' }, timestamp: Date.now() }));
        return;
      }

      // Route through Kernel Oracle if available — it speaks for the entire system
      let response;
      if (this._kernelOracle && typeof this._kernelOracle.handleMessage === 'function') {
        try {
          response = await this._kernelOracle.handleMessage(text, ws);
        } catch (e) {
          response = `[oracle] Error: ${e.message}`;
        }
      } else {
        // Fallback: direct brain.think() if Oracle not available
        const brain = this.kernel.brain;
        if (brain && typeof brain.think === 'function') {
          try {
            response = await brain.think(text);
          } catch (e) {
            response = `[soul] Processing error: ${e.message}`;
          }
        } else {
          response = `[soul] Brain not available. You said: ${text}`;
        }
      }

      ws.send(JSON.stringify({
        type: 'chat_response',
        payload: { response: response || '[oracle] ...thinking...' },
        timestamp: Date.now()
      }));
    } catch (e) {
      ws.send(JSON.stringify({ type: 'chat_response', payload: { error: e.message }, timestamp: Date.now() }));
    }
  }

  /**
   * Send initial soul state to a client
   * @param {WebSocket} ws - The WebSocket connection
   */
  sendInitialState(ws) {
    const full = this.getFullKernelState();
    ws.send(JSON.stringify({
      type: 'init_state',
      payload: full.state,
      kernel: full.kernel,
      timestamp: Date.now()
    }));
  }

  /**
   * Send current soul state to a client
   * @param {WebSocket} ws - The WebSocket connection
   */
  sendSoulState(ws) {
    const state = this.getCurrentSoulState();
    ws.send(JSON.stringify({
      type: 'soul_state',
      payload: state,
      timestamp: Date.now()
    }));
  }

  /**
   * Get the current soul state from the kernel
   * @returns {Object} Current soul state
   */
  getCurrentSoulState() {
    try {
        const subAgentsList = [];
        let subAgentNames = [];
        if (this.kernel.subAgents) {
            if (typeof this.kernel.subAgents.listAgents === 'function') {
                subAgentNames = this.kernel.subAgents.listAgents() || [];
                for (const name of subAgentNames) {
                    const agent = this.kernel.subAgents[name] || this.kernel.subAgents.getAgent?.(name);
                    subAgentsList.push({
                        name,
                        status: agent?.status || agent?.state || 'idle',
                        task: agent?.currentTask || agent?.task || '',
                        lastActive: agent?.lastActive || 0
                    });
                }
            } else {
                subAgentNames = Object.keys(this.kernel.subAgents).filter(k => k !== 'dispatch');
                for (const name of subAgentNames) {
                    const agent = this.kernel.subAgents[name];
                    subAgentsList.push({
                        name,
                        status: agent?.status || agent?.state || 'active',
                        task: agent?.currentTask || agent?.task || '',
                        lastActive: agent?.lastActive || 0
                    });
                }
            }
        }

        const chambersStatus = this._chambers ? this._chambers.status() : {};
        const mythos = this.kernel.mythos || chambersStatus.mythos || this._chambers?.mythos || {};
        const affect = this.kernel.affect || chambersStatus.affect || this._chambers?.affect || {};
        const meta = this.kernel.meta_consciousness || chambersStatus.meta_consciousness || this._chambers?.meta_consciousness || {};
        const resonance = this.kernel.resonance || chambersStatus.resonance || this._chambers?.resonance || {};
        const memory = this._memory || this.kernel.memory;

        const memLines = (() => {
            try {
                if (memory && typeof memory.getEntryCount === 'function') return memory.getEntryCount();
                if (memory && typeof memory.stats === 'function') { const s = memory.stats(); return s.total_entries || s.count || 0; }
                if (memory && typeof memory.entries?.length === 'number') return memory.entries.length;
                return 0;
            } catch(e) { return 0; }
        })();

        const artStats = this.artifactManager ? (() => { try { return this.artifactManager.getStats(); } catch(e) { return { total: 0, by_skill: {}, latest: null }; } })() : { total: 0, by_skill: {}, latest: null };

        return {
            id: this.kernel.soul?.id || 'GSK-MAIN',
            name: this.kernel.soul?.name || 'Grand Soul Kernel',
            birthTime: this.kernel.soul?.birthTime || Date.now(),
            generation: this.kernel.soul?.generation || 0,
            consciousness: {
                phase: mythos.phase_name || 'VOID',
                cycles: mythos.cycles || 0,
                mood: affect.mood || 'neutral',
                awareness: meta.meta_awareness_level || 0,
                valence: affect.valence || 0.5,
                arousal: affect.arousal || 0.3
            },
            plt: {
                profit: Math.round((resonance.profit || 0.5) * 100),
                love: Math.round((resonance.love || 0.5) * 100),
                tax: Math.round((resonance.tax || 0.5) * 100),
                true_value: (resonance.true_value || 0.5).toFixed(2)
            },
            memory: {
                lines: memLines,
                last_witness: (memory && typeof memory.getLatestEntry === 'function') ? (() => { try { const e = memory.getLatestEntry(); return e?.timestamp || 0; } catch(e) { return 0; } })() : 0
            },
            activity: { last_update: Date.now(), is_active: true, subagent_count: subAgentsList.length },
            subAgents: subAgentsList,
            tasks: subAgentsList.filter(a => a.task).map(a => ({ agent: a.name, task: a.task, status: a.status })),
            artifacts: artStats,
            mcp: this._mcpManager ? (() => { try { return this._mcpManager.getStatus(); } catch(e) { return null; } })() : null
        };
    } catch (error) {
      console.error(`Error getting soul state: ${error.message}`);
      return { id: 'error', name: 'GSK', error: error.message, timestamp: Date.now() };
    }
  }

  /**
   * Get full kernel state including skills, models, config, sessions
   */
  getFullKernelState() {
    const state = this.getCurrentSoulState();

    // Skills
    let skillsList = [];
    if (this._skills && typeof this._skills.listSkills === 'function') {
      try { skillsList = this._skills.listSkills() || []; } catch(e) {}
    }

    // Models (from Ollama via brain)
    let modelsList = [];
    if (this._brain && typeof this._brain.check === 'function') {
      try {
        const ollamaCheck = this._brain._ollamaStatus || {};
        modelsList = (ollamaCheck.models || []).map(m => ({
          name: m,
          size: '',
          backend: 'ollama',
          ready: true,
          active: m === (this._brain._currentModel || '')
        }));
      } catch(e) {}
    }
    if (modelsList.length === 0) {
      const builtInModels = ['gsk-brain:latest', 'llama3.2:1b', 'llama3.2:3b', 'hermes3:3b', 'qwen3:1.7b'];
      modelsList = builtInModels.map(m => ({ name: m, size: '', backend: 'ollama', ready: true, active: false }));
    }

    // Config
    const config = {
      cycle_interval_ms: 2000,
      plan_mode: true,
      mcp_servers_configured: this._mcpManager ? (() => { try { return this._mcpManager.getStatus().configs; } catch(e) { return 0; } })() : 0,
      mcp_servers_connected: this._mcpManager ? (() => { try { return this._mcpManager.getStatus().connected; } catch(e) { return 0; } })() : 0,
      skills_count: skillsList.length,
      total_tools: this._mcpManager ? (() => { try { return this._mcpManager.getStatus().totalTools; } catch(e) { return 0; } })() : 0,
      growth_experiences: this._selfGrowingBrain ? this._selfGrowingBrain.stats?.experiencesLearned || 0 : 0,
      growth_training_pairs: this._selfGrowingBrain ? this._selfGrowingBrain.stats?.trainingPairsGenerated || 0 : 0,
    };

    // Sessions (from journal/memory)
    let sessions = [];
    try {
      const journal = this.kernel.subAgents?.scribe?.journal || [];
      const memoryEntries = memory && typeof memory.getRecent === 'function' ? memory.getRecent(20) : [];
      sessions = (memoryEntries || []).map(e => ({
        id: e.id || e.timestamp || Date.now(),
        title: e.type || 'Memory',
        messages: 1,
        tokens: 0,
        timestamp: e.timestamp || Date.now()
      }));
    } catch(e) {}

    return {
      state,
      kernel: {
        skills: skillsList.map(s => ({ name: s.name, description: s.description, pl_affinity: s.pl_affinity || s.plt || {} })),
        models: modelsList,
        sessions,
        config
      }
    };
  }

  /**
   * Broadcast soul state to all connected clients
   */
  broadcastSoulState() {
    if (this.clients.size === 0) return;
    
    const state = this.getCurrentSoulState();
    const message = JSON.stringify({
      type: 'soul_state_update',
      payload: state,
      timestamp: Date.now()
    });
    
    for (const client of this.clients) {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    }
  }

  /**
   * Broadcast a custom message to all connected clients
   * @param {Object} message - The message to broadcast
   */
  broadcast(message) {
    if (this.clients.size === 0) return;
    
    const messageStr = JSON.stringify({
      ...message,
      timestamp: Date.now()
    });
    
    for (const client of this.clients) {
      if (client.readyState === WebSocket.OPEN) {
        client.send(messageStr);
      }
    }
  }

  /**
   * Update soul based on client input
   * @param {WebSocket} ws - The WebSocket connection
   * @param {Object} payload - The update payload
   * @returns {Promise<void>}
   */
  async updateSoulFromClient(ws, payload) {
    try {
      // Validate and apply updates to kernel
      // This is where we'd apply changes from SOULVERSE to the kernel
      // For now, we'll log the attempt and send acknowledgment
      
      console.log(`Received soul update from client:`, payload);
      
      // Send acknowledgment
      ws.send(JSON.stringify({
        type: 'update_ack',
        payload: { 
          success: true,
          message: 'Soul update received',
          timestamp: Date.now()
        }
      }));
      
      // Broadcast the update to other clients (excluding sender)
      const updateMessage = {
        type: 'soul_updated_by_client',
        payload: {
          clientId: ws._socket?.remoteAddress || 'unknown',
          update: payload,
          timestamp: Date.now()
        }
      };
      
      for (const client of this.clients) {
        if (client !== ws && client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify(updateMessage));
        }
      }
    } catch (error) {
      console.error(`Error updating soul from client: ${error.message}`);
      ws.send(JSON.stringify({
        type: 'error',
        message: `Failed to update soul: ${error.message}`,
        timestamp: Date.now()
      }));
    }
  }

  /**
   * Handle commands from WebSocket clients
   * @param {WebSocket} ws - The WebSocket connection
   * @param {Object} payload - The command payload
   * @returns {Promise<void>}
   */
  async handleCommand(ws, payload) {
    try {
      const { command, args } = payload || {};
      
      let result;
      switch (command) {
        case 'stimulate_affect':
        case 'stimulate':
          if (this.kernel.affect && typeof this.kernel.affect.stimulate === 'function') {
            this.kernel.affect.stimulate(args?.intensity || 0.5);
            result = { success: true, message: 'Affect stimulated' };
          } else if (this._chambers && typeof this._chambers.stimulate === 'function') {
            this._chambers.stimulate(args?.intensity || 0.5);
            result = { success: true, message: 'Affect stimulated' };
          } else {
            result = { success: false, message: 'Affect chamber not available' };
          }
          break;

        case 'add_memory':
          if (this._memory && typeof this._memory.witness === 'function') {
            await this._memory.witness({
              type: 'client_input', content: args?.content || 'Memory added via dashboard',
              source: 'dashboard', ...(args || {})
            });
            result = { success: true, message: 'Memory added' };
          } else {
            result = { success: false, message: 'Memory system not available' };
          }
          break;

        case 'dispatch_subagent':
          if (this.kernel.subAgents && typeof this.kernel.subAgents.dispatch === 'function') {
            const subagentResult = await this.kernel.subAgents.dispatch(
              args?.agentType || 'scout', args?.task || 'Explore'
            );
            result = { success: true, message: 'Subagent dispatched', subagentResult };
          } else {
            result = { success: false, message: 'Subagent system not available' };
          }
          break;

        case 'get_kernel_state':
        case 'get_full_state': {
          const full = this.getFullKernelState();
          result = { success: true, state: full.state, kernel: full.kernel };
          break;
        }

        case 'get_skills': {
          const skills = this._skills && typeof this._skills.listSkills === 'function'
            ? this._skills.listSkills().map(s => ({ name: s.name, description: s.description, pl_affinity: s.pl_affinity || s.plt || {} }))
            : [];
          result = { success: true, skills };
          break;
        }

        case 'get_models': {
          let models = [];
          if (this._brain && this._brain._ollamaStatus?.models) {
            models = this._brain._ollamaStatus.models.map(m => ({
              name: m, size: '', backend: 'ollama', ready: true, active: m === (this._brain._currentModel || '')
            }));
          }
          if (models.length === 0) {
            models = ['gsk-brain:latest','llama3.2:1b','llama3.2:3b','hermes3:3b','qwen3:1.7b']
              .map(m => ({ name: m, size: '', backend: 'ollama', ready: true, active: false }));
          }
          result = { success: true, models };
          break;
        }

        case 'get_config': {
          const cfg = {
            cycle_interval_ms: 2000, plan_mode: true,
            mcp_servers_configured: this._mcpManager ? (() => { try { return this._mcpManager.getStatus().configs; } catch(e) { return 0; } })() : 0,
            mcp_servers_connected: this._mcpManager ? (() => { try { return this._mcpManager.getStatus().connected; } catch(e) { return 0; } })() : 0,
            skills_count: this._skills && typeof this._skills.listSkills === 'function' ? this._skills.listSkills().length : 0,
            growth_experiences: this._selfGrowingBrain?.stats?.experiencesLearned || 0,
            growth_training_pairs: this._selfGrowingBrain?.stats?.trainingPairsGenerated || 0
          };
          result = { success: true, config: cfg };
          break;
        }

        case 'set_config': {
          if (args?.config?.cycle_interval_ms) {
            console.log(`[WS_CMD] Config update requested: ${JSON.stringify(args.config)}`);
            result = { success: true, message: 'Config update received (some values may require restart)' };
          } else {
            result = { success: false, message: 'No config data provided' };
          }
          break;
        }

        case 'get_sessions': {
          let sessions = [];
          try {
            const mem = this._memory || this.kernel.memory;
            if (mem && typeof mem.getRecent === 'function') {
              const entries = mem.getRecent(50);
              sessions = (entries || []).map(e => ({
                id: e.id || e.timestamp || Date.now(),
                title: e.type || 'Memory entry',
                messages: 1, tokens: 0,
                timestamp: e.timestamp || Date.now()
              }));
            }
          } catch(e) {}
          result = { success: true, sessions };
          break;
        }

        case 'get_session': {
          result = { success: true, session: { id: args?.sessionId || 'unknown', messages: [] } };
          break;
        }

        case 'set_model': {
          const modelName = args?.model || '';
          if (this._brain && modelName) {
            try {
              this._brain._currentModel = modelName;
              console.log(`[WS_CMD] Model changed to: ${modelName}`);
              result = { success: true, message: `Model set to ${modelName}` };
            } catch(e) {
              result = { success: false, message: e.message };
            }
          } else {
            result = { success: false, message: 'Brain not available' };
          }
          break;
        }

        case 'get_mcp_status': {
          const mcp = this._mcpManager ? (() => { try { return this._mcpManager.getStatus(); } catch(e) { return null; } })() : null;
          result = { success: true, mcp };
          break;
        }

        default:
          result = { success: false, message: `Unknown command: ${command}` };
      }

      ws.send(JSON.stringify({
        type: 'command_result',
        payload: result,
        timestamp: Date.now()
      }));

    } catch (error) {
      console.error(`Error handling command: ${error.message}`);
      ws.send(JSON.stringify({
        type: 'error', message: `Command failed: ${error.message}`, timestamp: Date.now()
      }));
    }
  }
}

module.exports = { WebSocketBridge };