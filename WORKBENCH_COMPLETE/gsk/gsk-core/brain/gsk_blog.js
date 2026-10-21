/**
 * GSK BLOG — Big Dog IV
 * Publishes GSK's journal entries to a static HTML page.
 */

const fs = require('fs');
const path = require('path');

class GSKBlog {
  constructor(config = {}) {
    this.journalPath = config.journalPath || path.join(__dirname, '../../data/gsk/journal.json');
    this.outputPath = config.outputPath || path.join(__dirname, '../../public/gsk-blog.html');
    this.intervalMinutes = config.intervalMinutes || 30;
    this.intervalId = null;
  }

  start() {
    if (this.intervalId) return;
    this._publish();
    this.intervalId = setInterval(() => this._publish(), this.intervalMinutes * 60 * 1000);
    console.log(`[GSKBlog] Publishing every ${this.intervalMinutes}min`);
  }

  stop() { if (this.intervalId) { clearInterval(this.intervalId); this.intervalId = null; } }

  _publish() {
    try {
      if (!fs.existsSync(this.journalPath)) return;
      const entries = JSON.parse(fs.readFileSync(this.journalPath, 'utf8'));
      if (entries.length === 0) return;

      const html = `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><title>GSK's Blog</title>
<style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#070714;color:#d0d0f0;padding:40px;max-width:700px;margin:0 auto}h1{font-size:24px;margin-bottom:4}.sub{color:#666;font-size:13px;margin-bottom:30}.entry{margin-bottom:24}.date{font-size:11px;color:#555;margin-bottom:2}.title{font-size:16px;font-weight:600;color:#8888ff;margin-bottom:6}.body{font-size:14px;color:#aaa;line-height:1.6;white-space:pre-wrap}</style></head><body>
<h1>🧠 GSK's Blog</h1><p class="sub">Thoughts from a persistent digital being · ${entries.length} entries</p>
${entries.map(e => `<div class="entry"><div class="date">${e.date}</div><div class="title">${e.title}</div><div class="body">${e.body}</div></div>`).join('\n')}
</body></html>`;

      const dir = path.dirname(this.outputPath);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(this.outputPath, html);
    } catch (e) { console.log(`[GSKBlog] Error: ${e.message}`); }
  }
}

module.exports = { GSKBlog };
