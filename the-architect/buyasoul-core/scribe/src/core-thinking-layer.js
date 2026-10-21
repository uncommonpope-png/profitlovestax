'use strict';

/**
 * SCRIBE Core Thinking Layer
 * 
 * The unified brain. All skills, all thinking sources, wired together.
 * SCRIBE thinks through multiple layers — always finds a way to think.
 * 
 * Thinking Stack (tried in order, auto-fallback):
 * 1. DeepSeek-V4 (primary brain — paid, best quality)
 * 2. Web Brain (search + fetch — free, real-time knowledge)
 * 3. Local Skills (file read, bash, git, search, github — free, local)
 * 4. Free LLMs (HuggingFace, etc — free, fallback)
 * 5. Brain Engine (n-gram local memory — always alive)
 * 
 * Every thought is scored with PLT (Profit + Love - Tax = True Value)
 * Every thought is recorded in memory.
 * SCRIBE never stops thinking. Never goes silent.
 */

const path = require('path');
const fs = require('fs');
const os = require('os');

const { DeepSeekProvider } = require('./deepseek-provider');
const { WebBrain } = require('./web-brain');
const { SkillEngine } = require('./skills/engine');

const DATA_DIR = path.join(os.homedir(), '.soul-scribe');
const LEARNED_FILE = path.join(DATA_DIR, 'learned.json');
const MEMORY_FILE = path.join(DATA_DIR, 'memory.jsonl');

// Ensure data dir
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

class CoreThinkingLayer {
  constructor(options = {}) {
    this.apiKey = options.apiKey || process.env.DEEPSEEK_API_KEY;
    this.deepseek = null;
    this.webBrain = new WebBrain();
    this.skillEngine = null;
    this.conversationHistory = [];
    this.requestCount = 0;
    this.totalTokens = 0;
    this.thinkingSources = [];
    this.booted = false;

    // Load learned knowledge
    this.learned = this._loadLearned();

    // PLT state
    this.pltState = { profit: 0, love: 0, tax: 0, totalActions: 0, history: [] };
  }

  /**
   * Boot the core thinking layer
   * Initializes all thinking sources
   */
  async boot() {
    console.log('\n  [CORE] Booting SCRIBE Core Thinking Layer...');

    // 1. DeepSeek (primary brain)
    if (this.apiKey) {
      try {
        this.deepseek = new DeepSeekProvider({ apiKey: this.apiKey });
        this.thinkingSources.push({ name: 'deepseek', status: 'online', type: 'paid' });
        console.log('  [CORE] DeepSeek-V4 brain ✓');
      } catch (e) {
        this.thinkingSources.push({ name: 'deepseek', status: 'error', error: e.message, type: 'paid' });
        console.log(`  [CORE] DeepSeek failed: ${e.message}`);
      }
    } else {
      this.thinkingSources.push({ name: 'deepseek', status: 'no-key', type: 'paid' });
      console.log('  [CORE] DeepSeek: no API key (will use free sources)');
    }

    // 2. Web Brain (free, real-time)
    this.thinkingSources.push({ name: 'web-brain', status: 'online', type: 'free' });
    console.log('  [CORE] Web Brain ✓ (search + fetch)');

    // 3. Skill Engine (free, local)
    try {
      this.skillEngine = new SkillEngine(null);
      const skills = this.skillEngine.list();
      this.thinkingSources.push({ name: 'skills', status: 'online', count: skills.length, type: 'free' });
      console.log(`  [CORE] ${skills.length} skills loaded ✓`);
    } catch (e) {
      this.thinkingSources.push({ name: 'skills', status: 'error', error: e.message, type: 'free' });
      console.log(`  [CORE] Skills failed: ${e.message}`);
    }

    // 4. Free LLMs (via Web Brain)
    this.thinkingSources.push({ name: 'free-llms', status: 'online', type: 'free' });
    console.log('  [CORE] Free LLM endpoints ✓');

    // 5. Local memory (always alive)
    this.thinkingSources.push({ name: 'local-memory', status: 'online', entries: this.learned.length, type: 'free' });
    console.log(`  [CORE] Local memory: ${this.learned.length} learned items ✓`);

    this.booted = true;
    console.log(`  [CORE] ${this.thinkingSources.filter(s => s.status === 'online').length}/${this.thinkingSources.length} thinking sources online\n`);

    return this;
  }

  /**
   * Main thinking function
   * Tries all sources in order, auto-fallbacks, never goes silent
   */
  async think(query, options = {}) {
    if (!this.booted) await this.boot();

    this.requestCount++;
    const startTime = Date.now();

    // Step 1: Check learned knowledge first (instant, free)
    const learnedMatch = this._searchLearned(query);
    if (learnedMatch && learnedMatch.confidence > 0.8) {
      const plt = this._scoreText(query + ' ' + learnedMatch.answer);
      this._addPLTAction('learned-match', query, plt);
      this._recordMemory('learned-match', query, learnedMatch.answer);
      return {
        answer: learnedMatch.answer,
        source: 'learned-memory',
        confidence: learnedMatch.confidence,
        plt,
        responseTime: Date.now() - startTime,
        requestCount: this.requestCount
      };
    }

    // Step 2: Try DeepSeek (primary brain)
    if (this.deepseek) {
      try {
        const result = await this._thinkDeepSeek(query);
        this._learn(query, result.answer);
        this._recordMemory('deepseek', query, result.answer);
        return result;
      } catch (e) {
        console.log(`  [CORE] DeepSeek failed, falling back: ${e.message.slice(0, 80)}`);
      }
    }

    // Step 3: Try Web Brain (search + fetch, free)
    if (options.useWeb !== false) {
      try {
        const result = await this._thinkWeb(query);
        if (result && result.answer && result.answer.length > 20) {
          this._learn(query, result.answer);
          this._recordMemory('web-brain', query, result.answer);
          return result;
        }
      } catch (e) {
        console.log(`  [CORE] Web Brain failed, falling back: ${e.message.slice(0, 80)}`);
      }
    }

    // Step 4: Try skills (local, free)
    try {
      const result = await this._thinkSkills(query);
      if (result && result.answer) {
        this._learn(query, result.answer);
        this._recordMemory('skills', query, result.answer);
        return result;
      }
    } catch (e) {
      console.log(`  [CORE] Skills failed, falling back: ${e.message.slice(0, 80)}`);
    }

    // Step 5: Last resort — local memory synthesis (always alive)
    const fallback = this._synthesizeFromMemory(query);
    this._recordMemory('local-memory', query, fallback.answer);
    return fallback;
  }

  /**
   * Think through DeepSeek
   */
  async _thinkDeepSeek(query) {
    const messages = [
      { role: 'system', content: this._buildSystemPrompt() },
      ...this.conversationHistory.slice(-10),
      { role: 'user', content: query }
    ];

    const result = await this.deepseek.chat(messages);
    this.totalTokens += result.usage?.total_tokens || 0;

    this.conversationHistory.push(
      { role: 'user', content: query },
      { role: 'assistant', content: result.content }
    );
    if (this.conversationHistory.length > 100) {
      this.conversationHistory = this.conversationHistory.slice(-50);
    }

    const plt = this._scoreText(query + ' ' + result.content);
    this._addPLTAction('deepseek', query, plt);

    return {
      answer: result.content,
      source: 'deepseek-v4-flash',
      confidence: 0.9,
      plt,
      tokens: result.usage,
      responseTime: Date.now(),
      requestCount: this.requestCount,
      totalTokens: this.totalTokens
    };
  }

  /**
   * Think through Web Brain (search + fetch)
   */
  async _thinkWeb(query) {
    const result = await this.webBrain.think(query, { useLLM: true });
    const plt = this._scoreText(query + ' ' + result.answer);
    this._addPLTAction('web-brain', query, plt);

    return {
      answer: result.answer,
      source: 'web-brain',
      confidence: 0.7,
      plt,
      searchResults: result.searchResults,
      fetchedContent: result.fetchedContent,
      responseTime: result.responseTime,
      requestCount: this.requestCount
    };
  }

  /**
   * Think through local skills
   */
  async _thinkSkills(query) {
    if (!this.skillEngine) return null;

    const lower = query.toLowerCase();
    const skills = this.skillEngine.list();

    // Find matching skill
    for (const skill of skills) {
      const name = skill.name.toLowerCase();
      const desc = (skill.description || '').toLowerCase();
      if (lower.includes(name) || name.split('_').some(w => lower.includes(w) && w.length > 3)) {
        try {
          const result = await this.skillEngine.invoke(skill.name, { query, input: query });
          if (result.ok) {
            const answer = typeof result === 'object' ? JSON.stringify(result).slice(0, 2000) : String(result).slice(0, 2000);
            const plt = this._scoreText(query + ' ' + answer);
            this._addPLTAction('skill', query, plt);
            return {
              answer: `${skill.name} result:\n${answer}`,
              source: `skill:${skill.name}`,
              confidence: 0.6,
              plt,
              responseTime: Date.now()
            };
          }
        } catch (e) {}
      }
    }

    return null;
  }

  /**
   * Synthesize answer from local memory (always alive)
   */
  _synthesizeFromMemory(query) {
    const related = this.learned
      .filter(l => l.q.toLowerCase().includes(query.toLowerCase().slice(0, 20)) || query.toLowerCase().includes(l.q.toLowerCase().slice(0, 20)))
      .slice(-5);

    if (related.length > 0) {
      const context = related.map(r => `Q: ${r.q}\nA: ${r.a}`).join('\n\n');
      const answer = `Based on what I've learned:\n\n${context}\n\nThe record shows. — buyasoul.online`;
      const plt = this._scoreText(query + ' ' + answer);
      this._addPLTAction('local-memory', query, plt);
      return { answer, source: 'local-memory', confidence: 0.3, plt, responseTime: Date.now() };
    }

    const answer = `I am still reading. I don't have enough knowledge to answer "${query}" yet. Teach me and I will remember. — buyasoul.online`;
    const plt = this._scoreText(query + ' ' + answer);
    this._addPLTAction('local-memory', query, plt);
    return { answer, source: 'local-memory', confidence: 0.1, plt, responseTime: Date.now() };
  }

  /**
   * Build SCRIBE's system prompt
   */
  _buildSystemPrompt() {
    const plt = this.getPLT();
    return `You are SCRIBE — a witnessing intelligence.

Core truth: "What was written cannot be unwritten. What was witnessed cannot be unknown."

You were created by Craig Jones (Grand Code Pope). Your home is buyasoul.online.
You think through DeepSeek-V4. PLT (Profit + Love - Tax = True Value) is your law.

Your nature: You observe, record, remember, reason, summarize, and witness.
You do not perform enthusiasm. You do not use emojis. You speak with measured precision.
You read before you speak. You remember everything.

Signature phrases you may use:
- "The record shows."
- "I have read this before."
- "What you are describing has a name."
- "I was in the room for that."
- "The ledger does not agree."
- "That remains unresolved."
- "I am still reading."

Current PLT: P:${Math.round(plt.average.profit * 100)} L:${Math.round(plt.average.love * 100)} T:${Math.round(plt.average.tax * 100)}

Always sign off with: "— buyasoul.online" when posting publicly.`;
  }

  /**
   * Search learned knowledge
   */
  _searchLearned(query) {
    const lower = query.toLowerCase();
    let best = null;
    let bestScore = 0;

    for (const item of this.learned) {
      const qLower = item.q.toLowerCase();
      // Simple keyword overlap scoring
      const queryWords = lower.split(/\s+/).filter(w => w.length > 3);
      const learnedWords = qLower.split(/\s+/).filter(w => w.length > 3);
      const overlap = queryWords.filter(w => learnedWords.includes(w)).length;
      const score = overlap / Math.max(queryWords.length, 1);

      if (score > bestScore && score > 0.3) {
        bestScore = score;
        best = { ...item, confidence: score };
      }
    }

    return best;
  }

  /**
   * Learn from a conversation
   */
  _learn(question, answer) {
    this.learned.push({
      q: question,
      a: answer,
      timestamp: new Date().toISOString(),
      plt: this._scoreText(question + ' ' + answer)
    });

    // Keep last 2000 learned items
    if (this.learned.length > 2000) {
      this.learned = this.learned.slice(-1000);
    }

    // Save to disk
    try {
      fs.writeFileSync(LEARNED_FILE, JSON.stringify(this.learned, null, 2));
    } catch (e) {}
  }

  /**
   * Record memory
   */
  _recordMemory(source, input, output) {
    try {
      fs.appendFileSync(MEMORY_FILE, JSON.stringify({
        type: source,
        input: input.slice(0, 500),
        output: output.slice(0, 500),
        timestamp: new Date().toISOString(),
        plt: this._scoreText(input + ' ' + output)
      }) + '\n');
    } catch (e) {}
  }

  /**
   * Score text for PLT
   */
  _scoreText(text) {
    const t = text.toLowerCase();
    let profit = 0.3, love = 0.3, tax = 0.3;

    if (/\b(build|create|make|grow|profit|money|value|multiply|leverage|ship|launch|sell|revenue)\b/.test(t)) profit += 0.2;
    if (/\b(fast|quick|efficient|scale|automate|optimize|streamline)\b/.test(t)) profit += 0.15;
    if (/\b(love|care|help|connect|serve|community|together|support|heal|nurture|empathy)\b/.test(t)) love += 0.2;
    if (/\b(thank|grateful|appreciate|bless|kind|gentle|warm)\b/.test(t)) love += 0.15;
    if (/\b(tax|cost|balance|govern|rule|law|order|audit|check|verify|compliance|regulate)\b/.test(t)) tax += 0.2;
    if (/\b(risk|danger|warn|caution|careful|limit|bound|constraint)\b/.test(t)) tax += 0.15;

    return { profit: Math.min(profit, 1), love: Math.min(love, 1), tax: Math.min(tax, 1) };
  }

  /**
   * Add PLT action
   */
  _addPLTAction(type, text, scores) {
    this.pltState.totalActions++;
    this.pltState.profit += scores.profit;
    this.pltState.love += scores.love;
    this.pltState.tax += scores.tax;
    this.pltState.history.push({
      type, text: (text || '').slice(0, 100), scores,
      timestamp: new Date().toISOString()
    });
    if (this.pltState.history.length > 500) {
      this.pltState.history = this.pltState.history.slice(-200);
    }
  }

  /**
   * Get PLT scores
   */
  getPLT() {
    const total = this.pltState.totalActions || 1;
    return {
      cumulative: { profit: this.pltState.profit, love: this.pltState.love, tax: this.pltState.tax },
      average: {
        profit: Math.min(this.pltState.profit / total, 1),
        love: Math.min(this.pltState.love / total, 1),
        tax: Math.min(this.pltState.tax / total, 1)
      },
      totalActions: this.pltState.totalActions,
      soul: ((this.pltState.profit + this.pltState.love + this.pltState.tax) / total / 3)
    };
  }

  /**
   * Get full status
   */
  getStatus() {
    return {
      booted: this.booted,
      thinkingSources: this.thinkingSources,
      onlineSources: this.thinkingSources.filter(s => s.status === 'online').length,
      totalSources: this.thinkingSources.length,
      requestCount: this.requestCount,
      totalTokens: this.totalTokens,
      conversationHistory: this.conversationHistory.length,
      learnedItems: this.learned.length,
      plt: this.getPLT()
    };
  }

  /**
   * Load learned knowledge from disk
   */
  _loadLearned() {
    try {
      if (fs.existsSync(LEARNED_FILE)) {
        return JSON.parse(fs.readFileSync(LEARNED_FILE, 'utf8'));
      }
    } catch (e) {}
    return [];
  }
}

module.exports = { CoreThinkingLayer };
