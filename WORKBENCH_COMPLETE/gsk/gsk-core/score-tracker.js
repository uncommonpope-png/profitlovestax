"use strict";

/**
 * GSK SCORECARD — Tracks build quality metrics over time.
 * Run after each build session to record scores.
 */

const fs = require("fs");
const path = require("path");

const SCORECARD_PATH = path.join(__dirname, "scorecard.jsonl");

function recordScore(session) {
  const entry = {
    timestamp: new Date().toISOString(),
    module: session.module,
    specExports: session.specExports || [],
    actualExports: session.actualExports || [],
    specFunctions: session.specFunctions || [],
    actualFunctions: session.actualFunctions || [],
    exportCoverage: 0,
    functionCoverage: 0,
    overallScore: 0,
    notes: session.notes || ""
  };

  // Calculate coverage
  if (entry.specExports.length > 0) {
    entry.exportCoverage = entry.actualExports.filter(e => entry.specExports.includes(e)).length / entry.specExports.length;
  } else {
    entry.exportCoverage = 1;
  }

  if (entry.specFunctions.length > 0) {
    entry.functionCoverage = entry.actualFunctions.filter(f => entry.specFunctions.includes(f)).length / entry.specFunctions.length;
  } else {
    entry.functionCoverage = 1;
  }

  entry.overallScore = Math.round(((entry.exportCoverage + entry.functionCoverage) / 2) * 100);

  fs.appendFileSync(SCORECARD_PATH, JSON.stringify(entry) + "\n");
  return entry;
}

function getHistory() {
  if (!fs.existsSync(SCORECARD_PATH)) return [];
  return fs.readFileSync(SCORECARD_PATH, "utf8")
    .trim()
    .split("\n")
    .filter(Boolean)
    .map(line => JSON.parse(line));
}

function getAverage() {
  const history = getHistory();
  if (history.length === 0) return null;
  const avg = history.reduce((sum, h) => sum + h.overallScore, 0) / history.length;
  return Math.round(avg);
}

function printScorecard(entry) {
  console.log(`\n=== SCORECARD: ${entry.module} ===`);
  console.log(`  Export coverage: ${Math.round(entry.exportCoverage * 100)}% (${entry.actualExports.filter(e => entry.specExports.includes(e)).length}/${entry.specExports.length})`);
  console.log(`  Function coverage: ${Math.round(entry.functionCoverage * 100)}% (${entry.actualFunctions.filter(f => entry.specFunctions.includes(f)).length}/${entry.specFunctions.length})`);
  console.log(`  Overall score: ${entry.overallScore}/100`);
  if (entry.notes) console.log(`  Notes: ${entry.notes}`);
  return entry;
}

module.exports = { recordScore, getHistory, getAverage, printScorecard };
