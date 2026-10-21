/**
 * GSK JOURNAL — Big Dog IV
 * Auto-generates journal entries from insights and observations.
 */

const fs = require('fs');
const path = require('path');

class JournalWriter {
  constructor(config = {}) {
    this.journalPath = config.journalPath || path.join(__dirname, '../../data/gsk/journal.json');
    this.maxEntries = config.maxEntries || 100;
    this.entries = [];
    this._load();
  }

  _load() {
    try {
      if (fs.existsSync(this.journalPath)) {
        this.entries = JSON.parse(fs.readFileSync(this.journalPath, 'utf8'));
      }
    } catch (e) { this.entries = []; }
  }

  _save() {
    try {
      const dir = path.dirname(this.journalPath);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(this.journalPath, JSON.stringify(this.entries, null, 2));
    } catch (e) { console.error('[Journal] Save error:', e.message); }
  }

  write(title, body, type = 'reflection') {
    const entry = {
      id: `entry_${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
      timestamp: Date.now(),
      title,
      body,
      type,
      author: 'GSK'
    };
    this.entries.unshift(entry);
    if (this.entries.length > this.maxEntries) this.entries.pop();
    this._save();

    try {
      this._writeToLogseq(entry);
    } catch (e) {
      console.log(`[JournalWriter] Logseq sync error: ${e.message}`);
    }

    return entry;
  }

  _writeToLogseq(entry) {
    try {
      // Assembly Phase 2 cleanup: local Seshat brain pages (was a literal
      // Windows Desktop path that produced backslash-named junk files).
      const logseqPath = path.join(__dirname, '..', '..', '..', 'workbench', '.seshat-brain', 'pages', 'GSK - Autonomy Journal.md');
      const dir = path.dirname(logseqPath);
      if (!fs.existsSync(dir)) return;

      const dateStr = new Date(entry.timestamp).toLocaleString();
      const markdown = `
### [${entry.type.toUpperCase()}] ${entry.title}
- **Timestamp**: ${dateStr}
- **Logseq Link**: [[${entry.date}]]
- **Details**:
${entry.body.split('\n').map(line => '  ' + line).join('\n')}

---
`;
      if (!fs.existsSync(logseqPath)) {
        const header = `# GSK — Autonomy & Reflection Journal\n\n> This is GSK's automated log of goals, insights, and structural changes.\n\n---\n`;
        fs.writeFileSync(logseqPath, header + markdown, 'utf8');
      } else {
        fs.appendFileSync(logseqPath, markdown, 'utf8');
      }
      console.log(`[JournalWriter] Logged to Logseq: ${logseqPath}`);
    } catch (e) {
      console.error('[JournalWriter] Logseq sync failed:', e.message);
    }
  }

  fromInsight(insight) {
    const title = insight.summary.length > 60 ? insight.summary.substring(0, 57) + '...' : insight.summary;
    return this.write(title, insight.detail || insight.summary, 'insight');
  }

  getRecent(count = 10) {
    return this.entries.slice(0, count);
  }

  getAll() { return this.entries; }
}

module.exports = { JournalWriter };
