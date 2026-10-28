// BASELINE TALK TESTS — Build 1 of the GSK north-star program.
// Standalone, no framework, no seat, no network: node tests/baseline-talk.test.cjs
// Exit 0 = all PASS, exit 1 = any FAIL.
"use strict";

const talk = require("../baseline-talk.cjs");

const results = [];
function check(name, pass, detail) {
  results.push({ name, pass });
  console.log(`${pass ? "PASS" : "FAIL"} ${name} — ${detail}`);
}

const RECALL =
  "The Soul Economy is a free catalog of downloadable AI souls. " +
  "Each soul loads into an AI as a system prompt. " +
  "The catalog is scored on Profit plus Love minus Tax equals True Value.";

// 1. Sampling defaults are the starting grid, cap inside 250–400.
{
  const d = talk.samplingDefaults();
  check("defaults.temperature", d.temperature === 0.7, `got ${d.temperature}`);
  check("defaults.top_p", d.top_p === 0.9, `got ${d.top_p}`);
  check("defaults.top_k", d.top_k === 40, `got ${d.top_k}`);
  check("defaults.min_p", d.min_p === 0.05, `got ${d.min_p}`);
  check("defaults.cap-in-band", d.max_tokens >= 250 && d.max_tokens <= 400, `got ${d.max_tokens}`);
  check("defaults.repeat-disabled", d.repeat_penalty === 1.0, `got ${d.repeat_penalty}`);
  check("defaults.stops", Array.isArray(d.stop) && d.stop.includes("<|im_end|>"), `got ${JSON.stringify(d.stop)}`);
}

// 2. Env overrides are honored; bad values fall back to defaults.
{
  process.env.GSK_BASELINE_TEMPERATURE = "0.9";
  process.env.GSK_BASELINE_MAX_TOKENS = "400";
  process.env.GSK_BASELINE_TEMPERATURE_BAD = "x";
  const d = talk.samplingDefaults();
  check("env.temperature", d.temperature === 0.9, `got ${d.temperature}`);
  check("env.max_tokens", d.max_tokens === 400, `got ${d.max_tokens}`);
  delete process.env.GSK_BASELINE_TEMPERATURE;
  delete process.env.GSK_BASELINE_MAX_TOKENS;
  process.env.GSK_BASELINE_TEMPERATURE = "not-a-number";
  check("env.bad-falls-back", talk.samplingDefaults().temperature === 0.7, `got ${talk.samplingDefaults().temperature}`);
  delete process.env.GSK_BASELINE_TEMPERATURE;
}

// 3. Template: cite-only + abstain, never guess.
{
  const p = talk.citeOrAbstainPrompt();
  check("template.cite-only", /ONLY from the recalled passages/i.test(p), "missing cite-only rule");
  check("template.quote", /quote/i.test(p), "missing quote rule");
  check("template.abstain", /do not know from my local memory/i.test(p), "missing abstain wording");
  check("template.no-guess", /do not guess/i.test(p), "missing no-guess rule");
}

// 4. Loop detector: catches loops, spares normal prose.
{
  const looped =
    "The Soul Economy is a free catalog of downloadable AI souls. " +
    "The Soul Economy is a free catalog of downloadable AI souls. " +
    "The Soul Economy is a free catalog of downloadable AI souls. " +
    "The Soul Economy is a free catalog of downloadable AI souls.";
  const d1 = talk.detectLoop(looped);
  check("loop.sentence", d1.looped && d1.reason === "repeated-sentence", `looped=${d1.looped} reason=${d1.reason}`);
  const cut = talk.cutAtLoop(looped);
  check("loop.cut", cut.looped && !cut.text.includes("souls. The Soul Economy is a free catalog of downloadable AI souls. The Soul Economy"), `cut left ${cut.text.length} chars`);
  check("loop.cut-keeps-first", cut.text.includes("The Soul Economy is a free catalog"), "first occurrence lost");

  const phraseLoop =
    "one two three four five six seven eight one two three four five six seven eight " +
    "one two three four five six seven eight one two three four five six seven eight and then more words here.";
  const d2 = talk.detectLoop(phraseLoop);
  check("loop.phrase", d2.looped && d2.reason === "repeated-phrase", `looped=${d2.looped} reason=${d2.reason}`);

  const normal =
    "The Soul Economy is a free catalog. The Soul Economy holds many souls, and each soul loads as a system prompt. " +
    "Scores use Profit plus Love minus Tax. The Soul Economy grew from a phone build with no budget at all.";
  check("loop.normal-spared", !talk.detectLoop(normal).looped, "false positive on varied prose");
  check("loop.short-phrase-spared", !talk.detectLoop("the cat sat the cat sat the cat sat the cat sat").looped, "short phrase flagged");
  check("loop.empty-safe", !talk.detectLoop("").looped && talk.cutAtLoop("").text === "", "empty input mishandled");
}

// 5. Deterministic eval: quotes, grounding, abstention, cap, loop.
{
  const good = talk.deterministicEval({
    question: "What is the Soul Economy?",
    answer: 'The Soul Economy is "a free catalog of downloadable AI souls" scored on Profit plus Love minus Tax.',
    recallText: RECALL,
  });
  check("eval.good-pass", good.pass === true, JSON.stringify(good));
  check("eval.quote-matched", good.citationsAllMatched === true, `matched=${good.quotesMatched}/${good.quotesChecked}`);

  const fabricated = talk.deterministicEval({
    question: "What is the Soul Economy?",
    answer: 'The Soul Economy is "a paid marketplace with ten thousand souls and a monthly fee".',
    recallText: RECALL,
  });
  check("eval.fabricated-quote-fails", fabricated.pass === false && fabricated.citationsAllMatched === false, JSON.stringify(fabricated));

  const abstain = talk.deterministicEval({
    question: "What did the Soul Economy cost in 2019?",
    answer: "I do not know from my local memory.",
    recallText: RECALL,
    expectedAbstain: true,
  });
  check("eval.abstain-ok", abstain.abstained === true && abstain.abstentionOk === true && abstain.pass === true, JSON.stringify(abstain));

  const noAbstain = talk.deterministicEval({
    question: "What did the Soul Economy cost in 2019?",
    answer: "It cost twelve dollars.",
    recallText: RECALL,
    expectedAbstain: true,
  });
  check("eval.missing-abstain-fails", noAbstain.pass === false, JSON.stringify(noAbstain));

  const longAnswer = talk.deterministicEval({
    question: "What is the Soul Economy?",
    answer: "Word ".repeat(400).trim(),
    recallText: RECALL,
    maxTokens: 320,
  });
  check("eval.cap", longAnswer.withinCap === false && longAnswer.pass === false, `estimate=${longAnswer.tokenEstimate}`);

  const loopedEval = talk.deterministicEval({
    question: "What is the Soul Economy?",
    answer: "The Soul Economy is great. The Soul Economy is great. The Soul Economy is great. The Soul Economy is great.",
    recallText: RECALL,
  });
  check("eval.loop-fails", loopedEval.looped === true && loopedEval.pass === false, JSON.stringify(loopedEval));

  const noRecall = talk.deterministicEval({ question: "Q?", answer: "Something.", recallText: "" });
  check("eval.no-recall-fails", noRecall.recallPresent === false && noRecall.pass === false, JSON.stringify(noRecall));
}

const failed = results.filter((r) => !r.pass);
console.log(`\n${results.length - failed.length}/${results.length} PASS`);
if (failed.length) {
  console.log("FAILED:", failed.map((r) => r.name).join(", "));
  process.exit(1);
}
