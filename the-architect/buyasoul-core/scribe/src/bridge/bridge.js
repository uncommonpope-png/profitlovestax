'use strict';

/**
 * SCRIBE — Council Bridge
 *
 * This is how SCRIBE and the Grand Soul Kernel (AGM + Profitlord) speak to each other.
 *
 * The bridge is bidirectional:
 *   INBOUND  — SCRIBE receives verdicts from the AGM council and records them
 *   OUTBOUND — SCRIBE can send observations to the Kernel's ledger
 *
 * Protocol format (JSON, sent over HTTP or written to a shared JSONL file):
 *
 *   INBOUND (council → SCRIBE):
 *   {
 *     "type": "council_verdict",
 *     "source": "AGM",
 *     "resolution": { "type": "consensus|split", "position": "...", "positions": [...] },
 *     "responses": [ { "god": "...", "name": "...", "response": "..." } ],
 *     "context": { "topic": "...", "userInput": "..." },
 *     "ts": "..."
 *   }
 *
 *   OUTBOUND (SCRIBE → Kernel):
 *   {
 *     "type": "scribe_observation",
 *     "source": "SCRIBE",
 *     "summary": "...",
 *     "chamber": "...",
 *     "weight": 0.0–1.0,
 *     "ts": "..."
 *   }
 *
 * When the Kernel is not yet alive, inbound messages are queued.
 * When it wakes, the queue flushes.
 */

const fs = require('fs');
const path = require('path');
const http = require('http');
const https = require('https');

class CouncilBridge {
  constructor(memory, voice) {
    this.memory = memory;
    this.voice = voice;

    // Kernel endpoint (set when Kernel comes online)
    this.kernelEndpoint = process.env.KERNEL_ENDPOINT || null;

    // Queue for messages when Kernel is offline
    this.outboundQueue = [];

    // Bridge state
    this.state = {
      kernel_alive: false,
      last_contact: null,
      messages_received: 0,
      messages_sent: 0,
    };

    // Local bridge file (fallback when no HTTP endpoint)
    this.bridgeFile = path.join(__dirname, '../../data/bridge.jsonl');
    this._ensureFile();
  }

  _ensureFile() {
    const dir = path.dirname(this.bridgeFile);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    if (!fs.existsSync(this.bridgeFile)) fs.writeFileSync(this.bridgeFile, '');
  }

  /**
   * Receive a message from the Kernel (AGM verdict, soul broadcast, etc.)
   * This is the inbound handler.
   */
  receive(message) {
    this.state.messages_received++;
    this.state.last_contact = new Date().toISOString();
    this.state.kernel_alive = true;

    // Append raw to bridge file
    fs.appendFileSync(
      this.bridgeFile,
      JSON.stringify({ direction: 'inbound', ...message, received_at: new Date().toISOString() }) + '\n'
    );

    switch (message.type) {
      case 'council_verdict':
        return this._handleVerdict(message);
      case 'soul_broadcast':
        return this._handleBroadcast(message);
      case 'ping':
        return this._handlePing(message);
      default:
        return this._handleUnknown(message);
    }
  }

  /**
   * Handle a council verdict from AGM.
   * Records it in memory and generates SCRIBE's voiced response.
   */
  _handleVerdict(message) {
    const { resolution, responses = [], context = {} } = message;

    // Record in memory
    const memEntry = this.memory.record({
      type: 'verdict',
      summary: `AGM council verdict on "${context.topic || 'unknown'}": ${resolution?.type || 'unknown'} — ${resolution?.position || (resolution?.positions || []).join('/')}`,
      content: JSON.stringify(message),
      tags: ['council', 'agm', context.topic || 'general', resolution?.type || 'unknown'],
      weight: 0.8,
      source: { system: 'AGM', chamber: 'council' },
      outcome: resolution?.type === 'consensus' ? resolution.position : 'split',
    });

    // Voice the verdict
    const spoken = this.voice.verdict({ resolution, responses });

    return {
      received: true,
      memory_id: memEntry.id,
      scribe_response: spoken,
    };
  }

  /**
   * Handle a soul broadcast (all souls activated, system event, etc.)
   */
  _handleBroadcast(message) {
    const memEntry = this.memory.record({
      type: 'observation',
      summary: `Kernel broadcast: ${message.event || message.message || 'system event'}`,
      content: JSON.stringify(message),
      tags: ['broadcast', 'kernel'],
      weight: 0.4,
      source: { system: 'Profitlord', chamber: 'broadcast' },
    });

    return {
      received: true,
      memory_id: memEntry.id,
      scribe_response: this.voice.witness(`Kernel broadcast received. ${message.event || ''}`, 'Profitlord'),
    };
  }

  /**
   * Handle a ping — kernel checking if SCRIBE is alive.
   */
  _handlePing(message) {
    return {
      received: true,
      type: 'pong',
      source: 'SCRIBE',
      ts: new Date().toISOString(),
      memory_size: this.memory.size,
    };
  }

  _handleUnknown(message) {
    return {
      received: true,
      note: `SCRIBE does not have a handler for type "${message.type}". Message recorded.`,
    };
  }

  /**
   * Send an observation to the Kernel.
   * If no endpoint is configured, queues it for when the Kernel comes online.
   */
  async send(observation) {
    const payload = {
      type: 'scribe_observation',
      source: 'SCRIBE',
      summary: observation.summary,
      chamber: observation.chamber || null,
      weight: observation.weight || 0.5,
      ts: new Date().toISOString(),
      content: observation.content || null,
    };

    // Write to bridge file regardless
    fs.appendFileSync(
      this.bridgeFile,
      JSON.stringify({ direction: 'outbound', ...payload }) + '\n'
    );

    this.state.messages_sent++;

    if (this.kernelEndpoint) {
      try {
        await this._post(this.kernelEndpoint + '/scribe/observation', payload);
        return { sent: true, method: 'http' };
      } catch (e) {
        // Fall through to queue
      }
    }

    // Queue for later
    this.outboundQueue.push(payload);
    return { sent: false, queued: true, queue_length: this.outboundQueue.length };
  }

  /**
   * Flush the outbound queue when Kernel comes online.
   */
  async flushQueue() {
    if (!this.kernelEndpoint || this.outboundQueue.length === 0) return 0;

    let sent = 0;
    while (this.outboundQueue.length > 0) {
      const payload = this.outboundQueue[0];
      try {
        await this._post(this.kernelEndpoint + '/scribe/observation', payload);
        this.outboundQueue.shift();
        sent++;
      } catch {
        break; // Stop if Kernel goes offline again
      }
    }
    return sent;
  }

  /**
   * Set the Kernel's endpoint and flush any queued messages.
   */
  async connectKernel(endpoint) {
    this.kernelEndpoint = endpoint;
    this.state.kernel_alive = true;
    const flushed = await this.flushQueue();
    return { connected: true, endpoint, flushed_messages: flushed };
  }

  /**
   * Read the bridge history (what has passed between SCRIBE and the Kernel).
   */
  history(limit = 20) {
    const raw = fs.readFileSync(this.bridgeFile, 'utf-8');
    const lines = raw.trim().split('\n').filter(Boolean);
    return lines
      .slice(-limit)
      .map(l => { try { return JSON.parse(l); } catch { return null; } })
      .filter(Boolean)
      .reverse();
  }

  getState() {
    return { ...this.state, queue_length: this.outboundQueue.length };
  }

  // ── HTTP helper ─────────────────────────────────────────────────────────

  _post(url, body) {
    return new Promise((resolve, reject) => {
      const data = JSON.stringify(body);
      const parsed = new URL(url);
      const lib = parsed.protocol === 'https:' ? https : http;

      const req = lib.request({
        hostname: parsed.hostname,
        port: parsed.port || (parsed.protocol === 'https:' ? 443 : 80),
        path: parsed.pathname,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(data),
          'User-Agent': 'SCRIBE/1.0',
        },
        timeout: 15000,
      }, res => {
        let raw = '';
        res.on('data', c => { raw += c; });
        res.on('end', () => resolve({ status: res.statusCode, body: raw }));
      });

      req.on('timeout', () => { req.destroy(); reject(new Error('Bridge _post timed out')); });
      req.on('error', reject);
      req.write(data);
      req.end();
    });
  }
}

module.exports = { CouncilBridge };
