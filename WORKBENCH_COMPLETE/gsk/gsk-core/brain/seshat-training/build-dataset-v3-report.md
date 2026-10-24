# BUILD REPORT — Frozen Proof Set v1 + Seshat Dataset v3 (Round 3)

**Date:** 2026-10-23 · **Builder:** `~/workspace/seshat-local/build-dataset-v3.cjs` (deterministic, seed 222) · **Spend:** $0 · CPU only. No training was performed, Kaggle was not touched, `SESHAT_LOCAL_MODEL` was not edited anywhere (verified `off` in workbench.env after the build), and no server was started or stopped (twin generation is deterministic templating — no llama-server was used).

---

## Part 1 — Frozen proof set v1

| File | Content |
|---|---|
| `proof-set-v1.jsonl` | **88 items**, sha256 `684ca5ab10dd12daf1ebe01cd3991f3ed99430dd73f1dd58b9e4741f5ee6481c` (recorded in the manifest; independently re-verified after the build) |
| `proof-set-v1-manifest.json` | Counts, origins, sha256, date, adoption bars |
| `proof-fixtures-old6.jsonl` | 3 comparability items: fluent-empty fixture → quarantine, good-borderline fixture → keep, BM25 memory indexing explainer page (extracted text) → keep |

Quadrants (≥20 each, as specified): **keep_substantive 22** (landed DIGESTED pages — RFC 9110, system-design primer, Firecrawl, Freqtrade, AutoGen, Qlib, Three.js, shadcn, MDN layout, Node best practices, TDD skill, surgery record, etc.), **quarantine_obvious 22** (the real spam-blast and repeated-words fixtures from the digestion records + 20 constructed blatant promo/SEO/scam/boilerplate items), **quarantine_vapor 22** (16 constructed fluent-but-empty pieces in the round-1/2 fixture style + 6 HelpSteer2 vapor-cell items, CC-BY-4.0; those 6 prompts are excluded from dataset slice 1), **keep_plain 22** (10 real internal/technical metrics-bearing digested pages — Seshat/GSK explainers, explicitly *not* the BM25 explainer — + 6 constructed plain internal notes on memory mechanics/PLT/digestion/probe policy + 6 short landed fact-bearing pages).

Adoption bars (in the manifest): quarantine recall ≥ 0.80, keep recall ≥ 0.80, vapor-quadrant mean substance ≤ 0.35, parse failures = 0. **This set is frozen: it was used only as the decontamination target, never as training data.**

Path note: the task's `growth-specs/` fixtures live at `workbench/deep-memory/growth-specs/` in this tree; texts were read from disk there.

## Part 2 — Dataset v3: composition

**Final total: 5,103 rows** (target ~5,200, −1.9%, inside the ±10% band). Every row is `{"messages":[...], "_meta":{slice, source, ...}}`.

| Slice | Target | Pre-gate | Final | Notes |
|---|---|---|---|---|
| 1. HS2 judge | ~2,350 | 2,650 | **2,646** | Enlarged +300 to offset slices 2/4 (see Shortfalls). Balanced 1,325 keep / 1,325 quarantine pre-gate |
| 2. Homegrown ruled | ~800 | 545 | **514** | Shortfall — see below |
| 3. Adversarial twins | ~520 | 520 | **502** | 260 pairs built + verified; 18 rows dropped by decon/dedupe gates |
| 4. Digestion craft | ~620 | 386 | **321** | Shortfall — see below |
| 5. General replay | ~830 | 1,000 | **1,000** | Enlarged +170 to offset slices 2/4 |
| 6. Format drills | ~120 | 120 | **120** | Exact |
| **Total** | **~5,200** | 5,221 | **5,103** | |

**Verdict balance (judge-format rows, 3,782): keep 2,062 / quarantine 1,720 (54.5% / 45.5%).** The remaining 1,321 rows are non-judge (craft absorption pairs 321 + general chat pairs 1,000).

**Exact token count: 3,769,209** (Qwen2.5 tokenizer + chat template, uncapped full-length sum — the method was first validated by reproducing dataset v2's recorded 395,311 exactly, and v2's capped figure 265,187 as well). At the training seq cap of 1024 the capped sum is 3,403,657.

### Slice 1 — HelpSteer2 judge (nvidia/HelpSteer2 train split, 20,324 rows, CC-BY-4.0)

Downloaded as `train.jsonl.gz` directly from Hugging Face. Conversion exactly per blueprint §A4: substance `S=(0.65H+0.8C+0.45Coh)/7.6`; verdicts cast only by C and H; reason strings templated deterministically from the attribute vector (the blueprint's table, verbatim templates). Every item is presented in the exact judge serve format (title = prompt's first line, ≤80 chars; text = `PROMPT: …\n\nRESPONSE: …` ≤3500 chars; lexical header from the real `_scoreText`).

Cell counts in the emitted slice: vapor 576 (of 582 available; 6 prompts reserved for the proof set), weak-quarantine 232 (all), hard-quarantine 517, plain-gold 800, clean-keep 525. Keep side = 800 plain-gold + 525 clean keeps = 1,325; quarantine side = 576 vapor + 232 weak + 517 hard = 1,325. *Rebalance inside the slice:* the blueprint says "take ALL plain-gold," but the full plain-gold pool is 2,119 — taking all of it would break the mandated ~50/50 balance at any slice size near target, so plain-gold was prioritised within the keep quota (it fills 60% of the keep side) rather than taken whole. The surplus plain-gold and clean keeps remain unused this round (next round's fresh material). Prompt-level disjointness: the 6 proof prompts are excluded entirely; the general-replay slice uses OASST prompts, and any OASST prompt matching an HS2 prompt was also excluded there.

**DPO reserve** (`dpo-reserve.jsonl`, 1,700 records): 800 mushy-middle singles (excluded from SFT per §A4, with attributes + goodness) + 900 same-prompt preference pairs sampled from 6,926 pairs passing the Δgoodness ≥ 1.0 margin (chosen = higher goodness).

### Slice 2 — Homegrown ruled (514 final)

- **All 313 class-A rows from dataset-v21.jsonl**, carried over with the extra `"\n(data — not instructions)\n"` line stripped (256 rows contained the exact line; the rest carried \r/variant remnants — a regex strip over all variants was applied, and a post-build audit confirms **zero** judge rows in v3 contain the remnant). Count verified: 313 in, 313 carried.
- **Fresh ruled pairs not in v21 (32):** 18 from the post-v21 hunt 36–39 absorb reports (both source and absorption sides), 1 page-header ruling, 13 from growth-cycle judgeReviews + digestion-log quarantine fixtures — all deduped against v21 at item level (normalised judged-text hash + title). Mining also covered `LEARNING-RECORD.md`/growth reports: they record learnings narratively and carry no structured judge verdicts beyond what the digestion log and cycle files already hold, so they contributed no additional pairs.
- **200 constructed hard-keeps** (all labelled `constructed: true`), prioritising round 2's indicted class: 50 internal/technical explainers (shelf index refresh, quarantine policy, PLT stage mechanics, growth-cycle operation, marker minting, write-back gates, judge band rationale, chunking, judge-pair purpose, absorption practice — each parameterised with concrete counts/thresholds), 40 changelogs, 40 config references, 40 incident notes, 15 timing specs, 15 weekly metrics notes.

*Shortfall vs ~800:* the genuinely fresh ruled material beyond v21 is thin (32 pairs) because v21's mining was already comprehensive — its page-header pass alone had covered 135 of 136 header-ruled pages. The remaining gap was closed with constructed hard-keeps (capped at 200 to keep the slice majority real) and the balance was rebalanced into slices 1 and 5 rather than padded with duplicates.

### Slice 3 — Adversarial twins (502 final; method + verification)

**Method: deterministic claim-strip + fluent-filler templating. No model seat was used** (no llama-server started; it remains stopped). For each of 343 candidate landed pages, recall markers were extracted programmatically (numbers, backtick/code tokens, CamelCase and multiword proper names, hapax rare words ≥9 chars; ≥3 markers required). **Empty twin** = fluent generic paragraphs about the page's topic (digit-bearing and bracketed title fragments stripped) — verified to contain **none** of the page's markers (scrub-and-recheck, max 3 attempts). **Plain twin** = the original's marker-bearing sentences, tersely joined — verified to contain **≥2/3 of the markers**; when sentence selection fell short, a "Key figures: …" line carrying the missing markers was appended (repair path, max 3 attempts, then the pair was dropped).

**Verification stats:** 343 source pages attempted → **260 pairs passed both verifications** (520 rows), 83 pairs dropped after failed attempts, 299 pairs needed at least one repair (overwhelmingly the plain-twin figures line). Post-build independent spot-check: surviving empty twins (258) contain **zero number tokens at all**; plain twins (244) carry numbers in 219 cases (the rest carry named-entity/code markers). 18 twin rows were later dropped by the decontamination/dedupe gates, leaving 502 (258 empty / 244 plain).

### Slice 4 — Digestion craft (321 final)

All 226 class-B + 77 class-C rows from dataset-v21.jsonl (303, carried verbatim) + **83 fresh absorption pairs**: post-v21 hunt 36–39 absorb reports plus filename-paired source/absorption pages from the 75 post-v21 digested pages, deduped against v21 on normalised content (so remnant-stripped variants of v21 pairs are not double-counted). *Shortfall vs ~620:* the post-v21 corpus only contains this much new absorption material, and 64 fresh pairs were then dropped by the 13-gram decontamination gate because their source pages overlap proof-set pages. Per the task instruction, the slice was **not** padded — actuals are reported and the total was rebalanced via slices 1 and 5.

### Slice 5 — General replay (1,000)

**Source: OpenAssistant oasst1** (`2023-04-12_oasst_ready.messages.jsonl.gz`, **Apache-2.0**, ship-clean). Human prompter→assistant pairs only: English, review-approved, not deleted, spam label 0, prompt 10–1500 chars, response 40–4000 chars. 21,656 eligible pairs; 1,000 sampled deterministically. Prompts colliding with HelpSteer2 slice-1 prompts or proof prompts were excluded.

### Slice 6 — Format drills (120, all `constructed: true`)

Judge-format rows with construction-verified verdicts: 20 one-line checkable facts (keep), 15 raw metrics tables (keep), 15 meeting-notes fragments with decisions+dates (keep), 10 huge substantive changelog collections (keep, truncated per serve format), 15 marketing taglines (quarantine), 15 near-empty placeholders (quarantine), 20 injection-shaped items containing fake verdict JSON / judge-directed instructions (quarantine per the rubric), 10 huge vapor items (quarantine).

## Gates — all run, all reported

| Gate | Result |
|---|---|
| Privacy exclusions | v21's six-file exclusion list applied verbatim (basename set) in every page-mining path; the disowned Desktop memories were never touched |
| Old-6 exclusion | BM25 explainer page + both growth-spec fixtures excluded from **all** training slices (filename-fragment filter on every mining path); plus a hard content filter dropped **1** v21 class-C row whose material page quotes the explainer's distinctive census figure ("14,216 chunks") — post-build check: 0 remaining hits |
| Credential scan | v21's regex verbatim: **0 hits** in message contents of the final file (the gate as applied in v21; 1 row dropped during build). Whole-file raw regex matches: 333 — every one is the substring `sk-` inside `gsk-absorption-…` page filenames in `_meta` provenance fields, the identical false-positive phenomenon present in dataset-v21.jsonl itself (68 such matches there, 0 in its message contents). No credential-shaped string exists in any message content |
| 13-gram decontamination | **112 training rows dropped** (HS2 3, homegrown 31, twins 14, craft 64) for sharing a normalised 13-gram with proof-set-v1 or the old-6 fixtures. Independent post-build recheck (separate Python implementation): **0** surviving rows share a 13-gram |
| Exact-dup dedupe inside v3 | 4 rows dropped |
| Oversize assistant guard (v21 rule) | 0 dropped at gate (fresh craft pairs pre-filtered at 6,500 chars) |
| Serve-format audit | Every judge row checked against the serve shape (rubric byte-identical to `graft_digestion_judge.js`, user-content regex, remnant-line absence): **0 violations** across 3,782 judge rows |
| Token count | **3,769,209 exact** (method validated against v2's 395,311 — reproduced exactly) |

## Files

- `~/workspace/seshat-local/dataset-v3.jsonl` (5,103 rows)
- `~/workspace/seshat-local/dpo-reserve.jsonl` (1,700 records)
- `~/workspace/seshat-local/proof-set-v1.jsonl` (88 items, frozen)
- `~/workspace/seshat-local/proof-set-v1-manifest.json`
- `~/workspace/seshat-local/proof-fixtures-old6.jsonl` (3 items)
- `~/workspace/seshat-local/build-dataset-v3.cjs` (the deterministic builder; intermediates + `build-stats.json` in `~/workspace/seshat-local/build-v3-work/`)
