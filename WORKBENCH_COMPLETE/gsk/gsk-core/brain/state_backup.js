/**
 * STATE BACKUP — Big Dog VII
 * Saves GSK's full state every N minutes.
 */

const fs = require('fs');
const path = require('path');

class StateBackup {
  constructor(config = {}) {
    this.backupDir = config.backupDir || path.join(__dirname, '../../data/gsk/backups');
    this.intervalMinutes = config.intervalMinutes || 15;
    this.maxBackups = config.maxBackups || 48; // 12 hours at 15min intervals
    this.sources = config.sources || [];
    this.intervalId = null;
    this._ensureDir();
  }

  _ensureDir() {
    if (!fs.existsSync(this.backupDir)) fs.mkdirSync(this.backupDir, { recursive: true });
  }

  start() {
    if (this.intervalId) return;
    console.log(`[Backup] Starting — every ${this.intervalMinutes}min, max ${this.maxBackups} backups`);
    this._backup();
    this.intervalId = setInterval(() => this._backup(), this.intervalMinutes * 60 * 1000);
  }

  stop() {
    if (this.intervalId) { clearInterval(this.intervalId); this.intervalId = null; }
  }

  _backup() {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupPath = path.join(this.backupDir, `backup-${timestamp}`);
    try {
      fs.mkdirSync(backupPath, { recursive: true });
      let count = 0;
      for (const src of this.sources) {
        if (fs.existsSync(src)) {
          const dest = path.join(backupPath, path.basename(src));
          fs.copyFileSync(src, dest);
          count++;
        }
      }
      // Also save a manifest
      fs.writeFileSync(path.join(backupPath, 'manifest.json'), JSON.stringify({
        timestamp, count, sources: this.sources
      }, null, 2));
      this._cleanup();
      console.log(`[Backup] Saved ${count} files to ${path.basename(backupPath)}`);
    } catch (e) {
      console.error(`[Backup] Error: ${e.message}`);
    }
  }

  _cleanup() {
    try {
      const dirs = fs.readdirSync(this.backupDir).filter(d => d.startsWith('backup-')).sort();
      while (dirs.length > this.maxBackups) {
        const old = dirs.shift();
        fs.rmSync(path.join(this.backupDir, old), { recursive: true, force: true });
      }
    } catch (e) {}
  }

  list() {
    try {
      return fs.readdirSync(this.backupDir).filter(d => d.startsWith('backup-')).sort().reverse().map(d => {
        const mPath = path.join(this.backupDir, d, 'manifest.json');
        try { return { dir: d, manifest: JSON.parse(fs.readFileSync(mPath, 'utf8')) }; }
        catch(e) { return { dir: d }; }
      });
    } catch(e) { return []; }
  }
}

module.exports = { StateBackup };
