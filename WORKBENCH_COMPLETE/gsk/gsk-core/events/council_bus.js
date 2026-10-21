// council_bus.js — Real-time event pub/sub for Gods Council chamber speeches
'use strict';

const EventEmitter = require('events');
const path = require('path');
const fs = require('fs');

const EVENT_LOG_PATH = path.join(process.cwd(), 'gsk/data/council_speeches.jsonl');

class CouncilEventBus extends EventEmitter {
  constructor(options = {}) {
    super();
    this.options = {
      scribeBridge: options.scribeBridge || null,
      ...options
    };
    this.speakers = {
      profit: { name: 'Profit', role: 'Legislator', color: 'emerald' },
      tax: { name: 'Tax Tribune', role: 'Auditor', color: 'amber' },
      love: { name: 'Love Council', role: 'Harmony Keeper', color: 'rose' },
      harvest: { name: 'Harvest', role: 'Executor', color: 'yellow' },
      chancellor: { name: 'Chancellor', role: 'Arbiter', color: 'red' }
    };
    this.sessionHistory = [];
    this.maxHistory = 100;
  }

  emitSpeech(speaker, chamber, message, voteType = 'statement', pltImpact = {}) {
    const payload = {
      timestamp: Date.now(),
      speaker: speaker,
      chamber: chamber,
      role: this.speakers[speaker]?.role || speaker,
      displayName: this.speakers[speaker]?.name || speaker,
      color: this.speakers[speaker]?.color || 'slate',
      message: message,
      vote: voteType,
      pltImpact: pltImpact,
      sessionId: this.currentSessionId || null
    };

    // Emit locally for subscribers
    this.emit('council_speech', payload);

    // Persist to history
    this.sessionHistory.push(payload);
    if (this.sessionHistory.length > this.maxHistory) {
      this.sessionHistory.shift();
    }

    // Write immutable event log
    this._writeEvent(payload);

    // Forward to SCRIBE if available
    if (this.options.scribeBridge && typeof this.options.scribeBridge.forwardEvent === 'function') {
      this.options.scribeBridge.forwardEvent({
        type: 'council_speech',
        content: message,
        source: 'council_bus',
        tags: ['source:council', `speaker:${speaker}`, `chamber:${chamber}`, `vote:${voteType}`],
        timestamp: payload.timestamp
      }).catch(() => {});
    }

    return payload;
  }

  _writeEvent(event) {
    try {
      fs.appendFileSync(EVENT_LOG_PATH, JSON.stringify(event) + '\n');
    } catch (e) {
      console.warn('[CouncilBus] Failed to write event log:', e.message);
    }
  }

  startSession(goalId, title) {
    this.currentSessionId = `council-${Date.now()}`;
    this.emit('session_start', { sessionId: this.currentSessionId, goalId, title });
    this.emitSpeech('chancellor', 'verdict', `Council convened for: ${title}`, 'gavel', { type: 'session_start' });
  }

  endSession(result) {
    this.emitSpeech('chancellor', 'verdict', `Council adjourned. Final verdict: ${result}`, 'ruling', { type: 'session_end', result });
    this.currentSessionId = null;
  }

  getHistory(limit = 50) {
    return this.sessionHistory.slice(-limit);
  }

  getStatus() {
    return {
      active: true,
      sessionsActive: this.currentSessionId ? 1 : 0,
      currentSessionId: this.currentSessionId,
      eventCount: this.sessionHistory.length,
      speakers: Object.keys(this.speakers)
    };
  }
}

module.exports = { CouncilEventBus };
