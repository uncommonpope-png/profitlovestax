const http = require('http');

const MCP_PORT = 3001;
const MCP_KEY = process.env.MCP_API_KEY || '92140facf0a3b8484f85b9d343687a95703e91b4724928e2ec78b8fd9d4aefc6';
const message = process.argv[2];
const timeoutMs = parseInt(process.argv[3] || '90000', 10);

const payload = JSON.stringify({ message });

const req = http.request({
    host: '127.0.0.1',
    port: MCP_PORT,
    path: '/mcp/chat',
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload),
        'x-api-key': MCP_KEY,
        'Authorization': 'Bearer ' + MCP_KEY,
    },
    timeout: timeoutMs,
}, (res) => {
    let d = '';
    res.on('data', (c) => (d += c));
    res.on('end', () => {
        console.log('HTTP', res.statusCode);
        try {
            const j = JSON.parse(d);
            if (j.error) { console.log('ERROR:', JSON.stringify(j.error).slice(0, 2000)); return; }
            const r = j.result?.result?.response || JSON.stringify(j.result);
            console.log('--- GSK RESPONSE ---');
            console.log(r);
            if (j.result?.result?.soul_state) {
                console.log('--- SOUL STATE ---');
                console.log(JSON.stringify(j.result.result.soul_state));
            }
        } catch (e) {
            console.log(d.slice(0, 4000));
        }
    });
});

req.on('timeout', () => { console.log('>>> REQUEST TIMEOUT after ' + timeoutMs + 'ms (brain still thinking in background)'); req.destroy(); });
req.on('error', (e) => { console.log('REQ ERROR:', e.message); });
req.write(payload);
req.end();
