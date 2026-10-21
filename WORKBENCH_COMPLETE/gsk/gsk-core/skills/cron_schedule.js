module.exports.MANIFEST = {
    name: 'cron_schedule',
    description: 'Skill: cron_schedule',
    version: '1.0.0',
    inputs: {},
    output: { schema: 'ok/error' }
};

module.exports.run = async (params) => {
    // Standardized implementation
};
'use strict';

/**
 * CRON SCHEDULER — Recurring scheduled jobs for GSK.
 *
 * Pulled from: SCRIBE's cron_schedule.js (final-run repo)
 * Supports simple interval-based schedules with no external dependencies.
 *
 * Ops: add, remove, list, run_now, clear
 */

const JOBS = new Map();
let _fusion = null;

function setFusion(f) { _fusion = f; }
function _now() { return Date.now(); }

function _parseInterval(spec) {
  if (typeof spec === 'number') return spec;
  const match = String(spec).trim().match(/^(\d+(?:\.\d+)?)(ms|s|m|h|d)$/i);
  if (!match) throw new Error(`Invalid interval spec: ${spec}. Use "30s", "5m", "1h", "2d", or ms.`);
  const val = parseFloat(match[1]);
  const unit = match[2].toLowerCase();
  const mult = { ms: 1, s: 1000, m: 60000, h: 3600000, d: 86400000 };
  return Math.round(val * mult[unit]);
}

function _schedule(job) {
  if (job._timer) clearTimeout(job._timer);
  const delay = Math.max(0, job.next_run - _now());
  job._timer = setTimeout(async () => {
    job.last_run = _now();
    job.run_count = (job.run_count || 0) + 1;
    job.next_run = job.last_run + job.interval_ms;
    try {
      if (job.action && _fusion) {
        const toolBridge = _fusion.systems?.toolBridge;
        if (toolBridge && typeof toolBridge.invoke === 'function') {
          await toolBridge.invoke(job.action, job.params || {});
        }
      }
    } catch (_) {}
    _schedule(job);
  }, delay);
  job._timer.unref && job._timer.unref();
}

const ops = {
  add(params = {}) {
    const { job_id, label, interval, action, params: actionParams, record_to_memory } = params;
    if (!job_id) throw new Error('job_id required');
    if (!interval) throw new Error('interval required ("5m", "1h", 60000)');
    if (JOBS.has(job_id)) throw new Error(`Job exists: ${job_id}`);
    const interval_ms = _parseInterval(interval);
    if (interval_ms < 1000) throw new Error('Minimum interval 1000ms');

    const job = {
      id: job_id, label: label || job_id, interval_ms,
      interval_spec: String(interval),
      action: action || null, params: actionParams || {},
      run_count: 0, errors: 0, last_run: null,
      next_run: _now() + interval_ms, _timer: null,
      record_to_memory: !!record_to_memory
    };
    JOBS.set(job_id, job);
    _schedule(job);
    return { ok: true, job_id, next_run: job.next_run, interval_ms };
  },

  remove(params = {}) {
    const job = JOBS.get(params.job_id);
    if (!job) throw new Error(`Job not found: ${params.job_id}`);
    if (job._timer) clearTimeout(job._timer);
    JOBS.delete(params.job_id);
    return { ok: true, removed: params.job_id };
  },

  list() {
    return Array.from(JOBS.values()).map(j => ({
      id: j.id, label: j.label, interval: j.interval_spec,
      run_count: j.run_count, errors: j.errors,
      last_run: j.last_run, next_run: j.next_run, action: j.action
    }));
  },

  clear() {
    for (const [id, job] of JOBS) {
      if (job._timer) clearTimeout(job._timer);
    }
    JOBS.clear();
    return { ok: true, cleared: true };
  }
};

module.exports = { ops, setFusion, JOBS };

