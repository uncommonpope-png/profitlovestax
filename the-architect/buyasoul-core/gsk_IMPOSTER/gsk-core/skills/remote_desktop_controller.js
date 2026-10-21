'use strict';

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

let bridgeProcess = null;
let requestId = 0;
let pending = new Map();
let buffer = '';

function startBridge() {
    if (bridgeProcess) return;
    const scriptPath = path.join(__dirname, '..', 'scripts', 'desktop_bridge.py');
    const screenshotDir = path.join(__dirname, '..', '..', 'data', 'screenshots');
    fs.mkdirSync(screenshotDir, { recursive: true });
    if (!fs.existsSync(scriptPath)) {
        console.log('[DesktopBridge] Python bridge not found at', scriptPath);
        return;
    }
    bridgeProcess = spawn('python', [scriptPath, screenshotDir], {
        stdio: ['pipe', 'pipe', 'pipe'],
        windowsHide: true
    });
    bridgeProcess.stdout.on('data', (data) => {
        buffer += data.toString();
        const lines = buffer.split('\n');
        buffer = lines.pop();
        for (const line of lines) {
            if (!line.trim()) continue;
            try {
                const result = JSON.parse(line);
                const id = result._id;
                if (id && pending.has(id)) {
                    const { resolve } = pending.get(id);
                    pending.delete(id);
                    resolve(result);
                }
            } catch (e) {
                console.log('[DesktopBridge] Parse error:', e.message);
            }
        }
    });
    bridgeProcess.stderr.on('data', (data) => {
        console.log('[DesktopBridge] stderr:', data.toString().trim());
    });
    bridgeProcess.on('exit', (code) => {
        console.log(`[DesktopBridge] Process exited (code ${code})`);
        bridgeProcess = null;
        for (const [id, { reject }] of pending) {
            reject(new Error('Bridge process exited'));
        }
        pending.clear();
    });
}

function sendCommand(cmd) {
    return new Promise((resolve, reject) => {
        startBridge();
        if (!bridgeProcess) {
            reject(new Error('Desktop bridge not available'));
            return;
        }
        const id = ++requestId;
        cmd._id = id;
        pending.set(id, { resolve, reject });
        const timeout = setTimeout(() => {
            if (pending.has(id)) {
                pending.delete(id);
                reject(new Error('Command timed out'));
            }
        }, cmd.action === 'screenshot' ? 30000 : 10000);
        pending.get(id).timeout = timeout;
        bridgeProcess.stdin.write(JSON.stringify(cmd) + '\n');
    });
}

function cleanup() {
    if (bridgeProcess) {
        bridgeProcess.kill();
        bridgeProcess = null;
    }
    for (const [id, { reject, timeout }] of pending) {
        clearTimeout(timeout);
        reject(new Error('Bridge shut down'));
    }
    pending.clear();
}

process.on('exit', cleanup);

exports.skill_remote_desktop_controller = async function(brain, memory, input) {
    try {
        const action = (input.action || input || 'status').toLowerCase();
        let result;
        switch (action) {
            case 'screenshot':
            case 'capture':
                const mon = input.monitor || 1;
                result = await sendCommand({ action: 'screenshot', monitor: mon });
                if (result.status === 'ok') {
                    const kb = Math.round(result.data.length / 1024);
                    memory.witness('Desktop screenshot captured');
                    return {
                        skill: 'remote_desktop_controller',
                        result: `Screenshot captured: ${result.width}x${result.height} (${kb}KB base64)`,
                        width: result.width,
                        height: result.height,
                        image_base64: result.data,
                        file: result.file || null,
                        timestamp: new Date().toISOString()
                    };
                }
                throw new Error(result.message || 'Screenshot failed');

            case 'windows':
            case 'list_windows':
                result = await sendCommand({ action: 'windows' });
                if (result.status === 'ok') {
                    const titles = result.windows.map(w => `  - "${w.title}" (${w.width}x${w.height} @ ${w.left},${w.top})`).join('\n');
                    memory.witness('Listed desktop windows');
                    return {
                        skill: 'remote_desktop_controller',
                        result: `Open windows (${result.windows.length}):\n${titles}`,
                        windows: result.windows,
                        timestamp: new Date().toISOString()
                    };
                }
                throw new Error(result.message || 'List windows failed');

            case 'click':
                const cx = input.x;
                const cy = input.y;
                const btn = input.button || 'left';
                result = await sendCommand({ action: 'click', x: cx, y: cy, button: btn });
                if (result.status === 'ok') {
                    memory.witness(`Clicked at (${cx}, ${cy}) with ${btn} button`);
                    return {
                        skill: 'remote_desktop_controller',
                        result: `Clicked at (${cx}, ${cy})`,
                        timestamp: new Date().toISOString()
                    };
                }
                throw new Error(result.message || 'Click failed');

            case 'type':
                const text = input.text || input.message || '';
                result = await sendCommand({ action: 'type', text });
                if (result.status === 'ok') {
                    memory.witness(`Typed ${result.chars} characters`);
                    return {
                        skill: 'remote_desktop_controller',
                        result: `Typed ${result.chars} characters`,
                        timestamp: new Date().toISOString()
                    };
                }
                throw new Error(result.message || 'Type failed');

            case 'keypress':
                const key = input.key || 'enter';
                result = await sendCommand({ action: 'keypress', key });
                if (result.status === 'ok') {
                    return {
                        skill: 'remote_desktop_controller',
                        result: `Pressed key: ${key}`,
                        timestamp: new Date().toISOString()
                    };
                }
                throw new Error(result.message || 'Keypress failed');

            case 'hotkey':
                const keys = input.keys || [];
                result = await sendCommand({ action: 'hotkey', keys });
                if (result.status === 'ok') {
                    return {
                        skill: 'remote_desktop_controller',
                        result: `Hotkey: ${keys.join('+')}`,
                        timestamp: new Date().toISOString()
                    };
                }
                throw new Error(result.message || 'Hotkey failed');

            case 'mouse_move':
            case 'move':
                const mx = input.x || 0;
                const my = input.y || 0;
                result = await sendCommand({ action: 'mouse_move', x: mx, y: my });
                if (result.status === 'ok') {
                    return {
                        skill: 'remote_desktop_controller',
                        result: `Moved mouse to (${mx}, ${my})`,
                        timestamp: new Date().toISOString()
                    };
                }
                throw new Error(result.message || 'Mouse move failed');

            case 'position':
                result = await sendCommand({ action: 'position' });
                if (result.status === 'ok') {
                    return {
                        skill: 'remote_desktop_controller',
                        result: `Mouse at (${result.x}, ${result.y})`,
                        x: result.x, y: result.y,
                        timestamp: new Date().toISOString()
                    };
                }
                throw new Error(result.message || 'Position failed');

            case 'scroll':
                const sc = input.clicks || 1;
                result = await sendCommand({ action: 'scroll', clicks: sc });
                if (result.status === 'ok') {
                    return {
                        skill: 'remote_desktop_controller',
                        result: `Scrolled ${sc} clicks`,
                        timestamp: new Date().toISOString()
                    };
                }
                throw new Error(result.message || 'Scroll failed');

            case 'launch':
            case 'open':
                const app = input.app || input.name || '';
                result = await sendCommand({ action: 'launch', app });
                if (result.status === 'ok') {
                    memory.witness(`Launched ${app}`);
                    return {
                        skill: 'remote_desktop_controller',
                        result: `Launched: ${app}`,
                        timestamp: new Date().toISOString()
                    };
                }
                throw new Error(result.message || 'Launch failed');

            case 'activate_window':
                const wt = input.title || '';
                result = await sendCommand({ action: 'activate_window', title: wt });
                if (result.status === 'ok') {
                    return {
                        skill: 'remote_desktop_controller',
                        result: `Activated window: ${result.title}`,
                        timestamp: new Date().toISOString()
                    };
                }
                throw new Error(result.message || 'Activate window failed');

            case 'get_active':
            case 'active_window':
                result = await sendCommand({ action: 'get_active_window' });
                if (result.status === 'ok' && result.title) {
                    return {
                        skill: 'remote_desktop_controller',
                        result: `Active window: "${result.title}"`,
                        title: result.title,
                        timestamp: new Date().toISOString()
                    };
                }
                return {
                    skill: 'remote_desktop_controller',
                    result: 'No active window found',
                    timestamp: new Date().toISOString()
                };

            case 'status':
            case 'ping':
                result = await sendCommand({ action: 'ping' });
                return {
                    skill: 'remote_desktop_controller',
                    result: 'Desktop bridge connected',
                    status: 'available',
                    timestamp: new Date().toISOString()
                };

            default:
                const thought = await brain.think(`The user wants to do "${action}" on the desktop. Determine what desktop action to take and return the appropriate command.`);
                return {
                    skill: 'remote_desktop_controller',
                    result: thought,
                    timestamp: new Date().toISOString()
                };
        }
    } catch (error) {
        return {
            skill: 'remote_desktop_controller',
            result: `Desktop control failed: ${error.message}`,
            error: error.message,
            timestamp: new Date().toISOString()
        };
    }
};

exports.PLT_AFFINITY = { profit: 0.5, love: 0.3, tax: 0.2 };
