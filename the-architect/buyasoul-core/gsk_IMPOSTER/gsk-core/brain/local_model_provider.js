/**
 * LOCAL_MODEL_PROVIDER.JS — Node.js ↔ Python bridge for local LLM inference
 *
 * Spawns a Python subprocess running local_model_bridge.py.
 * Supports transformers (CPU) and AirLLM (GPU) backends.
 * Exposes the same callBrain(prompt, options) interface as groq_provider.js
 *
 * PLT Press — Profit + Love - Tax = True Value
 */
'use strict';

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

const BRIDGE_SCRIPT = path.join(__dirname, 'local_model_bridge.py');
const LOCAL_MODEL = process.env.LOCAL_MODEL || 'Qwen/Qwen2.5-0.5B-Instruct';

let bridgeProcess = null;
let requestQueue = [];
let currentResolver = null;
let buffer = '';
let ready = false;
let loadAttempted = false;

const LOCAL_CONFIG = {
    model: LOCAL_MODEL,
    max_tokens: 512,
    timeout: 120000,
    backend: process.env.AIRLLM === '1' ? 'airllm' : 'transformers'
};

function startBridge() {
    return new Promise((resolve, reject) => {
        if (bridgeProcess) {
            resolve(true);
            return;
        }

        if (!fs.existsSync(BRIDGE_SCRIPT)) {
            console.log(`[LocalModel] Bridge script not found at ${BRIDGE_SCRIPT}`);
            resolve(false);
            return;
        }

        console.log(`[LocalModel] Starting Python bridge (model: ${LOCAL_MODEL}, backend: ${LOCAL_CONFIG.backend})...`);

        bridgeProcess = spawn('python', [BRIDGE_SCRIPT], {
            stdio: ['pipe', 'pipe', 'pipe'],
            env: {
                ...process.env,
                LOCAL_MODEL: LOCAL_MODEL,
                AIRLLM: process.env.AIRLLM || '0',
                PYTHONUNBUFFERED: '1'
            }
        });

        bridgeProcess.stdout.on('data', (data) => {
            buffer += data.toString();
            const lines = buffer.split('\n');
            buffer = lines.pop() || '';

            for (const line of lines) {
                if (!line.trim()) continue;
                try {
                    const msg = JSON.parse(line);
                    if (msg.status === 'ready') {
                        ready = true;
                        console.log(`[LocalModel] ✅ Bridge ready (backend: ${msg.backend})`);
                        resolve(true);
                    } else if (msg.response !== undefined && currentResolver) {
                        currentResolver(msg.response);
                        currentResolver = null;
                    } else if (msg.error && currentResolver) {
                        currentResolver(new Error(msg.error));
                        currentResolver = null;
                    }
                } catch (e) {
                    // Partial JSON or status message
                    if (line.includes('[LocalBridge]')) {
                        console.log(`[LocalModel] ${line.replace('[LocalBridge]', '').trim()}`);
                    }
                }
            }
        });

        bridgeProcess.stderr.on('data', (data) => {
            const msg = data.toString().trim();
            if (msg && msg.includes('[LocalBridge]')) {
                console.log(`[LocalModel] ${msg.replace('[LocalBridge]', '').trim()}`);
            }
        });

        bridgeProcess.on('error', (err) => {
            console.log(`[LocalModel] Process error: ${err.message}`);
            bridgeProcess = null;
            ready = false;
            resolve(false);
        });

        bridgeProcess.on('exit', (code) => {
            console.log(`[LocalModel] Process exited (code: ${code})`);
            bridgeProcess = null;
            ready = false;
            if (currentResolver) {
                currentResolver(new Error(`Bridge exited with code ${code}`));
                currentResolver = null;
            }
        });

        // Timeout for loading
        setTimeout(() => {
            if (!ready) {
                console.log('[LocalModel] Bridge load timeout — falling back');
                bridgeProcess = null;
                ready = false;
                resolve(false);
            }
        }, 120000);
    });
}

function sendRequest(prompt, options = {}) {
    return new Promise((resolve, reject) => {
        if (!bridgeProcess || !bridgeProcess.stdin.writable) {
            reject(new Error('Bridge not running'));
            return;
        }

        currentResolver = resolve;
        const request = {
            prompt: prompt,
            max_tokens: options.max_tokens || LOCAL_CONFIG.max_tokens,
            temperature: options.temperature || 0.7
        };
        bridgeProcess.stdin.write(JSON.stringify(request) + '\n');

        setTimeout(() => {
            if (currentResolver === resolve) {
                currentResolver = null;
                reject(new Error('Request timeout'));
            }
        }, options.timeout || LOCAL_CONFIG.timeout);
    });
}

async function callBrain(prompt, options = {}) {
    if (!loadAttempted) {
        loadAttempted = true;
        const started = await startBridge();
        if (!started) return null;
    }

    if (!ready) {
        return null;
    }

    try {
        return await sendRequest(prompt, options);
    } catch (e) {
        console.log(`[LocalModel] Inference failed: ${e.message}`);
        return null;
    }
}

function shutdown() {
    if (bridgeProcess) {
        bridgeProcess.kill();
        bridgeProcess = null;
        ready = false;
    }
}

function getStatus() {
    return {
        running: bridgeProcess !== null,
        ready: ready,
        model: LOCAL_MODEL,
        backend: LOCAL_CONFIG.backend
    };
}

module.exports = { callBrain, shutdown, getStatus, LOCAL_CONFIG };
