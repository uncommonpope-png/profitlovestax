module.exports.MANIFEST = {
    name: 'gsk-bridge-client',
    description: 'Skill: gsk-bridge-client',
    version: '1.0.0',
    inputs: {},
    output: { schema: 'ok/error' }
};

module.exports.run = async (params) => {
    // Standardized implementation
};
const http = require('http');

const PLT_AFFINITY = { profit: 0.9, love: 0.1, tax: 0.0 };
const HOST = process.env.GSK_BODY_HOST || 'localhost';
const PORT = parseInt(process.env.GSK_BODY_PORT || '50000', 10);

function doPost(route, data) {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify(data);
    const options = {
      hostname: HOST, port: PORT, path: route, method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(payload) }
    };
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', c => body += c);
      res.on('end', () => { try { resolve(JSON.parse(body)); } catch (e) { resolve({ success: false, error: body }); } });
    });
    req.on('error', reject);
    req.write(payload);
    req.end();
  });
}

function doGet(route) {
  return new Promise((resolve, reject) => {
    http.get({ hostname: HOST, port: PORT, path: route }, (res) => {
      let body = '';
      res.on('data', c => body += c);
      res.on('end', () => { try { resolve(JSON.parse(body)); } catch (e) { resolve({ success: false, error: body }); } });
    }).on('error', reject);
  });
}

async function skill_gsk_bridge_client(input) {
  const task = typeof input === 'string' ? input : (input.task || input.command || '');
  const mode = input && input.command ? 'command' : 'task';

  try {
    const bodyStatus = await doGet('/status');
    if (!bodyStatus.alive) {
      return { skill: 'gsk_bridge_client', success: false, error: 'Body not reachable', bodyStatus };
    }
    const result = await doPost('/task', { [mode]: task });
    return {
      skill: 'gsk_bridge_client', success: result.success,
      mindPid: process.pid, bodyPid: result.pid, childPid: result.childPid,
      output: result.output || '', error: result.error || '', bodyStatus
    };
  } catch (e) {
    return { skill: 'gsk_bridge_client', success: false, error: e.message };
  }
}

module.exports = { skill_gsk_bridge_client, PLT_AFFINITY };

