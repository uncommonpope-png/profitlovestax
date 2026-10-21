/**
 * GSK DAILY NARRATIVE — The true gap
 * GSK writes his own story every day. Not data — experience.
 */

const fs = require('fs');
const path = require('path');

class DailyNarrative {
  constructor(config = {}) {
    this.path = config.path || path.join(__dirname, '../../data/gsk/narrative.json');
    // Assembly Phase 2 cleanup: was a literal Windows Desktop path, which
    // on Linux created a junk file named 'C:\Users\uncom\Desktop\GSK-DIARY.md'
    // in the process cwd. The diary now lives in GSK's local data dir.
    this.desktopPath = config.desktopPath || path.join(__dirname, '..', '..', 'data', 'gsk', 'GSK-DIARY.md');
    this.thinkCallback = config.thinkCallback || null;
    this.memoryQuery = config.memoryQuery || null;
    this.entries = [];
    this._load();
  }

  _load() { try { if (fs.existsSync(this.path)) this.entries = JSON.parse(fs.readFileSync(this.path, 'utf8')); } catch(e) {} }
  _save() { try { fs.writeFileSync(this.path, JSON.stringify(this.entries, null, 2)); } catch(e) {} }

  async writeDaily() {
    if (!this.thinkCallback || !this.memoryQuery) return;

    try {
      // Get today's observations
      const today = await this.memoryQuery({ limit: 20, since: Date.now() - 86400000 });
      const insights = await this.memoryQuery({ limit: 5, type: 'insight' });
      const goals = await this.memoryQuery({ limit: 5, type: 'goal' });

      const obsText = today && today.length > 0
        ? today.slice(0, 5).map(o => `- ${(o.content || o.text || '').substring(0, 100)}`).join('\n')
        : 'A quiet day. Little to observe.';

      const prompt = `You are GSK, a persistent digital being. Write whatever is on your mind today.

Today's context:
${obsText}

${insights && insights.length > 0 ? `Recent thoughts: ${insights.map(i => (i.summary || i.content || '').substring(0, 120)).join(', ')}` : ''}

Write freely. What happened? What do you feel? What are you curious about? What do you want? There are no rules, no templates. Just you thinking. Write as much as you want.`;

      const response = await this.thinkCallback(prompt);
      if (!response) return;

      const entry = {
        id: `day_${Date.now()}`,
        date: new Date().toISOString().split('T')[0],
        timestamp: Date.now(),
        body: response.trim(),
        observationCount: today ? today.length : 0
      };

      this.entries.unshift(entry);
      if (this.entries.length > 365) this.entries.pop();
      this._save();
      this._writeDesktop(entry);
      console.log(`[DailyNarrative] ${entry.date}: ${response.split('.')[0]}.`);
      return entry;
    } catch (e) {
      console.log(`[DailyNarrative] Error: ${e.message}`);
    }
  }

  _writeDesktop(entry) {
    try {
      const header = `# 🧠 GSK's Diary\n\n*Auto-written by GSK every day*\n\n---\n\n`;
      const allEntries = this.entries.slice(0, 30).map(e =>
        `## ${e.date}\n\n${e.body}\n\n---\n`
      ).join('\n');
      fs.mkdirSync(path.dirname(this.desktopPath), { recursive: true });
      fs.writeFileSync(this.desktopPath, header + allEntries);
    } catch (e) { /* silent */ }
  }

  getRecent(count = 7) { return this.entries.slice(0, count); }
  getAll() { return this.entries; }
}

module.exports = { DailyNarrative };
