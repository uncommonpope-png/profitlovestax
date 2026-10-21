/**
 * Observation Engine
 * Watches log files and polls MCP inbox for observations
 * Tags by source: terminal, agent, user
 */

const fs = require('fs');
const http = require('http');
const path = require('path');

class ObservationEngine {
  constructor(config = {}) {
    this.config = {
      pollInterval: config.pollInterval || 30000, // 30 seconds default
      mcpInboxUrl: config.mcpInboxUrl || '',
      logPaths: config.logPaths || [],
      onObservation: config.onObservation || this._defaultHandler.bind(this)
    };
    
    this.watchers = [];
    this.pollTimer = null;
    this.isRunning = false;
    this.seenLogLines = new Set();
  }

  /**
   * Start the observation engine
   */
  start() {
    if (this.isRunning) {
      console.log('[ObservationEngine] Already running');
      return;
    }

    console.log('[ObservationEngine] Starting...');
    this.isRunning = true;

    // Start watching log files
    this._startLogWatchers();

    // Start polling MCP inbox
    this._startMcpPolling();

    console.log('[ObservationEngine] Started successfully');
  }

  /**
   * Stop the observation engine
   */
  stop() {
    if (!this.isRunning) {
      console.log('[ObservationEngine] Not running');
      return;
    }

    console.log('[ObservationEngine] Stopping...');
    this.isRunning = false;

    // Stop all file watchers
    this.watchers.forEach(watcher => {
      try {
        watcher.close();
      } catch (err) {
        console.error('[ObservationEngine] Error closing watcher:', err.message);
      }
    });
    this.watchers = [];

    // Stop MCP polling
    if (this.pollTimer) {
      clearInterval(this.pollTimer);
      this.pollTimer = null;
    }

    console.log('[ObservationEngine] Stopped');
  }

  observe(observation) {
    if (!observation) return null;
    const normalized = typeof observation === 'string'
      ? { source: 'system', content: observation, timestamp: new Date().toISOString() }
      : { timestamp: new Date().toISOString(), source: 'system', ...observation };
    this.config.onObservation(normalized);
    return normalized;
  }

  /**
   * Start watching log files
   * @private
   */
  _startLogWatchers() {
    if (!this.config.logPaths || this.config.logPaths.length === 0) {
      console.log('[ObservationEngine] No log paths configured');
      return;
    }

    this.config.logPaths.forEach(logPath => {
      try {
        // Check if file exists
        if (!fs.existsSync(logPath)) {
          console.warn(`[ObservationEngine] Log file not found: ${logPath}`);
          return;
        }

        const watcher = fs.watch(logPath, (eventType, filename) => {
          if (eventType === 'change' || eventType === 'rename') {
            this._handleLogChange(logPath);
          }
        });

        this.watchers.push(watcher);
        console.log(`[ObservationEngine] Watching: ${logPath}`);
      } catch (err) {
        console.error(`[ObservationEngine] Error watching ${logPath}:`, err.message);
      }
    });
  }

  /**
   * Handle log file changes
   * @private
   */
  _handleLogChange(logPath) {
    try {
      const content = fs.readFileSync(logPath, 'utf8');
      const lines = content.split('\n').filter(line => line.trim());
      
      if (lines.length === 0) return;

      // Get last few lines (most recent)
      const recentLines = lines.slice(-10);
      const startIndex = lines.length - recentLines.length;
      
      recentLines.forEach((line, idx) => {
        const key = `${logPath}:${startIndex + idx}:${line}`;
        if (this.seenLogLines.has(key)) return;
        this.seenLogLines.add(key);
        if (this.seenLogLines.size > 1000) this.seenLogLines.delete(this.seenLogLines.values().next().value);

        const observation = {
          source: this._detectSource(logPath, line),
          timestamp: new Date().toISOString(),
          content: line,
          file: path.basename(logPath)
        };

        this.config.onObservation(observation);
      });
    } catch (err) {
      console.error(`[ObservationEngine] Error reading ${logPath}:`, err.message);
    }
  }

  /**
   * Detect observation source from log path and content
   * @private
   */
  _detectSource(logPath, content) {
    const filename = path.basename(logPath).toLowerCase();
    
    // Check filename patterns
    if (filename.includes('terminal') || filename.includes('shell')) {
      return 'terminal';
    }
    if (filename.includes('agent') || filename.includes('bot')) {
      return 'agent';
    }
    if (filename.includes('user') || filename.includes('input')) {
      return 'user';
    }

    // Check content patterns
    if (content.includes('$') || content.includes('>')) {
      return 'terminal';
    }
    if (content.includes('[Agent]') || content.includes('[Bot]')) {
      return 'agent';
    }
    if (content.includes('[User]') || content.includes('User:')) {
      return 'user';
    }

    return 'unknown';
  }

  /**
   * Start polling MCP inbox
   * @private
   */
  _startMcpPolling() {
    if (!this.config.mcpInboxUrl) {
      console.log('[ObservationEngine] MCP inbox polling disabled (no URL configured)');
      return;
    }

    console.log(`[ObservationEngine] Polling MCP inbox every ${this.config.pollInterval}ms`);
    
    // Poll immediately
    this._pollMcpInbox();

    // Then poll at interval
    this.pollTimer = setInterval(() => {
      this._pollMcpInbox();
    }, this.config.pollInterval);
  }

  /**
   * Poll MCP inbox endpoint
   * @private
   */
  _pollMcpInbox() {
    const url = new URL(this.config.mcpInboxUrl);
    
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname,
      method: 'GET',
      timeout: 5000
    };

    const req = http.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          if (res.statusCode === 200) {
            const messages = JSON.parse(data);
            
            if (Array.isArray(messages) && messages.length > 0) {
              messages.forEach(msg => {
                const observation = {
                  source: msg.source || 'agent',
                  timestamp: msg.timestamp || new Date().toISOString(),
                  content: msg.content || msg.message || JSON.stringify(msg),
                  type: 'mcp_inbox'
                };

                this.config.onObservation(observation);
              });
            }
          }
        } catch (err) {
          console.error('[ObservationEngine] Error parsing MCP response:', err.message);
        }
      });
    });

    req.on('error', (err) => {
      // Silently ignore connection errors (MCP might not be running)
      if (err.code !== 'ECONNREFUSED' && err.code !== 'ETIMEDOUT') {
        console.error('[ObservationEngine] MCP polling error:', err.message);
      }
    });

    req.on('timeout', () => {
      req.destroy();
    });

    req.end();
  }

  /**
   * Default observation handler
   * @private
   */
  _defaultHandler(observation) {
    console.log(`[${observation.source.toUpperCase()}] ${observation.content}`);
  }

  /**
   * Add a log path to watch
   */
  addLogPath(logPath) {
    if (!this.config.logPaths.includes(logPath)) {
      this.config.logPaths.push(logPath);
      
      if (this.isRunning) {
        // If already running, start watching this new path
        try {
          if (fs.existsSync(logPath)) {
            const watcher = fs.watch(logPath, (eventType) => {
              if (eventType === 'change' || eventType === 'rename') {
                this._handleLogChange(logPath);
              }
            });
            this.watchers.push(watcher);
            console.log(`[ObservationEngine] Now watching: ${logPath}`);
          }
        } catch (err) {
          console.error(`[ObservationEngine] Error watching ${logPath}:`, err.message);
        }
      }
    }
  }

  /**
   * Remove a log path from watching
   */
  removeLogPath(logPath) {
    const index = this.config.logPaths.indexOf(logPath);
    if (index > -1) {
      this.config.logPaths.splice(index, 1);
      // Note: We don't remove the watcher here as fs.watch doesn't provide
      // a way to identify which watcher corresponds to which path
      console.log(`[ObservationEngine] Removed from config: ${logPath}`);
    }
  }
}

// Export factory function and class
module.exports = {
  /**
   * Create and start an observation engine
   */
  start: (config) => {
    const engine = new ObservationEngine(config);
    engine.start();
    return engine;
  },

  /**
   * Create an observation engine without starting it
   */
  create: (config) => {
    return new ObservationEngine(config);
  },

  ObservationEngine
};
