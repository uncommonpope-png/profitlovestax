'use strict';

/**
 * LIVING AUDIT — Nervous system observability for GSK.
 *
 * Patches GSK's EventBus (publish/subscribe) plus raw EventEmitter
 * (emit/on/once) to track which organs actually talk on the bus.
 * A loaded organ that never publishes nor subscribes is a DARK organ.
 *
 * Load order: node -r ./gsk_living_audit.js -r ./gsk_require_trace.js ./gsk_daemon.js
 */

const fs = require('fs');
const path = require('path');
const { EventEmitter } = require('events');

const metrics = new Map();
const GSK_ROOT = __dirname;

function isNodeInternal(file) {
    return file.startsWith('node:') ||
        file.includes('node_modules') ||
        file.includes('node\\internal');
}

function sourceFromStack(stack) {
    if (!stack) return 'unknown';
    const frames = stack.split('\n');
    for (const frame of frames) {
        const m = frame.match(/\((.+?):\d+:\d+\)/) || frame.match(/at\s+([^(]+?):\d+:\d+/);
        if (!m) continue;
        let file = m[1];
        if (file.startsWith('async ')) file = file.slice(6);
        if (file.includes('gsk_living_audit.js')) continue;
        if (file.includes(path.join('gsk-core', 'brain', 'event_bus.js'))) continue;
        if (isNodeInternal(file)) continue;
        try {
            file = path.relative(GSK_ROOT, file);
        } catch (e) {}
        return file;
    }
    return 'unknown';
}

function bucket(src) {
    if (!metrics.has(src)) {
        metrics.set(src, { emit: 0, on: 0, once: 0, publish: 0, subscribe: 0, events: new Set() });
    }
    return metrics.get(src);
}

function track(kind, event, stack) {
    const src = sourceFromStack(stack);
    if (src === 'unknown') return;
    const b = bucket(src);
    b[kind]++;
    if (typeof event === 'string') b.events.add(event);
}

// --- Patch GSK EventBus publish/subscribe ---
let EventBus = null;
try {
    ({ EventBus } = require('./gsk-core/brain/event_bus.js'));
} catch (e) {
    console.log('[LIVING_AUDIT] EventBus not found, relying on EventEmitter patch.');
}

if (EventBus) {
    const origPublish = EventBus.prototype.publish;
    const origSubscribe = EventBus.prototype.subscribe;
    EventBus.prototype.publish = function (event, data) {
        track('publish', event, new Error().stack);
        return origPublish.apply(this, [event, data]);
    };
    EventBus.prototype.subscribe = function (event, listener) {
        track('subscribe', event, new Error().stack);
        return origSubscribe.apply(this, [event, listener]);
    };
}

// --- Patch raw EventEmitter (catches non-bus emitters too) ---
const origEmit = EventEmitter.prototype.emit;
const origOn = EventEmitter.prototype.on;
const origOnce = EventEmitter.prototype.once;

EventEmitter.prototype.emit = function (event, ...args) {
    track('emit', event, new Error().stack);
    return origEmit.apply(this, [event, ...args]);
};

EventEmitter.prototype.on = function (event, listener) {
    track('on', event, new Error().stack);
    return origOn.apply(this, [event, listener]);
};

EventEmitter.prototype.once = function (event, listener) {
    track('once', event, new Error().stack);
    return origOnce.apply(this, [event, listener]);
};

let reportWritten = false;

function writeReport(snapshot) {
    if (!snapshot) reportWritten = true;
    try {
        const report = {};
        for (const [src, data] of metrics.entries()) {
            const pub = data.publish + data.emit;
            const sub = data.subscribe + data.on;
            const alive = pub > 0 && sub > 0;
            const broadcasting = pub > 0 && sub === 0;
            const listening = pub === 0 && sub > 0;
            const classification = alive ? 'ALIVE' : broadcasting ? 'ISOLATED_BROADCASTER' : listening ? 'PASSIVE_LISTENER' : 'DARK';
            const isRealBusUser = data.publish > 0 || data.subscribe > 0;
            report[src] = {
                publish_count: data.publish,
                subscribe_count: data.subscribe,
                emit_count: data.emit,
                on_count: data.on,
                once_count: data.once,
                bus_user: isRealBusUser,
                event_names: [...data.events].slice(0, 30),
                classification
            };
        }
        const outPath = path.join(GSK_ROOT, 'reports', 'living-audit.json');
        fs.writeFileSync(outPath, JSON.stringify(report, null, 2), 'utf-8');
        console.log(`[LIVING_AUDIT] Report saved to ${outPath} (${Object.keys(report).length} organs tracked)`);
    } catch (e) {
        console.error('[LIVING_AUDIT] Failed to write report:', e.message);
    }
}

process.on('SIGINT', () => { writeReport(); process.exit(0); });
process.on('SIGTERM', () => { writeReport(); process.exit(0); });
process.on('exit', () => { writeReport(); });

setInterval(() => {
    writeReport(true);
    console.log('[LIVING_AUDIT] Snapshot written (periodic checkpoint).');
}, 30000).unref();

console.log('[LIVING_AUDIT] Nervous system tracking active. 3-minute capture window.');
