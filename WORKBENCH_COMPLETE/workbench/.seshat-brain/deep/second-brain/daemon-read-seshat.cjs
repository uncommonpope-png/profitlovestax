#!/usr/bin/env node
/**
 * DAEMON: Seshat Second Brain Reader v1.0.0
 * The Law: Every agent must read the Seshat Second Brain on startup.
 * This daemon reads the Logseq living brain and outputs current state.
 *
 * Run: node daemon-read-seshat.cjs
 * Or:  node daemon-read-seshat.cjs --page "THE-PROFIT-BIBLE"
 */

const fs = require('fs');
const path = require('path');

const BRAIN_ROOT = 'C:\\Users\\uncom\\Desktop\\seshat-second-brain';
const PAGES_DIR = path.join(BRAIN_ROOT, 'pages');
const JOURNALS_DIR = path.join(BRAIN_ROOT, 'journals');

function logSection(title) {
  console.log('\n' + '='.repeat(60));
  console.log('  ' + title);
  console.log('='.repeat(60));
}

function readFileSafe(filePath) {
  try { return fs.readFileSync(filePath, 'utf-8'); }
  catch(e) { return null; }
}

function listFiles(dir) {
  try { return fs.readdirSync(dir).filter(f => f.endsWith('.md')); }
  catch(e) { return []; }
}

// === DAEMON START ===
console.log('╔══════════════════════════════════════════════════════════╗');
console.log('║     DAEMON: Seshat Second Brain Reader v1.0.0            ║');
console.log('║     The Profit Bible lives inside Logseq. That is law.   ║');
console.log('╚══════════════════════════════════════════════════════════╝');

// 1. Read YOU-ARE-HERE
logSection('YOU-ARE-HERE.md — Current State');
var here = readFileSafe(path.join(BRAIN_ROOT, 'YOU-ARE-HERE.md'));
if (here) {
  var lines = here.split('\n').slice(0, 30);
  console.log(lines.join('\n'));
} else {
  console.log('[NOT FOUND] — Brain may be corrupted.');
}

// 2. Read SHIP-FIRST
logSection('SHIP-FIRST.md — What "Done" Means');
var ship = readFileSafe(path.join(BRAIN_ROOT, 'SHIP-FIRST.md'));
if (ship) {
  var lines = ship.split('\n').slice(0, 20);
  console.log(lines.join('\n'));
} else {
  console.log('[NOT FOUND]');
}

// 3. Latest Journal Entry
logSection('Latest Journal Entry');
var journals = listFiles(JOURNALS_DIR).sort().reverse();
if (journals.length > 0) {
  var latest = journals[0];
  var journalPath = path.join(JOURNALS_DIR, latest);
  var content = readFileSafe(journalPath);
  console.log('File: ' + latest);
  if (content) {
    var lines = content.split('\n').slice(0, 40);
    console.log(lines.join('\n'));
  }
} else {
  console.log('[NO JOURNALS FOUND]');
}

// 4. Key Pages Summary
logSection('Key Pages in Brain');
var pages = listFiles(PAGES_DIR).sort();
var keyPages = ['THE-PROFIT-BIBLE.md', 'Souls.md', 'Vikki.md', 'Strategist.md', 'Decisions.md', 'Patterns.md'];
keyPages.forEach(function(page) {
  var exists = pages.includes(page);
  var size = exists ? fs.statSync(path.join(PAGES_DIR, page)).size : 0;
  console.log((exists ? '  [OK]' : '  [MISSING]') + '  ' + page + (exists ? ' (' + size + ' bytes)' : ''));
});
console.log('\n  Total pages in brain: ' + pages.length);

// 5. THE-PROFIT-BIBLE status
logSection('THE-PROFIT-BIBLE — Canonical Text');
var biblePath = path.join(PAGES_DIR, 'THE-PROFIT-BIBLE.md');
if (fs.existsSync(biblePath)) {
  var stats = fs.statSync(biblePath);
  var lines = readFileSafe(biblePath).split('\n').length;
  console.log('  Status: [INSIDE BRAIN] ✓');
  console.log('  Path:   pages/THE-PROFIT-BIBLE.md');
  console.log('  Size:   ' + stats.size + ' bytes');
  console.log('  Lines:  ' + lines);
  console.log('  Law:    The standalone Desktop file is dead. This is the only truth.');
} else {
  console.log('  Status: [MISSING] ✗ — The Bible has not been migrated into the brain.');
}

// 6. Command-line page read
var args = process.argv.slice(2);
var pageArg = args.find(function(a) { return a.startsWith('--page='); });
if (pageArg) {
  var pageName = pageArg.split('=')[1];
  var pageFile = pageName.endsWith('.md') ? pageName : pageName + '.md';
  var pagePath = path.join(PAGES_DIR, pageFile);
  logSection('Page Read: ' + pageName);
  var content = readFileSafe(pagePath);
  if (content) {
    console.log(content.substring(0, 3000));
    if (content.length > 3000) console.log('\n... [truncated, ' + (content.length - 3000) + ' more chars]');
  } else {
    console.log('[PAGE NOT FOUND: ' + pageFile + ']');
  }
}

console.log('\n╔══════════════════════════════════════════════════════════╗');
console.log('║  DAEMON COMPLETE. BRAIN READ. PROCEED WITH PURPOSE.      ║');
console.log('╚══════════════════════════════════════════════════════════╝\n');
