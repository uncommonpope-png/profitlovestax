/**
 * PHASE 2: Family Event Bus — Central Real-Time Messaging Channel
 * 
 * Replaces polling with event-driven architecture.
 * All agents (GSK, Seshat, SCRIBE) publish and subscribe here.
 * 
 * Events:
 *   seshat:page_created    — New Seshat page written
 *   seshat:page_modified   — Seshat page updated
 *   seshat:ingest_complete — Batch ingest finished
 *   scribe:memory_added    — New SCRIBE memory logged
 *   scribe:memory_witnessed— SCRIBE witnessed an event
 *   gsk:insight_generated  — GSK produced a new insight
 *   gsk:goal_created       — New goal generated
 *   gsk:goal_completed     — Goal finished
 *   gsk:thought_generated  — Perpetual consciousness thought
 *   gsk:teaching_injected  — Peer teaching correction received
 *   family:heartbeat       — System heartbeat (2s)
 *   family:error           — Error event
 */

const { EventEmitter } = require('events');
const fs = require('fs');
const path = require('path');

class FamilyEventBus extends EventEmitter {
    constructor() {
        super();
        this.setMaxListeners(50);
        this.subscribers = new Map();
        this.eventLog = [];
        this.maxLogSize = 500;
        this.stats = {
            published: 0,
            delivered: 0,
            errors: 0,
            byType: {}
        };
        this._logPath = null;
    }

    /**
     * Initialize with optional persistent log path
     */
    init(logPath) {
        this._logPath = logPath;
        if (logPath) {
            try {
                const stats = fs.statSync(logPath);
                let data;
                if (stats.size > 1048576) {
                    const fd = fs.openSync(logPath, 'r');
                    const startPos = stats.size - 1048576;
                    const buf = Buffer.alloc(1048576);
                    fs.readSync(fd, buf, 0, 1048576, startPos);
                    fs.closeSync(fd);
                    let content = buf.toString('utf8');
                    const openBr = content.indexOf('[');
                    const closeBr = content.lastIndexOf(']');
                    if (openBr >= 0 && closeBr > openBr) {
                        content = '[' + content.substring(openBr + 1, closeBr) + ']';
                    }
                    data = content;
                } else {
                    data = fs.readFileSync(logPath, 'utf8');
                }
                this.eventLog = JSON.parse(data).slice(-this.maxLogSize);
            } catch (e) {
                this.eventLog = [];
            }
        }
        return this;
    }

    /**
     * Publish an event to all subscribers
     * @param {string} event - Event type (e.g., 'seshat:page_created')
     * @param {object} payload - Event data
     * @param {string} source - Originating agent ('gsk', 'seshat', 'scribe', 'system')
     */
    publish(event, payload = {}, source = 'system') {
        const envelope = {
            event,
            source,
            payload,
            timestamp: Date.now(),
            id: `evt_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
        };

        // Track stats
        this.stats.published++;
        this.stats.byType[event] = (this.stats.byType[event] || 0) + 1;

        // Log to memory
        this.eventLog.push(envelope);
        if (this.eventLog.length > this.maxLogSize) {
            this.eventLog = this.eventLog.slice(-this.maxLogSize);
        }

        // Persist log if path configured
        if (this._logPath) {
            try {
                fs.writeFileSync(this._logPath, JSON.stringify(this.eventLog.slice(-100), null, 2));
            } catch (e) { /* non-fatal */ }
        }

        // Emit to all listeners
        this.emit(event, envelope);
        this.emit('*', envelope); // wildcard for debugging

        return envelope;
    }

    /**
     * Subscribe to an event type
     * @param {string} event - Event type or '*' for all
     * @param {Function} handler - Callback receiving envelope
     * @param {string} subscriberId - Who is subscribing
     */
    subscribe(event, handler, subscriberId = 'unknown') {
        const wrappedHandler = (envelope) => {
            try {
                this.stats.delivered++;
                handler(envelope);
            } catch (e) {
                this.stats.errors++;
                this.publish('family:error', {
                    originalEvent: event,
                    error: e.message,
                    subscriber: subscriberId
                }, 'system');
            }
        };

        this.subscribers.set(`${subscriberId}:${event}`, wrappedHandler);
        this.on(event, wrappedHandler);
        return () => this.unsubscribe(event, subscriberId);
    }

    /**
     * Unsubscribe from an event
     */
    unsubscribe(event, subscriberId) {
        const key = `${subscriberId}:${event}`;
        const handler = this.subscribers.get(key);
        if (handler) {
            this.off(event, handler);
            this.subscribers.delete(key);
        }
    }

    /**
     * Get recent events of a specific type
     */
    recent(eventType, count = 10) {
        return this.eventLog
            .filter(e => !eventType || e.event === eventType)
            .slice(-count);
    }

    /**
     * Get bus health stats
     */
    health() {
        return {
            uptime: this.eventLog.length > 0 ? Date.now() - this.eventLog[0].timestamp : 0,
            totalEvents: this.stats.published,
            totalDeliveries: this.stats.delivered,
            totalErrors: this.stats.errors,
            activeSubscribers: this.subscribers.size,
            recentEvents: this.eventLog.slice(-5).map(e => ({
                event: e.event,
                source: e.source,
                time: new Date(e.timestamp).toISOString()
            })),
            byType: this.stats.byType
        };
    }
}

// Singleton instance
let _instance = null;

function getFamilyEventBus() {
    if (!_instance) {
        _instance = new FamilyEventBus();
        const logDir = path.join(__dirname, '..', 'data', 'gsk');
        const logPath = path.join(logDir, 'family_event_log.json');
        _instance.init(logPath);
    }
    return _instance;
}

module.exports = { FamilyEventBus, getFamilyEventBus };
