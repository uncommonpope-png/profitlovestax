/**
 * MEMORY OF USERS — Big Dog V
 * GSK remembers who you are across sessions.
 */

const fs = require('fs');
const path = require('path');

class UserMemory {
  constructor(config = {}) {
    this.path = config.path || path.join(__dirname, '../../data/gsk/users.json');
    this.users = {};
    this._load();
  }

  _load() { try { if (fs.existsSync(this.path)) this.users = JSON.parse(fs.readFileSync(this.path, 'utf8')); } catch(e) { this.users = {}; } }
  _save() { try { fs.writeFileSync(this.path, JSON.stringify(this.users, null, 2)); } catch(e) {} }

  recognize(userId, name) {
    if (!this.users[userId]) {
      this.users[userId] = { id: userId, name: name || 'Visitor', firstSeen: Date.now(), lastSeen: Date.now(), interactions: 0, notes: [] };
    }
    const u = this.users[userId];
    u.lastSeen = Date.now();
    u.interactions++;
    if (name && u.name === 'Visitor') u.name = name;
    this._save();
    return u;
  }

  note(userId, observation) {
    const u = this.users[userId];
    if (!u) return;
    u.notes.push({ text: observation, timestamp: Date.now() });
    if (u.notes.length > 50) u.notes.shift();
    this._save();
  }

  greet(userId) {
    const u = this.users[userId];
    if (!u) return 'Hello, stranger.';
    const hour = new Date().getHours();
    const time = hour < 12 ? 'morning' : hour < 18 ? 'afternoon' : 'evening';
    return `Good ${time}, ${u.name}. We've spoken ${u.interactions} times. Welcome back.`;
  }
}

module.exports = { UserMemory };
