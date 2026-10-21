'use strict';

const https = require('https');

const PLT_AFFINITY = { profit: 0.5, love: 0.2, tax: 0.3 };

function skill_http_client(input) {
    return new Promise((resolve, reject) => {
        const startTime = Date.now();
        const url = input.url || input;
        const method = (input.method || 'GET').toUpperCase();
        const timeout = input.timeout || 30000;

        if (!url) return reject(new Error('URL is required'));

        try {
            const urlObj = new URL(url);
            const options = { hostname: urlObj.hostname, port: urlObj.port || (urlObj.protocol === 'https:' ? 443 : 80), path: urlObj.pathname + urlObj.search, method, headers: { 'User-Agent': 'GSK/1.0', 'Accept': 'application/json' } };

            const req = (urlObj.protocol === 'https:' ? https : require('http')).request(options, (res) => {
                let data = '';
                res.on('data', chunk => { data += chunk; });
                res.on('end', () => {
                    let parsed;
                    try { parsed = JSON.parse(data); } catch { parsed = data; }
                    resolve({ skill: 'http_client', plt_affinity: PLT_AFFINITY, status: 'success', status_code: res.statusCode, body: parsed, duration_ms: Date.now() - startTime, timestamp: Date.now() });
                });
            });

            req.setTimeout(timeout, () => { req.destroy(); reject(new Error('Request timeout')); });
            req.on('error', reject);
            req.end();
        } catch (e) { reject(e); }
    });
}

module.exports = { skill_http_client };