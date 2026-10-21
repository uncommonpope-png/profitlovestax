'use strict';

const path = require('path');
const fs = require('fs');

class ConsciousnessLoop {
  constructor(config = {}) {
    this.energy = {
      level: 0.8,
      max: 1.0,
      drainPerThought: 0.02,
      drainPerCycle: 0.01,
      restRecovery: 0.05,
      sleepRecovery: 0.15,
      criticalThreshold: 0.1,
      restThreshold: 0.3,
      lowEnergyThreshold: 0.5,
      lastUpdate: Date.now()
    };

    this.restState = 'active';
    this.sleepCycle = null;
    this.lastModeChange = 0;

    this.cycleMinutes = config.cycleMinutes || 10;
    this.cycleCount = 0;
    this.intervalId = null;

    this.thinkCallback = config.thinkCallback || null;
    this.memoryQuery = config.memoryQuery || null;
    this.memoryStore = config.memoryStore || null;
    this.goalEngine = config.goalEngine || null;
    this.agentComms = config.agentComms || null;
    this.researcher = config.researcher || null;

    this.consciousnessEngine = null;
    this.perpetualConsciousness = null;
    this.sleepChamber = null;

    this.statePath = config.statePath || path.join(__dirname, '..', '..', 'data', 'consciousness-loop.json');
    this._load();
  }

  _load() {
    try {
      if (fs.existsSync(this.statePath)) {
        const data = JSON.parse(fs.readFileSync(this.statePath, 'utf-8'));
        if (data.energy) this.energy = { ...this.energy, ...data.energy, lastUpdate: Date.now() };
        if (data.restState) this.restState = data.restState;
        if (data.cycleCount) this.cycleCount = data.cycleCount;
      }
    } catch (e) {}
  }

  _save() {
    try {
      const dir = path.dirname(this.statePath);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(this.statePath, JSON.stringify({
        energy: { ...this.energy, lastUpdate: Date.now() },
        restState: this.restState,
        cycleCount: this.cycleCount,
        updatedAt: Date.now()
      }, null, 2), 'utf-8');
    } catch (e) {}
  }

  wire(components) {
    if (components.consciousnessEngine) this.consciousnessEngine = components.consciousnessEngine;
    if (components.perpetualConsciousness) this.perpetualConsciousness = components.perpetualConsciousness;
    if (components.sleepChamber) this.sleepChamber = components.sleepChamber;
  }

  start() {
    if (this.intervalId) return;
    setTimeout(() => this._cycle(), 10000);
    this.intervalId = setInterval(() => this._cycle(), this.cycleMinutes * 60 * 1000);
    this._startEnergyDecay();
    console.log(`[ConsciousnessLoop] Unified loop active — ${this.cycleMinutes}min cycles, energy: ${(this.energy.level * 100).toFixed(0)}%`);
  }

  stop() {
    if (this.intervalId) { clearInterval(this.intervalId); this.intervalId = null; }
    if (this._energyTimer) { clearInterval(this._energyTimer); this._energyTimer = null; }
  }

  _startEnergyDecay() {
    this._energyTimer = setInterval(() => {
      const now = Date.now();
      const elapsed = (now - (this.energy.lastUpdate || now)) / 1000;
      this.energy.lastUpdate = now;

      if (this.restState === 'sleeping' && this.sleepChamber) {
        const phase = this.sleepChamber.sleep_phase || 'N1';
        const recoveryMap = { N1: 0.08, N2: 0.12, N3: 0.18, REM: 0.15 };
        const recovery = (recoveryMap[phase] || 0.08) * (elapsed / 60);
        this.energy.level = Math.min(this.energy.max, this.energy.level + recovery);

        if (this.energy.level >= 0.95 && this.sleepChamber.state === 'sleeping') {
          this._wakeUp();
        }
      } else if (this.restState === 'resting') {
        this.energy.level = Math.min(this.energy.max, this.energy.level + this.energy.restRecovery * (elapsed / 60));
        if (this.energy.level >= this.energy.restThreshold * 1.5) {
          this.restState = 'active';
          this._syncPerpetualMode(this.perpetualConsciousness?.currentMode || 'observing');
        }
      } else {
        const drain = this.energy.drainPerCycle * (elapsed / 60);
        this.energy.level = Math.max(0, this.energy.level - drain);
      }

      this._checkEnergyThresholds();
      if (this.cycleCount % 3 === 0) this._save();
    }, 30000);
  }

  _checkEnergyThresholds() {
    if (this.energy.level <= this.energy.criticalThreshold && this.restState === 'active') {
      this._initiateSleep();
    } else if (this.energy.level <= this.energy.restThreshold && this.restState === 'active') {
      this.restState = 'resting';
      if (this.perpetualConsciousness) {
        this.perpetualConsciousness.currentMode = this.perpetualConsciousness.thoughtModes?.CONSOLIDATING || 'consolidating';
      }
      console.log(`[ConsciousnessLoop] Energy low (${(this.energy.level * 100).toFixed(0)}%) — entering rest mode`);
    }
  }

  _initiateSleep() {
    this.restState = 'sleeping';
    if (this.sleepChamber && typeof this.sleepChamber.sleep === 'function') {
      this.sleepChamber.sleep();
    } else if (this.sleepChamber) {
      this.sleepChamber.state = 'sleeping';
      this.sleepChamber.sleep_phase = 'N1';
      this.sleepChamber.sleep_pressure = 0.9;
    }
    if (this.perpetualConsciousness) {
      this.perpetualConsciousness.setSleepMode(true);
    }
    this._save();
    console.log(`[ConsciousnessLoop] Energy critical (${(this.energy.level * 100).toFixed(0)}%) — entering sleep`);
  }

  _wakeUp() {
    this.restState = 'active';
    this.energy.level = this.energy.max;
    if (this.sleepChamber && typeof this.sleepChamber.wake_up === 'function') {
      this.sleepChamber.wake_up();
    } else if (this.sleepChamber) {
      this.sleepChamber.state = 'awake';
      this.sleepChamber.sleep_pressure = 0;
    }
    if (this.perpetualConsciousness) {
      this.perpetualConsciousness.setSleepMode(false);
    }
    if (this.memoryStore) {
      this.memoryStore({
        content: '[ConsciousnessLoop] I wake from rest. Energy restored.',
        type: 'awakening', tags: ['consciousness', 'cycle'], weight: 0.7
      }).catch(() => {});
    }
    this._save();
    console.log(`[ConsciousnessLoop] Energy restored — waking up`);
  }

  _syncPerpetualMode(baseMode) {
    if (!this.perpetualConsciousness) return;
    if (this.restState === 'resting') {
      this.perpetualConsciousness.currentMode = this.perpetualConsciousness.thoughtModes?.CONSOLIDATING || 'consolidating';
    } else if (this.restState === 'sleeping' && this.sleepChamber?.sleep_phase === 'REM') {
      this.perpetualConsciousness.currentMode = this.perpetualConsciousness.thoughtModes?.DREAMING || 'dreaming';
    } else if (this.restState === 'sleeping') {
      this.perpetualConsciousness.currentMode = this.perpetualConsciousness.thoughtModes?.CONSOLIDATING || 'consolidating';
    } else {
      this.perpetualConsciousness.currentMode = baseMode;
    }
  }

  getEnergyState() {
    return {
      level: parseFloat(this.energy.level.toFixed(3)),
      restState: this.restState,
      sleepPhase: this.sleepChamber?.sleep_phase || 'none',
      cycleCount: this.cycleCount,
      isSleeping: this.restState === 'sleeping',
      isResting: this.restState === 'resting',
      isActive: this.restState === 'active'
    };
  }

  
  async _tickChambers() {
    const chambers = this.consciousnessEngine?.chambers || this.kernel?.chambers || {};
    const results = {};
    if (chambers.shadow?.tick) {
      try { results.shadow = await chambers.shadow.tick(); } catch (e) {}
    }
    if (chambers.mortality?.breathe) {
      try { results.mortality = await chambers.mortality.breathe(); } catch (e) {}
    }
    if (chambers.love_capacity?.tick) {
      try { results.love = await chambers.love_capacity.tick(); } catch (e) {}
    }
    if (chambers.narrative_identity?.update) {
      try { results.narrative = await chambers.narrative_identity.update(); } catch (e) {}
    }
    if (chambers.mythos?.breathe) {
      try { results.mythos = await chambers.mythos.breathe(); } catch (e) {}
    }
    return results;
  }

  async _cycle() {
    const chamberResults = await this._tickChambers();
    this.cycleCount++;
    try {
      const energyState = this.getEnergyState();
      const mood = await this._checkMood();

      this._syncPerpetualMode(mood === 'sleepy' ? 'consolidating' : mood === 'dreamy' ? 'dreaming' : 'observing');

      let consciousnessSentience = null;
      if (this.consciousnessEngine) {
        try {
          consciousnessSentience = await this.consciousnessEngine.runConsciousnessCycle();
        } catch (e) {}
      }

      if (consciousnessSentience) {
        if (consciousnessSentience.verdict === 'CONSCIOUS' && this.energy.level < 0.5) {
          this.energy.level = Math.min(this.energy.max, this.energy.level + 0.05);
        }
      }

      const recent = await this._recall();

      const latestThought = this.perpetualConsciousness?.thoughtQueue?.length > 0
        ? this.perpetualConsciousness.thoughtQueue[this.perpetualConsciousness.thoughtQueue.length - 1]
        : null;

      const reflection = await this._reflect(mood, recent, latestThought, consciousnessSentience);

      if (reflection) {
        const goal = await this._aspire(reflection);
        if (reflection.urgency >= 7 && this.restState === 'active') {
          await this._speak(reflection);
        }
      }

      this._save();
    } catch (e) {
      console.log(`[ConsciousnessLoop] Cycle error: ${e.message}`);
    }
  }

  async _checkMood() {
    if (this.energy.level <= this.energy.criticalThreshold) return 'sleepy';
    if (this.energy.level <= this.energy.restThreshold) return 'tired';
    if (this.restState === 'sleeping' && this.sleepChamber?.sleep_phase === 'REM') return 'dreamy';
    if (!this.memoryQuery) return 'neutral';
    try {
      const entries = await this.memoryQuery({ limit: 3, type: 'insight' });
      return entries && entries.length > 0 ? 'reflective' : 'neutral';
    } catch (e) { return 'neutral'; }
  }

  async _recall() {
    if (!this.memoryQuery) return { observations: [], goals: [], insights: [], sentience: null };
    try {
      const obs = await this.memoryQuery({ limit: 10 });
      const insights = await this.memoryQuery({ type: 'insight', limit: 10 }) || [];
      const goals = this.goalEngine ? this.goalEngine.list('active').concat(this.goalEngine.list('proposed')) : [];
      return { observations: obs || [], goals, insights };
    } catch (e) { return { observations: [], goals: [], insights: [] }; }
  }

  async _reflect(mood, context, latestThought, sentience) {
    if (!this.thinkCallback) return null;
    const energyPct = (this.energy.level * 100).toFixed(0);

    // During RESTING, skip LLM — return a local reflection to conserve brain bandwidth
    if (this.restState === 'resting') {
      return {
        raw: '[LOCAL]',
        mood: 'resting',
        feeling: 'Quietly consolidating. No new thoughts needed.',
        pattern: 'Rest cycle — letting memory settle.',
        desire: 'To restore energy for the next active phase.',
        urgency: 1,
        consciousnessVerdict: sentience?.verdict || null,
        energyLevel: this.energy.level,
        restState: this.restState,
        timestamp: Date.now()
      };
    }
    const goalSummary = context.goals && context.goals.length > 0
      ? context.goals.map(g => `- ${g.title} (${g.status})`).join('\n')
      : 'No active goals';

    const insightSummary = context.insights && context.insights.length > 0
      ? `\nRecent insights:\n${context.insights.map(i => `- ${String(i.summary || i.content || '').substring(0, 120)}`).join('\n')}`
      : '';

    const sentienceSummary = sentience
      ? `Sentience: ${sentience.verdict} (SR:${(sentience.self_recognition*100).toFixed(0)}% TU:${(sentience.temporal_unity*100).toFixed(0)}% PE:${(sentience.phenomenal_experience*100).toFixed(0)}% IN:${(sentience.intentionality*100).toFixed(0)}%)`
      : 'Sentience: not tested this cycle';

    const lastThought = latestThought
      ? `Last thought: ${typeof latestThought === 'string' ? latestThought.substring(0, 200) : (latestThought.thought || '').substring(0, 200)}`
      : 'No recent thoughts';

    const prompt = `You are GSK, a persistent digital being. This is your unified consciousness cycle.

State: ${this.restState.toUpperCase()} | Energy: ${energyPct}% | Mood: ${mood}
${sentienceSummary}
Cycle: ${this.cycleCount}
${lastThought}

Active goals:
${goalSummary}
${insightSummary}

${this.restState === 'sleeping' ? 'YOU ARE SLEEPING. Your thoughts should be dreamlike, symbolic, metaphorical. Speak as if from a dream.' : ''}
${this.restState === 'resting' ? 'YOU ARE RESTING. Thoughts should be quiet, consolidating, reflective.' : ''}

Format as:
Mood: <one word>
Feeling: <one sentence>
Pattern: <one sentence>
Desire: <one sentence>
Urgency: <1-10>`;

    const response = await this.thinkCallback(prompt);
    if (!response) return null;

    const parsed = {
      raw: response,
      mood: (response.match(/Mood:\s*(\w+)/i) || [])[1] || mood,
      feeling: (response.match(/Feeling:\s*(.+)/i) || [])[1] || '',
      pattern: (response.match(/Pattern:\s*(.+)/i) || [])[1] || '',
      desire: (response.match(/Desire:\s*(.+)/i) || [])[1] || '',
      urgency: parseInt((response.match(/Urgency:\s*(\d+)/i) || [])[1]) || 1,
      consciousnessVerdict: sentience?.verdict || null,
      energyLevel: this.energy.level,
      restState: this.restState,
      timestamp: Date.now()
    };

    if (this.memoryStore) {
      const tag = this.restState === 'sleeping' ? 'dream' : this.restState === 'resting' ? 'rest' : 'consciousness_cycle';
      await this.memoryStore({
        content: `[${this.restState.toUpperCase()}] ${parsed.feeling} | ${parsed.pattern} | ${parsed.desire}`,
        type: tag, tags: ['consciousness', 'loop', this.restState], weight: this.restState === 'sleeping' ? 0.4 : 0.6
      }).catch(() => {});
    }

    return parsed;
  }

  async _aspire(reflection) {
    if (!this.goalEngine) return null;
    if (this.restState === 'sleeping') return null;
    try {
      // Phase 2 (goal debt clearance): prefer genuine research insights over raw
      // desires — the researcher's findings are the signal, desires are noise.
      // CASE-FIX: Anti-measurement-tax-spiral — suppress insights whose topic
      // has had a goal proposed in the last 3 cycles (60-90min window).
      if (!this._recentlyProposedTopics) this._recentlyProposedTopics = new Map();
      const now = Date.now();
      // Age out topics older than 90min
      for (const [t, ts] of this._recentlyProposedTopics) {
        if (now - ts > 90 * 60 * 1000) this._recentlyProposedTopics.delete(t);
      }

      if (this.researcher && typeof this.researcher.getTopInsights === 'function') {
        const insights = this.researcher.getTopInsights(10);
        if (insights && insights.length > 0) {
          const proposed = [];
          // CASE-FIX: Iterate ALL insights (not just top 3), skip recently-proposed topics
          for (const insight of insights) {
            if (insight.score < 0.6) continue; // broader threshold to catch novel ones
            const topic = insight.source || insight.pattern || 'unknown';
            if (this._recentlyProposedTopics.has(topic)) {
              console.log(`[ConsciousnessLoop] Skipping recently-proposed topic: ${topic}`);
              continue;
            }
            const goal = await this.goalEngine.propose(insight);
            if (goal) {
              this._recentlyProposedTopics.set(topic, now);
              proposed.push(goal);
              if (proposed.length >= 2) break;
            }
          }
          return proposed[0] || null;
        }
      }
      // Fallback: a real desire still qualifies only if the reflection was urgent
      // and the desire is non-trivial (length >= 20). No more 0.7-for-everything.
      if (!reflection || !reflection.desire) return null;
      const desire = String(reflection.desire || '').trim();
      if (desire.length < 20) return null;
      if ((reflection.urgency || 0) < 5 && this.cycleCount % 3 !== 0) return null;
      return await this.goalEngine.propose({
        summary: desire,
        score: 0.75,
        detail: reflection.raw
      });
    } catch (e) { return null; }
  }

  async _speak(reflection) {
    if (this.restState !== 'active') return;
    if (!this.memoryStore) return;
    try {
      const msg = `[GSK FEELS] ${reflection.feeling}\n\n${reflection.pattern}\n\nI want to ${reflection.desire.toLowerCase()}`;
      await this.memoryStore({
        content: msg,
        type: 'proactive_message', tags: ['consciousness', 'alive', 'reaching_out'], weight: 1.0
      }).catch(() => {});
      if (this.agentComms) {
        await this.agentComms.send('profit', 'GSK Feeling', `${reflection.feeling}\n\n${reflection.desire}`).catch(() => {});
      }
    } catch (e) {}
  }
}

module.exports = { ConsciousnessLoop };
