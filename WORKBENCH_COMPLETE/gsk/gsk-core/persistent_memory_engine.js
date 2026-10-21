const fs = require('fs');
const path = require('path');

class PersistentMemoryEngine {
  constructor(storagePath) {
    this.storagePath = storagePath || path.join(__dirname, '../data/agent_memory_state.json');
    this.stateHistory = this.loadHistory();
  }
  loadHistory() {
    try {
      if (fs.existsSync(this.storagePath)) {
        return JSON.parse(fs.readFileSync(this.storagePath, 'utf8'));
      }
    } catch (e) {}
    return [];
  }
  recordState(stateSnapshot) {
    const entry = {
      timestamp: Date.now(),
      state: stateSnapshot,
      pltScore: (stateSnapshot.profit || 0) + (stateSnapshot.love || 0) - (stateSnapshot.tax || 0)
    };
    this.stateHistory.push(entry);
    const dir = path.dirname(this.storagePath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(this.storagePath, JSON.stringify(this.stateHistory, null, 2));
    return entry;
  }
  getTrajectory() {
    return this.stateHistory;
  }
}
module.exports = PersistentMemoryEngine;
