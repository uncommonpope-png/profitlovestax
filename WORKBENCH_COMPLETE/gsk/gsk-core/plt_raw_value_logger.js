const fs = require('fs');
const path = require('path');

class PLTRawValueLogger {
  constructor(logFilePath) {
    this.logFilePath = logFilePath || path.join(__dirname, '../data/plt_raw_deltas.jsonl');
    this.lastState = null;
  }

  logDelta(currentState) {
    const timestamp = new Date().toISOString();
    const delta = {
      timestamp,
      profitDelta: this.lastState ? (currentState.profit - this.lastState.profit) : currentState.profit,
      loveDelta: this.lastState ? (currentState.love - this.lastState.love) : currentState.love,
      taxDelta: this.lastState ? (currentState.tax - this.lastState.tax) : currentState.tax,
      rawState: currentState
    };
    this.lastState = { ...currentState };
    const logEntry = JSON.stringify(delta) + '\n';
    fs.mkdirSync(path.dirname(this.logFilePath), { recursive: true });
    fs.appendFileSync(this.logFilePath, logEntry, 'utf8');
    return delta;
  }
}

module.exports = PLTRawValueLogger;
