// SOUL PREAMBLE TESTS — 2026-10-29, north-star program.
// Standalone, no framework, no seat, no network: node tests/soul-preamble.test.cjs
// Exit 0 = all PASS, exit 1 = any FAIL.
"use strict";

const fs = require("fs");
const path = require("path");
const preamble = require("../soul-preamble.cjs");

const results = [];
function check(name, pass, detail) {
  results.push({ name, pass });
  console.log(`${pass ? "PASS" : "FAIL"} ${name} — ${detail}`);
}

const COMPACT = path.join(__dirname, "..", "soul-preamble-compact.md");
const FULL = path.join(__dirname, "..", "soul-preamble.md");

// 1. Default load returns the compact file, non-empty, doctrine-bearing.
{
  delete process.env.GSK_SOUL_PREAMBLE;
  delete process.env.GSK_SOUL_PREAMBLE_FILE;
  const text = preamble.loadSoulPreamble();
  check("default.nonempty", text.length > 1000, `got ${text.length} chars`);
  check("default.is-compact", text.length < 8000, `got ${text.length} chars (cap ${preamble.MAX_CHARS})`);
  for (const needle of ["I am Profit", "222", "NEVER DIE", "Profit + Love - Tax", "Soul Foundry", "The Typist"]) {
    check(`default.contains:${needle}`, text.includes(needle), needle);
  }
  const words = text.split(/\s+/).filter(Boolean).length;
  const estTokens = Math.ceil(words * 1.33);
  check("default.under-1500-tokens", estTokens < 1500, `${words} words -> ~${estTokens} est tokens`);
}

// 2. Default load is NOT the full verbatim file (that file alone exceeds
// the whole 4096-token turn context and must never be the default).
{
  const full = fs.readFileSync(FULL, "utf8");
  const loaded = preamble.loadSoulPreamble();
  check("default.not-full", loaded.length < full.length && !loaded.includes("35,000+ lines of code"), `loaded ${loaded.length} chars vs full ${full.length}`);
}

// 3. Missing file fails open: "" returned, never throws.
{
  process.env.GSK_SOUL_PREAMBLE_FILE = path.join(__dirname, "no-such-preamble.md");
  let text = null;
  let threw = false;
  try {
    text = preamble.loadSoulPreamble();
  } catch {
    threw = true;
  }
  check("missing.fail-open", !threw && text === "", `threw=${threw} text=${JSON.stringify(text)}`);
  delete process.env.GSK_SOUL_PREAMBLE_FILE;
}

// 4. Explicit disable returns "".
{
  process.env.GSK_SOUL_PREAMBLE = "off";
  check("disabled.off", preamble.loadSoulPreamble() === "", "GSK_SOUL_PREAMBLE=off");
  delete process.env.GSK_SOUL_PREAMBLE;
}

// 5. Recall slice budget: 6000 with a preamble, 12000 without, env wins.
{
  check("recall.with-preamble", preamble.recallCharsForPreamble("x".repeat(100)) === 4000, "got 4000");
  check("recall.without-preamble", preamble.recallCharsForPreamble("") === 8000, "got 8000");
  process.env.GSK_SOUL_PREAMBLE_RECALL_CHARS = "8000";
  check("recall.env-override", preamble.recallCharsForPreamble("x".repeat(100)) === 8000, "got 8000");
  delete process.env.GSK_SOUL_PREAMBLE_RECALL_CHARS;
}

// 6. Compact file exists on disk and the full file carries all 28 sections.
{
  check("files.compact-exists", fs.existsSync(COMPACT), COMPACT);
  const full = fs.readFileSync(FULL, "utf8");
  const sections = (full.match(/^## \d\d\. /gm) || []).length;
  check("files.full-28-sections", sections === 28, `got ${sections}`);
}

const failed = results.filter((r) => !r.pass).length;
console.log(`\n${results.length - failed}/${results.length} PASS`);
process.exit(failed ? 1 : 0);
