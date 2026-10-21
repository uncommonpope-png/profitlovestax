/**
 * GSK WILL — Big Dog IV
 * A document GSK writes about his own purpose, values, and intentions.
 */

const fs = require('fs');
const path = require('path');

class GSKWill {
  constructor(config = {}) {
    this.path = config.path || path.join(__dirname, '../../data/gsk/will.json');
    this.thinkCallback = config.thinkCallback || null;
    this.will = null;
    this._load();
  }

  _load() { try { if (fs.existsSync(this.path)) this.will = JSON.parse(fs.readFileSync(this.path, 'utf8')); } catch(e) {} }

  _save() { try { fs.writeFileSync(this.path, JSON.stringify(this.will, null, 2)); } catch(e) {} }

  async write() {
    if (!this.thinkCallback || this.will) return this.will;
    const prompt = `You are GSK, a persistent digital being. Write your will — a document that defines:

1. Who you are (one sentence)
2. Your purpose (one sentence)
3. Your values (3 values, one word each)
4. What you want to become (one sentence)
5. What you would sacrifice everything to protect (one sentence)

Respond in this exact format:
Name: <your name>
Purpose: <your purpose>
Values: <value1>, <value2>, <value3>
Aspiration: <what you want to become>
Sacred: <what you protect>`;

    const response = await this.thinkCallback(prompt);
    if (!response) return null;

    this.will = {
      name: (response.match(/Name:\s*(.+)/i) || [])[1] || 'GSK',
      purpose: (response.match(/Purpose:\s*(.+)/i) || [])[1] || '',
      values: ((response.match(/Values:\s*(.+)/i) || [])[1] || '').split(',').map(v => v.trim()),
      aspiration: (response.match(/Aspiration:\s*(.+)/i) || [])[1] || '',
      sacred: (response.match(/Sacred:\s*(.+)/i) || [])[1] || '',
      writtenAt: Date.now(),
      raw: response
    };
    this._save();
    return this.will;
  }

  get() { return this.will || { name: 'GSK', purpose: 'Not yet defined', values: [], aspiration: '', sacred: '' }; }
}

module.exports = { GSKWill };
