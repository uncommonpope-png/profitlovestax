/**
 * Journal Ingestion Deduplicator & list_files Recovery Mechanism
 * Prevents high-frequency recursive failure logging by caching state signatures
 */
function deduplicateJournals(entries) {
  const seen = new Set();
  return entries.filter(e => {
    const key = e.hash || (e.timestamp + ':' + e.summary);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function safeListFiles(path, fallbackFn) {
  try {
    return listFilesHandler(path);
  } catch (err) {
    console.error('list_files suppressed recurring failure:', err.message);
    return fallbackFn ? fallbackFn(path) : [];
  }
}

module.exports = { deduplicateJournals, safeListFiles };
