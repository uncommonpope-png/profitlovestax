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
