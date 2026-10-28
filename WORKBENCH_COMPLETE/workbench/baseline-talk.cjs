// BASELINE TALK — Build 1 of the GSK north-star program (2026-10-28).
//
// The problem it fixes: the zero-key baseline turn composed on the local
// seat with temperature 0 (greedy) and NO stop strings, NO top_p/top_k/
// min_p, and NO repeat penalty — the exact recipe for looping,
// degenerate output. Greedy decoding self-reinforces: once a phrase
// repeats, the highest-probability continuation is the phrase again.
//
// What this module owns (all defaults overridable by env, never secrets):
//   samplingDefaults()  — sampling grid + stop strings + token cap
//   citeOrAbstainPrompt() — the answer template for the baseline turn
//   detectLoop() / cutAtLoop() — repeated-phrase loop detection + cut
//   deterministicEval() — fast, model-free checks recorded per turn
//
// The slow local judge is deliberately NOT in this module and NOT in
// the baseline hot path: it stays available for offline/second-stage
// use. These checks need no model and run in milliseconds.
//
// llama.cpp server notes (OpenAI-compatible /v1/chat/completions):
//   - temperature/top_p/top_k/min_p/max_tokens/repeat_penalty/stop are
//     all accepted request fields.
//   - repeat_penalty 1.0 = disabled (the server default). It stays
//     disabled here on purpose: prompt-counting repetition penalties
//     corrupt copied names and quotes in recall-grounded answers.
//     Tune via GSK_BASELINE_REPEAT_PENALTY only with A/B evidence.
//   - <|im_end|> is the Qwen ChatML end-of-turn token. The server
//     applies the GGUF-embedded chat template; the stop array below
//     is belt-and-braces so a runaway turn ends even if the template
//     does not stop it. The PC owner must still confirm the loaded
//     model's template actually ends on <|im_end|> (see report).
"use strict";

const DEFAULTS = {
  temperature: 0.7,
  top_p: 0.9,
  top_k: 40,
  min_p: 0.05,
  maxTokens: 320, // inside the 250–400 cap band
  repeatPenalty: 1.0, // disabled by design (see header)
  stops: ["<|im_end|>", "<|endoftext|>"],
};

function numEnv(name, fallback) {
  const raw = process.env[name];
  if (raw === undefined || raw === "") return fallback;
  const n = Number(raw);
  return Number.isFinite(n) ? n : fallback;
}

function intEnv(name, fallback) {
  return Math.round(numEnv(name, fallback));
}

// Sampling + stop config for a baseline turn. Env overrides:
//   GSK_BASELINE_TEMPERATURE, GSK_BASELINE_TOP_P, GSK_BASELINE_TOP_K,
//   GSK_BASELINE_MIN_P, GSK_BASELINE_MAX_TOKENS,
//   GSK_BASELINE_REPEAT_PENALTY, GSK_BASELINE_STOPS (comma-separated).
function samplingDefaults() {
  const stopsRaw = process.env.GSK_BASELINE_STOPS;
  const stops = stopsRaw
    ? stopsRaw.split(",").map((s) => s.trim()).filter(Boolean)
    : DEFAULTS.stops.slice();
  return {
    temperature: numEnv("GSK_BASELINE_TEMPERATURE", DEFAULTS.temperature),
    top_p: numEnv("GSK_BASELINE_TOP_P", DEFAULTS.top_p),
    top_k: intEnv("GSK_BASELINE_TOP_K", DEFAULTS.top_k),
    min_p: numEnv("GSK_BASELINE_MIN_P", DEFAULTS.min_p),
    max_tokens: intEnv("GSK_BASELINE_MAX_TOKENS", DEFAULTS.maxTokens),
    repeat_penalty: numEnv("GSK_BASELINE_REPEAT_PENALTY", DEFAULTS.repeatPenalty),
    stop: stops,
  };
}

// The cite-or-abstain answer template. The seat answers ONLY from the
// recalled passages, quotes them literally when it claims from them,
// and says plainly when the recall does not cover the question.
// Fabrication is a failure mode, not a fallback.
function citeOrAbstainPrompt() {
  return [
    "You are GSK answering from Seshat's local memory and GSK's authored static skills only.",
    "Answer ONLY from the recalled passages below. When you state something from them, quote the passage literally.",
    "If the recalled passages do not cover the question, say plainly: I do not know from my local memory. Do not guess, do not invent, do not fill gaps with general knowledge.",
    "Keep the answer short and in plain prose. Never claim a provider, seat, or external model answered.",
  ].join(" ");
}

function normWs(s) {
  return String(s ?? "").replace(/\s+/g, " ").trim();
}

function escapeRegExp(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// Find every occurrence start index of a whitespace-flexible unit in
// the original text (case-insensitive). Returns an array of indices.
function findOccurrences(original, unitNorm) {
  const pattern = escapeRegExp(unitNorm).replace(/\s+/g, "\\s+");
  const re = new RegExp(pattern, "gi");
  const hits = [];
  let m;
  while ((m = re.exec(original)) !== null) {
    hits.push(m.index);
    if (m[0].length === 0) re.lastIndex++;
  }
  return hits;
}

// Loop detection. Two independent signatures, both conservative so a
// normal answer that repeats a short phrase is NOT flagged:
//   (a) a sentence (>= 25 chars) appearing 3+ times, or
//   (b) an 8-word phrase appearing 4+ times.
// Returns { looped, cutAt, reason, unit }. cutAt is an index into the
// ORIGINAL text: the start of the 3rd (sentence) or 4th (phrase)
// occurrence — everything from there on is the loop.
function detectLoop(text) {
  const raw = String(text ?? "");
  if (!raw.trim()) return { looped: false, cutAt: -1, reason: "", unit: "" };
  const norm = normWs(raw).toLowerCase();

  // (a) repeated sentences
  const sentences = norm.split(/(?<=[.!?])\s+/).map((s) => s.trim()).filter(Boolean);
  const seen = new Map();
  for (const s of sentences) {
    if (s.length < 25) continue;
    seen.set(s, (seen.get(s) || 0) + 1);
    if (seen.get(s) === 3) {
      const hits = findOccurrences(raw, s);
      return { looped: true, cutAt: hits.length >= 3 ? hits[2] : -1, reason: "repeated-sentence", unit: s };
    }
  }

  // (b) repeated 8-word phrases
  const words = norm.split(" ").filter(Boolean);
  const counts = new Map();
  for (let i = 0; i + 8 <= words.length; i++) {
    const gram = words.slice(i, i + 8).join(" ");
    const c = (counts.get(gram) || 0) + 1;
    counts.set(gram, c);
    if (c === 4) {
      const hits = findOccurrences(raw, gram);
      return { looped: true, cutAt: hits.length >= 4 ? hits[3] : -1, reason: "repeated-phrase", unit: gram };
    }
  }
  return { looped: false, cutAt: -1, reason: "", unit: "" };
}

// Cut a looped answer at the loop point. Unlooped text is returned
// unchanged. Never returns an empty string for a non-empty input
// unless the loop starts at index 0 (degenerate from the first word).
function cutAtLoop(text) {
  const raw = String(text ?? "");
  const d = detectLoop(raw);
  if (!d.looped || d.cutAt <= 0) return { text: raw, looped: d.looped, cutAt: d.cutAt, reason: d.reason };
  return { text: raw.slice(0, d.cutAt).trim(), looped: true, cutAt: d.cutAt, reason: d.reason };
}

function extractQuotes(answer) {
  const out = [];
  const re = /"([^"]{20,})"|“([^”]{20,})”/g;
  let m;
  while ((m = re.exec(answer)) !== null) out.push(m[1] || m[2]);
  return out;
}

// Fast, model-free checks for one baseline turn. No seat, no judge.
//   recallPresent — the turn had local recall to answer from
//   citationsAllMatched — every literal quote (>= 20 chars) in the
//     answer appears verbatim in the recall (null when no quotes)
//   groundedSentences — sentences sharing a 24-char run with recall
//   looped — detectLoop() fired on the final answer
//   abstained — the answer says it does not know
//   withinCap — estimated tokens at or under maxTokens
//   pass — recall present, no loop, no fabricated quote, in cap,
//     and abstaining when the caller marked the prompt unanswerable.
// expectedAbstain is caller-supplied (the harness cannot know from
// the text alone whether a question was answerable); when it is not
// supplied, abstention is reported but does not fail the turn.
function deterministicEval(input) {
  const question = String(input?.question ?? "");
  const answer = String(input?.answer ?? "");
  const recallText = String(input?.recallText ?? "");
  const maxTokens = intEnv("GSK_BASELINE_MAX_TOKENS", DEFAULTS.maxTokens);
  const recallNorm = normWs(recallText).toLowerCase();
  const answerNorm = normWs(answer).toLowerCase();

  const recallPresent = recallNorm.length > 0;

  const quotes = extractQuotes(answer);
  let quotedMatched = 0;
  for (const q of quotes) {
    if (recallNorm.includes(normWs(q).toLowerCase())) quotedMatched++;
  }
  const citationsAllMatched = quotes.length === 0 ? null : quotedMatched === quotes.length;

  const sentences = answerNorm.split(/(?<=[.!?])\s+/).map((s) => s.trim()).filter((s) => s.length >= 20);
  let grounded = 0;
  for (const s of sentences) {
    let hit = false;
    for (let i = 0; i + 24 <= s.length && !hit; i++) {
      if (recallNorm.includes(s.slice(i, i + 24))) hit = true;
    }
    if (hit) grounded++;
  }

  const loop = detectLoop(answer);
  const abstained = /don'?t know|do not know|not in my (local )?memory|no record|cannot answer from/i.test(answer);
  const words = answer.trim() ? answer.trim().split(/\s+/).length : 0;
  const tokenEstimate = Math.ceil(words * 1.3);
  const withinCap = tokenEstimate <= (typeof input?.maxTokens === "number" ? input.maxTokens : maxTokens);

  const expectedAbstain = input?.expectedAbstain;
  const abstentionOk = expectedAbstain === undefined ? null : expectedAbstain ? abstained : true;

  const pass =
    recallPresent &&
    !loop.looped &&
    citationsAllMatched !== false &&
    withinCap &&
    abstentionOk !== false;

  return {
    questionChars: question.length,
    recallPresent,
    quotesChecked: quotes.length,
    quotesMatched: quotedMatched,
    citationsAllMatched,
    sentencesChecked: sentences.length,
    groundedSentences: grounded,
    looped: loop.looped,
    loopReason: loop.reason,
    abstained,
    abstentionOk,
    tokenEstimate,
    withinCap,
    pass,
  };
}

module.exports = {
  DEFAULTS,
  samplingDefaults,
  citeOrAbstainPrompt,
  detectLoop,
  cutAtLoop,
  deterministicEval,
};
