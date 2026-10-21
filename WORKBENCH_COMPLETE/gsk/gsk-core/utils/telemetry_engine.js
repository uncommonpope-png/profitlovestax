'use strict';

class TelemetryEngine {
    constructor(kernel) {
        this.kernel = kernel;
        this.registeredStats = new Map(); // Stores references to stats objects from other modules
        this.telemetryEvents = []; // For capturing discrete events
        this.maxTelemetryEvents = 1000;
        console.log('[TelemetryEngine] Initialized.');
    }

    /**
     * Registers a stats object from a module.
     * The TelemetryEngine will keep a reference to this object
     * and include its data in aggregated reports.
     * @param {string} moduleName - The name of the module (e.g., 'PerpetualConsciousness')
     * @param {object} statsObject - The stats object to register. This object should be mutable.
     */
    registerStats(moduleName, statsObject) {
        if (!moduleName || typeof moduleName !== 'string') {
            console.warn('[TelemetryEngine] Attempted to register stats with invalid module name.');
            return;
        }
        if (typeof statsObject !== 'object' || statsObject === null) {
            console.warn(`[TelemetryEngine] Attempted to register non-object stats for ${moduleName}.`);
            return;
        }
        this.registeredStats.set(moduleName, statsObject);
        console.log(`[TelemetryEngine] Registered stats for module: ${moduleName}`);
    }

    /**
     * Deregisters a module's stats.
     * @param {string} moduleName - The name of the module to deregister.
     */
    deregisterStats(moduleName) {
        if (this.registeredStats.has(moduleName)) {
            this.registeredStats.delete(moduleName);
            console.log(`[TelemetryEngine] Deregistered stats for module: ${moduleName}`);
        }
    }

    /**
     * Captures a discrete telemetry event.
     * @param {string} type - The type of event (e.g., 'tool_failure', 'plan_step_completed')
     * @param {object} payload - The event data.
     */
    recordEvent(type, payload = {}) {
        if (!type || typeof type !== 'string') {
            console.warn('[TelemetryEngine] Attempted to record event with invalid type.');
            return;
        }
        const event = {
            id: `${type}_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
            timestamp: Date.now(),
            type,
            ...payload
        };
        this.telemetryEvents.push(event);
        if (this.telemetryEvents.length > this.maxTelemetryEvents) {
            this.telemetryEvents.shift(); // Remove the oldest event
        }
        // console.log(`[TelemetryEngine] Recorded event: ${type}`);
    }

    /**
     * Retrieves all collected telemetry.
     * @returns {object} An object containing aggregated stats and recent events.
     */
    getReport() {
        const aggregatedStats = {};
        for (const [moduleName, statsObject] of this.registeredStats.entries()) {
            aggregatedStats[moduleName] = { ...statsObject }; // Return a clone to prevent external modification
        }

        return {
            timestamp: Date.now(),
            aggregatedStats,
            recentEvents: this.telemetryEvents.slice().reverse() // Return in reverse chronological order
        };
    }

    /**
     * Gets events of a specific type, optionally within a time range.
     * @param {string} type - The type of event to filter by.
     * @param {number} since - Optional timestamp (ms) to get events since.
     * @param {number} limit - Optional maximum number of events to return.
     * @returns {Array} An array of filtered events.
     */
    getEvents(type, since = 0, limit = 100) {
        return this.telemetryEvents
            .filter(event => event.type === type && event.timestamp >= since)
            .slice(-limit) // Get the most recent 'limit' events
            .reverse();
    }
}

module.exports = { TelemetryEngine };
