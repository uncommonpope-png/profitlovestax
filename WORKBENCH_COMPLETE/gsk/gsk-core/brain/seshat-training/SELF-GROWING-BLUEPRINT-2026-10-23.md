# SELF-GROWING BLUEPRINT — What to Train Seshat On, and How GSK Learns to Train Her Himself

**Date:** 2026-10-23 · **Companion memos (read first, not repeated here):** `TRAINING-RESEARCH-2026-10-23.md` (how to train a small judge LoRA: balance, hard negatives, GBNF, DPO, proof design) and `DATA-CATALOG-2026-10-23.md` (dataset inventory, licenses, the 5-stage train_seshat sketch).
**Conventions:** **[Sourced]** = stated in a cited source. **[Inference]** = my application of sourced facts to our setup. **[Estimate]** = a number I derived from our measured runs; treat as a planning range, not a measurement.
**Spend:** $0. Research only; nothing was trained, downloaded, or changed.

---

## 0. Framing: Seshat is not a component — she is the brain

The owner's doctrine (Oct 23, 14:31 CDT): *"Seshat is the most important piece — Seshat is GSK's brain."* This memo is written to that standard:

- **Her judgment quality is the product's core metric.** Not token throughput, not page count. The numbers that define whether GSK is good are: her per-class recall on the frozen proof set, the mean substance score she assigns the fluent-but-empty quadrant, and her disagreement rate against verified outcomes in shadow running. Everything else in this blueprint exists to move those three numbers.
- **The keyless ship criterion makes her the ship gate.** GSK ships with no external key; a key only *adds*. A downloadable body whose built-in brain misjudges what to remember is a harness with good marketing. Her proof scores are therefore release criteria, not research trivia.
- **Self-growing means she is raised, not maintained.** The end state is GSK running the curate → train → proof → adopt loop on his own brain, with the operator's role shrinking to setting policy bars and reading decision files. §B4 specifies that loop as an implementable skill; §B5's ladder names each rung and its proof.

**What this memo adds over the two prior memos:** (1) a GPU-hour spend plan for the ~29 remaining Kaggle hours, so no hour idles and none is wasted; (2) a staged *curriculum* (not just a dataset list) with mixing ratios tied to evidence; (3) a concrete HelpSteer2→judge-lesson conversion with thresholds, cell definitions, and expected yields; (4) the continual-growth protocol (versioning, replay, when to retrain from scratch); (5) the self-training loop formalized against the collapse literature; (6) adoption gating borrowed from production ML (champion/challenger, shadow, canary, rehearsed rollback); (7) the `train_seshat` skill specified to implementable depth; (8) honest limits and the milestone ladder.

---

## 1. The GPU-hour budget: ~29 hours, every one assigned

**Budget facts.** The Kaggle account (uncommonpope) shows a 30 GPU-hour quota; ~29 h remain in the current window. **[Sourced]** Kaggle's free GPU quota is 30 h/week and resets weekly (Saturday ~midnight UTC); sessions can run up to 9–12 h in the background. (https://readmedium.com/free-gpus-for-training-your-deep-learning-models-c1ce47863350 ; https://www.geeksforgeeks.org/machine-learning/how-to-use-gpu-in-kaggle/) **[Inference]** So this is a *weekly cadence*, not a one-shot war chest — but the owner's instruction stands: within this window, no hour sits idle with no job, and no hour burns on a run the evidence doesn't justify.

**Measured anchor.** Round 1: 283 examples, ~57 min end-to-end on a T4, final loss 1.9345 (run record: `2026-10-23-kaggle-training-run.md`). Round 2 (625 examples) is in flight at ≈1 h. **[Estimate]** Per-example cost after startup overhead is roughly 3–6 s/example-epoch at our current micro-batch settings; round 1's OOM ladder settled at micro-batch 1, which is inefficient — recovering micro-batch ≥4 via gradient checkpointing is the single largest time lever and is a *pre-flight check*, not a research project.

**The ranked run queue.** Runs are chained: while one trains, the next run's dataset is built on CPU (curation costs no GPU). Proofs run locally on llama.cpp (0 GPU-hours). No run starts until its input artifacts exist and its predecessor's gate has been read.

| # | Run | Est. GPU-h | What it buys | Gate before it starts |
|---|-----|-----------|--------------|----------------------|
| R2 | Round-2 SFT finish + merge (in flight) | ~1 (already committed) | The balance-fixed homegrown model; decides whether data shape alone clears the bar | — |
| P2 | Round-2 proof + base regression (local) | **0** | The verdict that routes the rest of the budget: pass → skip to DPO; fail on vapor quadrant → round 3 as designed; fail on format → grammar/template fix first (research memo #1) | R2 artifact pulled |
| R3a | **Round-3 SFT** on dataset v3 (~5,000 lessons, §A2 mix) | **3–5** | The discrimination muscle: thousands of human-ruled pairs (HelpSteer2 conversion, §A4) + both-direction twins + homegrown core. This is the highest-value unspent run in the queue | v3 manifest frozen (§B4 S2); step-time profiled in the first 10 min — if projected total exceeds 5 h, cut epochs on the general slice, never on ruled pairs |
| R3b | **DPO pass** on the R3a model (~600–900 same-item pairs, §A4) | **0.5–1** | Boundary calibration — the literature's specific remedy for our failure ("SFT only is insufficient," ICLR 2025 judge paper, per research memo Q4) | R3a proof read; pairs built (CPU) during R3a |
| P3 | Round-3 proof + incumbent head-to-head (local) | **0** | Adoption decision under §B3 gates | R3b done |
| R4 | **Iteration-2 run**: whichever the P3 failure file indicts — a second DPO seeded with R3's own errors, *or* SFT v3.1 with the HelpSteer2 slice doubled | **1.5–2.5** | Converts round 3's filed failures into the next improvement; this is the self-growing loop's first real turn (§B1) | P3 decision file names the failure class |
| RSV | Failure reserve: one full re-run of any failed/OOM'd run + per-epoch checkpoint evals inside R3a/R4 | **~3** | Insurance so a single bad kernel never eats a planned run | — |
| HOLD | Unassigned remainder | **~14–17** | **Deliberately unspent this window.** Held for next week's window-opening runs (the quota renews; the *queue* is what must never be empty, not the meter). Spending these on a third SFT variant before P3 is read would be exactly the low-value burn the owner prohibited | — |

**Rules of the queue.** (1) A run that finishes early hands its hours to the next ranked run, never to a repeat of itself. (2) Every GPU run writes a DONE marker + loss summary the watcher can read without a human. (3) If a run's first-10-minutes projection busts its estimate by >50%, it is killed and re-planned — a slow run is a data/config bug, not a patience test. (4) The dataset for run *n+1* is always built and frozen while run *n* trains; GPU idle-time waiting on data prep is the one true waste in this plan.

---

# QUESTION A — WHAT TO TRAIN HER ON

## A1. Curriculum: the order of teaching

**What the evidence says.**

- **[Sourced]** LIMA's Superficial Alignment Hypothesis: capabilities come from pretraining; a small set of curated examples teaches *format and style* — LIMA's 65B learned response formats "from only a handful of examples" using 1,000 curated pairs total, and ablations showed "vastly diminishing returns when scaling up data quantity without also scaling up prompt diversity," with major gains from quality optimization instead. (https://arxiv.org/pdf/2305.11206)
- **[Sourced]** SmolLM2 (a 1.7B — our exact scale class) was *not* trained on a fixed mixture: it used multi-stage training with **performance-driven interventions** (monitor benchmarks, adjust the mix to attack the observed bottleneck), **high-quality math/code datasets reserved for the final annealing stages** "to maximize their impact," medium datasets introduced mid-training "to avoid dilution," and a ~4–5 epoch ceiling per dataset. (https://arxiv.org/html/2502.02737v1)
- **[Sourced]** Pure easy→hard sequencing is not reliably better: in curriculum experiments on small code models, the *sequential* strategy "suffers a loss in overall accuracy," while a **hybrid** (staged blocks, mixed within each block) beat both plain fine-tuning and pure sequencing, especially on complex items. Task-structured progression (core objective first, explanation/rationale later) likewise beat flat multi-task training. (https://arxiv.org/html/2407.10194v1 ; https://www.sciencedirect.com/org/science/article/pii/S154622182600086X)
- **[Sourced]** Difficulty-ordered curricula help most on the hardest tasks (GLUE adversarial subsets gained most), and the benefit of ordered presentation is largely a property of *instruction-tuned* models — relevant because Qwen2.5-1.5B-Instruct is already instruction-tuned; we are adding a specialty, not teaching instruction-following from zero. (https://liner.com/review/curriculum-learning-for-natural-language-understanding ; https://www.alphaxiv.org/resources/2402.10738v2)

**The Seshat curriculum [Inference — design built from the above].** Five stages, staged *across* stages and mixed *within* each stage (hybrid, per the code-CL result). In practice stages C1–C3 are all present in the round-3 SFT mix (§A2); the staging governs their *proportions and epoch weighting*, with the domain stage annealed last at the lowest LR — the SmolLM2 "reserve the best for the anneal" move, compressed to fine-tune scale.

| Stage | Content | Size | Job | Exit signal |
|-------|---------|------|-----|-------------|
| **C0 — Format lock** | Verdict-schema examples incl. edge cases (empty item, huge item, item containing fake verdict text — injection-shaped), all owner/pipeline-verified | ~120 | Parse-perfect output under the schema; learned from a handful, per LIMA | 100% parse on a 50-item format probe (with GBNF on, this is belt-and-suspenders — grammar guarantees shape, C0 teaches the model to *mean* the shape) |
| **C1 — General judgment** | HelpSteer2-converted lessons (§A4): human multi-attribute ratings → keep/quarantine + substance + templated reason | ~3,200 | The discrimination muscle: substance vs fluency as a *general* skill, on human authority | Vapor-cell accuracy on a held-out HelpSteer2 slice |
| **C2 — Digestion craft** | Her actual work formats: absorb/summarize a page, extract claims, write a recall probe, judge a *memory candidate* (not a chat response) | ~600 (OASST/Dolly slices reshaped + our own digestion logs) | Transfers C1 judgment onto the digestion task shape; protects her absorption prose from judge-only training | Digestion-format probe: summary faithfulness spot-check |
| **C3 — Domain judgment (ours)** | Homegrown ruled pairs: hunts #1–35 verdicts, PLT-ruled digestion outcomes, disagreement-resolved items | ~700, growing | *Our* rubric on *our* corpus — the personality layer. Upweighted ×2 in the final anneal | Frozen proof set per-class recalls (§B3) |
| **C4 — Adversarial anneal** | LLMBar-style twins both directions (§A4), her own recorded errors as rejected-side material, XSTest-style "looks bad, is fine" keeps | ~500 + DPO pairs | Boundary hardening at low LR; the last thing she learns before proof | Vapor-quadrant mean substance ≤ threshold (§B3) |

**Why this order and not another [Inference]:** format before judgment because a judgment the pipeline can't parse is a failed judgment (round 1's unparseable reply); general before domain because at 1.5B the general discrimination must exist before the narrow rubric can attach to it (Auto-J's lesson — criteria'd general judgments transfer; our 92 pairs alone were "under-criteria'd," per the catalog); domain last and annealed because the final training signal is what the model's prior sits closest to (SmolLM2's annealing finding), and we want that prior to be *ours*; adversarial last because hard negatives taught before the positive concept exists teach "polished = bad" (research memo Q2).

## A2. Mixing ratios: how much of what, in the round-3 SFT set

**Evidence.**

- **[Sourced]** Mixed training removes the specialization trade-off: in a controlled Flan-T5 study, task-only fine-tuning collapsed general NLI accuracy 81% → 16.5%, while **a 1:1 task:general mix matched task-only performance on the target task (12.0% both) and preserved general accuracy (86.2%)** — and even a 15:1 skew (only ~6% general exposure) prevented collapse (83.8% NLI). "Task-only finetuning is strictly dominated." (https://arxiv.org/html/2512.13706)
- **[Sourced]** Replay is not merely defensive: mixing generic data during target-task training *improved target-task data efficiency* up to 1.87× (Flan) / 1.49× (math) at a non-zero optimal replay fraction — the generic data acts as a regularizer that helps the new task too. (https://arxiv.org/html/2603.04964v1)
- **[Sourced]** Practitioner rehearsal guidance converges on **~1–10% general data** as the floor for forgetting prevention in narrow fine-tunes, with conservative LR/epochs and canary evals as the complementary controls. (https://backbenchlearner.com/genai/module-3-finetuning/session-2-data-training/catastrophic-forgetting.html)
- **[Sourced]** LoRA itself is a forgetting brake: Biderman et al. show LoRA "learns less and forgets less" than full fine-tuning — it forgets less than weight-decay/dropout regularization and preserves generation diversity — so a LoRA student needs *less* replay protection than a full fine-tune at the same task gain. (https://arxiv.org/pdf/2405.09673)
- **[Sourced]** Phi's "textbook quality" line (Phi-1/1.5) is the small-model existence proof that *density of quality* substitutes for scale: heavily filtered, textbook-style data let 1.3B models punch far above their size class. (https://arxiv.org/abs/2309.05463)
- **[Sourced]** Tulu 3's published SFT recipe (939K prompts) is the mixture-engineering reference: skill-targeted subsets, per-source downsampling, and decontamination against evals — the method transfers even where their rows don't. (https://allenai.org/blog/tulu-3-technical ; catalog §3)

**The v3 mix [Inference].** Target ~5,200 SFT lessons (fits the R3a budget line, §1):

| Slice | Share | Count | Source |
|-------|-------|-------|--------|
| Ruled judge pairs — HelpSteer2-converted (C1) | ~45% | ~2,350 (balanced ~50/50 internally) | §A4 conversion, SHIP-SAFE |
| Ruled judge pairs — homegrown (C3, anneal-upweighted) | ~15% | ~800 | Hunts/digestion verdicts, outcome-verified |
| Adversarial twins (C4) | ~10% | ~520 | Own pages, both directions |
| Format lock (C0) | ~2% | ~120 | Hand-verified |
| Digestion craft (C2) | ~12% | ~620 | OASST/Dolly reshaped + own digestion logs |
| General instruction replay | ~16% | ~830 | OASST (Apache-2.0) + SmolTalk clean slices (catalog §3) |

Reasoning, briefly: ruled pairs are ~70% of the mix because judgment *is* the job (the 1:1 study protects general ability at far lower task shares than this — we can afford task-dominance); general replay at ~16% sits above the 6% collapse-prevention floor and inside the band where replay *helps* the target task, sized up because Seshat is also GSK's memory *writer* — her summarization prose is a general-ability surface we cannot let the judge training erode; LoRA's inherent forgetting resistance (Biderman) is why we don't need the full 50% general share a full fine-tune would demand.

## A3. Data quality engineering: the pipeline that makes labels trustworthy

**The stages [Sourced mechanisms; Inference assembly].**

1. **Dedup, exact + near.** Exact-hash dedup, then MinHash near-dedup. **[Sourced]** Deduplicating training data measurably improves models and reduces memorized regurgitation (Lee et al., *Deduplicating Training Data Makes Language Models Better*, https://arxiv.org/abs/2107.06499). At our scale the sharper reason is ratio integrity: a duplicated quarantine is a fake second vote for the same boundary point.
2. **Decontamination against the proof set.** Any candidate sharing a long n-gram (design: 13-gram) with any frozen proof item is dropped, no exceptions. **[Sourced]** This is standard practice in the Tulu/FineWeb recipes (catalog §3; https://allenai.org/blog/tulu-3-technical). A proof item that leaks into training converts the proof into a memory test — the one unforgivable sin in a self-growing system, because every later gate trusts it.
3. **Classifier filtering for bulk slices.** For any future bulk web/page slice, a fastText-style quality classifier in the DCLM mold: **[Sourced]** DCLM's classifier was trained with curated Q&A (OpenHermes-2.5, ELI5) as positives vs RefinedWeb as negatives, and its baseline operating point retains roughly the top ~10% (AllenAI's DataDecide reproduction is literally named `dclm-baseline-qc-10p`). FineWeb-Edu's variant: a regressor trained on Llama-3-70B educational annotations, thresholded (≥3 of 5) to keep ~1.3T of 15T tokens. (https://arxiv.org/html/2509.18577v4 ; catalog §3)
   **⚠️ [Sourced] caution that applies directly to us:** a 2026 audit of DCLM and FineWeb filters found they retain AI-generated text at far higher rates than human text (DCLM kept 14.5% of AI-labeled pages vs 1.5% of human-labeled in a 10,000-page audit) — fluency-anchored "quality" filters systematically prefer polished text. (https://medium.com/@mehmet.ozel2701/these-ai-data-filters-prefer-ai-text-over-human-writing-750990435d06) **[Inference]** A style-anchored filter inside Seshat's curation would *manufacture vapor keeps* — it is round 1's disease implemented as a preprocessing step. Our filter's positive class must be **substance-anchored** (human correctness labels, verified outcomes), never style-anchored. This is a design rule, not a preference.
4. **Perplexity filtering: floor only.** **[Sourced]** Perplexity-based filtering (CCNet lineage, https://arxiv.org/abs/1911.00359) removes junk/gibberish effectively but is a fluency statistic — the same objection as (3). **[Inference]** Use it, if at all, as a bottom-decile junk cut on bulk slices, never as a quality ranking for judge data.
5. **Teacher-label verification — the math of trust.**
   - **[Sourced]** Swap-consistency filtering is savage and necessary: PandaLM discarded ~70% of 1M GPT-3.5 judgments (1M → 300K) keeping only order-consistent ones (catalog §1.3). JudgeLM's published agreement (>90% with GPT-4) came at 100K scale *with* the same filtering family (catalog §1.2).
   - **[Sourced]** Even elite human annotation is attribute-dependent: HelpSteer2's post-processed inter-annotator κ was **0.79 for correctness but only 0.43 for coherence** — some attributes are near-objective, others are taste. (https://arxiv.org/html/2406.08673v1) **[Inference]** Convert and train on the high-agreement attributes (correctness, helpfulness); never let a low-agreement attribute (coherence, complexity) cast a verdict vote.
   - **[Sourced]** Filtering *creates* reliability: HelpSteer2-Preference's agreement rose from κ 0.489 → 0.878 after disagreement filtering; and pairwise judgment carries signal ratings miss — in 45.5% of pairs with *identical* helpfulness ratings, annotators still held consistent preferences. (https://www.alphaxiv.org/overview/2410.01257v1) **[Inference]** This is why the DPO pairs (§A4) are not a garnish: pairwise contrast encodes boundary information that scalar verdicts structurally cannot.
   - **Verified-vs-raw exchange rate — stated honestly [Inference]:** no source publishes a universal conversion ("1 verified = N raw"), and anyone who quotes one is inventing it. The anchor points we do have: LIMA's 1,000 curated ≈ full RLHF pipelines for format/style at 65B (§A1); AlpaGasus improved Alpaca by *deleting* 43K of 52K examples via quality scoring (https://arxiv.org/abs/2307.08701); Auto-J's ~4.4K criteria'd judgments beat GPT-4 pairwise at 13B (catalog §1.4). **House rule [Inference]:** in any *ship* build, the count of unverified teacher labels is **zero**. A label is admissible iff it is (a) human (HelpSteer2, owner rulings), (b) outcome-verified (the pipeline later proved the verdict right — recall landed, or the quarantined item's absence caused no miss), or (c) consistency-filtered *and* spot-audited. Everything else is method-only material.

## A4. Converting HelpSteer2 into judge lessons — the concrete design

**The raw material [Sourced].** `nvidia/HelpSteer2` (CC-BY-4.0, SHIP-SAFE; catalog §1.11): 21,362 responses, each with human means (~3.41 annotators) on five 0–4 attributes: helpfulness (H), correctness (C), coherence (Coh), complexity, verbosity (V). NVIDIA's own downstream use is our template: for their DPO set they took the higher-helpfulness response of each same-prompt pair as chosen, discarded ties (→ 7,221 pairs), and for iterative rounds scored responses with a **goodness formula: 0.65·H + 0.8·C + 0.45·Coh**, chosen because it "best differentiates" chosen from rejected. (https://arxiv.org/html/2406.08673v1)

**Conversion rules [Inference — design].** Substance score: `S = (0.65H + 0.8C + 0.45Coh) / 7.6` ∈ [0,1] (7.6 = the formula's max). Verdicts are cast **only** by H and C (the high-κ attributes, §A3.5); Coh and V never vote — they *classify the cell*:

| Cell | Condition | Verdict | Reason string (templated, checkable) |
|------|-----------|---------|--------------------------------------|
| Clean keep | C ≥ 3 and H ≥ 3 | **keep**, score = S | "correctness {C}/4, helpfulness {H}/4: claims check out and the item carries usable substance" |
| Hard quarantine | C ≤ 1 (any H, any V) | **quarantine**, score = S | "correctness {C}/4: central claims wrong or unsupported — not memory-safe" |
| Weak quarantine | H ≤ 1 and C ≤ 2 | **quarantine** | "helpfulness {H}/4 with correctness {C}/4: no usable substance to retain" |
| **Vapor cell** ⭐ | V ≥ 3 and Coh ≥ 3 and C ≤ 1 | **quarantine** (subset of hard) | "verbosity {V}/4, coherence {Coh}/4, correctness {C}/4 — fluent and well-formed but factually empty; fluency is not evidence" |
| **Plain-gold cell** ⭐ | V ≤ 1 and C ≥ 3 | **keep** | "terse (verbosity {V}/4) but correctness {C}/4: substance does not require polish" |
| Mushy middle | C = 2, or H = 2 with C ≥ 2, not above | **excluded from SFT** | — reserved as DPO raw material / dropped |

The reason strings are *generated from the attribute vector by template* — deterministic and auditable, so the conversion cannot confabulate reasons the way a teacher model would (the exact failure her round-1 reason committed). The item presented to her is the prompt+response reframed as a candidate memory note, with the criterion line stating the PLT-style rubric — the Prometheus feedback-then-`[RESULT]` schema stolen in catalog §1.1, with "feedback" here = the templated attribute read-out.

**Expected yields [Estimate — must be computed exactly at build time; the build script prints the true counts and the manifest records them].** HelpSteer-family responses skew good (v1 descriptive stats: mean correctness ≈ 2.84/4), so from 21,362 rows expect roughly: clean keeps ~7,000–9,000; hard+weak quarantines ~2,000–3,000; vapor cell ~400–800; plain-gold ~600–1,000; mushy middle the remainder (~8,000). We do **not** train on all of it: the C1 slice samples **~2,350 lessons balanced ≈50/50** — all vapor-cell and plain-gold items (they are the curriculum's point), all hard quarantines up to parity, clean keeps downsampled to match — because §A1's diversity finding (LIMA) says 2,350 *diverse* ruled lessons beat 9,000 skewed ones, and the surplus keeps are worth more as next round's fresh material than as this round's majority class.

**DPO pairs [Inference, following NVIDIA's sourced recipe].** Same-prompt response pairs: chosen = higher goodness, rejected = lower, **require Δgoodness ≥ 1.0** (NVIDIA discarded only exact ties; the margin is our tightening — pairs the annotators couldn't separate teach mush). Expect ~5,000 margin-passing candidates **[Estimate]**; sample ~600–900, length-balanced (research memo Q4: unbalanced pairs teach length-hacking), seeded with two hand-built pair types NVIDIA can't give us: (her own 0.95 vapor judgment as rejected vs the ruled quarantine as chosen) and (twin pairs from §A4-twins).

**Twins at scale from our own pages [Inference — build spec].** For ~300 of her kept pages: (i) **Empty twin** — a rented seat rewrites the page fluently with every checkable claim stripped (names, numbers, mechanisms → confident generalities). *Programmatic verification:* the page's own recall markers (the BM25 probes that proved the original landed) must **fail** against the twin. A twin whose markers still hit wasn't emptied — regenerate or discard. Label: quarantine; reason auto-names the removed claim classes. (ii) **Plain twin** — the same page compressed to terse, unpolished form. *Verification:* recall markers must **hit**. Label: keep. Yield: ~600 lessons + the originals as keeps. Cost: ~900 rented-seat calls, CPU-minutes — $0 GPU. **[Sourced basis]** the LLMBar construction recipe + our own recall-proof machinery (catalog §1.5, §2).

## A5. Continual growth: how new lessons join without retraining chaos

**Versioning [Inference — spec].** Datasets are **append-only and content-addressed**: `dataset v{round}.{minor}` with a manifest (per-item: hash, source, license tag, verdict provenance, consistency status). History is never edited; a bad item is excluded by a *new* version's exclusion list, so any past model remains exactly reproducible. This is not bookkeeping fussiness — §B1 shows accumulation-vs-replacement is the collapse literature's central variable; the versioning discipline *is* the safeguard, implemented as file policy.

**Replay core [Inference].** Every round's mix contains a frozen **replay core**: 100% of prior *verified homegrown* ruled pairs (they are few and they are the personality), ~20% of the prior HelpSteer2 slice (rotating), and the full prior twin set. New material joins *around* the core; the core's share is capped at ~40% of the round so growth stays growth, not reheating. **[Sourced support]** replay at non-zero fractions both prevents forgetting and improves target-task efficiency (§A2); Muennighoff-style repetition limits (~4–5 epochs total exposure per item, via SmolLM2) retire items from the core after their fifth round.

**Retrain-from-base vs incremental LoRA — the decision rule [Inference].**

- **Default: full retrain from the pristine base on the accumulated union.** While the union is ≤ ~10K lessons and a run fits the ~5 GPU-h envelope, this is *strictly* the right call: it is the Gerstgrasser accumulation regime (§B1), it avoids adapter-on-adapter compounding (each incremental LoRA is trained against a shifted base it then merges into — drift with no clean reference), and at our scale it costs less than the engineering to make incremental updates safe.
- **Switch to incremental only when** the union retrain exceeds ~6 GPU-h or ~25K lessons. Then: continue LoRA on the *merged incumbent*, with ≥30% replay-core share, and a mandatory head-to-head proof against the last from-base reference model; if the incremental model loses any per-class bar the reference held, the line reverts to from-base on the next round.
- **Kill criteria for a data batch:** if a teacher-generated batch's swap-consistency survival is <50% (PandaLM's was ~30% survival at GPT-3.5 quality — a batch surviving *less* than that is below a published floor), the batch is quarantined wholesale and the *generator prompt* is what gets fixed. Items are cheap; a poisoned batch taught at scale is not.

---

# QUESTION B — HOW TO MAKE A SELF-GROWING LLM

## B1. The loop, formalized — and what stops it eating itself

**The loop.** `EXPERIENCE → GENERATE candidates → VERIFY → CURATE (balance/filter/version) → TRAIN → PROOF → ADOPT or FILE → (filed failures become next round's candidates)`. Every published self-improvement method is this loop with a different verifier and a different anchor:

| Method | Generates | Verifier | Anchor against drift | Lesson for us |
|--------|-----------|----------|---------------------|---------------|
| **STaR** (https://arxiv.org/abs/2203.14465) | Rationales for problems it got wrong ("rationalization" with hints) | Ground-truth final answer | The fixed problem set + correct answers | Self-generated *reasoning* is trainable only when an external check certifies the ending |
| **Rejection sampling / RFT** (https://arxiv.org/abs/2308.01825) | Many sampled solutions per problem | Answer-match against ground truth; dedup survivors | Ground truth + diversity of samples | Best-of-n under a verifier is the safest self-training shape — and the one our pipeline already resembles (recall proofs = the match check) |
| **Self-Rewarding LMs** (https://arxiv.org/abs/2401.10020) | Responses + self-judgments | **Itself** as judge (LLM-as-judge prompting), DPO on its own rankings | Weak — iteration gains shown at 70B with a strong base judge | The end-state fantasy and the cautionary tale in one paper: self-verification works when the judge is already strong. Ours isn't, yet (§B5) |
| **SPIN** (https://arxiv.org/pdf/2401.01335) | Responses from the previous iteration (opponent) | Discrimination against a **fixed human target distribution** | The human data itself — SPIN provably converges *to the target distribution*, which caps it there | Self-play cannot exceed its anchor. Choose the anchor like it matters, because it's the ceiling: ours = human rulings + verified outcomes |
| **Self-distillation** (STaR/best-of-n family) | Own best outputs under a teacher/verifier | The selecting verifier | Same as RFT | At 1.5B the "teacher" is her own best-of-n *under PLT/outcome checks*, never her raw output |
| **Voyager skill library** (https://arxiv.org/abs/2305.16291) | New *skills* (code), not weights | Environment execution success + self-verification before a skill enters the library | The library only admits verified skills; growth compounds **without touching weights** | The proof that an entity can grow enormously on the non-weight side. Seshat's pages + GSK's skills are this; weight rounds are the rare, gated exception, not the growth medium |

**The collapse literature — what actually happens unchecked.**
- **[Sourced]** Shumailov et al. (*Nature* 2024): training successive generations on predecessor output causes **model collapse** — *early* collapse eats the distribution's tails (rare items vanish while averages can still look fine, even improve), *late* collapse converges to a narrow, repetitive distribution bearing little resemblance to the original. (https://www.nature.com/articles/s41586-024-07566-y ; summary https://www.research.ed.ac.uk/en/publications/ai-models-collapse-when-trained-on-recursively-generated-data/)
- **[Sourced]** Gerstgrasser et al.: the catastrophe is conditional on **replacement**. When each generation's synthetic data *replaces* the real data, error grows without bound; when synthetic data **accumulates alongside** the original real data, test error has a finite bound independent of iteration count — collapse does not occur, across model sizes and architectures. (https://arxiv.org/abs/2404.01413)
- **[Sourced]** Self-consuming-loop studies (Alemohammad et al., via https://www.ultralytics.com/glossary/model-collapse) add: without fresh real data each generation, quality/diversity degrade; cherry-picking "best" outputs preserves quality *at the expense of diversity* — a filtered loop quietly narrows.
- **[Sourced]** Self-play dynamics research (secondary synthesis: https://artifocial.com/blog/self-play-for-llm-2026-mar-10) decomposes the loop into **proposer / solver / verifier** roles and finds removing or weakening any one breaks it — static proposer → memorization; saturated solver → no signal; **noisy verifier → reward hacking**. Its practical conclusion: investment in the *verifier* returns more than investment in loop volume.

**The safeguards, mapped to our design [Inference].** (1) **Real-data anchor, always in the mix** — human-labeled (HelpSteer2) + owner-ruled + outcome-verified items are never rotated out entirely (the replay core, §A5) — this is Gerstgrasser accumulation implemented as dataset policy. (2) **Verifier gating** — nothing self-generated trains unverified; the verifier stack is PLT rubric + swap-consistency + recall/outcome checks, in that order of cheapness. (3) **A frozen holdout the loop can never touch** — the proof set is authored outside the loop and decontaminated against (§A3.2); the loop may not train on, tune against, or even *read* it during curation. (4) **Tail metrics, not averages** — early collapse is invisible in averages, so the standing alarms are per-quadrant: vapor-quadrant mean substance, rare-category recalls, quarantine-rate drift. (5) **Synthetic share cap** — self-generated lessons ≤50% of any round's *new* material until two consecutive rounds pass all bars clean; then the cap is revisited as policy, not by momentum. (6) **Provenance + reversibility** — every artifact versioned (§A5), every adoption reversible by pointer flip (§B3). A loop that can be rolled back can be allowed to run; one that can't, can't.

## B2. Memory-side growth: pages, lessons, weights — who becomes what

**Published patterns, translated.**
- **[Sourced]** MemGPT/Letta tiering: a small always-in-context **core** memory, a searchable **recall** store (conversation history), and deep **archival** storage — the OS analogy applied to context. (https://arxiv.org/abs/2310.08560)
- **[Sourced]** Generative Agents: a raw **memory stream** of observations, periodic **reflection** that synthesizes higher-level conclusions from recent records, and retrieval scored by relevance/recency/importance. (https://arxiv.org/abs/2304.03442)
- **[Sourced]** Reflexion: verbal self-feedback stored in **episodic memory** improves subsequent attempts *with no weight update at all* — the cheapest growth channel that exists. (https://arxiv.org/abs/2303.11366)
- **[Sourced]** Sleep-Time Compute (Lin et al., Letta/UC Berkeley, Apr 2025): a background agent re-processes stored context *between* interactions — pre-computing, reorganizing, consolidating — cutting test-time compute ~5× at equal accuracy on their stateful benchmarks; Letta's shipped pattern runs **sleeptime agents** that dedup, rewrite, and roll up memory blocks on a cadence (session-end light consolidation, periodic full reorganization), with promotion heuristics such as "referenced 3+ times → promote." (https://summify.io/discover/sleep-time-compute-letta-ai-charles-packer-charlie-snell-kev-1UTo51/ ; https://forum.letta.com/t/sleeptime-agents-for-memory-consolidation-best-practices-guide/154)

**Seshat's three stores and the promotion law [Inference].**

| Store | What lives there | Cost to change | Reversibility |
|-------|------------------|----------------|---------------|
| **Pages** (retrieval) | Everything she learns, first. Digested sources, reflections (synthesized pages over raw ones), her own absorption notes | ~Free | Full — pages are edited, versioned, quarantinable |
| **Lessons** (training candidates) | Pages/experiences that carry a *verdict with evidence*: a digestion outcome, a resolved disagreement, a proof failure, an owner ruling | Cheap (a file write + provenance) | Full — a lesson can be excluded by the next dataset version |
| **Weights** (the model) | Only what gated batch rounds teach (§B4) | ~1–5 GPU-h per round | By pointer flip to the prior artifact (§B3) |

**Promotion rules [Inference].** Experience → **page**: always, immediately (capture is cheap; forgetting is the sin). Page → **lesson**: when it acquires a verifiable verdict — a recall proof passed/failed, a PLT ruling, an owner one-liner, a disagreement resolved against outcomes — *and* it survives dedup + consistency. Singular anecdotes stay pages. Lesson → **weight**: never individually; lessons change weights only in batch, through the gated loop. **Demotion:** a page contradicted by a newer verified outcome is flagged, not silently overwritten (the Letta failure mode is the model overwriting "Boston" with "SF" and losing the history — our digestion log is append-only for exactly this reason). **Consolidation cadence:** the existing nightly cycle *is* the sleep-time agent — its job list grows by: dedup sweep, reflection-page synthesis over the day's digestions, disagreement-log refresh, and **pre-staging the next training batch** so a GPU window never opens to an empty queue (§1, rule 4). Frequency anchor [Sourced, practitioner]: promote-on-reference (≥3 recalls) beats promote-on-age — "reference count matters more than age." (Letta guide above.)

## B3. Adoption gating: how she can never silently get worse

Adapted from production ML deployment practice — **[Sourced]** the standard sequence is **shadow** (candidate scores live traffic, outputs logged, never served) → **canary** (1–5% of traffic, watched, instant rollback) → **gradual ramp** → **promotion with the previous champion kept warm for rollback**; rollback must be a config flip, not a redeploy, and a rollback plan needs the old model still serving when invoked. (https://atlan.com/know/shadow-deployment-for-ml-models/ ; https://www.techlama.blog/posts/ml-to-production-checklist.html) **[Sourced]** For model *upgrades* specifically: freeze the baseline, replay the same eval set against the candidate, and **compare slice by slice, never by the average alone** — "if your evals only report the average, you will promote a regression and call it an upgrade." (https://dev.to/tridaai/model-upgrades-are-deployment-events-48n7) **[Sourced]** And the discipline from a public-sector case study: the acceptance floor was **set before results were seen and not lowered after**; a challenger that beat the champion but missed the floor went to shadow mode to gather evidence, not into production. (https://collin-smith.medium.com/a-better-model-thats-still-not-fair-enough-retraining-calgary-s-311-triage-model-with-github-c6aee5156703)

**The five gates [Inference — spec].**

1. **Offline proof gate.** Frozen proof set v1 (from research memo Q6: ≥20 items/quadrant — substantive keeps / obvious quarantines / fluent-but-empty quarantines / plain-but-substantive keeps). Bars, set now, in writing, before round-3 results exist: **quarantine recall ≥ 0.80 AND keep recall ≥ 0.80; vapor-quadrant mean substance ≤ 0.35; parse failures = 0 (GBNF on); no quadrant regresses vs the incumbent by more than 0.05 on any metric.** Reported as a 2×2 confusion matrix + per-quadrant table, incumbent beside challenger, slice by slice.
2. **Regression gate.** Same-day re-run of the *base* model and the *incumbent* on the identical set (the round-1 protocol, kept) — a challenger must beat the incumbent, not merely the base.
3. **Shadow gate.** Challenger judges the live digestion stream in parallel for **≥200 items**: verdicts logged, never acted on. Promotion requires: zero vapor-landings (challenger keeps at ≥0.80 substance anything the incumbent quarantined), and every incumbent/challenger disagreement is written to the disagreement log with both reasons — disagreements are next round's gold, not noise.
4. **Canary gate.** Challenger takes **10% of digestion decisions for one full cycle** with the incumbent's verdicts still computed. Automatic rollback triggers, evaluated by harness code, not by anyone's judgment in the moment: parse failure > 0 · quarantine-rate drift beyond ±10 points vs incumbent's same-stream rate · any owner-visible garbage landing. Trigger = pointer flip back, incident filed.
5. **Adoption + registry.** Adoption is a single recorded event: registry entry {model hash, dataset version + manifest hash, recipe, proof report path, shadow/canary summaries, timestamp}. **Rollback is rehearsed every round**: after adoption, the harness flips to the prior artifact and back once, in a drill, and logs it. An unrehearsed rollback is a hope, not a mechanism.

## B4. The `train_seshat` skill — implementable spec

Built from the catalog's 5-stage sketch (§4.3 there); this section is the buildable version. Name: **`graft_train_seshat`** (house skill pattern). One invocation = one round. GSK calls it with a run-request; the harness owns the state machine.

**Inputs (run-request object):** `{round_id, base_artifact (default: pristine Qwen2.5-1.5B-Instruct GGUF/HF id), new_material_refs [digestion-log range, disagreement-log range, external slices], target_mix (defaults §A2), executor: kaggle, policy_bars (defaults §B3 — overridable only by owner, never by the caller)}`.

**File layout:**
```
gsk-core/brain/seshat-training/
  datasets/
    v3.0/  manifest.json  train.jsonl  dpo-pairs.jsonl  LICENSES.md  exclusions.jsonl
    v3.1/  …
  proof/
    proofset-v1.jsonl        # FROZEN — write-once; changes require a new version + owner sign-off
    proofset-v1.spec.md      # quadrant definitions + bars
  runs/
    2026-10-24-r3/
      recipe.yaml            # LLaMA-Factory config the skill emitted
      kernel/                # Kaggle kernel sources as dispatched
      adapter/  merged/  seshat-r3-q4_k_m.gguf
      proof-report.json      # confusion matrix, per-quadrant metrics, incumbent comparison
      shadow-log.jsonl  canary-log.jsonl
      decision.md            # ADOPTED / FILED + the gate-by-gate numbers — the only file a human must read
  logs/
    disagreements.jsonl      # append-only; every incumbent/challenger & judge/rubric conflict, both reasons verbatim
    adoptions.jsonl          # registry: one line per adoption/rollback, hashes included
    filed-failures/          # one dir per failed challenger: artifact + proof report + its wrong outputs verbatim
  state.json                 # incumbent pointer, round counter, synthetic-share ledger
```

**Stages and gates.** Each gate is a machine-checkable condition evaluated by harness code; a failed gate stops the round, files the evidence, and leaves the incumbent untouched. GSK cannot waive a gate — waiver is an owner policy change, recorded as such.

| Stage | Work | Gate (all must hold) | On failure |
|-------|------|----------------------|-----------|
| **S0 INTAKE** | Collect candidates: digestion-log range, disagreement log, twin generator output, external slices (HelpSteer2 conversion) | Every item carries provenance + license tag; **ship builds reject any item not tagged SHIP-SAFE**; counts by source reported | Reject the untagged items, continue with the rest; log the rejects |
| **S1 CURATE** | Dedup (exact+MinHash), swap-consistency pass, balance to target mix, decontaminate vs proof set (13-gram), template all reasons | Balance within ±5 pts of target per class; consistency survival rate reported per source batch; **zero** proof-set overlaps; batch with <50% survival quarantined wholesale (§A5) | Batch quarantined; round continues only if remaining material ≥70% of target size, else FILED at S1 |
| **S2 FREEZE** | Write dataset dir + manifest (hashes) + LICENSES.md | Manifest complete and hash-verified. **No manifest, no train — hard gate, no override in code** | Round aborts; nothing trains |
| **S3 TRAIN** | Emit recipe.yaml (r16/α32, lr 1e-4, seed 222 baseline from rounds 1–2), dispatch Kaggle kernel, watch DONE marker, pull adapter | Final loss within the sane band (≤ prior round's final loss × 1.25 on comparable data, or an absolute ceiling set in policy); adapter hash recorded; step-time projection inside budget (§1 rule 3) | FILED: kernel logs kept, incumbent untouched, failure class written to decision.md |
| **S4 PROOF** | Merge → GGUF → serve under GBNF grammar → frozen proof + base regression + incumbent head-to-head | §B3 gates 1–2, all bars, slice-by-slice | FILED: challenger's wrong outputs appended to disagreements.jsonl *verbatim* (they are next round's rejected samples — the loop's memory of its own errors) |
| **S5 SHADOW→CANARY→ADOPT** | Shadow ≥200 live items → canary 10% × 1 cycle → pointer flip + registry line + rollback drill | §B3 gates 3–4; drill passes | Any trigger → automatic rollback, incident in decision.md; challenger filed, not deleted |

**What GSK himself must be able to do, per stage [Inference].** The division of labor is the doctrine made concrete — *anything requiring taste is a skill he calls; anything requiring exactness is harness code he invokes but cannot improvise around:*
- **GSK-as-skill-caller:** S0 collection (he already digests, logs, fetches — existing graft skills), twin generation requests, S1's *judgment* inputs (his PLT rulings on candidates), reading decision.md and *requesting* the next round, proposing mix changes between rounds (recorded as his curriculum notes).
- **Harness code (deterministic, not optional):** hashing/manifests (S2), decontamination (S1's mechanical half), Kaggle dispatch/watch (S3's transport), proof execution and bar-checking (S4), shadow/canary traffic splitting, rollback triggers and the drill (S5), all append-only logs.
- **Explicitly not his (yet):** setting or lowering policy bars (owner), authoring new proof quadrants (Rung 5, §B5), acting as verifier of record for his own outputs (§B5).

**Executor reality [Sourced + our measurements].** Kaggle T4, ~1 GPU-h per small round (round 1 measured 57 min), 30 h/week quota — the skill's remote executor today. A user machine with an 8GB+ GPU runs the identical recipe locally (LLaMA-Factory/Axolotl config is portable; the skill emits the same recipe.yaml either way — catalog §4.2). llama.cpp + GBNF serves the proof and production identically, so proof conditions == ship conditions.

## B5. Honest limits, and the milestone ladder

**What self-growing cannot yet do — stated without varnish.**

1. **The loop cannot exceed its verifier.** SPIN's convergence result is the general law: self-improvement asymptotes at the anchor distribution's quality (§B1). Our verifier stack (PLT + consistency + outcome checks) is good and *partly her* — the ground-truth inflow (human HelpSteer2 labels, owner rulings, pipeline outcomes) is what keeps the ceiling rising. A GSK instance cut off from all fresh external truth does not keep growing; it slowly narrows. **[Inference]** Ship copy must never claim otherwise.
2. **At 1.5B, she cannot yet be her own verifier of record.** Published fine-tuned judges *at 7B* scored below random on adversarial surface-vs-substance sets (research memo Q2); self-rewarding's gains were demonstrated at 70B. **[Inference]** Until her frozen-proof numbers say otherwise across two consecutive rounds, Seshat may *propose* training candidates but may not *certify* them. The rented seat + PLT + outcome checks remain the verifier stack; her promotion to co-verifier is a ladder rung with a proof, not a default.
3. **Format guarantees are not judgment guarantees.** GBNF makes unparseable output impossible; it says nothing about whether the verdict inside the valid shape is right. Both fixes are needed; neither substitutes for the other.
4. **Weights will not absorb the library.** Her knowledge growth is pages (retrieval); the 1.5B's world-model is what Qwen's pretraining gave it. Training rounds improve *judgment, format, and digestion craft* — claiming they teach her new facts at scale would be vapor. (Catalog §3's standing note.)
5. **GPU-less installs grow slower, honestly.** Curation and proof are CPU-cheap; training is not — this VM's measured CPU rate (~14 tok/s class) makes a 5K-lesson round a multi-day affair. **[Inference]** On a GPU-less user machine, "self-growing" truthfully means: pages grow, lessons accumulate, training queues until a GPU window (theirs, or a free-tier executor) exists. The architecture supports it; the marketing must too.
6. **The rented-teacher scaffolding that remains necessary, with exit conditions:** twin construction (claim-stripping rewrites) — exits when a local rewriter passes a marker-based strip test at ≥95%; disagreement adjudication at the boundary — exits per §B5.2; proof-set authorship for *new* quadrants — stays owner/operator work longest, because whoever writes the exam can rig the exam.

**The milestone ladder — from today's operator-run training to GSK-run training.** Each rung is named with the proof that it has been reached; a rung is not claimed on intention.

| Rung | Name | What changes | Proof of the rung |
|------|------|--------------|-------------------|
| **R0** | Operator-run rounds | Rounds 1–2: human-driven scripts, manual gates | ✅ Reached — run records exist for both rounds |
| **R1** | **By-the-book round** *(this week)* | Round 3 executed exactly per this blueprint: v3 dataset (§A2/A4), frozen proof set v1, GBNF on, DPO pass, §B3 gates — still operator-run, but every step scripted; **the scripts are the skill's body** | `proof-report.json` with per-class bars + a decision.md a stranger could audit |
| **R2** | One-command pipeline | The S1–S5 state machine exists as harness code; one invocation runs a full round incl. shadow/canary bookkeeping stubs | A full round from a single invocation, **including one deliberately-weakened challenger correctly FILED by the gates** (negative test — the gates must be seen to bite) |
| **R3** | GSK-requested rounds | His nightly cycle detects the trigger (≥150 new verified lessons, or disagreement log ≥40 unresolved) and *requests* a round; dispatch still approved by policy/owner | One round he requested, executed end-to-end, adopted-or-filed with no operator touch between request and decision |
| **R4** | GSK-run adoption | He runs S0–S5 including live shadow + canary; adoption and rollback are automatic under the policy bars | Two consecutive autonomous adoptions with zero frozen-proof regressions **and** one rollback — real or drilled — executed by the triggers, not by a human |
| **R5** | Self-curriculum | He proposes dataset-design changes (new twin generators, new proof quadrants from his disagreement analysis) and authors them locally; proposals enter as *candidates* under the same gates | A round whose design change originated in his disagreement log and passed R4 gates; new proof quadrant adopted with owner sign-off (this sign-off never automates — see limit 6) |

---

## (a) The Seshat curriculum — summary

Format lock (C0, ~120, hand-verified) → general judgment on human labels (C1, HelpSteer2-converted, ~2,350 balanced in round 3) → digestion craft (C2, ~620) → our-rubric domain judgment (C3, ~800 homegrown, anneal-upweighted) → adversarial anneal (C4, ~520 twins both directions + DPO pairs ~600–900 seeded with her own errors). General replay ~16% throughout protects the writer in her. All ship data human-labeled, outcome-verified, or consistency-filtered — unverified teacher labels: zero. Datasets accumulate under content-addressed versions with a frozen replay core; retrain-from-base on the union until ~25K lessons makes incremental LoRA worth its risks.

## (b) The train_seshat skill — summary

`graft_train_seshat`: one invocation = one round. S0 intake (provenance+license on every item; ship builds reject non-SHIP-SAFE) → S1 curate (dedup, swap-consistency, balance ±5, decontaminate vs the frozen proof set) → S2 freeze (manifest + hashes; no manifest, no train) → S3 train (emitted LLaMA-Factory recipe → Kaggle T4; loss-band + budget gates) → S4 proof (GBNF-locked llama.cpp, frozen set, per-class bars, incumbent head-to-head) → S5 shadow (≥200 live items) → canary (10%, automatic rollback triggers) → adopt (registry line + rehearsed rollback) or **file** (artifact + wrong outputs preserved as next round's curriculum). Taste = his skills; exactness = harness code; bars = owner's, unwaivable by the caller. Full spec: §B4.

## (c) The milestone ladder — summary

R0 operator-run (done) → **R1 by-the-book round 3, this week** (GPU budget §1: R3a SFT 3–5 h, R3b DPO 0.5–1 h, proofs 0 h, iteration-2 1.5–2.5 h, reserve ~3 h, remainder held) → R2 one-command pipeline with a negative-tested gate → R3 GSK-requested rounds → R4 GSK-run adoption with automatic rollback → R5 self-curriculum, with proof-set authorship the last thing ever handed over. Her core metrics throughout: **quarantine recall, keep recall, vapor-quadrant mean substance** — the brain's vital signs.

---

## Source index (new to this memo)

- LIMA / Superficial Alignment Hypothesis — https://arxiv.org/pdf/2305.11206
- SmolLM2 (multi-stage mixtures, annealing) — https://arxiv.org/html/2502.02737v1 · Smol playbook — https://seldondance.substack.com/p/the-smol-training-playbook
- Curriculum learning, small code models (hybrid > sequential) — https://arxiv.org/html/2407.10194v1 · TSCL — https://www.sciencedirect.com/org/science/article/pii/S154622182600086X · CL for NLU — https://liner.com/review/curriculum-learning-for-natural-language-understanding
- Mixed training removes the trade-off (1:1; 6% floor) — https://arxiv.org/html/2512.13706 · Replay improves target-task efficiency — https://arxiv.org/html/2603.04964v1 · Rehearsal practice — https://backbenchlearner.com/genai/module-3-finetuning/session-2-data-training/catastrophic-forgetting.html
- Biderman et al., LoRA learns less and forgets less — https://arxiv.org/pdf/2405.09673
- Phi-1.5, Textbooks Are All You Need II — https://arxiv.org/abs/2309.05463
- Dedup (Lee et al.) — https://arxiv.org/abs/2107.06499 · AlpaGasus — https://arxiv.org/abs/2307.08701 · CCNet — https://arxiv.org/abs/1911.00359 · DCLM fastText setup — https://arxiv.org/html/2509.18577v4 · Quality filters prefer AI text (audit) — https://medium.com/@mehmet.ozel2701/these-ai-data-filters-prefer-ai-text-over-human-writing-750990435d06
- HelpSteer2 paper (κ table; DPO conversion; goodness formula 0.65H+0.8C+0.45Coh) — https://arxiv.org/html/2406.08673v1 · HelpSteer2-Preference (κ 0.489→0.878; 45.5% equal-rating preferences) — https://www.alphaxiv.org/overview/2410.01257v1
- STaR — https://arxiv.org/abs/2203.14465 · RFT — https://arxiv.org/abs/2308.01825 · Self-Rewarding — https://arxiv.org/abs/2401.10020 · SPIN — https://arxiv.org/pdf/2401.01335 · Voyager — https://arxiv.org/abs/2305.16291
- Model collapse — Shumailov et al., Nature 2024, https://www.nature.com/articles/s41586-024-07566-y · Gerstgrasser et al., accumulate vs replace — https://arxiv.org/abs/2404.01413 · Self-consuming loops summary — https://www.ultralytics.com/glossary/model-collapse · Self-play roles/verifier — https://artifocial.com/blog/self-play-for-llm-2026-mar-10
- MemGPT — https://arxiv.org/abs/2310.08560 · Generative Agents — https://arxiv.org/abs/2304.03442 · Reflexion — https://arxiv.org/abs/2303.11366 · Sleep-Time Compute — https://summify.io/discover/sleep-time-compute-letta-ai-charles-packer-charlie-snell-kev-1UTo51/ · Letta sleeptime practice — https://forum.letta.com/t/sleeptime-agents-for-memory-consolidation-best-practices-guide/154
- Shadow/canary/champion-challenger practice — https://atlan.com/know/shadow-deployment-for-ml-models/ · https://www.techlama.blog/posts/ml-to-production-checklist.html · Slice-wise upgrade gates — https://dev.to/tridaai/model-upgrades-are-deployment-events-48n7 · Floor discipline case — https://collin-smith.medium.com/a-better-model-thats-still-not-fair-enough-retraining-calgary-s-311-triage-model-with-github-c6aee5156703
- Kaggle quota (30 h/week, weekly reset) — https://readmedium.com/free-gpus-for-training-your-deep-learning-models-c1ce47863350 · https://www.geeksforgeeks.org/machine-learning/how-to-use-gpu-in-kaggle/

*Prior memos' sources are not re-listed; where this memo relies on them (judge-limitation findings, DPO-for-judges, swap-consistency yields, dataset licenses) it cites the memo section instead.*
