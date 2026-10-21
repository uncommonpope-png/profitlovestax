const https = require('https');
const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '..', '..', '.env');
if (fs.existsSync(envPath)) {
    fs.readFileSync(envPath, 'utf8').split('\n').forEach(line => {
        const [key, ...rest] = line.split('=');
        if (key && rest.length) {
            process.env[key.trim()] = rest.join('=').trim();
        }
    });
}

const GROQ_CONFIG = {
    apiKey: process.env.GROQ_API_KEY || '',
    baseUrl: 'https://api.groq.com/openai/v1'
};

const GROQ_MODELS = {
    fast:    { name: 'llama-3.3-70b-versatile', max_tokens: 512,  timeout: 30, desc: 'fast reasoning + low latency' },
    smart:   { name: 'llama-3.3-70b-versatile', max_tokens: 2048, timeout: 60, desc: 'balanced reasoning' },
    coder:   { name: 'llama-3.3-70b-versatile', max_tokens: 2048, timeout: 120, desc: 'deep reasoning for code' },
    deep:    { name: 'llama-3.3-70b-versatile', max_tokens: 4096, timeout: 180, desc: 'deep analysis' },
    gemma:   { name: 'llama-3.1-8b-instant', max_tokens: 1024, timeout: 30, desc: 'fast lightweight' },
};

const CODE_KEYWORDS = ['code', 'function', 'class', 'refactor', 'debug', 'analyze', 'search', 'replace', 'find', 'import', 'ast', 'parse', 'syntax', 'error', 'fix', 'write code', 'implement', 'algorithm'];
const DEEP_KEYWORDS = ['why', 'how do i', 'explain', 'reason', 'think', 'plan', 'strategy', 'design', 'complex', 'detailed', 'compare', 'decide', 'choose', 'evaluate', 'analyze deeply', 'understand'];

function classifyTask(prompt) {
    const lower = (prompt || '').toLowerCase();
    if (CODE_KEYWORDS.some(k => lower.includes(k))) return 'coder';
    if (DEEP_KEYWORDS.some(k => lower.includes(k))) return 'deep';
    return 'fast';
}

function callGroq(prompt, model, max_tokens = 512, timeout_ms = 30000, systemPrompt = '') {
    return new Promise((resolve, reject) => {
        if (!GROQ_CONFIG.apiKey) {
            reject(new Error('GROQ_API_KEY not set'));
            return;
        }

        const messages = [];
        
        if (systemPrompt) {
            messages.push({ role: 'system', content: systemPrompt });
        }
        
        messages.push({ role: 'user', content: prompt });
        
        const body = JSON.stringify({
            model: model || 'llama-3.3-70b-versatile',
            messages: messages,
            temperature: 0.2,
            max_tokens: max_tokens
        });

        const req = https.request({
            hostname: 'api.groq.com',
            path: '/openai/v1/chat/completions',
            method: 'POST',
            headers: {
                'Authorization': 'Bearer ' + GROQ_CONFIG.apiKey,
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(body)
            }
        }, (res) => {
            const chunks = [];
            res.on('data', c => chunks.push(c));
            res.on('end', () => {
                try {
                    const data = JSON.parse(Buffer.concat(chunks).toString());
                    if (data.error) return reject(new Error(data.error.message || JSON.stringify(data)));
                    const text = data.choices?.[0]?.message?.content || '';
                    resolve(text);
                } catch (e) {
                    reject(e);
                }
            });
        });

        req.setTimeout(timeout_ms, () => { req.destroy(); reject(new Error('Timeout')); });
        req.on('error', reject);
        req.write(body);
        req.end();
    });
}

function callOllama(prompt, model) {
    return new Promise((resolve, reject) => {
        const http = require('http');
        const body = JSON.stringify({
            model: model || 'qwen2.5-coder:7b',
            prompt: prompt,
            stream: false,
            options: { temperature: 0.2, num_predict: 512 }
        });
        const req = http.request({
            hostname: 'localhost',
            port: 11434,
            path: '/api/generate',
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) }
        }, (res) => {
            const chunks = [];
            res.on('data', c => chunks.push(c));
            res.on('end', () => {
                try {
                    const data = JSON.parse(Buffer.concat(chunks).toString());
                    resolve(data.response || '');
                } catch (e) { reject(e); }
            });
            res.on('error', reject);
        });
        req.setTimeout(60000, () => { req.destroy(); reject(new Error('Timeout')); });
        req.on('error', reject);
        req.write(body);
        req.end();
    });
}

function callBrain(prompt, options = {}) {
    return new Promise(async (resolve, reject) => {
        if (!GROQ_CONFIG.apiKey) {
            reject(new Error('GROQ_API_KEY not set'));
            return;
        }
        
        const taskType = options.taskType || classifyTask(prompt);
        const modelConfig = GROQ_MODELS[taskType] || GROQ_MODELS.fast;
        const modelName = options.model || modelConfig.name;
        const maxTokens = options.max_tokens || modelConfig.max_tokens;
        const timeout = (modelConfig.timeout || 30) * 1000;
        const systemPrompt = options.systemPrompt || options.soulContext || '';

        try {
            const result = await callGroq(prompt, modelName, maxTokens, timeout, systemPrompt);
            if (result && result.trim()) {
                resolve(result);
            } else {
                reject(new Error('Groq returned empty response'));
            }
        } catch (e) {
            reject(new Error(`Groq failed (${taskType}): ${e.message}`));
        }
    });
}

module.exports = { callBrain, callGroq, callOllama, GROQ_CONFIG, GROQ_MODELS, classifyTask };