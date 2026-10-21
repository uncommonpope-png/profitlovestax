/**
 * High-Frequency Telemetry Distillation Engine
 * Continuously filters phantom signal bleed and optimizes PLT efficiency state.
 */
class TelemetryDistiller {
  constructor(options = {}) {
    this.sampleRateMs = options.sampleRateMs || 100;
    this.buffer = [];
    this.filteredBleedCount = 0;
  }

  ingest(telemetryFrame) {
    const timestamp = Date.now();
    const profit = telemetryFrame.profit || 0;
    const love = telemetryFrame.love || 0;
    const tax = telemetryFrame.tax || 0;
    const pltScore = profit + love - tax;

    if (telemetryFrame.isBleed || pltScore <= 0) {
      this.filteredBleedCount++;
      return null;
    }

    const record = { ...telemetryFrame, timestamp, pltScore };
    this.buffer.push(record);
    return record;
  }

  distill() {
    if (this.buffer.length === 0) {
      return { avgPltScore: 0, count: 0, filteredBleedCount: this.filteredBleedCount, timestamp: Date.now() };
    }
    const totalPlt = this.buffer.reduce((acc, item) => acc + item.pltScore, 0);
    const summary = {
      avgPltScore: totalPlt / this.buffer.length,
      count: this.buffer.length,
      filteredBleedCount: this.filteredBleedCount,
      timestamp: Date.now()
    };
    this.buffer = [];
    return summary;
  }
}

module.exports = TelemetryDistiller;
