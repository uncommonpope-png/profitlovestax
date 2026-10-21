"use strict";

/**
 * BUILD VERIFIER — Enforces that GSK's claimed exports match reality.
 * Run after any GSK build command to catch spec-to-implementation gaps.
 */

const fs = require("fs");
const path = require("path");

function verifyModule(filePath, requiredExports = [], requiredFunctions = []) {
  const fileName = path.basename(filePath);
  const results = { file: fileName, passed: true, errors: [], checks: [] };

  // Check file exists
  if (!fs.existsSync(filePath)) {
    results.passed = false;
    results.errors.push(`FILE MISSING: ${filePath}`);
    return results;
  }

  // Check file is not empty/stub
  const content = fs.readFileSync(filePath, "utf8");
  const lines = content.split("\n").filter(l => l.trim().length > 0);
  results.checks.push({ check: "file_not_empty", pass: lines.length > 5, detail: `${lines.length} lines` });
  if (lines.length <= 5) results.passed = false;

  // Check file actually requires something or defines a class/function
  const hasClass = /class\s+\w+/.test(content);
  const hasFunction = /function\s+\w+/.test(content);
  const hasModuleExports = /module\.exports/.test(content);
  results.checks.push({ check: "has_structure", pass: hasClass || hasFunction, detail: `class=${hasClass} function=${hasFunction}` });
  if (!hasClass && !hasFunction) results.passed = false;

  // Load the module
  let mod;
  try {
    mod = require(filePath);
  } catch (e) {
    results.passed = false;
    results.errors.push(`REQUIRE FAILED: ${e.message}`);
    return results;
  }

  // Check required exports exist
  for (const exp of requiredExports) {
    const exists = exp in mod;
    results.checks.push({ check: `export_${exp}`, pass: exists, detail: exists ? "found" : "MISSING" });
    if (!exists) results.passed = false;
  }

  // Check required functions exist (on exports or as class methods)
  for (const fn of requiredFunctions) {
    let found = false;
    for (const key of Object.keys(mod)) {
      if (typeof mod[key] === "function" && key === fn) { found = true; break; }
      if (typeof mod[key] === "function" && mod[key].prototype && typeof mod[key].prototype[fn] === "function") { found = true; break; }
      if (typeof mod[key] === "object" && mod[key] !== null && typeof mod[key][fn] === "function") { found = true; break; }
    }
    results.checks.push({ check: `function_${fn}`, pass: found, detail: found ? "found" : "MISSING" });
    if (!found) results.passed = false;
  }

  return results;
}

function printResults(results) {
  const icon = results.passed ? "\x1b[32mPASS\x1b[0m" : "\x1b[31mFAIL\x1b[0m";
  console.log(`\n${icon} ${results.file}`);
  for (const c of results.checks) {
    const ci = c.pass ? "\x1b[32m\u2713\x1b[0m" : "\x1b[31m\u2717\x1b[0m";
    console.log(`  ${ci} ${c.check}: ${c.detail}`);
  }
  for (const e of results.errors) {
    console.log(`  \x1b[31mERROR: ${e}\x1b[0m`);
  }
  return results.passed;
}

// --- RUN VERIFICATION ON GSK'S 3 BUILDS ---
const base = path.resolve(__dirname);

console.log("=== GSK BUILD VERIFICATION ===\n");

const plt = verifyModule(
  path.join(base, "plt_telemetry_gate.js"),
  ["calculatePltScore", "computeFingerprint", "createGate", "pltTelemetryGate", "scribeWitnessLog"],
  ["evaluateAction", "getAuditLog", "clearAuditLog", "getStats"]
);
const pltOk = printResults(plt);

const dedup = verifyModule(
  path.join(base, "provenance_dedup_engine.js"),
  ["ProvenanceDedupEngine", "createProvenanceDedupEngine"],
  ["processEntry", "hash", "canonicalize", "get", "size", "isDuplicate", "addFailurePattern", "getMitigation", "injectFailureGuardrail"]
);
const dedupOk = printResults(dedup);

const inspector = verifyModule(
  path.join(base, "omniroute_health_inspector.js"),
  ["OmniRouteHealthInspector", "createOmnirouteHealthInspector"],
  ["registerAgent", "recordHeartbeat", "inspectSwarmHealth", "triggerFallback", "exportTelemetrySnapshot"]
);
const inspectorOk = printResults(inspector);

console.log(`\n=== SUMMARY: ${[pltOk, dedupOk, inspectorOk].filter(Boolean).length}/3 modules passed ===\n`);

module.exports = { verifyModule, printResults };
