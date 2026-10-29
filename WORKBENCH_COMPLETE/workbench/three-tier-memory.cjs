// THREE-TIER MEMORY — Build 4: Append-Only Truth, Curated Canon, Derived Index
//
// Architecture:
// Tier A: Append-only ground-truth event ledger (JSONL). Never modified or deleted.
// Tier B: Curated canon / doctrine (Markdown). FORBIDDEN to direct model auto-write.
//         Model proposals route to a staging queue for human review.
// Tier C: Derived search index built deterministically from Tier A and Tier B.

"use strict";

const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const BASE_DIR = path.resolve(__dirname, ".seshat-brain");
const TIER_A_PATH = path.join(BASE_DIR, "tier-a-ledger.jsonl");
const TIER_B_DIR = path.join(BASE_DIR, "curated-canon");
const PROPOSALS_PATH = path.join(BASE_DIR, "proposals-queue.jsonl");
const TIER_C_INDEX_PATH = path.join(BASE_DIR, "tier-c-index.json");

// Ensure directories exist
function ensureDirs() {
  if (!fs.existsSync(BASE_DIR)) fs.mkdirSync(BASE_DIR, { recursive: true });
  if (!fs.existsSync(TIER_B_DIR)) fs.mkdirSync(TIER_B_DIR, { recursive: true });
}

// 1. Tier B Poisoning Guard
const TIER_B_PATTERNS = [
  /curated-canon/i,
  /deep[\\/]genesis/i,
  /profit_bible/i,
  /the-profit-bible\.md/i
];

function isTierBPath(filepath) {
  const norm = filepath.replace(/\\/g, "/");
  return TIER_B_PATTERNS.some(p => p.test(norm));
}

// 2. Tier A: Append-Only Event Ledger
function appendTierA(event) {
  ensureDirs();
  const entry = {
    id: "evt_" + Date.now() + "_" + crypto.randomBytes(3).toString("hex"),
    timestamp: new Date().toISOString(),
    source: event.source || "agent",
    type: event.type || "observation",
    text: String(event.text || event.content || ""),
    metadata: event.metadata || {}
  };
  fs.appendFileSync(TIER_A_PATH, JSON.stringify(entry) + "\n", "utf8");
  return entry;
}

function readTierA(limit = 100) {
  if (!fs.existsSync(TIER_A_PATH)) return [];
  const lines = fs.readFileSync(TIER_A_PATH, "utf8").trim().split("\n").filter(Boolean);
  return lines.slice(-limit).map(l => {
    try { return JSON.parse(l); } catch { return null; }
  }).filter(Boolean);
}

// 3. Tier B: Curated Canon (Protected)
function writeCuratedCanon(filename, content, actor = "system") {
  ensureDirs();
  if (actor !== "human_curator" && actor !== "system") {
    throw new Error("Tier B Poisoning Defense: Direct model auto-write to curated canon is strictly forbidden.");
  }
  const fullPath = path.join(TIER_B_DIR, filename);
  fs.writeFileSync(fullPath, content, "utf8");
  return { path: fullPath, bytes: Buffer.byteLength(content, "utf8") };
}

// Proposals Queue (for model-proposed additions without poisoning canon)
function proposeFact(proposal) {
  ensureDirs();
  const entry = {
    id: "prop_" + Date.now() + "_" + crypto.randomBytes(3).toString("hex"),
    timestamp: new Date().toISOString(),
    proposed_by: proposal.proposed_by || "1.5b_seat",
    title: proposal.title || "Untitled Proposal",
    content: proposal.content || "",
    rationale: proposal.rationale || "",
    status: "pending_review"
  };
  fs.appendFileSync(PROPOSALS_PATH, JSON.stringify(entry) + "\n", "utf8");
  return { success: true, proposal_id: entry.id, status: entry.status };
}

// 4. Tier C: Derived Index & Search Engine
function tokenize(text) {
  return String(text || "")
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, " ")
    .split(/\s+/)
    .filter(t => t.length > 1);
}

function rebuildTierCIndex() {
  ensureDirs();
  const passages = [];

  // Index Tier B Curated Canon
  if (fs.existsSync(TIER_B_DIR)) {
    const files = fs.readdirSync(TIER_B_DIR);
    for (const file of files) {
      if (!file.endsWith(".md") && !file.endsWith(".txt")) continue;
      const fullPath = path.join(TIER_B_DIR, file);
      const text = fs.readFileSync(fullPath, "utf8");
      // Split into paragraphs/sections
      const sections = text.split(/\n\s*---\s*\n|\n#{1,3}\s+/).filter(s => s.trim().length > 20);
      sections.forEach((sec, idx) => {
        passages.push({
          id: `canon_${file}_${idx}`,
          tier: "Tier-B",
          source: `curated-canon/${file}`,
          title: file,
          text: sec.trim(),
          tokens: tokenize(sec)
        });
      });
    }
  }

  // Also index deep/genesis if available
  const genesisPath = path.join(BASE_DIR, "deep", "genesis", "THE-PROFIT-BIBLE.md");
  if (fs.existsSync(genesisPath)) {
    const text = fs.readFileSync(genesisPath, "utf8");
    const sections = text.split(/\n#{1,3}\s+/).filter(s => s.trim().length > 30);
    sections.slice(0, 50).forEach((sec, idx) => {
      passages.push({
        id: `genesis_${idx}`,
        tier: "Tier-B",
        source: "deep/genesis/THE-PROFIT-BIBLE.md",
        title: "Profit Bible Canon",
        text: sec.trim().slice(0, 1500),
        tokens: tokenize(sec)
      });
    });
  }

  // Index Tier A Event Ledger
  const events = readTierA(500);
  for (const evt of events) {
    passages.push({
      id: evt.id,
      tier: "Tier-A",
      source: "tier-a-ledger.jsonl",
      title: `${evt.type}: ${evt.source}`,
      text: evt.text,
      tokens: tokenize(evt.text)
    });
  }

  fs.writeFileSync(TIER_C_INDEX_PATH, JSON.stringify({
    rebuiltAt: new Date().toISOString(),
    count: passages.length,
    passages
  }, null, 2), "utf8");

  return passages;
}

function searchTierC(query, options = {}) {
  const { topK = 5, minScore = 0.1 } = options;
  let indexData;
  if (fs.existsSync(TIER_C_INDEX_PATH)) {
    try {
      indexData = JSON.parse(fs.readFileSync(TIER_C_INDEX_PATH, "utf8")).passages;
    } catch {}
  }
  if (!indexData) {
    indexData = rebuildTierCIndex();
  }

  const qTokens = tokenize(query);
  if (qTokens.length === 0) return [];

  const scored = indexData.map(p => {
    let matchCount = 0;
    for (const qt of qTokens) {
      if (p.tokens.includes(qt)) matchCount++;
    }
    // Tier B multiplier (canon prioritized over raw events)
    const tierMultiplier = p.tier === "Tier-B" ? 1.5 : 1.0;
    const score = (matchCount / Math.sqrt(p.tokens.length || 1)) * tierMultiplier;
    return { ...p, score };
  });

  return scored
    .filter(s => s.score >= minScore)
    .sort((a, b) => b.score - a.score)
    .slice(0, topK)
    .map(({ id, tier, source, title, text, score }) => ({
      id, tier, source, title, text: text.slice(0, 1000), score: Number(score.toFixed(4))
    }));
}

module.exports = {
  TIER_A_PATH,
  TIER_B_DIR,
  PROPOSALS_PATH,
  TIER_C_INDEX_PATH,
  isTierBPath,
  appendTierA,
  readTierA,
  writeCuratedCanon,
  proposeFact,
  rebuildTierCIndex,
  searchTierC
};
