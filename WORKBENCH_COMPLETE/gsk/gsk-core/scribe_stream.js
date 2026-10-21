/**
 * PHASE 4: SCRIBE Memory Stream Integration
 * 
 * Wraps SCRIBE's memory logging to emit events on the Family Event Bus.
 * Every memory logged by SCRIBE is instantly flagged for cross-agent consumption.
 * 
 * Replaces polling-based scribe_witness with event-driven broadcasting.
 */

const fs = require('fs');
const path = require('path');
const http = require('http');
const { getFamilyEventBus } = require('./family_event_bus');

const SCRIBE_URL = process.env.SCRIBE_URL || 'http://127.0.0.1:4000';
const SCRIBE_KEY = process.env.SCRIBE_KEY || 'scribe-master-key-2026';

class ScribeStream {
    constructor() {
        this.bus = getFamilyEventBus();
        this.stats = {
            witnessed: 0,
            broadcast: 0,
            errors: 0,
            lastWitness: null
        };
        this._memoryBuffer = [];
        this._flushInterval = null;
    }

    /**
     * Start the SCRIBE stream — flush memory buffer every 5s
     */
    start() {
        this._flushInterval = setInterval(() => this._flushBuffer(), 5000);

        // Subscribe to family events that SCRIBE should witness
        this.bus.subscribe('seshat:page_created', (env) => this._onSeshatEvent(env), 'scribe-stream');
        this.bus.subscribe('seshat:page_modified', (env) => this._onSeshatEvent(env), 'scribe-stream');
        this.bus.subscribe('gsk:insight_generated', (env) => this._onGSKEvent(env), 'scribe-stream');
        this.bus.subscribe('gsk:goal_completed', (env) => this._onGSKEvent(env), 'scribe-stream');
        this.bus.subscribe('gsk:teaching_injected', (env) => this._onTeachingEvent(env), 'scribe-stream');

        console.log('[ScribeStream] Active — listening for family events');
        return this;
    }

    stop() {
        if (this._flushInterval) {
            clearInterval(this._flushInterval);
            this._flushInterval = null;
        }
    }

    /**
     * Record a memory to SCRIBE and broadcast to the bus
     */
    async witness(event, data, source = 'scribe') {
        const memory = {
            event,
            data,
            source,
            timestamp: Date.now(),
            hash: this._hash(JSON.stringify({ event, data, timestamp: Date.now() }))
        };

        // Broadcast immediately to bus (even if SCRIBE server is down)
        this.bus.publish('scribe:memory_added', memory, 'scribe');
        this.stats.broadcast++;
        this.stats.lastWitness = memory;

        // Buffer for SCRIBE server write
        this._memoryBuffer.push(memory);

        // Also try to write to SCRIBE server
        try {
            await this._writeToSCRIBE(memory);
            this.stats.witnessed++;
        } catch (e) {
            this.stats.errors++;
            // Still broadcast locally — SCRIBE server being down shouldn't block the family
        }

        return memory;
    }

    /**
     * Query SCRIBE memories by tag
     */
    async queryMemory(tag, limit = 10) {
        return new Promise((resolve) => {
            const url = new URL(`${SCRIBE_URL}/memory/query`);
            const req = http.get(url, {
                headers: {
                    'X-API-Key': SCRIBE_KEY,
                    'Content-Type': 'application/json'
                },
                timeout: 5000
            }, (res) => {
                let data = '';
                res.on('data', chunk => data += chunk);
                res.on('end', () => {
                    try {
                        const parsed = JSON.parse(data);
                        resolve(parsed.memories || []);
                    } catch {
                        resolve([]);
                    }
                });
            });
            req.on('error', () => resolve([]));
            req.on('timeout', () => { req.destroy(); resolve([]); });
        });
    }

    _onSeshatEvent(envelope) {
        this.witness('seshat变更', {
            filename: envelope.payload.filename,
            action: envelope.event,
            size: envelope.payload.size
        }, 'scribe');
    }

    _onGSKEvent(envelope) {
        this.witness('gsk产出', {
            event: envelope.event,
            summary: (envelope.payload.title || envelope.payload.name || '').substring(0, 100)
        }, 'scribe');
    }

    _onTeachingEvent(envelope) {
        this.witness('教学注入', {
            from: envelope.payload.from,
            to: envelope.payload.to,
            topic: envelope.payload.topic
        }, 'scribe');
    }

    _flushBuffer() {
        if (this._memoryBuffer.length === 0) return;
        const batch = this._memoryBuffer.splice(0);
        // Persist to local file as backup
        try {
            const logDir = path.join(__dirname, '..', 'data', 'gsk');
            const logPath = path.join(logDir, 'scribe_stream_log.jsonl');
            const lines = batch.map(m => JSON.stringify(m)).join('\n') + '\n';
            fs.appendFileSync(logPath, lines);
        } catch (e) { /* non-fatal */ }
    }

    _writeToSCRIBE(memory) {
        return new Promise((resolve, reject) => {
            const postData = JSON.stringify({
                event: memory.event,
                data: memory.data,
                source: memory.source,
                timestamp: memory.timestamp
            });

            const url = new URL(`${SCRIBE_URL}/witness`);
            const req = http.request(url, {
                method: 'POST',
                headers: {
                    'X-API-Key': SCRIBE_KEY,
                    'Content-Type': 'application/json',
                    'Content-Length': Buffer.byteLength(postData)
                },
                timeout: 8000
            }, (res) => {
                let data = '';
                res.on('data', chunk => data += chunk);
                res.on('end', () => resolve(data));
            });

            req.on('error', reject);
            req.on('timeout', () => { req.destroy(); reject(new Error('timeout')); });
            req.write(postData);
            req.end();
        });
    }

    _hash(str) {
        let h = 0;
        for (let i = 0; i < str.length; i++) {
            h = ((h << 5) - h) + str.charCodeAt(i);
            h |= 0;
        }
        return Math.abs(h).toString(16);
    }

    health() {
        return {
            ...this.stats,
            bufferSize: this._memoryBuffer.length,
            lastWitnessTime: this.stats.lastWitness
                ? new Date(this.stats.lastWitness.timestamp).toISOString()
                : null
        };
    }
}

module.exports = { ScribeStream };
