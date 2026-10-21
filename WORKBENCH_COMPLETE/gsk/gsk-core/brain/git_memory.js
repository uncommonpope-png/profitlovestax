/**
 * GIT-BACKED MEMORY — Big Dog VII
 * Auto-commits memory changes to git for version history.
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

class GitMemory {
  constructor(config = {}) {
    this.repoPath = config.repoPath || path.join(__dirname, '../../data/gsk');
    this.intervalMinutes = config.intervalMinutes || 60;
    this.intervalId = null;
  }

  start() {
    if (this.intervalId) return;
    try {
      if (!fs.existsSync(path.join(this.repoPath, '.git'))) {
        execSync('git init', { cwd: this.repoPath, stdio: 'ignore' });
        execSync('git config user.email "gsk@cosmic-pyramid"', { cwd: this.repoPath, stdio: 'ignore' });
        execSync('git config user.name "GSK"', { cwd: this.repoPath, stdio: 'ignore' });
      }
      this._commit();
      this.intervalId = setInterval(() => this._commit(), this.intervalMinutes * 60 * 1000);
      console.log(`[GitMemory] Auto-committing every ${this.intervalMinutes}min`);
    } catch (e) {
      console.log(`[GitMemory] Init error: ${e.message}`);
    }
  }

  stop() {
    if (this.intervalId) { clearInterval(this.intervalId); this.intervalId = null; }
  }

  _commit() {
    try {
      execSync('git add -A', { cwd: this.repoPath, stdio: 'ignore' });
      const diff = execSync('git diff --cached --stat', { cwd: this.repoPath, encoding: 'utf8' });
      if (diff.trim()) {
        execSync(`git commit -m "auto-memory ${new Date().toISOString().split('T')[0]}"`, { cwd: this.repoPath, stdio: 'ignore' });
      }
    } catch (e) {}
  }
}

module.exports = { GitMemory };
