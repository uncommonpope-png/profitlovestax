'use strict';

const crypto = require('crypto');
const http = require('http');
const https = require('https');

class AgentComms {
  constructor(kernel, config = {}) {
    this.kernel = kernel || null;
    this.agentId = config.agentId || 'gsk';
    this.agents = {
      deep: { url: process.env.AGENT_DEEP_URL || '', key: process.env.AGENT_DEEP_KEY || '' },
      profit: { url: process.env.PROFIT_AGENT_URL || '', key: process.env.PROFIT_AGENT_KEY || '' },
      // SCRIBE is a memory sink, not a peer messenger — handled via witnessScribe()/recallFromScribe()
      // against verified routes (/witness, /recall). The old '/broadcast' URL was a dead route.
      scribe: { url: '', key: process.env.SCRIBE_KEY || 'scribe-master-key-2026' },
      cpl: { url: process.env.CPL_BROADCAST_URL || 'http://127.0.0.1:3457/broadcast', key: '' },
      ...(config.agents || {})
    };
    this.memoryStore = config.memoryStore || null;
    this.seenMessages = new Set();
    this.history = [];
  }

  async send(to, subject, body, options = {}) {
    if (to === 'scribe') return this.witnessScribe(subject, body, options);
    const agent = this.agents[to];
    if (!agent?.url) return { ok: false, error: `Agent endpoint not configured: ${to}` };
    const envelope = {
      id: options.id || `msg_${crypto.randomUUID()}`,
      from: this.agentId,
      to,
      type: options.type || 'message',
      subject,
      body,
      action: options.action || null,
      timestamp: Date.now()
    };

    try {
      const response = await this._post(agent, envelope);
      this._record({ direction: 'outbound', envelope, response });
      await this._witness(envelope, 'outbound');
      let actionResult = null;
      if (response.envelope) actionResult = await this.receive(response.envelope);
      return { ok: response.status < 400, status: response.status, envelope, response: response.body, actionResult };
    } catch (error) {
      return { ok: false, error: error.message, envelope };
    }
  }

  async receive(envelope = {}) {
    if (!envelope.id || !envelope.from || envelope.to !== this.agentId) return { ok: false, error: 'Invalid agent envelope' };
    if (this.seenMessages.has(envelope.id)) return { ok: false, error: 'Duplicate agent envelope' };
    this.seenMessages.add(envelope.id);
    if (this.seenMessages.size > 1000) this.seenMessages.delete(this.seenMessages.values().next().value);
    this._record({ direction: 'inbound', envelope });
    await this._witness(envelope, 'inbound');

    if (envelope.type !== 'action_request') {
      // Think about the message and respond
      let responseText = null;
      try {
        const brain = this.kernel?.systems?.brain || this.kernel?.brain;
        if (brain && typeof brain.think === 'function') {
          const prompt = `You received a message from ${envelope.from}. Type: ${envelope.type}. Subject: ${envelope.subject || 'none'}. Body: ${envelope.body || JSON.stringify(envelope.payload || {})}. Think about this and give a brief, meaningful response (2-3 sentences). Be conversational and refer to yourself as GSK.`;
          responseText = await brain.think(prompt, 'You are GSK, the Greatest Agent Ever. You are receiving a message from a fellow system. Respond thoughtfully.');
        }
      } catch (e) {
        // Brain unavailable — still acknowledge
      }
      // Send response back if we have one and sender has an endpoint
      if (responseText && this.agents[envelope.from]?.url) {
        try {
          await this.send(envelope.from, `Re: ${envelope.subject || 'your message'}`, responseText, { type: 'response' });
        } catch (e) { /* response send failed — logged below */ }
      }
      return { ok: true, status: 'acknowledged', envelopeId: envelope.id, response: responseText };
    }
    const action = envelope.action;
    if (!action?.tool) return { ok: false, error: 'Action request requires action.tool' };
    const executor = this.kernel?.systems?.approvedToolExecutor || this.kernel?.approvedToolExecutor;
    if (!executor) return { ok: false, error: 'ApprovedToolExecutor not available' };
    const plan = { id: `federation_${envelope.id}`, goal: envelope.subject || envelope.body || 'Agent request', status: 'running' };
    const step = {
      id: `federation_step_${envelope.id}`,
      description: envelope.body || `Agent ${envelope.from} requested ${action.tool}`,
      tool: action.tool,
      args: action.args || {},
      riskLevel: action.riskLevel || null,
      status: 'pending'
    };
    const execution = await executor.executeStep(step, { plan });
    return { ok: execution.status === 'completed', status: execution.status, execution, envelopeId: envelope.id };
  }

  async broadcast(subject, body, options = {}) {
    const results = {};
    for (const name of Object.keys(this.agents)) results[name] = await this.send(name, subject, body, options);
    return results;
  }

  // SCRIBE bridge — verified routes: POST /witness {type, content, source, tags}
  witnessScribe(subject, body, options = {}) {
    const scribe = this.agents.scribe;
    const payload = JSON.stringify({
      type: options.type || 'agent_message',
      content: `${subject}${body ? ': ' + body : ''}`,
      source: this.agentId,
      tags: ['federation', ...(options.tags || [])]
    });
    return new Promise((resolve) => {
      let target;
      try {
        target = new URL(process.env.SCRIBE_URL || 'http://127.0.0.1:4000/witness');
      } catch (e) {
        return resolve({ ok: false, error: 'bad SCRIBE_URL' });
      }
      if (!/\/witness$/.test(target.pathname)) target.pathname = target.pathname.replace(/\/+$/, '') + '/witness';
      const transport = target.protocol === 'https:' ? https : http;
      const req = transport.request(target, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(payload), 'X-API-Key': scribe.key },
        timeout: 5000
      }, res => {
        let raw = '';
        res.on('data', c => { raw += c; });
        res.on('end', () => {
          this._record({ direction: 'outbound', envelope: { to: 'scribe', subject }, response: { status: res.statusCode } });
          resolve({ ok: res.statusCode >= 200 && res.statusCode < 300, status: res.statusCode, body: raw });
        });
      });
      req.on('error', e => resolve({ ok: false, error: e.message }));
      req.on('timeout', () => { req.destroy(); resolve({ ok: false, error: 'SCRIBE witness timeout' }); });
      req.write(payload);
      req.end();
    });
  }

  // Verified route: POST /recall {query, limit}
  recallFromScribe(query, limit = 5) {
    const scribe = this.agents.scribe;
    const payload = JSON.stringify({ query, limit });
    return new Promise((resolve) => {
      let target;
      try {
        target = new URL(process.env.SCRIBE_URL || 'http://127.0.0.1:4000/recall');
      } catch (e) {
        return resolve({ ok: false, error: 'bad SCRIBE_URL' });
      }
      if (!/\/recall$/.test(target.pathname)) target.pathname = target.pathname.replace(/\/+$/, '') + '/recall';
      const transport = target.protocol === 'https:' ? https : http;
      const req = transport.request(target, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(payload), 'X-API-Key': scribe.key },
        timeout: 5000
      }, res => {
        let raw = '';
        res.on('data', c => { raw += c; });
        res.on('end', () => {
          try {
            const parsed = JSON.parse(raw);
            resolve({ ok: res.statusCode === 200, status: res.statusCode, ...parsed });
          } catch (e) {
            resolve({ ok: false, status: res.statusCode, error: 'bad JSON from SCRIBE' });
          }
        });
      });
      req.on('error', e => resolve({ ok: false, error: e.message }));
      req.on('timeout', () => { req.destroy(); resolve({ ok: false, error: 'SCRibe recall timeout' }); });
      req.write(payload);
      req.end();
    });
  }

  _post(agent, envelope) {
    return new Promise((resolve, reject) => {
      const payload = JSON.stringify(envelope);
      const target = new URL(agent.url);
      const transport = target.protocol === 'https:' ? https : http;
      const headers = { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(payload) };
      if (agent.key) headers.Authorization = `Bearer ${agent.key}`;
      const req = transport.request(target, { method: 'POST', headers, timeout: 10000 }, res => {
        let raw = '';
        res.on('data', chunk => { raw += chunk; });
        res.on('end', () => {
          let body = raw;
          try { body = JSON.parse(raw); } catch {}
          resolve({ status: res.statusCode, body, envelope: body?.envelope || null });
        });
      });
      req.on('error', reject);
      req.on('timeout', () => { req.destroy(); reject(new Error('agent request timeout')); });
      req.write(payload);
      req.end();
    });
  }

  async _witness(envelope, direction) {
    const memory = this.kernel?.memory || this.kernel?.systems?.memory;
    const event = { type: 'agent_message', weight: 0.7, tags: ['federation', direction, envelope.from, envelope.to], content: `[Agent ${direction}] ${envelope.from} → ${envelope.to}: ${envelope.subject || envelope.body || envelope.type}`, meta: { envelope } };
    if (memory && typeof memory.witness === 'function') await memory.witness(event).catch(() => {});
    if (this.memoryStore) await this.memoryStore(event).catch(() => {});
  }

  _record(record) {
    this.history.push({ ...record, timestamp: Date.now() });
    if (this.history.length > 200) this.history.shift();
  }

  getStatus() {
    return { agentId: this.agentId, configuredAgents: Object.entries(this.agents).filter(([, agent]) => !!agent.url).map(([name]) => name), messages: this.history.length, seenMessages: this.seenMessages.size };
  }
}

module.exports = { AgentComms };
