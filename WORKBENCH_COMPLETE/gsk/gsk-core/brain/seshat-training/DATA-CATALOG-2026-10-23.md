# DATA CATALOG FOR SESHAT — what we can feed her, and what GSK needs to one day feed her himself

**Compiled:** 2026-10-23 · **Research only — nothing downloaded, nothing changed, $0 spent.**
**Context:** Seshat is a Qwen2.5-1.5B-class local model inside GSK. Her job: judge memory-digestion
candidates and output **verdict (keep / quarantine) + substance score + reason** in a fixed parseable format.
GSK ships to the world, so license hygiene is a ship gate, not paperwork.

**Known failure this catalog attacks:** in round 1, her ruled training pairs were 72 keep / 20 quarantine.
The trained model cured the base's over-quarantine disease but flipped to keeps-everything — through the
production pipeline it landed a fluent-but-empty "vapor" item at substance **0.95** with a fabricated reason.
Published judge models fail the same way (arXiv:2403.02839 — *On the Limitations of Fine-tuned Judge Models*:
JudgeLM, PandaLM, Auto-J, Prometheus score **below random** on LLMBar adversarial sets, because fine-tuning
teaches surface features). The fix is data shape: more real quarantines, hard negatives in both directions,
and a test that can't be gamed by a majority verdict.

## How to read the license column

- **SHIP-SAFE** — license permits redistribution inside a released product (Apache-2.0 / MIT / CC-BY / ODC-BY),
  with attribution where required.
- **TRAIN-ONLY** — usable to train our own model / build our own data internally; do **not** bundle the raw
  data in the shipped product. (Note: whether weights trained on a dataset inherit its license is legally
  unsettled; the conservative house rule is: non-commercial or terms-bound data never touches the shipped
  artifact's training set unless we've accepted that risk explicitly.)
- **METHOD-ONLY** — use the *recipe* (how they built it, their augmentation tricks, their eval design);
  do not use the data itself in the product pipeline.

A recurring trap, stated once: **many "open" judge datasets are GPT-4/GPT-3.5 outputs.** Their cards say the
data is "subject to OpenAI's Terms of Use." OpenAI's terms restrict using outputs to develop competing models.
That makes them method references for us, not training fuel for a shipped product — no matter how good they are.

---

## 1. Published judge-training datasets

### 1.1 Prometheus — Feedback Collection + Preference Collection ⭐ the format twin
- **Host:** Hugging Face `prometheus-eval/Feedback-Collection`, `prometheus-eval/Preference-Collection`;
  code github.com/prometheus-eval/prometheus-eval. Prometheus-Bench + Feedback Bench live in the same org.
- **Size:** Feedback Collection **100,000** instances (direct assessment: instruction + response + reference
  answer + 1 of 1,000 rubrics → written feedback + score 1–5). Preference Collection **200,000** instances
  (pairwise: response A vs B → comparative feedback + winner), with verdicts balanced 100K/100K A/B
  *specifically to prevent verdict bias* — the exact disease we hit
  ([paper Table 1](https://arxiv.org/html/2405.01535v2)).
- **License:** The **models** are Apache-2.0, but the paper's own license appendix states: *"The Preference
  Collection dataset is subject to OpenAI's Terms of Use for generated data. The model could be used for
  commercial purposes while the dataset is intended for research purposes."* The Feedback Collection carries
  the same OpenAI-terms condition on its model/dataset cards
  ([HF card](https://huggingface.co/prometheus-eval/prometheus-7b-v2.0)).
- **Verdict: METHOD-ONLY** for product training. (Train-only for internal experiments if we ever accept the
  OpenAI-terms risk — recommendation: don't.)
- **What it teaches:** This is the closest published format to Seshat's job: *feedback-then-score*, rubric-
  conditioned, absolute (single item) grading — not just ranking. Steal: (a) feedback-before-verdict ordering,
  (b) the deliberate 50/50 verdict balancing, (c) rubric-as-input so one model serves many criteria,
  (d) Feedback Bench (~1K GPT-4-graded items) as an *eval-design* reference.
- **Plug-in:** Copy the schema into our own data builder: every Seshat training item becomes
  `{item, criterion, feedback, [RESULT] verdict+score}` — with feedback generated about **our own corpus
  items**, labeled by **our own verified pipeline outcomes**, not their data.

### 1.2 JudgeLM (JudgeLM-100K)
- **Host:** github.com/baaivision/JudgeLM (data via linked drive); models on HF under `BAAI/`.
- **Size:** **100K** training judge samples + 5K validation; each = question + answer pair + GPT-4 judgment
  (scores for both answers + reason). Judges single answers, pairs, multiple answers, multi-turn
  ([paper](https://arxiv.org/abs/2310.17631)).
- **License:** Model cards state **"License: Non-commercial license"** (finetuned from Vicuna, itself
  LLaMA-derived); judgments are GPT-4 outputs. No permissive data license found.
- **Verdict: METHOD-ONLY — NOT shippable in the product.**
- **What it teaches:** Not verdict+reason ranking so much as the **bias-mitigation augmentation trio**:
  *swap augmentation* (present the pair in both orders; keep only consistent judgments — kills position bias),
  *reference support* (judge with a reference answer), *reference drop* (sometimes remove it so the judge
  doesn't become dependent). Their agreement with the GPT-4 teacher exceeds 90% at 100K scale — evidence that
  data *volume + consistency filtering* is what makes small judges reliable.
- **Plug-in:** Apply swap-consistency filtering to **our own** pair data: any candidate judgment that flips
  when presentation order flips is discarded before it becomes a training pair. Directly attacks fabricated-
  reason failures like our 0.95 vapor landing.

### 1.3 PandaLM
- **Host:** github.com/WeOpenML/PandaLM (train data via linked drive; 1K human-annotated test set in repo).
- **Size:** **300K** filtered training samples (from 1M unfiltered). Format is exactly a ruled pair:
  input (instruction, input, response1, response2) → output (**evaluation_result**: 1 / 2 / Tie,
  **evaluation_reason**, reference_response). Labels generated by GPT-3.5, then filtered by the swap-
  consistency heuristic above ([repo README via ecosyste.ms](https://awesome.ecosyste.ms/projects/github.com%2FWeOpenML%2FPandaLM),
  [paper](https://arxiv.org/abs/2306.05087)).
- **License:** **Unclear — stated plainly:** the repo does not attach a clear permissive license to the
  *training data*, and the labels are GPT-3.5 outputs (OpenAI terms). Do not treat as ship-safe.
- **Verdict: METHOD-ONLY** (the swap-filter recipe + the result/reason/reference output triple).
- **Plug-in:** Their output triple maps 1:1 onto Seshat's format if we add a score. Their filtering yield
  (1M → 300K, i.e. ~70% of teacher judgments discarded as inconsistent) is the calibration fact for our own
  pipeline: expect to throw away most auto-generated judgments; keep only the consistent ones.

### 1.4 Auto-J
- **Host:** github.com/GAIR-NLP/auto-j; project page gair-nlp.github.io/auto-j.
- **Size:** **4,396** training judgments — **3,436 pairwise + 960 single-response** — GPT-4-written critiques
  across 58 real-world scenarios, each with scenario-specific criteria
  ([project page](https://gair-nlp.github.io/auto-j/), [paper](https://arxiv.org/abs/2310.05470)).
- **License:** **Unclear for the data** (built from real user queries + chatbot responses, GPT-4 judgments);
  not verified as permissive in this pass. Treat as not ship-safe.
- **Verdict: METHOD-ONLY.**
- **What it teaches:** The *small-data* proof: ~4.4K well-criteria'd judgments trained a 13B judge that beat
  GPT-4 on their testbed pairwise accuracy (73.7% win). Also the **single-response protocol** — critique +
  overall rating for one item with no pair — which is literally Seshat's digestion setting. Their lesson for
  us: criteria-conditioned critiques beat raw scores, and a few thousand *good* ruled examples move a judge
  more than 100K sloppy ones. Our 92 pairs aren't hopeless; they're under-criteria'd.
- **Plug-in:** Adopt per-category criteria text in Seshat's prompt/data format (trading note vs narrative
  vs code vs personal memory get different stated criteria), mirroring Auto-J's scenario criteria.

### 1.5 LLMBar ⭐ the adversarial set — and the recipe that matters most
- **Host:** github.com/princeton-nlp/LLMBar; also on HF; ships inside RewardBench as subsets.
- **Size:** **419** human-verified instances (eval-sized, deliberately): each = instruction + two outputs,
  one faithful, one deviating, + gold preference. Five subsets: Natural (real outputs), and four adversarial —
  **Neighbor** (output answers a *neighboring* instruction), **GPTInst** (GPT-4 rewrote the instruction and
  answered that instead), **GPTOut** (fluent output that subtly violates constraints), **Manual** (hand-built
  traps). Adversarial outputs are *surface-better* — longer, cleaner, more confident — and objectively wrong
  ([README](https://raw.githubusercontent.com/princeton-nlp/LLMBar/main/README.md)).
- **License:** **MIT** — per RewardBench's own license table, which lists "LLMBar {Natural, Neighbor, GPTInst,
  GPTOut, Manual} — MIT License" ([allenai/reward-bench card §License](https://huggingface.co/datasets/allenai/reward-bench)).
- **Verdict: SHIP-SAFE** (MIT) — and even better as a *generator recipe* (see §6).
- **What it teaches:** Pure "sounds good ≠ is good." This is the benchmark on which published fine-tuned judges
  score below random. 419 items is too few to train on directly; its value is (a) a frozen trap-quadrant for
  our proof set, and (b) the **construction method**: take a substantive item, manufacture a surface-upgraded
  empty/wrong twin.
- **Plug-in:** (1) Drop LLMBar-style items into the frozen proof set's adversarial quadrant. (2) Run the
  GPTOut transform over **our own kept pages**: produce fluent twins with the checkable claims stripped →
  label quarantine, reason naming what's missing. And the reverse transform (plain, terse, substantive →
  keep) so fluency decorrelates from verdict in **both** directions.

### 1.6 FLASK + Feedback Bench (eval-side references)
- **FLASK** — github.com/kaistAI/FLASK. **1,740** evaluation instances annotated with skill sets (12 skills
  across logical thinking / background knowledge / problem handling / user alignment), domain, difficulty;
  scoring is 1–5 **per skill** against rubrics; FLASK-HARD = 89 hardest with instance-specific rubrics
  ([paper](https://arxiv.org/pdf/2307.10928)). **License: not verified from a primary source in this pass —
  check the repo LICENSE file before any use.** **Verdict: METHOD-ONLY** (it's an eval protocol, not training
  data anyway). *Plug-in:* our single substance score could decompose into 2–3 named sub-scores (has-checkable-
  claims / on-topic / self-contained) — FLASK is the template for rubric decomposition, and Prometheus's
  Feedback Bench (~1K items, GPT-4 feedback+scores, same OpenAI-terms cloud as §1.1) is the template for a
  small fixed judge-benchmark. Both inform our frozen proof set design (§6.3).

### 1.7 MT-Bench human judgments (LMSYS)
- **Host:** HF `lmsys/mt_bench_human_judgments`; code/data in github.com/lm-sys/FastChat (`llm_judge`).
- **Size:** 80 questions × model pairs across two turns, **~3K expert human votes** (paper: "MT-bench
  questions, 3K expert votes, and 30K conversations with human preferences are publicly available")
  ([paper](https://arxiv.org/abs/2306.05685)).
- **Format:** Pairwise winner only (model_a / model_b / tie) — **no reasons, no scores**.
- **License:** The MT-Bench portion inside RewardBench is listed as **Apache-2.0** (RewardBench license
  table); the standalone HF dataset's own card terms were not separately verified in this pass.
- **Verdict: TRAIN-ONLY / low value for us.** Teaches response-ranking, not keep/quarantine discrimination,
  and carries no rationales — Seshat's failures are rationale failures. Skip except as eval-culture reference.

### 1.8 Chatbot Arena conversations (LMSYS)
- **Host:** HF `lmsys/chatbot_arena_conversations` (gated — terms acceptance required).
- **Size:** **33,000** cleaned conversations with pairwise human votes, 20 models, Apr–Jun 2023
  ([HF card](https://huggingface.co/datasets/lmsys/chatbot_arena_conversations)).
- **License (exact, from the card):** *"The user prompts are licensed under CC-BY-4.0, while the model outputs
  are licensed under CC-BY-NC-4.0."* → The outputs — the part a judge learns from — are **non-commercial**.
- **Verdict: NOT shippable (NC outputs); TRAIN-ONLY at most, and low priority** — votes without reasons,
  same limitation as §1.7.

### 1.9 UltraFeedback (+ UltraCM critiques)
- **Host:** HF `openbmb/UltraFeedback`; github.com/OpenBMB/UltraFeedback; cleaned binarized variants at
  `allenai/ultrafeedback_binarized_cleaned` and `argilla/ultrafeedback-binarized-preferences-cleaned`.
- **Size:** **64K prompts, ~256K responses (4 per prompt), ~380K GPT-4 annotations** — per-response scores
  on instruction-following, truthfulness, honesty, helpfulness **plus written critiques** (the UltraCM side)
  ([repo](https://github.com/OpenBMB/UltraFeedback)).
- **License:** ⚠️ **Mixed/uncertain — stated plainly:** the HF card's license tag and the GPT-4 provenance
  conflict; annotations are GPT-4 outputs and prompts aggregate ShareGPT / FLAN / TruthfulQA / FalseQA, each
  with its own terms. The Argilla curation also documents a real label-quality bug (an `overall_score`
  inversion that rated some worst responses 10/10; later fixed upstream) — a cautionary tale: even flagship
  preference data ships with inverted labels
  ([Argilla curation notes](https://huggingface.co/datasets/argilla/ultrafeedback-binarized-curation)).
- **Verdict: TRAIN-ONLY at most; do not bundle; not needed** — its truthfulness/honesty critique dimensions
  are conceptually useful (score *dimensions*, not one number) but the license cloud + ranking format make it
  a poor fit versus §1.12.

### 1.10 Nectar
- **Host:** HF `berkeley-nest/Nectar` (Berkeley Starling project).
- **Size:** **183K prompts × 7 ranked responses each** (GPT-4, GPT-3.5, Llama, Mistral…), ranked by GPT-4;
  sources: lmsys-chat-1m, ShareGPT, Anthropic HH, FLAN, etc.
  ([HF card](https://huggingface.co/datasets/berkeley-nest/Nectar)).
- **License (exact, from the card):** *"Apache-2.0 license under the condition that the dataset is not used to
  compete with OpenAI"* — a nonstandard rider on top of Apache-2.0, and the rankings are GPT-4 outputs over
  partly NC-licensed sources.
- **Verdict: TRAIN-ONLY, flagged.** The rider + provenance make it unsafe to bundle and risky to train the
  shipped artifact on. Ranking-only format (no reasons) limits judge value anyway. Skip.

### 1.11 HelpSteer / HelpSteer2 (NVIDIA) ⭐⭐ the ship-clean judge fuel
- **Host:** HF `nvidia/HelpSteer` (v1, ~37K samples), `nvidia/HelpSteer2` (**21,362 rows**: 10K+ prompts × 2
  responses), plus `nvidia/HelpSteer2-Preference` (binarized pairs derived from the ratings).
- **Format:** Human-annotated **multi-attribute absolute scores per single response**: helpfulness,
  correctness, coherence, complexity, verbosity — each 0–4
  ([HF card](https://huggingface.co/datasets/nvidia/HelpSteer2)). Human labels, collected with Scale AI —
  **not** GPT-4 outputs. This is the dataset that trained the RewardBench-topping Llama-3.1-Nemotron-70B
  reward model (94.1%).
- **License (exact):** **CC-BY-4.0** — the card: *"HelpSteer2 is an open-source Helpfulness Dataset
  (CC-BY-4.0)"*; NVIDIA explicitly built it because *"using proprietary LLMs like GPT-4 to create preference
  datasets introduces commercial usage restrictions"* — they made the ship-clean alternative on purpose
  ([paper abstract](https://arxiv.org/abs/2410.01257)).
- **Verdict: SHIP-SAFE** (attribution required).
- **What it teaches:** Absolute, per-item, multi-dimensional scoring by humans — the closest ship-clean
  analog to Seshat's substance score. The **verbosity attribute is gold for us**: it lets us build pairs
  where verbosity is high but correctness/helpfulness are low — human-labeled fluent-but-empty, no synthesis
  required. And correctness 0–1 responses give real quarantine-grade examples with human authority.
- **Plug-in:** Convert to Seshat format: response + attribute vector → assistant target
  `feedback… [RESULT] verdict, score` where verdict = quarantine when correctness ≤1 or helpfulness ≤1
  (regardless of verbosity/coherence), keep when correctness ≥3. This single conversion manufactures
  **thousands of ruled single-item judgments, human-labeled, ship-clean** — versus our 92 hand-built pairs.
  Cap its share of the mix (see §6) so she learns *our* rubric on *our* corpus first, general discrimination
  second.

### 1.12 RewardBench (the dataset, used as data)
- **Host:** HF `allenai/reward-bench`.
- **Size:** **~2,985** human-verified chosen/rejected pairs (filtered down from 5,123 source prompts),
  23 subsets across Chat / Chat-Hard / Safety / Reasoning ([card](https://huggingface.co/datasets/allenai/reward-bench)).
- **License:** Released under **ODC-BY**, *"requiring the user to follow the licenses of the subsequent
  parts"* — and the parts differ: AlpacaEval subsets **CC-BY-NC-4.0** ❌, DoNotAnswer **CC-BY-NC-SA-4.0** ❌,
  MT-Bench **Apache-2.0** ✅, LLMBar **MIT** ✅, XSTest **CC-BY-4.0** ✅, HumanEvalPack **MIT** ✅,
  PRM Math **MIT** ✅ (full table on the card).
- **Verdict: SHIP-SAFE only subset-by-subset.** The Chat-Hard slice — **llmbar-natural + llmbar-adver-\***
  — is the single most on-target eval block in this whole catalog: pairs where the rejected answer is the
  longer, smoother one.
- **Plug-in:** Use the MIT/CC subsets as (a) frozen proof-set material and (b) a small DPO/pairwise sidecar.
  Never ingest the NC subsets into anything that ships.

---

## 2. Hard-negative / adversarial sets — "sounds good ≠ is good"

| Set | Host | Size | License | What it teaches Seshat |
|---|---|---|---|---|
| **LLMBar** (§1.5) | GitHub/HF | 419 pairs | **MIT** ✅ | Fluent, confident, instruction-violating outputs vs plain correct ones. The core trap quadrant. |
| **HaluEval** | github.com/RUCAIBox/HaluEval; HF `pminervini/HaluEval` | **35,000** samples: 10K QA + 10K dialogue + 10K summarization (each with a *right* and a *hallucinated* response against the same knowledge) + 5K human-annotated general | ⚠️ **Not clearly stated** — the benchmark is ChatGPT-generated and the HF card carries no clean permissive license in this pass. **Treat as METHOD/TRAIN-ONLY until verified.** | The single best *shape* for quarantine training: same prompt, plausible fluent answer with fabricated facts vs grounded answer. The dialogue/QA splits include the source knowledge, so "checkable claim vs source" is explicit — exactly the reasoning her fabricated 0.95 justification lacked. |
| **FEVER** (fact verification) | fever.ai; HF `fever/fever` | ~185K claims labeled SUPPORTS / REFUTES / NOT-ENOUGH-INFO against Wikipedia evidence | **CC BY-SA 3.0** (share-alike — attribution + SA on redistributed data) | Claim-vs-evidence discipline: a claim with no supporting evidence is a quarantine pattern. SA copyleft makes raw-data bundling awkward → **TRAIN-ONLY / method**; the *task shape* (claim + evidence → verdict) is directly our digestion check. |
| **TruthfulQA** | github.com/sylinrl/TruthfulQA | 817 questions, misconception traps | **MIT** (repo) ✅ (verify at download) | Fluent, commonly-believed, wrong answers. Tiny; best as proof-set spice, not training bulk. |
| **RewardBench Chat-Hard / llmbar-adver-*** (§1.12) | HF | ~500 pairs in the adversarial subsets | MIT (LLMBar parts) ✅ | Length/verbosity bias traps with human-verified winners. |
| **XSTest** (inside RewardBench) | HF | 450 prompts (250 safe / 200 unsafe) | **CC-BY-4.0** ✅ | The *opposite* trap: items that look dangerous/empty but are fine — teaches her not to over-quarantine borderline-but-legit material (protects against relapsing into the base model's disease). |

**The general principle the literature supports:** hard negatives must be *manufactured against your own
positives* (LLMBar's method), not just collected. Generic adversarial sets calibrate the sense; twins built
from her own corpus fix the specific failure. Both are in the §6 plan.

Also relevant, from our own research memo (TRAINING-RESEARCH-2026-10-23): quarantine **reasons must name the
missing evidence** ("no checkable claim; restates the prompt") — every hard-negative source above should be
converted so the reason field states *what evidence is absent*, never just "low quality."

---

## 3. General growth data for her wider mind

She is GSK's living memory, not only a judge — but note the architecture honestly: **her knowledge growth
mostly belongs in Seshat's pages (retrieval), not her weights.** Weight-training is for judgment and format;
a 1.5B will not memorize a library. The sets below grow her *general competence* (language, reasoning,
summarization, code literacy) so her judgments and digestions get smarter. Ship column = safe to include the
raw data (or a model trained on it, per house rule) in the released product.

| Set | Host | Size | License (exact) | Ship? | Use for Seshat |
|---|---|---|---|---|---|
| **Dolly-15k** | HF `databricks/databricks-dolly-15k` | 15,011 human-written instruction/response records, 8 categories incl. **summarization, classification, closed QA with context** ([card](https://huggingface.co/datasets/databricks/databricks-dolly-15k)) | **CC BY-SA 3.0** | ⚠️ Train-only (share-alike on data) | Human-written, no GPT outputs anywhere. The summarization/classification categories are digestion-shaped. Small, clean, human — good early-mix ballast. |
| **OpenAssistant (OASST1/2)** | HF `OpenAssistant/oasst1`, `oasst2` | OASST1: 161,443 messages / 66,497 conversation trees / 461,292 quality ratings, human-written + human-ranked ([The Decoder](https://the-decoder.com/openassistant-releases-its-open-source-chatgpt-competitor/)) | **Apache-2.0** (code+data; data also described as CC BY 4.0 by the project) ✅ | **SHIP-SAFE** | Human rankings + quality labels = preference signal with zero proprietary-teacher cloud. Multi-turn memory-flavored conversations suit a memory organ. |
| **HelpSteer2** (§1.11) | HF `nvidia/HelpSteer2` | 21,362 rows | **CC-BY-4.0** ✅ | **SHIP-SAFE** | Doubles as judge data (§1.11) and general attribute-scoring competence. |
| **SmolTalk** | HF `HuggingFaceTB/smoltalk` | **1.1M** conversations (smol-magpie-ultra, smol-rewrite, smol-summarize, NuminaMath-CoT 100K, MetaMathQA 50K, self-oss-instruct code, APIGen 80K…) ([card](https://huggingface.co/datasets/HuggingFaceTB/smoltalk)) | HF tag **Apache-2.0**, but ⚠️ components are mixed-provenance (Magpie data is Llama-3.1-405B-generated → Llama license terms ride along; OpenHermes is GPT-4-generated) | ⚠️ **Train-only, subset-pick** (self-oss-instruct, NuminaMath, smol-rewrite/summarize are the cleaner slices) | Built *for* small models (SmolLM2) — the right scale class for her. The rewrite/summarize slices are literally memory-digestion skills. |
| **Tulu 3 SFT Mixture** | HF `allenai/tulu-3-sft-mixture` | **939,344** prompts ([Ai2](https://allenai.org/blog/tulu-3-technical)) | Released under **ODC-BY**, but ⚠️ it's a *mixture*: components carry their own licenses and ~43% is GPT-4o/Claude-generated synthetic | ⚠️ **Train-only with per-component filtering** | The best-documented open post-training recipe in existence; use Ai2's *curation method* (skill-specific mixes, decontamination, downsampling) even where we don't use their rows. |
| **FineWeb-Edu** | HF `HuggingFaceFW/fineweb-edu` (samples: 10BT/100BT/350BT) | **1.3 trillion tokens** of educational web text (full FineWeb: 15T) ([paper](https://arxiv.org/html/2406.17557v2)) | **ODC-By** ✅ (Common Crawl terms also apply to content) | **SHIP-SAFE as data**; realistically *retrieval/knowledge* use, not 1.5B pretraining | Raw knowledge. For us this feeds **Seshat pages / hunt curriculum**, not LoRA. If a future larger local model is ever pretrained, this is the corpus. Also its *classifier-filtering method* is a curation lesson (§4). |
| **SlimOrca** | HF `Open-Orca/SlimOrca` | ~518K curated GPT-4 completions (FLAN-derived prompts) | HF tag **MIT**, ⚠️ but completions are GPT-4 outputs → OpenAI terms cloud | **TRAIN-ONLY** | Reasoning-trace style data. Optional; SmolTalk/Tulu cover this ground with cleaner stories. Low priority. |
| **OpenOrca (full)** | HF `Open-Orca/OpenOrca` | ~4.2M rows (GPT-4 + GPT-3.5 system instructions) | HF tag **MIT**, ⚠️ same GPT-output cloud, larger | **TRAIN-ONLY** | Same note as SlimOrca; the deduped Slim slice dominates it for our scale. Low priority. |
| **Code: self-oss-instruct** (inside SmolTalk) + **Magicoder-OSS-Instruct-75K** | HF | 75–80K self-contained code instruction pairs, generated from seed snippets (no human code copied) | ⚠️ **Verify at download** — Magicoder data cards have carried differing terms across versions; the self-oss-instruct slice inherits SmolTalk's mixed story | **TRAIN-ONLY until verified** | GSK's curriculum is code-heavy; Seshat must judge code pages (does this snippet *do* what the note claims?). Code instruction data teaches the literacy her code judgments need. |

**Deliberately excluded:** ShareGPT-derived sets (license is a known mess), Alpaca/GPT4-Alpaca & Code-Alpaca
(**CC-BY-NC** — non-commercial, and GPT outputs), Anthropic HH-RLHF (useful preference data but safety-dialogue
specific; CC-BY-NC on some releases — check before any use).

---

## 4. Self-growing data methods — the "GSK learns to train her" endgame

The endgame requirement: **the curate → train → proof → adopt loop must become a GSK-callable skill**, not
an operator script. Here is the literature and the open tooling it would be built from, with compute reality
checked against what we actually have (free Kaggle-class T4s; user machines; our measured ~14 tok/s CPU
fallback — CPU is a proof-of-concept path, never the plan).

### 4.1 The methods (each maps to a loop stage)

1. **Self-Instruct** (arXiv:2212.10560) — a model bootstraps its own instruction data from a small seed set,
   with filtering. *For GSK:* seed = our PLT rubric + the 92 ruled pairs; generation expands candidate
   judgment items (new vapor twins, new borderline cases) which then must survive verification (stage 2).
2. **Rejection Sampling / RFT / best-of-n distillation** (Llama-2-era staple; STaR, arXiv:2203.14465, is the
   reasoning version) — sample many outputs, **keep only the ones that pass a verifier**, train on the
   survivors. *For GSK this is the core loop and we already own the verifier:* PLT scoring + swap-consistency
   (JudgeLM/PandaLM filter) + recall-proofs. GSK generates judgments with a rented seat (or Seshat herself),
   verifies them against outcomes it can check, and only verified judgments become training pairs.
   **This is growth-by-record, formalized: experience → verified record → training data.**
3. **Self-Rewarding Language Models** (Meta, arXiv:2401.10020) — the model acts as its own judge via
   LLM-as-judge prompting, builds preference pairs from its own rankings, and improves *both* generation and
   judging across iterations with DPO. *For GSK:* the long-horizon shape — Seshat's judging improves Seshat's
   training data which improves Seshat. Documented gains are at 70B; at 1.5B expect the loop to work only with
   the external verifier (stage 2) kept in the circuit — self-rewarding without a ground-truth anchor drifts,
   and our round-1 flip is what drift looks like.
4. **DPO on same-item verdict pairs** (from TRAINING-RESEARCH-2026-10-23; ICLR 2025 judge paper: "SFT only
   is insufficient") — chosen = correct verdict+reason, rejected = the wrong verdict on the *same item*,
   seeded with the model's own recorded errors (her 0.95 vapor judgment is literally a ready-made rejected
   sample). TRL's DPOTrainer with LoRA (model as its own reference) fits a Kaggle T4 at 1.5B easily.
5. **Curriculum generation from a memory corpus** — our variant of FineWeb-Edu's classifier-filtering and
   Tulu's skill-mix method: Seshat's own digested pages are the corpus; a curriculum = pages ordered by
   digestion outcome (clean keeps → borderline → known traps), with each hunt adding fresh ruled items.
   The reading-queue *already is* a curriculum generator; it needs a "export training pairs" verb, not a
   new system.
6. **Hard-negative mining from pipeline disagreements** — wherever the rented judge, the PLT rubric, and
   Seshat disagree on a live item, that item is automatically a high-value training candidate (it's
   definitionally at the decision boundary). Log disagreements as first-class records; they are the scarcest
   data we have — scarcer than new keeps.

### 4.2 The frameworks (what a GSK-callable `train_seshat` skill is built from)

| Tool | License | Role in the loop | Fit |
|---|---|---|---|
| **TRL** (HF) | Apache-2.0 | SFTTrainer + DPOTrainer — the actual training step, LoRA via PEFT | ✅ Already our proven path (Kaggle round 1/2 scripts). The skill wraps TRL. |
| **LLaMA-Factory** | Apache-2.0 | Config-driven SFT/DPO/RLHF for 100+ models incl. Qwen2.5; YAML recipes = data a skill can *write* | ✅ Best "skill surface": GSK authors a YAML recipe + dataset manifest, calls one CLI. |
| **Axolotl** | Apache-2.0 | YAML-config LoRA/QLoRA training, dataset format handlers | ✅ Equivalent alternative; SmolTalk/SlimOrca reference models were trained with it. Pick ONE (LLaMA-Factory *or* Axolotl) — don't carry both. |
| **Distilabel** (Argilla) | Apache-2.0 | **Synthetic data pipelines**: generate → label → critique → filter DAGs, built for exactly curate-stage automation | ⭐ The curation stage's natural engine: a distilabel pipeline *is* "GSK curates a dataset" as code. |
| **Argilla** | Apache-2.0 | Human-feedback review UI + dataset curation | Optional: the owner's review surface for spot-checking auto-curated pairs (his one-line verdicts become gold labels). |
| **llama.cpp (GBNF)** | MIT | Serving + grammar-constrained decoding | ✅ From the research memo: a GBNF verdict grammar makes unparseable outputs *impossible* at serve time — belongs in the loop's adopt stage (proof runs against the grammar-locked server). |
| **Kaggle kernels API** | — (platform) | Free T4 execution of the train stage | ✅ Proven in rounds 1–2 (57 min, $0). The skill's remote executor until user-machine GPUs are in scope. |

### 4.3 The skill, sketched (what "self-growing" concretely means)

```
graft_train_seshat (future skill, GSK-callable):
  1. CURATE   — distilabel-style pipeline over Seshat's digestion log + disagreement log:
                emit candidate pairs; apply swap-consistency + PLT-band filters; enforce class balance
                (target ~50/50 keep/quarantine among ruled pairs); attach hard-negative twins (LLMBar recipe).
  2. FREEZE   — write dataset manifest (counts per class, source per item, license tag per item —
                ship builds accept SHIP-SAFE tags only) + hash. No manifest, no train.
  3. TRAIN    — emit LLaMA-Factory YAML (r16/α32, lr 1e-4, seed 222 baseline), dispatch to Kaggle executor,
                watch for the DONE marker.
  4. PROOF    — run the FROZEN balanced proof set (≥20/quadrant, per-class bars: quarantine recall ≥0.8 AND
                keep recall ≥0.8, parse-failure rate, mean vapor-quadrant score) against the GBNF-locked
                merged GGUF, plus same-day base regression.
  5. ADOPT    — flip only on full pass; otherwise keep the artifact + scores, stay on the old model,
                and file the failure items into the disagreement log (they seed the next curation).
```

Every stage already exists somewhere in our stack as an operator action; the work is wrapping, not inventing.
**Compute reality:** curation is CPU-cheap; training is ~1 GPU-hour per round on a free T4; proof is local
llama.cpp minutes. A user machine with any 8GB+ GPU can run the whole loop; a GPU-less machine can still
curate + proof, and train slowly or not at all — which matches the ship criterion (keyless, local, grows
where it can).

---

## 5. Trading data (brief)

GSK's curriculum includes trading systems. Split by use: **knowledge** (goes into Seshat pages / hunt queue —
license-light) vs **training data** (goes into weights — license-strict).

| Source | Access | Terms reality | Use |
|---|---|---|---|
| **Stooq** (stooq.com) | Free CSV downloads of daily OHLCV (US stocks, indices, FX, crypto) | Free for personal use per site terms; no formal redistribution license → **do not bundle raw data in the product** | Knowledge + backtest fixtures locally; ideal hunt/curriculum feed. |
| **Yahoo Finance via yfinance** | Free library | Yahoo's terms: personal, non-commercial use of the data; the *library* is Apache-2.0 but the *data* is Yahoo's → **not redistributable** | Local knowledge/backtests only. Never ship the data; derived *lessons* (pages) are ours. |
| **Binance public data** (data.binance.vision) | Free monthly/daily archives: spot klines, trades, aggTrades | Public archive provided by Binance under its website terms; the cleanest bulk crypto source | Knowledge + any time-series literacy training; still don't bundle raw archives in the installer. |
| **FRED** (St. Louis Fed) | Free API key, generous limits | US-government/Fed data — series are largely public-domain or freely usable with attribution (some third-party series restricted — check per-series) | Macro knowledge for pages; the safest "ship-adjacent" source in this table. |
| **Alpha Vantage** | Free tier API key (**25 requests/day** on the standard free tier) | Free tier is for personal/non-commercial evaluation per their terms | Trickle-feed knowledge only; useless at training scale. |
| **Tiingo / Nasdaq Data Link** | Free tiers (Tiingo free: limited symbols/history; NDL: free datasets vary) | Per-dataset licenses; NDL free sets are clearly labeled | Case-by-case; NDL's labeled free sets (e.g. some Treasury/FRED mirrors) are fine for knowledge. |
| **Kaggle finance datasets** | Free download | **License varies per dataset** (many CC0/CC-BY, many "other/unknown") — check each card | Several good OHLCV corpora are CC0/CC-BY → those specific ones are TRAIN-OK and even bundle-OK with attribution. |
| **HF finance datasets** (e.g. financial sentiment: Financial PhraseBank — research terms; various ticker-news sets) | Free | Per-card; PhraseBank is research-use in practice | Sentiment/news-headline judgment is a *domain* Seshat will digest — a small ship-clean sentiment set would help her judge trading-note pages. Verify per card before use. |

**Rule for this section:** market *data* almost never ships; market *knowledge* (strategies, failure modes,
indicator math — from books/repos already in the hunt curriculum) is the actual curriculum. Price history
teaches a 1.5B judge almost nothing in weights; it teaches plenty as retrievable pages with worked examples.

---

## 6. SYNTHESIS — "Feed her next": the ranked top 5 for dataset v2.2 / v3

Failure being attacked, restated: **(a)** only 20 real quarantine pairs in v2 → verdict prior collapsed to
keep; **(b)** the kept vapor item was fluent-but-empty, and her reason *fabricated* evidence; **(c)** one
reply was unparseable. Round 2 (running) fixes part of (a) with our own reserve. These five are what round
2 does *not* already cover.

### #1 — HelpSteer2 conversion: thousands of human-ruled single-item judgments **[SHIP-SAFE · CC-BY-4.0]**
Convert `nvidia/HelpSteer2` (§1.11) into Seshat format (feedback → [RESULT] verdict+score), with quarantine
defined by human correctness/helpfulness floors *regardless of verbosity*. **Expected effect:** the ruled-pair
scarcity ends — quarantine examples go from 20 to thousands, all human-labeled, all ship-clean; the verbosity
attribute directly manufactures fluent-but-empty negatives with human authority. This is the highest-leverage
single addition in the catalog. *Guardrail:* cap at ~40–50% of the ruled mix so her rubric stays *ours*
(PLT on our corpus), with HelpSteer2 as discrimination muscle, not the personality.

### #2 — LLMBar-recipe twins from her own corpus, both directions **[SHIP-SAFE · MIT method + own data]**
For ~100 of her own kept pages: (i) fluent twin with checkable claims stripped → **quarantine**, reason
naming the missing evidence; (ii) the same content rewritten plain/terse → **keep**. Plus LLMBar's own 419
(MIT) folded into training *and* mirrored in the proof set. **Expected effect:** fluency decorrelates from
verdict in both directions — the direct counter to the 0.95 vapor landing and to fabricated reasons (the
reason field is forced to cite what's *absent*, which is checkable). This is the fix the judge-limitations
paper implies and the one generic data cannot give her, because the twins are in *her* domain voice.

### #3 — Replace the 6-test proof with a frozen balanced proof set **[SHIP-SAFE · built from MIT/CC/own items]**
≥20 items per quadrant — substantive keeps / obvious quarantines / **fluent-but-empty quarantines** /
plain-but-substantive keeps — frozen across rounds, scored as a 2×2 confusion matrix with **per-class bars**
(quarantine recall ≥0.8 AND keep recall ≥0.8), plus parse-failure rate and mean vapor-quadrant substance as
the early-warning gauge. Sources: LLMBar (MIT), RewardBench MIT/CC subsets, XSTest (CC-BY), HaluEval-style
pairs built from her own pages, and her own recorded errors. **Expected effect:** a keep-everything model
can no longer "pass" 4/6 — round 1's failure becomes *unrepresentable* as success. Without this, every other
item on this list is unverifiable.

### #4 — GBNF grammar lock + template/EOS audit (serving-side, from TRAINING-RESEARCH) **[SHIP-SAFE · MIT tooling]**
Not data, but it closes failure (c): constrain llama.cpp decoding to the verdict schema so an unparseable
reply is impossible, and audit train-vs-serve template byte-identity + EOS-in-loss on the merged model.
**Expected effect:** the format failure class disappears entirely; every remaining failure is a *judgment*
failure, which data can then fix. Cheapest item on the list, do it before round 3 regardless of round 2's
outcome.

### #5 — DPO pass seeded with her own errors **[SHIP-SAFE · own data; METHOD from ICLR 2025 judge work]**
After SFT: preference pairs on the *same item* — chosen = correct verdict+reason, rejected = her own wrong
verdict (the 0.95 vapor judgment is pair #1), plus JudgeLM-style swap-inconsistent judgments as rejected
samples. TRL DPOTrainer, LoRA, ~1 epoch, β=0.1, lr ~5e-6–1e-5, fits the free T4. **Expected effect:** SFT
taught her the format and the prior; DPO teaches the *boundary* — the literature's specific remedy for judge
calibration ("SFT only is insufficient"). This is also the prototype of the self-growing loop's improvement
stage (§4.1.3–4): her errors becoming her curriculum is the whole endgame in miniature.

**Explicitly NOT in the top 5, and why:** Prometheus/JudgeLM/PandaLM/Auto-J *data* (better formats than ours,
unusable licenses — methods harvested in §1 instead); UltraFeedback/Nectar (ranking-shaped, license-clouded,
and UltraFeedback's own label bug is the cautionary tale); more same-distribution SFT volume (the research
memo's SKIP — volume without balance and hard negatives re-teaches the failure).

---

## Source index (primary)

- Prometheus 2 paper + license appendix — https://arxiv.org/html/2405.01535v2 · datasets —
  https://huggingface.co/datasets/prometheus-eval/Preference-Collection
- JudgeLM paper — https://arxiv.org/abs/2310.17631 · repo — https://github.com/baaivision/JudgeLM
- PandaLM paper — https://arxiv.org/abs/2306.05087 · repo — https://github.com/WeOpenML/PandaLM
- Auto-J paper — https://arxiv.org/abs/2310.05470 · page — https://gair-nlp.github.io/auto-j/
- LLMBar repo/README — https://raw.githubusercontent.com/princeton-nlp/LLMBar/main/README.md ·
  license via RewardBench table — https://huggingface.co/datasets/allenai/reward-bench
- FLASK paper — https://arxiv.org/pdf/2307.10928
- MT-Bench/Arena paper — https://arxiv.org/abs/2306.05685 ·
  Arena data + license — https://huggingface.co/datasets/lmsys/chatbot_arena_conversations
- UltraFeedback repo — https://github.com/OpenBMB/UltraFeedback ·
  label-bug curation — https://huggingface.co/datasets/argilla/ultrafeedback-binarized-curation
- Nectar card (license rider quoted) — https://huggingface.co/datasets/berkeley-nest/Nectar
- HelpSteer2 card — https://huggingface.co/datasets/nvidia/HelpSteer2 · paper — https://arxiv.org/abs/2410.01257
- HaluEval paper — https://arxiv.org/abs/2305.11747 · repo — https://github.com/RUCAIBox/HaluEval
- Dolly-15k card — https://huggingface.co/datasets/databricks/databricks-dolly-15k
- SmolTalk card — https://huggingface.co/datasets/HuggingFaceTB/smoltalk
- Tulu 3 — https://allenai.org/blog/tulu-3-technical
- FineWeb/FineWeb-Edu paper — https://arxiv.org/html/2406.17557v2
- Judge-limitations paper (below-random finding) — arXiv:2403.02839 (via TRAINING-RESEARCH-2026-10-23)
- Self-Rewarding LMs — arXiv:2401.10020 · STaR — arXiv:2203.14465 · Self-Instruct — arXiv:2212.10560
- Frameworks — github.com/huggingface/trl · github.com/llamafactory-ai/LLaMA-Factory ·
  github.com/axolotl-ai-cloud/axolotl · github.com/argilla-io/distilabel

*Uncertainty register (checked, not guessed): HaluEval data license — not clearly stated, flagged in §2.
PandaLM/Auto-J data licenses — not stated permissively, flagged in §1.3/§1.4. FLASK repo license — not
verified from primary source in this pass, flagged in §1.6. UltraFeedback — card tag vs provenance conflict,
flagged in §1.9. SlimOrca/OpenOrca/SmolTalk — HF tags vs GPT/Llama-output provenance conflicts, flagged in §3.
Magicoder/self-oss-instruct terms — verify at download, flagged in §3.*
