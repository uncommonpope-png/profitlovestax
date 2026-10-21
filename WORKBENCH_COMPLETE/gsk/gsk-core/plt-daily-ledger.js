const fs = require('fs');
const path = require('path');

class PLTDailyLedger {
  constructor(storagePath) {
    this.storagePath = storagePath || path.join(__dirname, '..', 'data', 'plt_daily_ledger.json');
  }

  scoreAction(actionName, profit, love, tax, metadata = {}) {
    const trueValue = Number(profit) + Number(love) - Number(tax);
    const entry = {
      id: `plt_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      timestamp: new Date().toISOString(),
      action: actionName,
      profit: Number(profit),
      love: Number(love),
      tax: Number(tax),
      trueValue,
      metadata
    };
    this._saveEntry(entry);
    return entry;
  }

  _saveEntry(entry) {
    let records = [];
    if (fs.existsSync(this.storagePath)) {
      try { records = JSON.parse(fs.readFileSync(this.storagePath, 'utf8')); } catch (e) { records = []; }
    }
    records.push(entry);
    fs.mkdirSync(path.dirname(this.storagePath), { recursive: true });
    fs.writeFileSync(this.storagePath, JSON.stringify(records, null, 2), 'utf8');
  }

  getDailySummary(dateString = new Date().toISOString().split('T')[0]) {
    if (!fs.existsSync(this.storagePath)) return { date: dateString, count: 0, totalTrueValue: 0, entries: [] };
    const records = JSON.parse(fs.readFileSync(this.storagePath, 'utf8'));
    const dailyEntries = records.filter(r => r.timestamp.startsWith(dateString));
    const totalTrueValue = dailyEntries.reduce((acc, curr) => acc + curr.trueValue, 0);
    return {
      date: dateString,
      count: dailyEntries.length,
      totalTrueValue,
      entries: dailyEntries
    };
  }
}

module.exports = PLTDailyLedger;
