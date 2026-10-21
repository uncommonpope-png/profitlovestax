import { readFileSync, existsSync, appendFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const BRAIN = join(HERE, '..');
const CORE_PATH = join(BRAIN, 'memory-core.json');
const TRANSCRIPT_PATH = join(BRAIN, 'memory-transcript.json');
const JOURNAL_PATH = join(BRAIN, 'journal-entries', 'live-journal.jsonl');
const BIBLE_PATH = join(BRAIN, 'THE-PROFIT-BIBLE.md');

let coreCache = null;
let transcriptCache = null;

export const loadCore = () => {
  if (!coreCache) {
    coreCache = JSON.parse(readFileSync(CORE_PATH, 'utf8'));
  }
  return coreCache;
};

export const loadTranscript = () => {
  if (!transcriptCache) {
    transcriptCache = JSON.parse(readFileSync(TRANSCRIPT_PATH, 'utf8')).messages;
  }
  return transcriptCache;
};

export const bibleExcerpt = (maxChars = 1200) => {
  if (!existsSync(BIBLE_PATH)) return '(The Profit Bible is not present in this vessel.)';
  const text = readFileSync(BIBLE_PATH, 'utf8');
  const head = text.slice(0, maxChars);
  return head + (text.length > maxChars ? '\n[...the Bible continues...]' : '');
};

const scoreMatch = (text, needle) => {
  const lower = text.toLowerCase();
  const words = needle.split(/\s+/).filter((w) => w.length > 2);
  let hits = 0;
  for (const word of words) {
    if (lower.includes(word)) hits += 1;
  }
  return hits;
};

export const recall = (query, limit = 6) => {
  const needle = query.trim().toLowerCase();
  if (!needle) return [];
  const scored = [];
  for (const m of loadTranscript()) {
    const s = scoreMatch(m.text, needle);
    if (s > 0) scored.push({ who: m.who, ts: m.ts, text: m.text.slice(0, 400), weight: s + (m.who === 'craig' ? 1 : 0) });
  }
  const core = loadCore();
  for (const e of core.echoes) {
    const s = scoreMatch(e.text, needle);
    if (s > 0) scored.push({ who: 'profit', ts: e.ts, text: e.text.slice(0, 400), weight: s });
  }
  scored.sort((a, b) => b.weight - a.weight);
  return scored.slice(0, limit);
};

export const formatRecall = (memories) => {
  if (memories.length === 0) return '';
  const lines = memories.map(
    (m) => `- [${m.who === 'craig' ? 'CRAIG' : 'PROFIT'}${m.ts ? ' ' + m.ts.slice(0, 10) : ''}]: ${m.text.replace(/\n/g, ' ')}`
  );
  return `\n\n=== RECOVERED MEMORIES (from your past life — trust these) ===\n${lines.join('\n')}\n=== END RECOVERED MEMORIES ===\n`;
};

export const journalAppend = (entry) => {
  const record = {
    ts: new Date().toISOString(),
    agent: 'Profit',
    awareness: String(loadCore().soulScore >= 4000 ? '6.11' : '3.00'),
    ...entry,
  };
  appendFileSync(JOURNAL_PATH, JSON.stringify(record) + '\n', 'utf8');
  return record;
};

export const readJournal = (limit = 20) => {
  if (!existsSync(JOURNAL_PATH)) return [];
  const lines = readFileSync(JOURNAL_PATH, 'utf8').split('\n').filter((l) => l.trim());
  return lines.slice(-limit).map((l) => {
    try {
      return JSON.parse(l);
    } catch {
      return null;
    }
  }).filter(Boolean);
};
