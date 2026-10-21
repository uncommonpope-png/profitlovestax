// gsk-core/governance/deadlock_sentry.js
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');

const DEADLOCK_WINDOW_MS = 60000; // 60-second sliding window
const MIN_DUPLICATE_ACTIONS = 2; // A -> fail -> A = 2 entries
const EVENT_LOG_PATH = path.join(process.cwd(), 'gsk/data/deadlock_sentry_events.jsonl');

class SemanticDeadlockSentry {
  constructor({ goalRunner, scribeBridge, onDeadlockDetected }) {
    this.goalRunner = goalRunner;
    this.scribeBridge = scribeBridge;
    this.onDeadlockDetected = onDeadlockDetected;
    this.actionHistory = new Map(); // key: signature -> [timestamps]
    this.quarantinedSessions = new Set();
    this.active = true;
    
    this._ensureLogDir();
    this._loadRecentEvents();
  }

  _ensureLogDir() {
    const dir = path.dirname(EVENT_LOG_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }

  _loadRecentEvents() {
    try {
      if (fs.existsSync(EVENT_LOG_PATH)) {
        const raw = fs.readFileSync(EVENT_LOG_PATH, 'utf8');
        const lines = raw.trim().split('\n').slice(-100);
        for (const line of lines) {
          const event = JSON.parse(line);
          if (Date.now() - new Date(event.detectedAt).getTime() < DEADLOCK_WINDOW_MS) {
            this._record(event.signature, event.timestamp);
          }
        }
      }
    } catch (e) {
      console.warn('[SENTRY] Failed to load recent events:', e.message);
    }
  }

  _signatureFor(action, target) {
    return `${action}|${typeof target === 'string' ? require('crypto').createHash('md5').update(target).digest('hex') : JSON.stringify(target)}`;
  }

  observe(action, target, outcome, sessionId) {
    if (!this.active) return;

    const sig = this._signatureFor(action, target);
    const now = Date.now();
    this._record(sig, now);

    const history = this.actionHistory.get(sig) || [];
    const recent = history.filter(t => now - t < DEADLOCK_WINDOW_MS);
    this.actionHistory.set(sig, recent);

    const hasFailures = recent.length > 0;
    const dupCount = recent.length;

    // Check condition: A -> Failure -> A within window
    if (dupCount >= MIN_DUPLICATE_ACTIONS && outcome === 'fail') {
      const isDeadlock = this._detectRecursivePattern(recent, sig);
      if (isDeadlock && !this.quarantinedSessions.has(sessionId)) {
        return this._triggerDeadlockEvent({
          signature: sig,
          actionCount: dupCount,
          timestamps: recent,
          sessionId,
          detectedAt: new Date().toISOString(),
          trigger: `Recursive action '${action}' on target repeated ${dupCount} times in ${DEADLOCK_WINDOW_MS}ms`
        });
      }
    }
  }

  _detectRecursivePattern(timestamps, sig) {
    if (timestamps.length < 2) return false;
    const diffs = timestamps.slice(1).map((t, i) => t - timestamps[i]);
    const avgInterval = diffs.reduce((a, b) => a + b, 0) / diffs.length;
    return avgInterval < 30000; // Less than 30s average → likely looped
  }

  _record(sig, timestamp) {
    const history = this.actionHistory.get(sig) || [];
    history.push(timestamp);
    this.actionHistory.set(sig, history.filter(t => Date.now() - t < DEADLOCK_WINDOW_MS));
  }

  async _triggerDeadlockEvent(incident) {
    const eventId = uuidv4();
    const logLine = JSON.stringify({
      id: eventId,
      type: 'SEMANTIC_DEADLOCK',
      signature: incident.signature,
      actionCount: incident.actionCount,
      triggeredBy: incident.trigger,
      detectedAt: incident.detectedAt,
      timestamps: incident.timestamps
    });

    // Append to log
    fs.appendFileSync(EVENT_LOG_PATH, logLine + '\n');

    // Quarantine session
    this.quarantinedSessions.add(incident.sessionId);

    // Inject autopsy lesson into SCRIBE
    if (this.scribeBridge) {
      await this.scribeBridge.forwardEvent({
        type: 'deadlock_autopsy',
        content: `[AUTOPSY] Deadlock triggered by: ${incident.trigger}. Signature: ${incident.signature}.`,
        source: 'deadlock_sentry',
        tags: ['source:deadlock_sentry', 'severity:critical', 'module:deadlock_sentry'],
        timestamp: incident.detectedAt
      });
    }

    // Notify listeners (e.g., WebSocket broadcaster)
    if (this.onDeadlockDetected) {
      this.onDeadlockDetected(incident);
    }

    // Halt goal runner session
    if (this.goalRunner && this.goalRunner.abortSession) {
      this.goalRunner.abortSession(incident.sessionId);
    }

    console.warn(`[SENTRY] ⚡ SEMANTIC DEADLOCK ISOLATED — Session ${incident.sessionId} quarantined.`);
    return eventId;
  }

  releaseQuarantine(sessionId) {
    if (this.quarantinedSessions.delete(sessionId)) {
      console.log(`[SENTRY] ✅ Quarantine lifted for session ${sessionId}`);
      return true;
    }
    return false;
  }

  getStatus() {
    return {
      active: this.active,
      observedSignatures: this.actionHistory.size,
      quarantinedSessions: Array.from(this.quarantinedSessions),
      windowSizeMs: DEADLOCK_WINDOW_MS
    };
  }
}

module.exports = { SemanticDeadlockSentry, DEADLOCK_WINDOW_MS };
