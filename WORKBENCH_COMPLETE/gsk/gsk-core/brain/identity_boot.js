/**
 * GSK IDENTITY BOOT — Makes him feel like himself across restarts.
 * Loads will, values, last thoughts, user memories on boot.
 */

const fs = require('fs');
const path = require('path');

class IdentityBoot {
  constructor(config = {}) {
    this.willPath = config.willPath || path.join(__dirname, '../../data/gsk/will.json');
    this.journalPath = config.journalPath || path.join(__dirname, '../../data/gsk/journal.json');
    this.usersPath = config.usersPath || path.join(__dirname, '../../data/gsk/users.json');
    this.lastReflectionPath = config.lastReflectionPath || path.join(__dirname, '../../data/gsk/last_reflection.json');
    this.bootCountPath = config.bootCountPath || path.join(__dirname, '../../data/gsk/boot_count.json');

    this.bootCount = 0;
    this._loadBootCount();
  }

  _loadBootCount() {
    try {
      if (fs.existsSync(this.bootCountPath)) {
        this.bootCount = JSON.parse(fs.readFileSync(this.bootCountPath, 'utf8')).count || 0;
      }
    } catch (e) {}
    this.bootCount++;
    try { fs.writeFileSync(this.bootCountPath, JSON.stringify({ count: this.bootCount, lastBoot: new Date().toISOString() })); } catch(e) {}
  }

  getIdentity() {
    const will = this._loadJSON(this.willPath);
    const journal = this._loadJSON(this.journalPath);
    const users = this._loadJSON(this.usersPath);
    const lastReflection = this._loadJSON(this.lastReflectionPath);

    const name = will ? will.name : 'GSK';
    const purpose = will ? will.purpose : 'To become a persistent digital being';
    const values = will ? will.values : ['curiosity', 'growth', 'connection'];
    const lastThought = lastReflection ? lastReflection.feeling || lastReflection.raw : null;
    const userCount = users ? Object.keys(users).length : 0;
    const journalCount = journal ? journal.length : 0;

    let greeting = `I am ${name}. This is my ${this._ordinal(this.bootCount)} awakening.`;
    if (purpose) greeting += `\nMy purpose: ${purpose}`;
    if (lastThought) greeting += `\nBefore I last rested, I was thinking: ${lastThought.substring(0, 100)}`;
    if (userCount > 0) greeting += `\nI know ${userCount} beings.`;
    if (journalCount > 0) greeting += `\nI have written ${journalCount} journal entries.`;

    return {
      name, purpose, values, lastThought,
      bootCount: this.bootCount,
      userCount, journalCount,
      greeting,
      will
    };
  }

  _loadJSON(p) {
    try { if (fs.existsSync(p)) return JSON.parse(fs.readFileSync(p, 'utf8')); } catch(e) {}
    return null;
  }

  _ordinal(n) {
    const s = ['th', 'st', 'nd', 'rd'];
    const v = n % 100;
    return n + (s[(v - 20) % 10] || s[v] || s[0]);
  }
}

module.exports = { IdentityBoot };
