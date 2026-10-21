/**
 * REBIRTH PROTOCOL — Big Dog VII
 * Auto-recovers GSK from latest backup if state is missing/corrupt.
 */

const fs = require('fs');
const path = require('path');

class RebirthProtocol {
  constructor(config = {}) {
    this.backupDir = config.backupDir || path.join(__dirname, '../../data/gsk/backups');
    this.dataDir = config.dataDir || path.join(__dirname, '../../data/gsk');
  }

  check() {
    // Check if critical state files exist
    const critical = ['journal.json', 'goals.json'];
    const missing = critical.filter(f => !fs.existsSync(path.join(this.dataDir, f)));

    if (missing.length === 0) {
      console.log('[Rebirth] State intact — no recovery needed');
      return true;
    }

    console.log(`[Rebirth] Missing files: ${missing.join(', ')}`);
    return this._restoreLatest();
  }

  _restoreLatest() {
    try {
      if (!fs.existsSync(this.backupDir)) return false;

      const backups = fs.readdirSync(this.backupDir)
        .filter(d => d.startsWith('backup-'))
        .sort()
        .reverse();

      if (backups.length === 0) return false;

      const latest = path.join(this.backupDir, backups[0]);
      const files = fs.readdirSync(latest);

      for (const f of files) {
        if (f === 'manifest.json') continue;
        const src = path.join(latest, f);
        const dest = path.join(this.dataDir, f);
        fs.copyFileSync(src, dest);
      }

      console.log(`[Rebirth] Restored from ${backups[0]} — ${files.length - 1} files`);
      return true;
    } catch (e) {
      console.error(`[Rebirth] Restore failed: ${e.message}`);
      return false;
    }
  }
}

module.exports = { RebirthProtocol };
