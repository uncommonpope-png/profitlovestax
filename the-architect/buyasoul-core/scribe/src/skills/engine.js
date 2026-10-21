'use strict';

/**
 * SkillEngine
 *
 * Loads all skill modules, provides invoke(name, params) and list().
 * Every invocation is recorded in an audit log (skills_audit.jsonl).
 *
 * Skills live alongside this file:
 *   web_fetch.js, file_read.js, file_write.js, bash_run.js,
 *   git_ops.js, search.js, github_api.js
 *
 * Each skill module exports:
 *   { MANIFEST, run(params) }
 */

const fs   = require('fs');
const path = require('path');

const SKILLS_DIR  = __dirname;
const AUDIT_FILE  = path.join(__dirname, '..', '..', 'data', 'skills_audit.jsonl');

const SKILL_FILES = [
  'web_fetch',
  'file_read',
  'file_write',
  'bash_run',
  'git_ops',
  'search',
  'github_api',
  'data_analysis',
  'http_post',
  'crypto_sign',
  'scheduler',
  'telegram',
  'llm',
  'doc_convert',
  'process_monitor',
  // Consciousness layer
  'soul_speak',
  'memory_query',
  'chamber_scan',
  'diff_minds',
  'pattern_watch',
  'soul_ledger',
  'timeline',
  'broadcast_self',
  'knowledge_graph',
  'introspect',
  // Production utilities
  'rate_limiter',
  'env_config',
  'log_writer',
  'health_check',
  'retry',
  // Feature skills
  'summarize',
  'alert_router',
  'watchdog',
  'cron_schedule',
  'diff_history',
  'csv_parse',
  'text_diff',
  'event_bus',
  'note_pad',
  'report_builder',
  // Wave 2 — intelligence + persistence + world + security + self-improvement
  'sqlite_store',
  'time_series',
  'workflow',
  'rss_reader',
  'email_send',
  'anomaly',
  'opinion',
  'acl',
  'tamper_detect',
  'skill_eval',
  'self_write',
  'chart',
  'heartbeat',
  'kernel_sync',
  // Wave 3 — reasoning, prediction, agents, conversation, markets, identity, conflict, plugins, voice, profit
  'reasoning',
  'prediction',
  'agent_spawn',
  'conversation',
  'market',
  'soul_evolve',
  'conflict',
  'plugin',
  'voice_prep',
  'profit_brain',
  // Companion protocol
  'aria',
  // Phase 3 - NLP Command System
  'nlp_parser',
  'command_registry',
];

class SkillEngine {
  constructor(memory) {
    this._memory  = memory; // optional — may be null during unit test
    this._skills  = {};
    this._load();
    this._ensureAuditFile();
  }

  // ── Loading ─────────────────────────────────────────────────────────────────

    _load() {
    let loaded = 0;
    for (const name of SKILL_FILES) {
      try {
        const mod = require(path.join(SKILLS_DIR, `${name}.js`));
        if (!mod.MANIFEST || typeof mod.run !== 'function') {
          console.warn(`[SkillEngine] ${name}.js missing MANIFEST or run() — skipped`);
          continue;
        }
        this._skills[name] = mod;
        loaded++;
      } catch (e) {
        console.warn(`[SkillEngine] Failed to load ${name}.js: ${e.message}`);
        if (this._memory) {
          try {
            this._memory.record({
              type: 'conflict',
              summary: `Failed to load skill "${name}": ${e.message}`,
              tags: ['skill', name, 'load_failure', 'critical'],
              weight: 0.8,
              source: { system: 'SCRIBE', chamber: 'SkillEngine' },
            });
          } catch {}
        }
      }
    }
    // Inject memory reference into skills that support it
    if (this._memory) {
      for (const mod of Object.values(this._skills)) {
        if (typeof mod.setMemory === 'function') mod.setMemory(this._memory);
      }
    }
    // Inject self-reference into skills that invoke other skills (retry)
    for (const mod of Object.values(this._skills)) {
      if (typeof mod.setSkills === 'function') mod.setSkills(this);
    }
    console.log(`[SkillEngine] Loaded ${loaded} skill(s).`);
  }

  _ensureAuditFile() {
    const dir = path.dirname(AUDIT_FILE);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    if (!fs.existsSync(AUDIT_FILE)) fs.writeFileSync(AUDIT_FILE, '', 'utf-8');
  }

  // ── Public API ──────────────────────────────────────────────────────────────

  /**
   * list() — return array of skill manifests
   */
  list() {
    return Object.values(this._skills).map(s => s.MANIFEST);
  }

  /**
   * invoke(name, params) — run a skill, return result, record in audit + memory
   * Always resolves (never throws). On error: { ok: false, error, ... }
   */
  async invoke(name, params = {}) {
    const skill = this._skills[name];

    if (!skill) {
      const err = { ok: false, error: `Unknown skill: ${name}`, ts: new Date().toISOString() };
      this._audit(name, params, err);
      return err;
    }

    const started = Date.now();
    let result;

    try {
      result = await skill.run(params);
    } catch (e) {
      result = { ok: false, error: e.message, ts: new Date().toISOString() };
    }

    const duration_ms = Date.now() - started;
    const enriched = { ...result, skill: name, duration_ms };

    this._audit(name, params, enriched);
    this._remember(name, enriched);

    return enriched;
  }

  // ── Internals ───────────────────────────────────────────────────────────────

  _audit(name, params, result) {
    const entry = {
      id:        `audit_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      skill:     name,
      params:    this._sanitize(params),
      ok:        result.ok,
      ts:        result.ts || new Date().toISOString(),
      duration_ms: result.duration_ms || null,
      error:     result.error || null,
    };
    try {
      fs.appendFileSync(AUDIT_FILE, JSON.stringify(entry) + '\n', 'utf-8');
    } catch {
      // audit failure must not crash the engine
    }
  }

  _remember(name, result) {
    if (!this._memory) return;
    try {
      this._memory.record({
        type: 'observation',
        summary: result.ok
          ? `Invoked skill "${name}" — succeeded in ${result.duration_ms}ms`
          : `Invoked skill "${name}" — failed: ${result.error}`,
        tags: ['skill', name, result.ok ? 'success' : 'failure'],
        weight: 0.4,
        source: { system: 'SCRIBE', chamber: name },
        meta: { ok: result.ok, duration_ms: result.duration_ms },
      });
    } catch {
      // memory failure must not crash the engine
    }
  }

  /**
   * Sanitize params before logging — redact any key named token/key/secret/password
   */
  _sanitize(params) {
    const REDACT = /token|key|secret|password|auth/i;
    const out = {};
    for (const [k, v] of Object.entries(params)) {
      out[k] = REDACT.test(k) ? '[REDACTED]' : v;
    }
    return out;
  }

  /**
   * run(name, params) — alias for invoke(), used internally by skills
   */
  async run(name, params = {}) {
    return this.invoke(name, params);
  }

  /**
   * register(mod) — hot-register a skill module at runtime (used by plugin.js / self_write.js)
   */
  register(mod) {
    if (!mod.MANIFEST || typeof mod.run !== 'function') {
      throw new Error(`register: module missing MANIFEST or run()`);
    }
    const name = mod.MANIFEST.name;
    this._skills[name] = mod;
    if (this._memory && typeof mod.setMemory === 'function') mod.setMemory(this._memory);
    if (typeof mod.setSkills === 'function') mod.setSkills(this);
    console.log(`[SkillEngine] Registered skill: ${name}`);
    return mod.MANIFEST;
  }

  /**
   * unregister(name) — remove a skill from the live registry
   */
  unregister(name) {
    if (this._skills[name]) {
      delete this._skills[name];
      console.log(`[SkillEngine] Unregistered skill: ${name}`);
    }
  }

  /**
   * auditLog() — read recent audit entries
   */
  auditLog(limit = 20) {
    try {
      const raw = fs.readFileSync(AUDIT_FILE, 'utf-8').trim();
      if (!raw) return [];
      return raw
        .split('\n')
        .filter(Boolean)
        .map(l => JSON.parse(l))
        .slice(-limit);
    } catch {
      return [];
    }
  }
}

module.exports = { SkillEngine };
