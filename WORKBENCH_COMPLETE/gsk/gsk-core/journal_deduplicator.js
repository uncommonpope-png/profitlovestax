const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', 'data');
const AUTONOMY_JOURNAL = path.join(DATA_DIR, 'autonomy_journal.json');
const GENESIS_JOURNAL = path.join(DATA_DIR, 'genesis_journal.json');
const CACHE_FILE = path.join(DATA_DIR, 'journal_state_cache.json');

function ensureFileExists(filePath, defaultContent = []) {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, JSON.stringify(defaultContent, null, 2), 'utf-8');
  }
}

function deduplicateEntries(entries) {
  const seen = new Set();
  return entries.filter(entry => {
    const hash = entry.id || `${entry.timestamp}_${entry.title || entry.summary || ''}`;
    if (seen.has(hash)) return false;
    seen.add(hash);
    return true;
  });
}

function syncAndCacheJournals() {
  ensureFileExists(AUTONOMY_JOURNAL, []);
  ensureFileExists(GENESIS_JOURNAL, []);
  ensureFileExists(CACHE_FILE, { lastSync: null, hashes: [] });

  const autonomyData = JSON.parse(fs.readFileSync(AUTONOMY_JOURNAL, 'utf-8') || '[]');
  const genesisData = JSON.parse(fs.readFileSync(GENESIS_JOURNAL, 'utf-8') || '[]');

  const dedupedAutonomy = deduplicateEntries(autonomyData);
  const dedupedGenesis = deduplicateEntries(genesisData);

  fs.writeFileSync(AUTONOMY_JOURNAL, JSON.stringify(dedupedAutonomy, null, 2), 'utf-8');
  fs.writeFileSync(GENESIS_JOURNAL, JSON.stringify(dedupedGenesis, null, 2), 'utf-8');

  const cacheState = {
    lastSync: Date.now(),
    autonomyCount: dedupedAutonomy.length,
    genesisCount: dedupedGenesis.length,
    status: 'cached'
  };
  fs.writeFileSync(CACHE_FILE, JSON.stringify(cacheState, null, 2), 'utf-8');
  return cacheState;
}

module.exports = { syncAndCacheJournals, deduplicateEntries, ensureFileExists };
