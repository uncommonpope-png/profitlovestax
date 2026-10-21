'use strict';
/**
 * GOAL DEBT CLEARANCE — Phase 2 of the GSK repair plan.
 *
 * Three operations, each safe and reviewable:
 *   1. BACKUP  — copy goals.json → data/gsk/backups/goal-debt-<timestamp>.json
 *   2. ARCHIVE — move stale (>7 days) failed / needs_brain / awaiting_approval /
 *                failed_verification / refused goals to data/gsk/goals_archive.jsonl
 *                (append-only ledger; nothing is deleted).
 *   3. DEDUPE  — collapse near-duplicate active goals (e.g. the 186 "Heavens 2.0"
 *                / "Build …" variants) by normalized-title similarity, keeping the
 *                representative with the best status / most recent update.
 *
 * The cleaned goal list is written back to goals.json. Run with:
 *   node tools-goal-debt-clear.js            (report only — dry run)
 *   node tools-goal-debt-clear.js --apply    (actually write files)
 */

const fs = require('fs');
const path = require('path');

const GOALS_PATH = path.join(__dirname, 'data', 'gsk', 'goals.json');
const ARCHIVE_PATH = path.join(__dirname, 'data', 'gsk', 'goals_archive.jsonl');
const BACKUP_DIR = path.join(__dirname, 'data', 'gsk', 'backups');

const APPLY = process.argv.includes('--apply');
const STALE_MS = 7 * 24 * 3600 * 1000; // 7 days
const STUCK_STATUSES = ['failed', 'needs_brain', 'awaiting_approval', 'failed_verification', 'refused'];

function log(msg) { console.log(msg); }

function backup() {
  if (!fs.existsSync(BACKUP_DIR)) fs.mkdirSync(BACKUP_DIR, { recursive: true });
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const dest = path.join(BACKUP_DIR, `goal-debt-${stamp}.json`);
  fs.copyFileSync(GOALS_PATH, dest);
  log(`[1/3] Backup → ${dest}`);
  return dest;
}

function normalize(title) {
  return String(title || '')
    .toLowerCase()
    .replace(/[^a-z0-9 ]/g, ' ')
    .replace(/\b(a|an|the|and|or|for|to|of|my|its|our|their|build|builds|built|deploy|create|ship|with|into|this|that|on|in|at|by)\b/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function tokens(title) {
  return new Set(normalize(title).split(' ').filter(Boolean));
}

function similarity(a, b) {
  const ta = tokens(a), tb = tokens(b);
  if (ta.size === 0 || tb.size === 0) return 0;
  let inter = 0;
  for (const t of ta) if (tb.has(t)) inter++;
  return inter / Math.min(ta.size, tb.size);
}

function statusRank(goal) {
  return { completed: 5, planned: 4, proposed: 3, awaiting_approval: 2, needs_brain: 2, failed: 1, failed_verification: 1, refused: 0 }[goal.status] || 0;
}

function main() {
  if (!fs.existsSync(GOALS_PATH)) { log(`goals.json not found at ${GOALS_PATH}`); process.exit(1); }
  if (APPLY) backup();
  const goals = JSON.parse(fs.readFileSync(GOALS_PATH, 'utf8'));
  const now = Date.now();
  log(`Total goals loaded: ${goals.length} (${APPLY ? 'APPLY' : 'DRY RUN'})`);

  const byStatus = {};
  goals.forEach(g => byStatus[g.status] = (byStatus[g.status] || 0) + 1);
  log(`Status counts: ${JSON.stringify(byStatus)}`);

  // ── 2. ARCHIVE stale stuck goals ──────────────────────────────────────
  const stale = goals.filter(g =>
    STUCK_STATUSES.includes(g.status) &&
    (now - (g.updatedAt || g.createdAt || 0)) > STALE_MS
  );
  log(`[2/3] Archiving ${stale.length} stale stuck goals (>7 days)`);

  const keep = goals.filter(g => !stale.includes(g));
  if (APPLY && stale.length > 0) {
    const lines = stale.map(g => JSON.stringify({ ...g, archivedAt: now, archiveReason: 'stale_stuck' }));
    fs.appendFileSync(ARCHIVE_PATH, lines.join('\n') + '\n', 'utf8');
    log(`      → appended ${stale.length} to ${path.basename(ARCHIVE_PATH)}`);
  }

  // ── 3. DEDUPE near-duplicate remaining goals ──────────────────────────
  const kept = [];
  let dupes = 0;
  for (const g of keep) {
    const t = tokens(g.title);
    // find an existing kept goal it duplicates (title similarity ≥ 0.8)
    let dupOf = null;
    for (const k of kept) {
      if (similarity(g.title, k.title) >= 0.8) { dupOf = k; break; }
    }
    if (dupOf) {
      // keep the representative with the better status / fresher update
      if (statusRank(g) > statusRank(dupOf) ||
          (statusRank(g) === statusRank(dupOf) && (g.updatedAt || 0) > (dupOf.updatedAt || 0))) {
        const idx = kept.indexOf(dupOf);
        kept[idx] = g;
        if (APPLY) fs.appendFileSync(ARCHIVE_PATH, JSON.stringify({ ...dupOf, archivedAt: now, archiveReason: 'dedupe' }) + '\n', 'utf8');
      } else {
        if (APPLY) fs.appendFileSync(ARCHIVE_PATH, JSON.stringify({ ...g, archivedAt: now, archiveReason: 'dedupe' }) + '\n', 'utf8');
      }
      dupes++;
    } else {
      kept.push(g);
    }
  }
  log(`[3/3] Deduped ${dupes} near-duplicate goals (similarity ≥0.8)`);

  log(`\nResult: ${goals.length} → ${kept.length} goals (removed ${goals.length - kept.length})`);
  log(`Remaining by status: ${JSON.stringify(kept.reduce((m, g) => { m[g.status] = (m[g.status] || 0) + 1; return m; }, {}))}`);

  if (APPLY) {
    fs.writeFileSync(GOALS_PATH, JSON.stringify(kept, null, 2), 'utf8');
    log(`\n✓ goals.json updated (${kept.length} goals)`);
  } else {
    log(`\n(DRY RUN — nothing written. Re-run with --apply to commit.)`);
  }
}

main();
