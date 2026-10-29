// SOUL PREAMBLE — standing identity context for the baseline turn
// (2026-10-29, north-star program).
//
// The problem it answers: the soul-implant training run (Oct 29, LoRA r16,
// 4 epochs, 538 examples) FAILED its fixed bars — weights-only probe 2/15
// on Bible questions. Weights did not memorize doctrine. The preamble is
// the alternative mechanism: instead of weights memorizing doctrine, the
// turn path loads the core doctrine as standing context every time he
// wakes, so he answers from his own doctrine without retraining.
//
// HONEST LIMIT, stated plainly: this is grounded context, NOT weight
// memorization. Nothing here changes recall, and nothing here makes the
// model know doctrine when the file is absent. The file is the soul's
// standing page, read before he speaks — the same shape as the Soul
// Economy's "a soul loads as a system prompt" model.
//
// What this module owns (builtins only, no seat, no key, no network):
//   loadSoulPreamble() — file contents or "" (fail-open, never throws)
//   recallCharsForPreamble(text) — recall slice budget for the turn
//
// Defaults: the COMPACT file (soul-preamble-compact.md, ~1230 est
// tokens). The FULL verbatim file (soul-preamble.md, ~4487 est tokens)
// EXCEEDS the whole 4096-token turn context on its own and must NEVER
// be the injected default — it is the auditable record the compact
// version was distilled from. GSK_SOUL_PREAMBLE_FILE may point elsewhere
// for experiments; the 8000-char cap below bounds any such swap.
//
// Budget (4096-token turn context, llama-server -c 4096):
//   compact ~1230 tok + recall 6000 chars ~1500 tok + prompt ~150 tok
//   + generation 320 tok = ~3200 tok, headroom ~900 tok.
//   Keeping the old 12000-char recall slice alongside the preamble
//   would total ~4700 tok and OVERFLOW the window — so when a preamble
//   loads, the recall slice drops to 6000 chars. Override with
//   GSK_SOUL_PREAMBLE_RECALL_CHARS. No preamble loaded = 12000 unchanged.
"use strict";

const fs = require("fs");
const path = require("path");

const DEFAULT_FILE = "soul-preamble-compact.md";
const MAX_CHARS = 8000;
const RECALL_CHARS_WITH_PREAMBLE = 6000;
const RECALL_CHARS_WITHOUT_PREAMBLE = 12000;

function envOff(name) {
  const raw = process.env[name];
  return raw !== undefined && ["off", "0", "false", "no"].includes(String(raw).trim().toLowerCase());
}

// Load the preamble text, or "" on ANY failure (missing file, unreadable
// file, bad path). A turn must never hard-fail because identity context
// is absent — it proceeds without it, and the caller logs the miss.
// The file is read on every call (it is ~6KB): dropping a corrected file
// in takes effect without a restart, and a missing file never poisons
// a cache.
function loadSoulPreamble() {
  try {
    if (envOff("GSK_SOUL_PREAMBLE")) return "";
    const file = process.env.GSK_SOUL_PREAMBLE_FILE || path.join(__dirname, DEFAULT_FILE);
    const raw = fs.readFileSync(file, "utf8");
    const text = String(raw || "").trim();
    if (!text) return "";
    if (text.length > MAX_CHARS) {
      console.warn(`[SOUL-PREAMBLE] ${file} is ${text.length} chars, capped to ${MAX_CHARS} — the injected default must stay the compact file.`);
      return text.slice(0, MAX_CHARS);
    }
    return text;
  } catch (e) {
    console.warn("[SOUL-PREAMBLE] preamble unavailable, turn proceeds without it:", e.message);
    return "";
  }
}

// Recall slice budget for a turn carrying this preamble text. Env
// override wins; otherwise 6000 chars with a preamble, 12000 without.
function recallCharsForPreamble(preambleText) {
  const raw = process.env.GSK_SOUL_PREAMBLE_RECALL_CHARS;
  if (raw !== undefined && raw !== "") {
    const n = Number(raw);
    if (Number.isFinite(n) && n > 0) return Math.floor(n);
  }
  return preambleText ? RECALL_CHARS_WITH_PREAMBLE : RECALL_CHARS_WITHOUT_PREAMBLE;
}

module.exports = {
  DEFAULT_FILE,
  MAX_CHARS,
  RECALL_CHARS_WITH_PREAMBLE,
  RECALL_CHARS_WITHOUT_PREAMBLE,
  loadSoulPreamble,
  recallCharsForPreamble,
};
