'use strict';

/**
 * ASYNCHRONOUS REACTIVE EVENT BUS
 *
 * Based on Sage skill: async_reactive_event_bus
 *
 * Implementation:
 * - Reactive stream-based event distribution.
 * - Non-blocking event propagation.
 * - Explicit subscription lifecycle management.
 * - Error-isolated subscriber execution (one failing subscriber doesn't kill others).
 */

const EventEmitter = require('events');

// UNIFIED EVENT TRACE mirror (Steal List #5, 2026-10-23): every
// publish on the shared bus is also appended to the body's one
// trace stream (brain/event_trace.js), so bus users join the trace
// without code changes. The mirror NEVER throws and never blocks
// the bus: telemetry is a witness, not a gate. Payloads are
// summarized here (scalars only, strings truncated) — no secrets,
// no full payloads in telemetry.
let _traceFn = null;
try { _traceFn = require('./event_trace.js').trace; } catch { _traceFn = null; }
function _summarizeForTrace(data) {
    try {
        if (data === null || data === undefined) return {};
        if (typeof data !== 'object') return { value: String(data).slice(0, 120) };
        const out = {};
        for (const [k, v] of Object.entries(data).slice(0, 8)) {
            if (v === null || v === undefined) out[k] = v;
            else if (typeof v === 'string') out[k] = v.slice(0, 120);
            else if (typeof v === 'number' || typeof v === 'boolean') out[k] = v;
            else out[k] = `[${Array.isArray(v) ? `array:${v.length}` : typeof v}]`;
        }
        return out;
    } catch { return {}; }
}

class EventBus extends EventEmitter {
    constructor() {
        super();
        this.setMaxListeners(100);
        this.activeSubscriptions = new Map();
        this._errorHandlers = new Set();
    }

    /**
     * Publish an event asynchronously with error isolation
     */
    publish(event, data) {
        // Unified-trace mirror first (synchronous append, guarded):
        // the trace keeps true stream order even though subscriber
        // delivery below is deferred via setImmediate.
        if (_traceFn) {
            try { _traceFn('event_bus', String(event), _summarizeForTrace(data), { runId: (data && typeof data === 'object' && (data.runId || data.correlationId)) || null }); } catch { /* witness, never a gate */ }
        }
        setImmediate(() => {
            // Get listeners for this specific event
            const listeners = this.listeners(event);
            const wildcardListeners = this.listeners('*');

            // Execute each subscriber in try-catch to isolate failures
            for (const listener of listeners) {
                try {
                    listener(data);
                } catch (err) {
                    console.error(`[EventBus] Subscriber error for event '${event}':`, err.message);
                    this._notifyErrorHandlers(event, err, listener);
                }
            }

            // Execute wildcard subscribers
            for (const listener of wildcardListeners) {
                try {
                    listener({ event, data });
                } catch (err) {
                    console.error(`[EventBus] Wildcard subscriber error for event '${event}':`, err.message);
                    this._notifyErrorHandlers('*', err, listener);
                }
            }
        });
    }

    /**
     * Subscribe to an event with explicit cancellation
     */
    subscribe(event, listener) {
        if (event === 'all') event = '*'; // Allow 'all' as alias for wildcard
        this.on(event, listener);
        const subId = `sub_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
        this.activeSubscriptions.set(subId, { event, listener });

        return {
            cancel: () => {
                this.removeListener(event, listener);
                this.activeSubscriptions.delete(subId);
            }
        };
    }

    /**
     * Register error handler for subscriber failures
     */
    onError(handler) {
        this._errorHandlers.add(handler);
        return {
            cancel: () => this._errorHandlers.delete(handler)
        };
    }

    _notifyErrorHandlers(event, error, listener) {
        for (const handler of this._errorHandlers) {
            try {
                handler(event, error, listener);
            } catch (err) {
                // Error handlers shouldn't throw
            }
        }
    }
}

module.exports = { EventBus };
