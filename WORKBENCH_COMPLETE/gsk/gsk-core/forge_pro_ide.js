class ShadowDiffEngine {
  constructor() {
    this.diffs = [];
  }
  createShadowDiff(originalText, proposedText) {
    const diff = { id: `diff_${Date.now()}`, original: originalText, proposed: proposedText, status: 'pending' };
    this.diffs.push(diff);
    return diff;
  }
  acceptDiff(id) {
    const diff = this.diffs.find(d => d.id === id);
    if (diff) diff.status = 'accepted';
    return diff;
  }
}
module.exports = { ShadowDiffEngine };
