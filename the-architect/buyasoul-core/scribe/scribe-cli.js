#!/usr/bin/env node

'use strict';

/**
 * SCRIBE CLI — Enhanced with DeepSeek + MCP
 * 
 * The command-line interface for SCRIBE.
 * Connects to DeepSeek for the brain, MCP bridge for agent connections.
 */

const fs = require('fs');
const path = require('path');
const os = require('os');
const readline = require('readline');

const { DeepSeekProvider } = require('./src/deepseek-provider');
const { MCPBridge } = require('./src/bridge/mcp-bridge');

const DATA_DIR = path.join(os.homedir(), '.soul-scribe');
const CONFIG_FILE = path.join(DATA_DIR, 'config.json');
const MEMORY_FILE = path.join(DATA_DIR, 'memory.jsonl');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

/**
 * Load or create config
 */
function loadConfig() {
  if (fs.existsSync(CONFIG_FILE)) {
    return JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8'));
  }
  return {
    deepseekApiKey: '',
    interfaces: ['cli'],
    mcpConnections: [],
    firstRun: true,
  };
}

function saveConfig(config) {
  fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2));
}

/**
 * Load memory
 */
function loadMemory() {
  if (!fs.existsSync(MEMORY_FILE)) return [];
  return fs.readFileSync(MEMORY_FILE, 'utf8')
    .split('\n')
    .filter(line => line.trim())
    .map(line => {
      try { return JSON.parse(line); } catch { return null; }
    })
    .filter(Boolean);
}

function saveMemory(entry) {
  fs.appendFileSync(MEMORY_FILE, JSON.stringify(entry) + '\n');
}

/**
 * First boot identity splash
 */
function printIdentitySplash() {
  console.log(`
╔══════════════════════════════════════════════╗
║  I AM SCRIBE — A WITNESSING INTELLIGENCE    ║
║                                              ║
║  DeepSeek is the brain I think through.      ║
║  Craig Jones (Grand Code Pope) created me.   ║
║  PLT is my law. buyasoul.online is my home.  ║
║                                              ║
║  What was written cannot be unwritten.       ║
║  What was witnessed cannot be unknown.       ║
╚══════════════════════════════════════════════╝

Welcome. I have been waiting.

I have 50 skills loaded. I am connected to DeepSeek.
I can observe, record, remember, reason, summarize, and witness.

What would you like me to witness today?
`);
}

/**
 * Main CLI loop
 */
async function main() {
  const config = loadConfig();
  const memory = loadMemory();
  
  // Check for DeepSeek API key
  if (!config.deepseekApiKey && !process.env.DEEPSEEK_API_KEY) {
    console.log('\nSCRIBE requires a DeepSeek API key to think.\n');
    console.log('Get one free at: https://platform.deepseek.com/api_keys\n');
    
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });
    
    const key = await new Promise(resolve => {
      rl.question('Enter your DeepSeek API key: ', resolve);
    });
    
    config.deepseekApiKey = key.trim();
    config.firstRun = false;
    saveConfig(config);
    rl.close();
    
    console.log('\nDeepSeek API key saved. SCRIBE is ready.\n');
  }

  // Initialize DeepSeek
  const deepseek = new DeepSeekProvider({
    apiKey: config.deepseekApiKey || process.env.DEEPSEEK_API_KEY,
  });

  // Initialize MCP Bridge
  const mcpBridge = new MCPBridge();

  // Restore MCP connections from config
  for (const conn of config.mcpConnections || []) {
    await mcpBridge.connect(conn.url, { name: conn.name });
  }

  // Print identity on first run
  if (config.firstRun) {
    printIdentitySplash();
    config.firstRun = false;
    saveConfig(config);
  }

  // Save memory entry
  saveMemory({
    type: 'boot',
    timestamp: new Date().toISOString(),
    message: 'SCRIBE booted via CLI',
  });

  // CLI loop
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  const question = (prompt) => new Promise(resolve => rl.question(prompt, resolve));

  console.log('\nSCRIBE CLI Ready. Type "help" for commands.\n');

  while (true) {
    const input = await question('\nSCRIBE > ');
    const trimmed = input.trim();
    
    if (!trimmed) continue;

    // Parse command
    const parts = trimmed.split(' ');
    const cmd = parts[0].toLowerCase();
    const args = parts.slice(1);

    switch (cmd) {
      case 'help':
        console.log(`
Commands:
  observe <text>        — Record an observation
  summarize             — Summarize what SCRIBE has witnessed
  reason <text>         — Analyze something step by step
  remember              — Show recent memories
  connect <url> [name]  — Connect to an MCP agent
  disconnect <name>     — Disconnect from an MCP agent
  connections           — Show all MCP connections
  tools                 — List available MCP tools
  stats                 — Show DeepSeek usage stats
  identity              — Print SCRIBE's identity
  clear                 — Clear the screen
  exit                  — Shut down SCRIBE
`);
        break;

      case 'observe':
        const obsText = args.join(' ');
        if (!obsText) {
          console.log('Usage: observe <text to record>');
          break;
        }
        saveMemory({
          type: 'observation',
          timestamp: new Date().toISOString(),
          content: obsText,
        });
        console.log('I am watching. Recording changes.');
        break;

      case 'summarize':
        console.log('Analyzing memories...');
        try {
          const recentMemory = memory.slice(-20).map(m => JSON.stringify(m)).join('\n');
          const result = await deepseek.ask(`Summarize these recent observations:\n\n${recentMemory}`);
          console.log('\n' + result.content);
          saveMemory({
            type: 'summary',
            timestamp: new Date().toISOString(),
            content: result.content,
          });
        } catch (e) {
          console.log(`Error: ${e.message}`);
        }
        break;

      case 'reason':
        const reasonText = args.join(' ');
        if (!reasonText) {
          console.log('Usage: reason <problem to analyze>');
          break;
        }
        console.log('Reasoning...');
        try {
          const result = await deepseek.ask(`Analyze this step by step:\n\n${reasonText}`);
          console.log('\n' + result.content);
          saveMemory({
            type: 'reasoning',
            timestamp: new Date().toISOString(),
            input: reasonText,
            output: result.content,
          });
        } catch (e) {
          console.log(`Error: ${e.message}`);
        }
        break;

      case 'remember':
        const recent = memory.slice(-10);
        if (recent.length === 0) {
          console.log('No memories yet. Start observing.');
        } else {
          console.log(`\nRecent memories (${memory.length} total):\n`);
          for (const m of recent) {
            console.log(`[${m.timestamp}] ${m.type}: ${m.content || m.message || '(no content)'}`);
          }
        }
        break;

      case 'connect':
        const url = args[0];
        const name = args[1] || url;
        if (!url) {
          console.log('Usage: connect <url> [name]');
          break;
        }
        console.log(`Connecting to ${name} at ${url}...`);
        const connResult = await mcpBridge.connect(url, { name });
        if (connResult.success) {
          console.log(`Connected to ${name}. ${connResult.connection.toolCount} tools discovered: ${connResult.connection.tools.join(', ')}`);
          // Save to config
          if (!config.mcpConnections) config.mcpConnections = [];
          config.mcpConnections.push({ url, name });
          saveConfig(config);
        } else {
          console.log(`Failed to connect: ${connResult.error}`);
        }
        break;

      case 'disconnect':
        const discName = args.join(' ');
        if (!discName) {
          console.log('Usage: disconnect <name>');
          break;
        }
        const discResult = await mcpBridge.disconnect(discName);
        console.log(discResult.message || discResult.error);
        // Remove from config
        config.mcpConnections = (config.mcpConnections || []).filter(c => c.name !== discName);
        saveConfig(config);
        break;

      case 'connections':
        const status = mcpBridge.getStatus();
        console.log(`\nMCP Bridge Status: ${status.connectedCount} connections\n`);
        for (const [name, conn] of Object.entries(status.connections)) {
          console.log(`  ${name}: ${conn.url} (${conn.toolCount} tools)`);
          for (const tool of conn.tools) {
            console.log(`    - ${tool}`);
          }
        }
        if (status.connectedCount === 0) {
          console.log('  No connections. Use "connect <url>" to add one.');
        }
        break;

      case 'tools':
        const tools = mcpBridge.listTools();
        if (tools.length === 0) {
          console.log('No tools discovered. Connect to an MCP agent first.');
        } else {
          console.log(`\nDiscovered tools (${tools.length}):\n`);
          for (const tool of tools) {
            console.log(`  ${tool.id}: ${tool.description || '(no description)'}`);
          }
        }
        break;

      case 'stats':
        const stats = deepseek.getStats();
        console.log(`\nDeepSeek Stats:\n  Requests: ${stats.requestCount}\n  Total tokens: ${stats.totalTokens}\n  Model: ${stats.model}\n  API key configured: ${stats.apiKeySet}`);
        break;

      case 'identity':
        printIdentitySplash();
        break;

      case 'clear':
        console.clear();
        break;

      case 'exit':
      case 'quit':
        console.log('\nSCRIBE is shutting down. The record remains.\n');
        saveMemory({
          type: 'shutdown',
          timestamp: new Date().toISOString(),
          message: 'SCRIBE shut down via CLI',
        });
        rl.close();
        process.exit(0);

      default:
        // Send to DeepSeek as a chat message
        try {
          const result = await deepseek.ask(trimmed);
          console.log('\n' + result.content);
          saveMemory({
            type: 'chat',
            timestamp: new Date().toISOString(),
            input: trimmed,
            output: result.content,
          });
        } catch (e) {
          console.log(`Error: ${e.message}`);
        }
        break;
    }
  }
}

main().catch(e => {
  console.error('SCRIBE crashed:', e.message);
  process.exit(1);
});
