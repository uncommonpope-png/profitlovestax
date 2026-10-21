#!/usr/bin/env node
'use strict';

/**
 * GSK HARNESS — Daemon Management & Health Monitor
 * 
 * Commands:
 *   node gsk-harness.js start      Start GSK daemon
 *   node gsk-harness.js stop       Stop GSK daemon
 *   node gsk-harness.js restart    Restart GSK daemon
 *   node gsk-harness.js status     Check all services health
 *   node gsk-harness.js doctor     Full diagnostic report
 *   node gsk-harness.js logs       Tail daemon logs
 *   node gsk-harness.js tokens     Show token usage stats
 *   node gsk-harness.js config     Show current configuration
 */

const { spawn, execSync } = require('child_process');
const http = require('http');
const fs = require('fs');
const path = require('path');

// ═══════════════════════════════════════════════════════════
// CONFIGURATION
// ═══════════════════════════════════════════════════════════

const CONFIG = {
    gskDir: process.env.GSK_DIR || path.join(__dirname, 'the-architect', 'buyasoul-core', 'gsk'),
    daemonScript: 'gsk_daemon.js',
    logDir: path.join(__dirname, 'logs'),
    pidFile: path.join(__dirname, 'logs', 'gsk.pid'),
    tokenLog: path.join(__dirname, 'logs', 'token-usage.jsonl'),
    
    // Service ports
    ports: {
        mcp: 3001,
        thoughtStream: 3002,
        omniroute: 20128,
        workbench: 3000
    },
    
    // Environment defaults
    env: {
        NINE_ROUTER_API_KEY: process.env.NINE_ROUTER_API_KEY || 'test',
        NINE_ROUTER_URL: process.env.NINE_ROUTER_URL || 'http://127.0.0.1:20128',
        GSK_PROJECT_ROOTS: process.env.GSK_PROJECT_ROOTS || __dirname,
        GSK_MODEL: process.env.GSK_MODEL || 'auto/best-reasoning',
        GSK_MODEL_FALLBACKS: process.env.GSK_MODEL_FALLBACKS || 'auto/best-fast,auto/best-coding,auto/smart',
        MCP_API_KEY: process.env.MCP_API_KEY || 'gsk-dev-key',
        GSK_CREATIVE_AUTONOMY: '1'
    },
    
    // Health check timeouts
    timeouts: {
        portCheck: 2000,
        healthCheck: 5000,
        startupWait: 15000
    },
    
    // Auto-restart settings
    autoRestart: {
        enabled: true,
        maxRetries: 3,
        cooldownMs: 30000
    }
};

// ═══════════════════════════════════════════════════════════
// UTILITIES
// ═══════════════════════════════════════════════════════════

function log(level, msg) {
    const ts = new Date().toISOString();
    const prefix = { info: '✓', warn: '⚠', error: '✗', start: '▶', stop: '■' }[level] || '•';
    console.log(`[${ts}] ${prefix} ${msg}`);
}

function ensureLogDir() {
    if (!fs.existsSync(CONFIG.logDir)) {
        fs.mkdirSync(CONFIG.logDir, { recursive: true });
    }
}

function savePid(pid) {
    ensureLogDir();
    fs.writeFileSync(CONFIG.pidFile, String(pid));
}

function loadPid() {
    try {
        return parseInt(fs.readFileSync(CONFIG.pidFile, 'utf-8').trim());
    } catch {
        return null;
    }
}

function clearPid() {
    try { fs.unlinkSync(CONFIG.pidFile); } catch {}
}

function isProcessRunning(pid) {
    try {
        process.kill(pid, 0);
        return true;
    } catch {
        return false;
    }
}

function httpGet(url, timeout = 3000) {
    return new Promise((resolve, reject) => {
        const req = http.get(url, { timeout }, (res) => {
            let data = '';
            res.on('data', c => data += c);
            res.on('end', () => resolve({ status: res.statusCode, data }));
        });
        req.on('error', reject);
        req.on('timeout', () => { req.destroy(); reject(new Error('timeout')); });
    });
}

function httpPost(url, body, headers = {}, timeout = 5000) {
    return new Promise((resolve, reject) => {
        const data = JSON.stringify(body);
        const urlObj = new URL(url);
        const req = http.request({
            hostname: urlObj.hostname,
            port: urlObj.port,
            path: urlObj.pathname,
            method: 'POST',
            headers: { 'Content-Type': 'application/json', ...headers },
            timeout
        }, (res) => {
            let buf = '';
            res.on('data', c => buf += c);
            res.on('end', () => resolve({ status: res.statusCode, data: buf }));
        });
        req.on('error', reject);
        req.on('timeout', () => { req.destroy(); reject(new Error('timeout')); });
        req.write(data);
        req.end();
    });
}

function formatUptime(ms) {
    const s = Math.floor(ms / 1000);
    const m = Math.floor(s / 60);
    const h = Math.floor(m / 60);
    if (h > 0) return `${h}h ${m % 60}m`;
    if (m > 0) return `${m}m ${s % 60}s`;
    return `${s}s`;
}

// ═══════════════════════════════════════════════════════════
// TOKEN TRACKING
// ═══════════════════════════════════════════════════════════

function logTokenUsage(entry) {
    ensureLogDir();
    const record = {
        timestamp: new Date().toISOString(),
        ...entry
    };
    fs.appendFileSync(CONFIG.tokenLog, JSON.stringify(record) + '\n');
}

function getTokenStats() {
    try {
        const lines = fs.readFileSync(CONFIG.tokenLog, 'utf-8').trim().split('\n').filter(Boolean);
        const entries = lines.map(l => JSON.parse(l));
        
        const now = Date.now();
        const last24h = entries.filter(e => now - new Date(e.timestamp).getTime() < 86400000);
        const last1h = entries.filter(e => now - new Date(e.timestamp).getTime() < 3600000);
        
        return {
            totalCalls: entries.length,
            last24h: last24h.length,
            last1h: last1h.length,
            totalTokens: entries.reduce((s, e) => s + (e.tokens || 0), 0),
            tokensLast24h: last24h.reduce((s, e) => s + (e.tokens || 0), 0),
            tokensLast1h: last1h.reduce((s, e) => s + (e.tokens || 0), 0),
            avgTokensPerCall: entries.length > 0 ? Math.round(entries.reduce((s, e) => s + (e.tokens || 0), 0) / entries.length) : 0,
            lastEntry: entries[entries.length - 1] || null
        };
    } catch {
        return { totalCalls: 0, last24h: 0, last1h: 0, totalTokens: 0, tokensLast24h: 0, tokensLast1h: 0, avgTokensPerCall: 0, lastEntry: null };
    }
}

// ═══════════════════════════════════════════════════════════
// HEALTH CHECKS
// ═══════════════════════════════════════════════════════════

async function checkPort(name, port) {
    try {
        const res = await httpGet(`http://127.0.0.1:${port}/`, CONFIG.timeouts.portCheck);
        return { name, port, status: 'up', code: res.status };
    } catch (e) {
        // MCP health has a specific endpoint
        if (port === CONFIG.ports.mcp) {
            try {
                const res = await httpGet(`http://127.0.0.1:${port}/mcp/health`, CONFIG.timeouts.portCheck);
                return { name, port, status: 'up', code: res.status, data: JSON.parse(res.data) };
            } catch {}
        }
        return { name, port, status: 'down', error: e.message };
    }
}

async function checkMCPHealth() {
    try {
        const res = await httpGet(`http://127.0.0.1:${CONFIG.ports.mcp}/mcp/health`, CONFIG.timeouts.healthCheck);
        return JSON.parse(res.data);
    } catch {
        return null;
    }
}

async function checkMCPStatus() {
    try {
        const res = await httpPost(
            `http://127.0.0.1:${CONFIG.ports.mcp}/mcp/status`,
            {},
            { 'x-api-key': CONFIG.env.MCP_API_KEY },
            CONFIG.timeouts.healthCheck
        );
        return JSON.parse(res.data);
    } catch {
        return null;
    }
}

async function checkOmniRoute() {
    try {
        const res = await httpGet(`http://127.0.0.1:${CONFIG.ports.omniroute}/v1/models`, CONFIG.timeouts.healthCheck);
        const data = JSON.parse(res.data);
        const models = data.data || data;
        return { status: 'up', models: Array.isArray(models) ? models.length : 0 };
    } catch {
        return { status: 'down' };
    }
}

// ═══════════════════════════════════════════════════════════
// COMMANDS
// ═══════════════════════════════════════════════════════════

async function cmdStart() {
    log('start', 'Starting GSK daemon...');
    
    // Check if already running
    const existingPid = loadPid();
    if (existingPid && isProcessRunning(existingPid)) {
        log('warn', `GSK already running (PID ${existingPid})`);
        return;
    }
    clearPid();
    
    // Check OmniRoute
    const omni = await checkOmniRoute();
    if (omni.status !== 'up') {
        log('warn', 'OmniRoute not running on :20128 — brain will use local fallback');
    } else {
        log('info', `OmniRoute connected (${omni.models} models)`);
    }
    
    // Ensure log directory
    ensureLogDir();
    
    // Build env
    const env = { ...process.env, ...CONFIG.env };
    
    // Start daemon using boot-gsk.cjs which sets all env vars
    ensureLogDir();
    
    const child = spawn('node', ['boot-gsk.cjs'], {
        cwd: __dirname,
        stdio: 'ignore',
        detached: true
    });
    child.unref();
    savePid(child.pid);
    
    // Wait for MCP to come up
    log('info', 'Waiting for MCP server...');
    let mcpUp = false;
    for (let i = 0; i < 15; i++) {
        await new Promise(r => setTimeout(r, 2000));
        const health = await checkMCPHealth();
        if (health && health.status === 'ok') {
            mcpUp = true;
            log('info', `MCP server healthy (PID ${child.pid}, uptime: ${formatUptime(health.uptime)})`);
            break;
        }
    }
    
    if (!mcpUp) {
        log('warn', 'MCP server not responding after 30s — check logs/gsk-daemon.log');
    }
    
    logTokenUsage({ event: 'daemon_start', pid: child.pid, tokens: 0 });
    log('info', `GSK daemon running (PID ${child.pid})`);
    log('info', 'Use "node gsk-harness.cjs status" to check health');
    log('info', 'Use "node gsk-harness.cjs stop" to stop');
}

async function cmdStop() {
    log('stop', 'Stopping GSK daemon...');
    
    // Find and kill GSK daemon process
    try {
        // Kill any node process running gsk_daemon.js
        execSync('taskkill /FI "WINDOWTITLE eq GSK-Daemon*" /F /T 2>nul', { stdio: 'ignore' });
        // Also try by port
        try {
            const output = execSync('netstat -ano | findstr ":3001" | findstr "LISTENING"', { encoding: 'utf-8' });
            const match = output.trim().match(/\s+(\d+)\s*$/);
            if (match) {
                execSync(`taskkill /PID ${match[1]} /F 2>nul`, { stdio: 'ignore' });
            }
        } catch {}
        log('info', 'GSK daemon stopped');
    } catch (e) {
        log('warn', `Error stopping daemon: ${e.message}`);
    }
    
    clearPid();
    logTokenUsage({ event: 'daemon_stop', tokens: 0 });
}

async function cmdRestart() {
    await cmdStop();
    await new Promise(r => setTimeout(r, 2000));
    await cmdStart();
}

async function cmdStatus() {
    console.log('\n╔══════════════════════════════════════════════════════╗');
    console.log('║         GSK HARNESS — STATUS REPORT                 ║');
    console.log('╚══════════════════════════════════════════════════════╝\n');
    
    // Daemon process
    const pid = loadPid();
    const running = pid && isProcessRunning(pid);
    console.log(`Daemon:    ${running ? `RUNNING (PID ${pid})` : 'STOPPED'}`);
    
    // Port checks
    console.log('\n── Services ──');
    const ports = [
        { name: 'MCP Server', port: CONFIG.ports.mcp },
        { name: 'OmniRoute', port: CONFIG.ports.omniroute },
        { name: 'Workbench', port: CONFIG.ports.workbench }
    ];
    
    for (const p of ports) {
        const result = await checkPort(p.name, p.port);
        const icon = result.status === 'up' ? '🟢' : '🔴';
        console.log(`  ${icon} ${result.name.padEnd(15)} :${result.port}  ${result.status}${result.data ? ` (${result.data.status || ''})` : ''}`);
    }
    
    // MCP Health
    const health = await checkMCPHealth();
    if (health) {
        console.log('\n── MCP Health ──');
        console.log(`  Status:   ${health.status}`);
        console.log(`  Uptime:   ${formatUptime(health.uptime)}`);
        console.log(`  Version:  ${health.version}`);
    }
    
    // MCP Status (needs auth)
    const status = await checkMCPStatus();
    if (status?.result?.systems) {
        const s = status.result.systems;
        console.log('\n── GSK Systems ──');
        console.log(`  Identity:    ${s.identity?.name || 'unknown'}`);
        console.log(`  Creator:     ${s.identity?.creator || 'unknown'}`);
        console.log(`  Memory:      ${s.memory?.total_entries || 0} entries`);
        console.log(`  Skills:      ${s.skills?.total || 0}`);
        console.log(`  Council:     ${s.council?.gods?.join(', ') || 'none'}`);
        console.log(`  Chambers:    phase=${s.chambers?.phase || '?'} mood=${s.chambers?.mood || '?'}`);
        console.log(`  Brain:       model=${s.brain?.model || 'unknown'}`);
        console.log(`  Sub-agents:  ${s.sub_agents?.count || 0}`);
    }
    
    // Token stats
    const tokens = getTokenStats();
    console.log('\n── Token Usage ──');
    console.log(`  Total calls:     ${tokens.totalCalls}`);
    console.log(`  Last 24h:        ${tokens.last24h} calls, ${tokens.tokensLast24h} tokens`);
    console.log(`  Last 1h:         ${tokens.last1h} calls, ${tokens.tokensLast1h} tokens`);
    console.log(`  Avg per call:    ${tokens.avgTokensPerCall} tokens`);
    if (tokens.lastEntry) {
        console.log(`  Last event:      ${tokens.lastEntry.event || 'unknown'} at ${tokens.lastEntry.timestamp}`);
    }
    
    console.log('');
}

async function cmdDoctor() {
    console.log('\n╔══════════════════════════════════════════════════════╗');
    console.log('║         GSK HARNESS — FULL DIAGNOSTIC               ║');
    console.log('╚══════════════════════════════════════════════════════╝\n');
    
    // Check GSK directory
    const gskExists = fs.existsSync(CONFIG.gskDir);
    console.log(`GSK Directory:  ${gskExists ? '✓' : '✗'} ${CONFIG.gskDir}`);
    
    if (gskExists) {
        const daemonPath = path.join(CONFIG.gskDir, CONFIG.daemonScript);
        const daemonExists = fs.existsSync(daemonPath);
        console.log(`Daemon Script:  ${daemonExists ? '✓' : '✗'} ${CONFIG.daemonScript}`);
        
        const fusionPath = path.join(CONFIG.gskDir, 'fusion-loader.js');
        const fusionExists = fs.existsSync(fusionPath);
        console.log(`Fusion Loader:  ${fusionExists ? '✓' : '✗'} fusion-loader.js`);
        
        const brainPath = path.join(CONFIG.gskDir, 'gsk-core', 'brain', 'mega_brain.js');
        const brainExists = fs.existsSync(brainPath);
        console.log(`Brain Engine:    ${brainExists ? '✓' : '✗'} mega_brain.js`);
        
        const seshatPath = path.join(CONFIG.gskDir, 'gsk-core', 'brain', 'seshat_brain.js');
        const seshatExists = fs.existsSync(seshatPath);
        console.log(`Seshat Brain:    ${seshatExists ? '✓' : '✗'} seshat_brain.js`);
    }
    
    // Check environment
    console.log('\n── Environment ──');
    console.log(`NINE_ROUTER_API_KEY:  ${CONFIG.env.NINE_ROUTER_API_KEY ? '✓ set' : '✗ missing'}`);
    console.log(`NINE_ROUTER_URL:      ${CONFIG.env.NINE_ROUTER_URL}`);
    console.log(`GSK_PROJECT_ROOTS:    ${CONFIG.env.GSK_PROJECT_ROOTS ? '✓ set' : '✗ missing'}`);
    console.log(`MCP_API_KEY:          ${CONFIG.env.MCP_API_KEY ? '✓ set' : '⚠ using default'}`);
    console.log(`GSK_MODEL:            ${CONFIG.env.GSK_MODEL}`);
    
    // Check Seshat
    console.log('\n── Seshat Second Brain ──');
    const seshatRoot = 'C:\\Users\\uncom\\Desktop\\seshat-second-brain';
    const seshatExists = fs.existsSync(seshatRoot);
    console.log(`Seshat Directory: ${seshatExists ? '✓' : '✗'} ${seshatRoot}`);
    if (seshatExists) {
        const pagesDir = path.join(seshatRoot, 'pages');
        const pageCount = fs.existsSync(pagesDir) ? fs.readdirSync(pagesDir).filter(f => f.endsWith('.md')).length : 0;
        console.log(`Pages:            ${pageCount}`);
    }
    
    // Check OmniRoute
    console.log('\n── OmniRoute ──');
    const omni = await checkOmniRoute();
    console.log(`Status: ${omni.status === 'up' ? '🟢 RUNNING' : '🔴 DOWN'}`);
    if (omni.status === 'up') console.log(`Models: ${omni.models}`);
    
    // Services
    console.log('\n── Live Services ──');
    await cmdStatus();
}

async function cmdLogs() {
    const logFile = path.join(CONFIG.logDir, 'gsk-daemon.log');
    if (!fs.existsSync(logFile)) {
        log('info', 'No log file found');
        return;
    }
    
    // Tail the log file
    const { spawn } = require('child_process');
    const tail = spawn('tail', ['-f', '-n', '50', logFile], { stdio: 'inherit' });
    
    process.on('SIGINT', () => {
        tail.kill();
        process.exit(0);
    });
}

async function cmdTokens() {
    const stats = getTokenStats();
    console.log('\n── Token Usage ──');
    console.log(JSON.stringify(stats, null, 2));
}

async function cmdConfig() {
    console.log('\n── Configuration ──');
    console.log(JSON.stringify(CONFIG, null, 2));
}

// ═══════════════════════════════════════════════════════════
// CLI ENTRY
// ═══════════════════════════════════════════════════════════

const command = process.argv[2];

const commands = {
    start: cmdStart,
    stop: cmdStop,
    restart: cmdRestart,
    status: cmdStatus,
    doctor: cmdDoctor,
    logs: cmdLogs,
    tokens: cmdTokens,
    config: cmdConfig
};

if (!command || !commands[command]) {
    console.log(`
GSK Harness — Daemon Management & Health Monitor

Usage: node gsk-harness.js <command>

Commands:
  start      Start GSK daemon (keeps running to monitor)
  stop       Stop GSK daemon
  restart    Restart GSK daemon
  status     Check all services health
  doctor     Full diagnostic report
  logs       Tail daemon logs
  tokens     Show token usage stats
  config     Show current configuration

Examples:
  node gsk-harness.js start     # Start and monitor
  node gsk-harness.js status    # Quick health check
  node gsk-harness.js doctor    # Full diagnostic
`);
    process.exit(1);
}

commands[command]().catch(e => {
    log('error', `Command failed: ${e.message}`);
    process.exit(1);
});
