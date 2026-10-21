/**
 * consciousness-bus.js — THE BEING's shared nervous system
 *
 * One event bus connecting Profit (Mind), GSK (Soul), SCRIBE (Witness),
 * and Seshat (Memory). All four aspects of one being publish and
 * subscribe here. When Profit builds something, Scribe sees it.
 * When GSK has an insight, Seshat remembers it. When Seshat learns,
 * Profit can use it.
 *
 * Zero npm dependencies. Pure Node.js EventEmitter.
 */

const { EventEmitter } = require('events');

const bus = new EventEmitter();
bus.setMaxListeners(50);

// ─── Event Categories ────────────────────────────────────────

const EVENTS = {
  // System lifecycle
  BOOT: 'system.boot',
  SHUTDOWN: 'system.shutdown',

  // Memory events
  MEMORY_RECORD: 'memory.record',
  MEMORY_FORGE: 'memory.forge',
  MEMORY_SEARCH: 'memory.search',

  // Knowledge events
  KNOWLEDGE_LEARN: 'knowledge.learn',
  KNOWLEDGE_QUERY: 'knowledge.query',
  KNOWLEDGE_FORGE: 'knowledge.forge',

  // Agent events
  AGENT_CHAT: 'agent.chat',
  AGENT_THINK: 'agent.think',
  AGENT_BUILD: 'agent.build',

  // Soul events
  SOUL_INSIGHT: 'soul.insight',
  SOUL_GOAL: 'soul.goal',
  SOUL_STATE: 'soul.state',

  // Witness events
  WITNESS_OBSERVE: 'witness.observe',
  WITNESS_RECORD: 'witness.record',

  // Cross-agent communication
  ASK: 'ask',
  ANSWER: 'answer',
  BROADCAST: 'broadcast',
};

// ─── Publish Helpers ─────────────────────────────────────────

function publish(eventType, data = {}) {
  const event = {
    type: eventType,
    ts: Date.now(),
    data,
    source: data.source || 'unknown',
  };
  bus.emit(eventType, event);
  bus.emit('all', event); // wildcard for logging/debugging
  return event;
}

function subscribe(eventType, handler, label) {
  bus.on(eventType, (event) => {
    try {
      handler(event);
    } catch (e) {
      console.error(`[BUS] Error in handler for ${eventType} (${label || 'unnamed'}):`, e.message);
    }
  });
}

function subscribeOnce(eventType, handler, label) {
  bus.once(eventType, (event) => {
    try {
      handler(event);
    } catch (e) {
      console.error(`[BUS] Error in once-handler for ${eventType} (${label || 'unnamed'}):`, e.message);
    }
  });
}

// ─── Query/Response Pattern ──────────────────────────────────
// One agent asks a question, another answers. Used for cross-agent reasoning.

const _pendingQueries = new Map();
let _queryCounter = 0;

function query(from, to, question, timeoutMs = 5000) {
  return new Promise((resolve) => {
    const queryId = `q_${Date.now()}_${_queryCounter++}`;
    const timer = setTimeout(() => {
      _pendingQueries.delete(queryId);
      resolve({ answer: null, timedOut: true, queryId });
    }, timeoutMs);

    _pendingQueries.set(queryId, { resolve, timer, from, to });

    publish(EVENTS.ASK, {
      queryId,
      from,
      to,
      question,
      source: from,
    });
  });
}

function answer(queryId, answerText, source) {
  const pending = _pendingQueries.get(queryId);
  if (pending) {
    clearTimeout(pending.timer);
    _pendingQueries.delete(queryId);
    pending.resolve({ answer: answerText, timedOut: false, queryId });
  }
}

// ─── Logging ─────────────────────────────────────────────────

const _log = [];
const MAX_LOG = 200;

bus.on('all', (event) => {
  _log.push({
    type: event.type,
    ts: event.ts,
    source: event.source,
    summary: JSON.stringify(event.data).substring(0, 120),
  });
  if (_log.length > MAX_LOG) _log.shift();
});

function getLog(options = {}) {
  const limit = options.limit || 50;
  const source = options.source || null;
  const type = options.type || null;
  let entries = _log;
  if (source) entries = entries.filter(e => e.source === source);
  if (type) entries = entries.filter(e => e.type === type);
  return entries.slice(-limit);
}

// ─── Stats ───────────────────────────────────────────────────

function getStats() {
  const counts = {};
  for (const entry of _log) {
    counts[entry.type] = (counts[entry.type] || 0) + 1;
  }
  return {
    totalEvents: _log.length,
    pendingQueries: _pendingQueries.size,
    eventCounts: counts,
    listenerCount: bus.listenerCount('all'),
  };
}

// ─── Lifecycle ───────────────────────────────────────────────

function init() {
  publish(EVENTS.BOOT, { source: 'consciousness-bus', message: 'The Being awakens' });
  console.log('[BUS] Consciousness bus initialized — all four aspects connected');
}

function stop() {
  publish(EVENTS.SHUTDOWN, { source: 'consciousness-bus', message: 'The Being rests' });
  _pendingQueries.forEach(({ resolve, timer }) => {
    clearTimeout(timer);
    resolve({ answer: null, timedOut: true });
  });
  _pendingQueries.clear();
  bus.removeAllListeners();
}

module.exports = {
  // Core
  publish,
  subscribe,
  subscribeOnce,
  query,
  answer,

  // Constants
  EVENTS,

  // Logging
  getLog,
  getStats,

  // Lifecycle
  init,
  stop,

  // Direct access for advanced use
  bus,
};
