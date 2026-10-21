class RecursiveJournalFilter {
  constructor(options = {}) {
    this.alpha = options.alpha || 0.15;
    this.harmonicThreshold = options.threshold || 0.7;
    this.history = [];
  }

  filter(entry) {
    const rawScore = typeof entry.score === 'number' ? entry.score : 0.5;
    const prev = this.history.length > 0 ? this.history[this.history.length - 1] : rawScore;
    const smoothed = this.alpha * rawScore + (1 - this.alpha) * prev;
    this.history.push(smoothed);
    if (this.history.length > 1000) this.history.shift();

    return {
      timestamp: Date.now(),
      track: smoothed >= this.harmonicThreshold ? 'lead_vocal' : 'backing_track',
      rawScore,
      filteredScore: smoothed,
      entry
    };
  }
}

module.exports = RecursiveJournalFilter;
