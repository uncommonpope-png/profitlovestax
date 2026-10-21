const fs = require('fs');
const path = require('path');

class GraphIngestionPipeline {
  constructor(config = {}) {
    this.batchSize = config.batchSize || 100;
    this.nodes = new Map();
    this.edges = [];
  }

  async ingestNote(noteData) {
    if (!noteData || !noteData.id) return null;
    this.nodes.set(noteData.id, noteData);
    return noteData.id;
  }
}

module.exports = GraphIngestionPipeline;

GraphIngestionPipeline.prototype.ingestBatch = async function(notesArray) {
  let processed = 0;
  let errors = 0;
  for (const note of notesArray) {
    try {
      await this.ingestNote(note);
      processed++;
    } catch (err) {
      errors++;
    }
  }
  return { processed, errors, totalNodes: this.nodes.size };
};
