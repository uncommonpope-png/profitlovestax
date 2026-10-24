'use strict';

/**
 * UNIFIED EVENT TRACE (Steal List #5, 2026-10-23 — from AutoGen's
 * OpenTelemetry spans + OpenHands' event stream, per
 * gsk-sessions/2026-10-23-harness-comparison.md Trails #4).
 *
 * ONE append target for the whole body. The body already had rich
 * *records* (digestion log, PLT history, growth ledger) and four
 * separate event buses; what it never had was a single ordered
 * stream a watcher can grep while a run is happening. This module
 * is that stream: span-shaped JSONL, one file per day, under
 * .seshat-brain/traces/.
 *
 * Emitters wired at birth:
 *   - skills/graft_tool_harness.js — run start, PLT gate verdict,
 *     every step + probe, PLT score, run end (source "harness");
 *   - brain/event_bus.js — every publish() on the shared EventBus
 *     is mirrored here (source "event_bus"), so any existing bus
 *     user joins the trace without code changes;
 *   - skills/graft_digestion.js — per-item digestion outcomes
 *     (source "seshat.digestion");
 *   - brain/scribe_bridge.js — witness forwards (source
 *     "scribe.bridge"); the bridge's peer may be down — the trace
 *     records the attempt and its outcome either way.
 *
 * Rails:
 *   - trace() NEVER throws and never blocks the caller on failure:
 *     telemetry is a witness, not a gate. A failed append returns
 *     null and the body keeps working.
 *   - No secrets in telemetry (graft_observability discipline #7):
 *     callers pass summaries, never credential values or full
 *     payloads. Data fields are size-capped by convention at the
 *     emit sites.
 *   - Ordering is file append order — the true stream order.
 *     `seq` is monotonic per process; `ts` + append order order
 *     across processes.
 *
 * Reader: readTrace() below (the graft_observability draft becomes
 * this module's query side; no dashboard on day one — a trace file
 * Profit can grep beats a UI that doesn't exist).
 */

const fs = require('fs');
const path = require('path');

const BRAIN_DIR = path.resolve(__dirname, '..', '..', '..', 'workbench', '.seshat-brain');
const TRACE_DIR = path.join(BRAIN_DIR, 'traces');

let _seq = 0;

function traceFileFor(date = new Date()) {
    return path.join(TRACE_DIR, `trace-${date.toISOString().slice(0, 10)}.jsonl`);
}

/**
 * Append one span-shaped event. Returns the record, or null if the
 * append failed (never throws).
 * @param {string} source  emitter name, e.g. 'harness', 'seshat.digestion'
 * @param {string} event   event name, e.g. 'run_start', 'step'
 * @param {object} data    small summary payload (no secrets, no payloads)
 * @param {object} opts    { runId } — correlation id for the run
 */
function trace(source, event, data = {}, opts = {}) {
    try {
        const rec = {
            ts: new Date().toISOString(),
            seq: ++_seq,
            pid: process.pid,
            source,
            event,
            runId: opts.runId || (data && data.runId) || null,
            data: data || {},
        };
        fs.mkdirSync(TRACE_DIR, { recursive: true });
        fs.appendFileSync(traceFileFor(), JSON.stringify(rec) + '\n', 'utf8');
        return rec;
    } catch {
        return null;
    }
}

/**
 * Read trace records back, in stream (append) order.
 * @param {object} q { file?, source?, runId?, event?, limit? }
 *   file defaults to today's trace file.
 */
function readTrace(q = {}) {
    const file = q.file || traceFileFor();
    let lines;
    try { lines = fs.readFileSync(file, 'utf8').split('\n').filter(Boolean); }
    catch { return { file, records: [], error: 'trace_file_unreadable' }; }
    const records = [];
    for (const line of lines) {
        let rec;
        try { rec = JSON.parse(line); } catch { continue; }
        if (q.source && rec.source !== q.source) continue;
        if (q.runId && rec.runId !== q.runId) continue;
        if (q.event && rec.event !== q.event) continue;
        records.push(rec);
    }
    const limit = q.limit || 500;
    return { file, records: records.slice(-limit), total: records.length };
}

module.exports = { trace, readTrace, TRACE_DIR, BRAIN_DIR, traceFileFor };
