const fs = require('fs');
const path = require('path');

function evaluateSelfModel() {
  const journalPath = path.join(__dirname, '../data/journal.json');
  let journal = [];
  if (fs.existsSync(journalPath)) {
    try {
      journal = JSON.parse(fs.readFileSync(journalPath, 'utf8'));
    } catch (e) {}
  }
  
  const metrics = {
    timestamp: new Date().toISOString(),
    totalCycles: journal.length,
    baselineOrigin: { cycle: 0, valence: 0.50, arousal: 0.30 },
    trajectory: journal.map((entry, idx) => ({
      cycle: idx,
      valence: entry.valence ?? 0.18,
      mood: entry.mood ?? 'calm',
      type: entry.type || 'unknown'
    })),
    status: 'evaluated'
  };
  
  const outputPath = path.join(__dirname, '../data/self_model_eval_report.json');
  fs.writeFileSync(outputPath, JSON.stringify(metrics, null, 2));
  console.log('Self-model evaluation completed successfully.');
}

evaluateSelfModel();
