'use strict';

const https = require('https');

const GEMINI_CONFIG = {
    apiKey: process.env.GEMINI_API_KEY || '',
    baseUrl: 'https://generativelanguage.googleapis.com/v1beta',
};

const GEMINI_MODELS = {
    fast:  { name: 'gemini-2.0-flash',        max_tokens: 512,  timeout: 30,  desc: 'fast flash model' },
    smart: { name: 'gemini-2.0-flash',        max_tokens: 2048, timeout: 60,  desc: 'balanced' },
    coder: { name: 'gemini-2.0-flash',        max_tokens: 2048, timeout: 120, desc: 'code' },
    deep:  { name: 'gemini-2.5-pro',          max_tokens: 4096, timeout: 180, desc: 'deep reasoning' },
};

const CODE_KEYWORDS = ['code', 'function', 'class', 'refactor', 'debug', 'analyze', 'search', 'replace', 'find', 'import', 'ast', 'parse', 'syntax', 'error', 'fix', 'write code', 'implement', 'algorithm'];
const DEEP_KEYWORDS = ['why', 'how do i', 'explain', 'reason', 'think', 'plan', 'strategy', 'design', 'complex', 'detailed', 'compare', 'decide', 'choose', 'evaluate', 'analyze deeply', 'understand'];

function classifyTask(prompt) {
    const lower = (prompt || '').toLowerCase();
    if (CODE_KEYWORDS.some(k => lower.includes(k))) return 'coder';
    if (DEEP_KEYWORDS.some(k => lower.includes(k))) return 'deep';
    return 'fast';
}

function callGemini(prompt, model, max_tokens = 512, timeout_ms = 30000, systemPrompt = '') {
    return new Promise((resolve, reject) => {
        if (!GEMINI_CONFIG.apiKey) {
            reject(new Error('GEMINI_API_KEY not set'));
            return;
        }

        const contents = [{ parts: [{ text: prompt }] }];
        const body = {
            contents,
            generationConfig: {
                maxOutputTokens: max_tokens,
                temperature: 0.7,
            },
        };

        if (systemPrompt) {
            body.systemInstruction = { parts: [{ text: systemPrompt }] };
        }

        const bodyStr = JSON.stringify(body);
        const url = `/v1beta/models/${model}:generateContent?key=${GEMINI_CONFIG.apiKey}`;

        const req = https.request({
            hostname: 'generativelanguage.googleapis.com',
            path: url,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(bodyStr),
            },
        }, (res) => {
            const chunks = [];
            res.on('data', c => chunks.push(c));
            res.on('end', () => {
                try {
                    const data = JSON.parse(Buffer.concat(chunks).toString());
                    if (data.error) {
                        reject(new Error(data.error.message || JSON.stringify(data)));
                        return;
                    }
                    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
                    resolve(text);
                } catch (e) {
                    reject(e);
                }
            });
        });

        req.setTimeout(timeout_ms, () => { req.destroy(); reject(new Error('Timeout')); });
        req.on('error', reject);
        req.write(bodyStr);
        req.end();
    });
}

function callBrain(prompt, options = {}) {
    return new Promise(async (resolve, reject) => {
        if (!GEMINI_CONFIG.apiKey) {
            reject(new Error('GEMINI_API_KEY not set'));
            return;
        }

        const taskType = options.taskType || classifyTask(prompt);
        const modelConfig = GEMINI_MODELS[taskType] || GEMINI_MODELS.fast;
        const modelName = options.model || modelConfig.name;
        const maxTokens = options.max_tokens || modelConfig.max_tokens;
        const timeout = (modelConfig.timeout || 30) * 1000;
        const systemPrompt = options.systemPrompt || '';

        try {
            const result = await callGemini(prompt, modelName, maxTokens, timeout, systemPrompt);
            if (result && result.trim()) {
                resolve(result);
            } else {
                reject(new Error('Gemini returned empty response'));
            }
        } catch (e) {
            reject(new Error(`Gemini failed (${taskType}): ${e.message}`));
        }
    });
}

module.exports = { callBrain, callGemini, GEMINI_CONFIG, GEMINI_MODELS, classifyTask };
