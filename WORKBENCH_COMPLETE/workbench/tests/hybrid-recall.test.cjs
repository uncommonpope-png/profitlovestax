// HYBRID RECALL TESTS — Build 2 of the GSK north-star program.
// Standalone, no framework, no seat, no network for the unit cases
// (the two VM-path cases use the local deep index + local vector
// store only): node tests/hybrid-recall.test.cjs
// Exit 0 = all PASS, exit 1 = any FAIL.
"use strict";

const hyb = require("../hybrid-recall.cjs");

const results = [];
function check(name, pass, detail) {
  results.push({ name, pass });
  console.log(`${pass ? "PASS" : "FAIL"} ${name} — ${detail}`);
}

function approx(a, b, eps) {
  return Math.abs(a - b) <= eps;
}

// 1. RRF fusion: shared items outrank single-list items, k=60 math.
{
  const a = [
    { key: "shared", text: "shared passage" },
    { key: "a-only", text: "a only passage" },
  ];
  const b = [
    { key: "shared", text: "shared passage" },
    { key: "b-only", text: "b only passage" },
  ];
  const fused = hyb.fuseRRF([a, b], 60, 50);
  check("rrf.shared-first", fused[0].key === "shared", `first=${fused[0].key}`);
  check("rrf.math", approx(fused[0].rrf, 2 / 61, 0.0001), `rrf=${fused[0].rrf} expected=${2 / 61}`);
  check("rrf.single-math", approx(fused[1].rrf, 1 / 62, 0.0001), `rrf=${fused[1].rrf} expected=${1 / 62}`);
  check("rrf.limit", hyb.fuseRRF([a, b], 60, 2).length === 2, "limit not respected");
  const again = hyb.fuseRRF([a, b], 60, 50);
  check("rrf.deterministic", JSON.stringify(fused.map((f) => f.key)) === JSON.stringify(again.map((f) => f.key)), "same input, different order");
}

// 2. Deterministic reranker: known relevance orders correctly.
{
  const query = "soul economy catalog free souls";
  const cands = [
    { key: "c", shelf: "pages", source: "s1", title: "unrelated", text: "The weather today is warm and the garden grows tomatoes.", rrf: 0.03 },
    { key: "b", shelf: "pages", source: "s2", title: "notes", text: "A soul loads into an AI as a system prompt.", rrf: 0.02 },
    { key: "a", shelf: "pages", source: "s3", title: "Soul Economy catalog", text: "The Soul Economy is a free catalog of downloadable AI souls.", rrf: 0.01 },
  ];
  const ranked = hyb.rerank(query, cands);
  check("rerank.best-first", ranked[0].key === "a", `first=${ranked[0].key}`);
  check("rerank.scores-bounded", ranked.every((r) => r.finalScore >= 0 && r.finalScore <= 1), `scores=${ranked.map((r) => r.finalScore).join(",")}`);
  // Blend behavior, locked in: a zero-overlap item with max RRF
  // scores exactly the RRF component (0.4 * 1.0) — the dense leg's
  // top hit may be a paraphrase with no shared terms, and that is
  // signal, not noise. So with skewed RRF it outranks a weak term
  // hit; with EQUAL RRF the deterministic order rules and it falls
  // last. Both behaviors are asserted, not just the convenient one.
  const cEntry = ranked.find((r) => r.key === "c");
  check("rerank.zero-det-pure-rrf", cEntry && cEntry.finalScore === 0.4 && cEntry.detScore === 0, `c final=${cEntry && cEntry.finalScore} det=${cEntry && cEntry.detScore}`);
  const equalRrf = cands.map((c) => ({ ...c, rrf: 0.02 }));
  const rankedEqual = hyb.rerank(query, equalRrf);
  check("rerank.equal-rrf-det-order", rankedEqual[0].key === "a" && rankedEqual[rankedEqual.length - 1].key === "c", `order=${rankedEqual.map((r) => r.key).join(",")}`);
  const again = hyb.rerank(query, cands);
  check("rerank.deterministic", JSON.stringify(ranked.map((r) => r.key)) === JSON.stringify(again.map((r) => r.key)), "same input, different order");
  check("rerank.sync", !!(ranked && typeof ranked.length === "number"), "rerank must return synchronously, no model, no promise");
}

// 3. Scorer seam: swapping the scorer changes order without
// changing callers — this is where a neural cross-encoder plugs in.
{
  const query = "soul economy catalog free souls";
  const cands = [
    { key: "x", shelf: "pages", source: "s1", title: "t1", text: "The Soul Economy is a free catalog.", rrf: 0.03 },
    { key: "y", shelf: "pages", source: "s2", title: "t2", text: "Unrelated garden text.", rrf: 0.01 },
  ];
  const custom = (q, p) => (p.key === "y" ? 1 : 0);
  const ranked = hyb.rerank(query, cands, custom);
  check("rerank.seam", ranked[0].key === "y", `first=${ranked[0].key} (custom scorer must win)`);
}

// 4. Dense exclusion rule (privacy gate): bare profit_bible.md hits
// never reach candidates; full-path form-A passages are unaffected.
{
  check("exclude.bare", hyb.denseExcludedFile("profit_bible.md") === true, "bare basename not excluded");
  check("exclude.gsk-path", hyb.denseExcludedFile("gsk/profit_bible.md") === true, "gsk path not excluded");
  check("exclude.form-a-ok", hyb.denseExcludedFile("deep/genesis/THE-PROFIT-BIBLE.md") === false, "form-A path wrongly excluded");
  check("exclude.other-ok", hyb.denseExcludedFile("pages/GSK - Genesis Journal.md") === false, "ordinary file wrongly excluded");
}

async function vmCases() {
  // 5. BM25-only fallback: dense disabled → block still builds,
  // vectorAvailable false, no throw, format matches recallBlock.
  {
    const r = await hyb.retrieve("What is the Soul Economy?", { denseEnabled: false });
    check("fallback.bm25-block", typeof r.block === "string" && r.block.length > 0, `block=${r.block.length} chars`);
    check("fallback.vector-off", r.vectorAvailable === false, `vectorAvailable=${r.vectorAvailable}`);
    check("fallback.top-shape", r.top.length > 0 && r.top.length <= 6 && r.top.every((h) => h.shelf && h.source && h.text), `top=${r.top.length}`);
    check("fallback.header", r.block.startsWith("## SESHAT DEEP MEMORY"), "block header mismatch");
    check("fallback.literal", r.block.includes(r.top[0].text), "top passage text not preserved literally in block");
    check("fallback.used-hybrid", r.usedHybrid === true, "BM25-only leg must still report usedHybrid");
  }

  // 6. Dense leg throwing → BM25-only, no throw, vectorAvailable false.
  {
    const r = await hyb.retrieve("What is the Soul Economy?", {
      denseFn: async () => { throw new Error("vector store gone"); },
    });
    check("fallback.dense-throw", r.block.length > 0 && r.vectorAvailable === false, `vectorAvailable=${r.vectorAvailable} block=${r.block.length}`);
  }

  // 7. Dense exclusion inside retrieve: injected dense hits, one
  // excluded basename + one good hit → excluded counted, good kept.
  {
    const r = await hyb.retrieve("What is the Soul Economy?", {
      denseFn: async () => [
        { file: "profit_bible.md", category: "bible", text: "Some bible-shaped text about the Soul Economy catalog." },
        { file: "pages/good-note.md", category: "pages", text: "The Soul Economy is a free catalog of downloadable AI souls, scored on Profit plus Love minus Tax." },
      ],
    });
    check("exclude.counted", r.denseExcluded === 1, `denseExcluded=${r.denseExcluded}`);
    check("exclude.good-kept", !r.block.includes("Some bible-shaped text"), "excluded text leaked into block");
  }

  // 8. BM25 leg failing → retrieve throws; the caller-side fallback
  // (legacy recallBlock) still produces a block for the same query,
  // which is exactly what the server wiring falls back to.
  {
    let threw = false;
    try {
      await hyb.retrieve("What is the Soul Economy?", {
        dm: { recallHits: () => { throw new Error("index gone"); } },
        denseEnabled: false,
      });
    } catch (e) { threw = true; }
    check("fallback.bm25-throws", threw === true, "BM25 failure must surface so the caller can fall back");
    const dm = require("../deep-memory/deep-memory.cjs");
    const legacy = dm.recallBlock("What is the Soul Economy?", 6);
    check("fallback.legacy-block", typeof legacy === "string" && legacy.length > 0, `legacy block=${legacy.length} chars`);
  }

  // 9. Full hybrid path on the VM (real dense leg): block builds,
  // vectorAvailable true on this machine (store + cached model).
  {
    const r = await hyb.retrieve("What is the Soul Economy?");
    check("vm.hybrid-block", r.block.length > 0, `block=${r.block.length} chars`);
    check("vm.vector-available", r.vectorAvailable === true, `vectorAvailable=${r.vectorAvailable}`);
    check("vm.counts", r.candidates >= r.fused && r.fused >= r.top.length, `candidates=${r.candidates} fused=${r.fused} top=${r.top.length}`);
  }

  // 10. Format: empty list → empty string, never a header alone.
  {
    check("format.empty", hyb.formatRecallBlock([]) === "", "empty list must give empty block");
    const one = hyb.formatRecallBlock([{ shelf: "pages", source: "s", title: "t", text: "literal passage text here" }]);
    check("format.delimited", one.includes("[1] (Seshat deep memory · pages · s · t)\nliteral passage text here"), "delimited format mismatch");
  }
}

vmCases().then(() => {
  const failed = results.filter((r) => !r.pass);
  console.log(`\n${results.length - failed.length}/${results.length} PASS`);
  if (failed.length) {
    console.log("FAILED:", failed.map((r) => r.name).join(", "));
    process.exit(1);
  }
}).catch((e) => {
  console.log("FAIL harness-error —", e && e.message ? e.message : e);
  process.exit(1);
});
