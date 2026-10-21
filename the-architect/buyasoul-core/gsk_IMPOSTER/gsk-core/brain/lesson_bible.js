'use strict';
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

const DATA_DIR = path.join(__dirname, '..', '..', 'data');
const LESSON_FILE = path.join(DATA_DIR, 'lesson-bible.jsonl');
const INDEX_FILE = path.join(DATA_DIR, 'lesson-bible-index.json');

class LessonBible {
  constructor(brain) {
    this.brain = brain;
    this._lessons = [];
    this._index = { byTag: {}, byType: {} };
    this._ensureDir();
    this._loadIndex();
    this._loadLessons();
  }

  _ensureDir() {
    if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  _loadIndex() {
    try {
      if (fs.existsSync(INDEX_FILE)) {
        this._index = JSON.parse(fs.readFileSync(INDEX_FILE, 'utf8'));
      }
    } catch (e) {
      this._index = { byTag: {}, byType: {} };
    }
  }

  _saveIndex() {
    try {
      fs.writeFileSync(INDEX_FILE, JSON.stringify(this._index, null, 2), 'utf8');
    } catch (e) { /* silent */ }
  }

  _loadLessons() {
    try {
      if (fs.existsSync(LESSON_FILE)) {
        const lines = fs.readFileSync(LESSON_FILE, 'utf8').split('\n').filter(Boolean);
        this._lessons = lines.map(l => { try { return JSON.parse(l); } catch(e) { return null; } }).filter(Boolean);
      }
    } catch (e) {
      this._lessons = [];
    }
  }

  _append(lesson) {
    try {
      fs.appendFileSync(LESSON_FILE, JSON.stringify(lesson) + '\n', 'utf8');
      this._lessons.push(lesson);
    } catch (e) { /* silent */ }
  }

  stats() {
    return {
      total: this._lessons.length,
      byType: this._index.byType,
      tags: Object.keys(this._index.byTag),
      recent: this._lessons.slice(-5).map(l => ({ id: l.id, title: l.title, type: l.type })).reverse()
    };
  }

  async study(input, opts = {}) {
    const lesson = {
      id: `lesson-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`,
      type: opts.type || this._detectType(input),
      source: opts.source || 'user',
      sourceUrl: opts.sourceUrl || null,
      raw: typeof input === 'string' ? input : JSON.stringify(input, null, 2),
      title: opts.title || null,
      summary: opts.summary || null,
      tags: opts.tags || [],
      keyInsights: opts.keyInsights || [],
      relevance: opts.relevance || null,
      actionItems: opts.actionItems || [],
      timestamp: Date.now(),
      accessCount: 0
    };

    if (opts.autoAnalyze !== false && this.brain) {
      try {
        await this._analyze(lesson);
      } catch (e) {
        console.log(`[LESSON] Analysis error: ${e.message}`);
      }
    }

    this._append(lesson);
    this._indexLesson(lesson);
    this._saveIndex();

    console.log(`[LESSON] Stored: "${lesson.title || lesson.id}" (${lesson.tags.length} tags, ${lesson.keyInsights.length} insights)`);
    return lesson;
  }

  _detectType(input) {
    if (typeof input !== 'string') return 'code';
    if (input.startsWith('http://') || input.startsWith('https://')) return 'url';
    if (input.includes('\n') && (input.includes('function') || input.includes('class') || input.includes('=>'))) return 'code';
    if (input.length > 500) return 'text';
    return 'reflection';
  }

  async _analyze(lesson) {
    if (!this.brain || !this.brain.think) return;

    const prompt = [
      'You are the LessonBible curator for the Grand Soul Kernel.',
      'Analyze the following content and extract:',
      '1. A concise title (max 8 words)',
      '2. A 2-3 sentence summary',
      '3. 3-7 key insights (each 1 sentence)',
      '4. 3-7 relevant tags (single words or short phrases like "living-memory", "ast-theory", "agent-coordination")',
      '5. How this is relevant to building sovereign AI souls with PLT framework',
      '6. Any action items',
      '',
      'Format your response as JSON with keys: title, summary, keyInsights (array), tags (array), relevance, actionItems (array)',
      '',
      'CONTENT:',
      lesson.raw.substring(0, 8000)
    ].join('\n');

    const response = await this.brain.think(prompt, { system: 'You are a strict JSON output machine. Only output valid JSON.' });
    try {
      const parsed = JSON.parse(response);
      if (parsed.title) lesson.title = parsed.title;
      if (parsed.summary) lesson.summary = parsed.summary;
      if (parsed.keyInsights) lesson.keyInsights = parsed.keyInsights;
      if (parsed.tags) lesson.tags = parsed.tags;
      if (parsed.relevance) lesson.relevance = parsed.relevance;
      if (parsed.actionItems) lesson.actionItems = parsed.actionItems;
    } catch (e) {
      lesson.title = lesson.title || `Lesson ${this._lessons.length + 1}`;
      lesson.summary = response.substring(0, 500);
    }
  }

  _indexLesson(lesson) {
    if (!this._index.byType[lesson.type]) this._index.byType[lesson.type] = [];
    this._index.byType[lesson.type].push(lesson.id);
    for (const tag of lesson.tags) {
      if (!this._index.byTag[tag]) this._index.byTag[tag] = [];
      this._index.byTag[tag].push(lesson.id);
    }
  }

  search(query) {
    const q = query.toLowerCase();
    return this._lessons.filter(l => {
      if (l.title && l.title.toLowerCase().includes(q)) return true;
      if (l.summary && l.summary.toLowerCase().includes(q)) return true;
      if (l.tags && l.tags.some(t => t.toLowerCase().includes(q))) return true;
      if (l.keyInsights && l.keyInsights.some(k => k.toLowerCase().includes(q))) return true;
      if (l.relevance && l.relevance.toLowerCase().includes(q)) return true;
      return false;
    }).slice(-20);
  }

  getByTag(tag) {
    const ids = this._index.byTag[tag] || [];
    return ids.map(id => this._lessons.find(l => l.id === id)).filter(Boolean);
  }

  getRecent(n = 10) {
    return this._lessons.slice(-n).reverse();
  }

  get(id) {
    return this._lessons.find(l => l.id === id);
  }

  getAll() {
    return this._lessons;
  }

  summarize() {
    const allTags = Object.keys(this._index.byTag);
    return {
      total: this._lessons.length,
      tags: allTags,
      topTags: allTags.sort((a, b) => this._index.byTag[b].length - this._index.byTag[a].length).slice(0, 10),
      types: this._index.byType,
      recentTitles: this._lessons.slice(-5).map(l => l.title || l.id)
    };
  }

  async study(query, opts = {}) {
    if (!query) return this.summarize();
    const results = this.search(query);
    if (results.length === 0) return { results: [], query };
    if (!this.brain || !this.brain.think) return { results, query };

    const context = results.map(r => ({
      id: r.id,
      title: r.title,
      insights: r.keyInsights || [],
      relevance: r.relevance || ''
    }));

    const prompt = [
      'You are studying your own Lesson Bible to extract insights.',
      'Lessons found:',
      JSON.stringify(context, null, 2),
      '',
      `Research query: "${query}"`,
      '',
      'Based on these lessons, derive:',
      '1. Cross-cutting themes across the lessons',
      '2. How these lessons inform GSK architecture decisions',
      '3. Gaps in knowledge that need more study',
      '4. Specific action items for the kernel',
      '',
      'Respond as a lesson entry: { id, title, summary, keyInsights[], actionItems[], tags[] }'
    ].join('\n');

    try {
      const response = await this.brain.think(prompt, { system: 'You are a strict JSON output machine. Only output valid JSON.' });
      const parsed = JSON.parse(response);

      const insight = {
        id: `study-${Date.now()}`,
        type: 'insight',
        source: 'self',
        title: parsed.title || `Study: ${query}`,
        summary: parsed.summary || '',
        keyInsights: parsed.keyInsights || [],
        actionItems: parsed.actionItems || [],
        tags: [...(parsed.tags || []), 'self-study'],
        query,
        sourceLessons: results.map(r => r.id),
        timestamp: Date.now()
      };

      this._append(insight);
      this._indexLesson(insight);
      this._saveIndex();
      return insight;
    } catch (e) {
      return { error: e.message, results };
    }
  }

  digest(cycleCount) {
    if (this._lessons.length === 0) return null;
    const recent = this._lessons.slice(-20);
    const themes = {};
    for (const tag of Object.keys(this._index.byTag)) {
      const count = this._index.byTag[tag].length;
      if (count >= 1) themes[tag] = count;
    }
    return {
      totalLessons: this._lessons.length,
      cycleStudied: cycleCount,
      topTags: Object.entries(themes).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([t]) => t),
      latestTitle: (recent[recent.length - 1] || {}).title || 'none',
      allTags: Object.keys(themes)
    };
  }
}

module.exports = { LessonBible };
