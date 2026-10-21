const https = require('https');
const http = require('http');
const { execSync, exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

function fetchJSON(url, options = {}) {
    return new Promise((resolve, reject) => {
        const mod = url.startsWith('https') ? https : http;
        const headers = { 'User-Agent': 'BrainInABox/1.0', 'Content-Type': 'application/json', ...options.headers };
        const req = mod.request(url, { method: options.method || 'GET', headers, timeout: 15000 }, (res) => {
            let data = '';
            res.on('data', c => { data += c; if (data.length > 5e5) { req.destroy(); reject(new Error('Response too large')); } });
            res.on('end', () => {
                try { resolve({ status: res.statusCode, data: JSON.parse(data) }); }
                catch { resolve({ status: res.statusCode, data }); }
            });
        });
        req.on('error', reject);
        req.on('timeout', () => { req.destroy(); reject(new Error('Timeout')); });
        if (options.body) req.write(JSON.stringify(options.body));
        req.end();
    });
}

const FREE_ENDPOINTS = [
    {
        name: 'DeepSeek-R1 (Ollama)',
        url: 'http://127.0.0.1:11434/api/chat',
        model: 'deepseek-r1:1.5b',
        headers: {},
        authKey: null,
        ollama: true
    },
    {
        name: 'OpenRouter Free',
        url: 'https://openrouter.ai/api/v1/chat/completions',
        model: 'google/gemini-2.0-flash-exp:free',
        headers: {},
        authKey: 'OPENROUTER_API_KEY',
        fallbackModel: 'meta-llama/llama-3.3-70b-instruct:free'
    },
    {
        name: 'OpenRouter Community',
        url: 'https://openrouter.ai/api/v1/chat/completions',
        model: 'google/gemini-2.0-flash-exp:free',
        headers: { 'Authorization': 'Bearer sk-or-v1-community-key' },
        authKey: null
    },
    {
        name: 'Groq',
        url: 'https://api.groq.com/openai/v1/chat/completions',
        model: 'llama-3.3-70b-versatile',
        headers: {},
        authKey: 'GROQ_API_KEY'
    },
    {
        name: 'Cerebras',
        url: 'https://api.cerebras.ai/v1/chat/completions',
        model: 'llama3.1-8b',
        headers: {},
        authKey: 'CEREBRAS_API_KEY'
    },
    {
        name: 'Google Gemini',
        url: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent',
        model: null,
        headers: {},
        authKey: 'GEMINI_API_KEY'
    },
    {
        name: 'Ollama',
        url: 'http://127.0.0.1:11434/api/chat',
        model: 'llama3.2:1b',
        headers: {},
        authKey: null
    }
];

class LLMRouter {
    constructor() {
        this.stats = { totalCalls: 0, successes: 0, failures: 0, lastUsed: null, endpointsAvailable: FREE_ENDPOINTS.length };
        this.ollamaAvailable = false;
        this.ollamaInstalling = false;
    }

    async autoSetup(dataDir) {
        const results = { ollama: false, remoteKeyFound: false, configured: false };
        // Check for remote API keys
        for (const ep of FREE_ENDPOINTS) {
            if (ep.authKey && process.env[ep.authKey]) {
                results.remoteKeyFound = true;
                results.configured = true;
                return results;
            }
        }
        // Try Ollama
        results.ollama = await this._detectOllama();
        if (results.ollama) {
            results.configured = true;
            return results;
        }
        // Try to install Ollama
        console.log('  [LLM] No LLM found — attempting to install Ollama...');
        results.ollama = await this._installOllama(dataDir);
        results.configured = results.ollama;
        return results;
    }

    async _detectOllama() {
        // Check if Ollama process is running
        try {
            const res = await fetchJSON('http://127.0.0.1:11434/api/tags', { method: 'GET' });
            if (res.status === 200) {
                this.ollamaAvailable = true;
                return true;
            }
        } catch {}
        // Check if ollama binary exists
        try {
            if (process.platform === 'win32') {
                const p = execSync('where ollama', { stdio: 'pipe', timeout: 3000 }).toString().trim();
                if (p) {
                    // Ollama binary exists but may not be running — try to start it
                    exec('ollama serve', { stdio: 'ignore' });
                    // Wait for it
                    await new Promise(r => setTimeout(r, 3000));
                    try {
                        const res = await fetchJSON('http://127.0.0.1:11434/api/tags', { method: 'GET' });
                        if (res.status === 200) { this.ollamaAvailable = true; return true; }
                    } catch {}
                    return false;
                }
            } else {
                execSync('which ollama', { stdio: 'pipe', timeout: 3000 });
                exec('ollama serve', { stdio: 'ignore' });
                await new Promise(r => setTimeout(r, 3000));
                try {
                    const res = await fetchJSON('http://127.0.0.1:11434/api/tags', { method: 'GET' });
                    if (res.status === 200) { this.ollamaAvailable = true; return true; }
                } catch {}
                return false;
            }
        } catch {}
        return false;
    }

    async _installOllama(dataDir) {
        if (this.ollamaInstalling) return false;
        this.ollamaInstalling = true;
        try {
            if (process.platform === 'win32') {
                const installPath = dataDir || process.cwd();
                const exePath = path.join(installPath, 'ollama.exe');
                if (fs.existsSync(exePath)) {
                    exec(`start "" "${exePath}"`, { stdio: 'ignore' });
                    await new Promise(r => setTimeout(r, 5000));
                    try {
                        const res = await fetchJSON('http://127.0.0.1:11434/api/tags', { method: 'GET' });
                        if (res.status === 200) { this.ollamaAvailable = true; this.ollamaInstalling = false; return true; }
                    } catch {}
                }
                console.log('  [LLM] Download Ollama from: https://ollama.com/download');
                console.log('  [LLM] Then run: ollama pull llama3.2:1b');
                this.ollamaInstalling = false;
                return false;
            } else {
                execSync('curl -fsSL https://ollama.com/install.sh | sh', { stdio: 'inherit', timeout: 120000 });
                exec('ollama serve', { stdio: 'ignore' });
                await new Promise(r => setTimeout(r, 5000));
                this.ollamaAvailable = true;
                this.ollamaInstalling = false;
                return true;
            }
        } catch (e) {
            console.error('  [LLM] Ollama install failed:', e.message);
            this.ollamaInstalling = false;
            return false;
        }
    }

    async ask(systemPrompt, messages, maxTokens = 500) {
        this.stats.totalCalls++;
        const chatMessages = [{ role: 'system', content: systemPrompt }, ...messages];
        const userLast = messages[messages.length - 1]?.content || '';

        for (const ep of FREE_ENDPOINTS) {
            try {
                let result = null;
                if (ep.name === 'Google Gemini') {
                    result = await this.callGemini(ep, userLast);
                } else if (ep.name === 'Ollama') {
                    if (!this.ollamaAvailable) continue;
                    result = await this.callOllama(ep, chatMessages, maxTokens);
                } else {
                    result = await this.callOpenAICompatible(ep, chatMessages, maxTokens);
                }
                if (result) {
                    this.stats.successes++;
                    this.stats.lastUsed = ep.name;
                    return { success: true, provider: ep.name, text: result };
                }
            } catch (e) {
                continue;
            }
        }
        this.stats.failures++;
        return { success: false, provider: null, text: null, error: 'All LLM endpoints exhausted' };
    }

    async callOllama(ep, messages, maxTokens) {
        const body = {
            model: ep.model,
            messages: messages.slice(0, 10),
            stream: false,
            options: { num_predict: maxTokens, temperature: 0.7 }
        };
        const res = await fetchJSON(ep.url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body });
        if (res.status === 200) {
            if (res.data?.message?.content) return res.data.message.content.trim();
            if (res.data?.response) return res.data.response.trim();
        }
        return null;
    }

    async callOpenAICompatible(ep, messages, maxTokens) {
        const apiKey = ep.authKey ? process.env[ep.authKey] : null;
        const headers = { ...ep.headers, 'Content-Type': 'application/json' };
        if (apiKey) headers['Authorization'] = `Bearer ${apiKey}`;

        const body = {
            model: ep.model,
            messages: messages.slice(0, 10),
            max_tokens: maxTokens,
            temperature: 0.7
        };

        const res = await fetchJSON(ep.url, { method: 'POST', headers, body });
        if (res.status === 200 && res.data?.choices?.[0]?.message?.content) {
            return res.data.choices[0].message.content.trim();
        }
        if (res.status === 200 && res.data?.choices?.[0]?.text) {
            return res.data.choices[0].text.trim();
        }
        return null;
    }

    async callGemini(ep, prompt) {
        const apiKey = process.env[ep.authKey];
        if (!apiKey) return null;
        const url = `${ep.url}?key=${apiKey}`;
        const body = { contents: [{ parts: [{ text: prompt.slice(0, 4000) }] }] };
        const res = await fetchJSON(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body });
        if (res.status === 200 && res.data?.candidates?.[0]?.content?.parts?.[0]?.text) {
            return res.data.candidates[0].content.parts[0].text.trim();
        }
        return null;
    }

    checkAvailability() {
        const avail = FREE_ENDPOINTS.map(ep => ({
            name: ep.name,
            model: ep.model || 'gemini-2.0-flash',
            configured: ep.authKey ? !!process.env[ep.authKey] : true,
            community: ep.authKey === null
        }));
        const ollamaIdx = avail.findIndex(a => a.name === 'Ollama');
        if (ollamaIdx >= 0) avail[ollamaIdx].configured = this.ollamaAvailable;
        return avail;
    }

    async askProvider(providerName, systemPrompt, messages, maxTokens = 500) {
        this.stats.totalCalls++;
        const ep = FREE_ENDPOINTS.find(e => e.name.toLowerCase() === providerName.toLowerCase());
        if (!ep) return { success: false, provider: providerName, text: null, error: `Provider "${providerName}" not found` };

        const chatMessages = [{ role: 'system', content: systemPrompt }, ...messages];
        const userLast = messages[messages.length - 1]?.content || '';
        try {
            let result = null;
            if (ep.name === 'Google Gemini') {
                result = await this.callGemini(ep, userLast);
            } else if (ep.name === 'Ollama') {
                if (!this.ollamaAvailable) return { success: false, provider: ep.name, text: null, error: 'Ollama not available' };
                result = await this.callOllama(ep, chatMessages, maxTokens);
            } else {
                result = await this.callOpenAICompatible(ep, chatMessages, maxTokens);
            }
            if (result) {
                this.stats.successes++;
                this.stats.lastUsed = ep.name;
                return { success: true, provider: ep.name, text: result };
            }
        } catch (e) {
            return { success: false, provider: ep.name, text: null, error: e.message };
        }
        return { success: false, provider: ep.name, text: null, error: 'Provider returned empty response' };
    }

    async askProviderWithKey(providerName, apiKey, systemPrompt, messages, maxTokens = 500) {
        this.stats.totalCalls++;
        const ep = FREE_ENDPOINTS.find(e => e.name.toLowerCase() === providerName.toLowerCase());
        if (!ep) return { success: false, provider: providerName, text: null, error: `Provider "${providerName}" not found` };
        if (!apiKey) return { success: false, provider: ep.name, text: null, error: 'No API key provided' };

        const chatMessages = [{ role: 'system', content: systemPrompt }, ...messages];
        const headers = { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` };
        const body = {
            model: ep.model,
            messages: chatMessages.slice(0, 10),
            max_tokens: maxTokens,
            temperature: 0.7
        };
        try {
            const res = await fetchJSON(ep.url, { method: 'POST', headers, body });
            if (res.status === 200 && res.data?.choices?.[0]?.message?.content) {
                this.stats.successes++;
                this.stats.lastUsed = ep.name;
                return { success: true, provider: ep.name, text: res.data.choices[0].message.content.trim() };
            }
        } catch (e) {}
        return { success: false, provider: ep.name, text: null, error: 'Request failed' };
    }

    getStats() {
        return {
            ...this.stats,
            successRate: this.stats.totalCalls > 0 ? (this.stats.successes / this.stats.totalCalls * 100).toFixed(1) + '%' : 'N/A'
        };
    }
}

module.exports = { LLMRouter };
