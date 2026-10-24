# Training Research Memo — Seshat Judge LoRA (Qwen2.5-1.5B)

**Date:** 2026-10-23 · **Scope:** research only; no training files, datasets, or running jobs were changed.
**Our failure shape (given):** SFT round 1 (r16/α32 all-linear, lr 1e-4 cosine, 2–3 ep, seq 1024, assistant-only loss, 283 examples, 92 ruled pairs at 72 keep / 20 quarantine) flipped the base model's over-quarantine bias into keep-everything collapse: vapor item landed at 0.95 with a fabricated reason through the production pipeline, plus one unparseable direct reply. Round 2 (v2.1 data, ~2.2×, weighted to fluent-but-empty quarantines) is already running.

Conventions: **[Sourced]** = stated in a cited source. **[Inference]** = my application of a source to our setup; not stated in the source.

---

## Q1 — Class imbalance in verdict-style SFT

**Findings**

- **[Sourced]** Imbalanced fine-tuning data produces majority-class bias, poor minority recognition, and misleading headline accuracy — a model that predicts only the majority class looks "accurate" while failing the minority class entirely. The standard remedies are the same three families as in classical ML: resampling (over/undersampling), loss reweighting (class weights, focal loss), and decision-threshold adjustment. (MarkAIcode, *How to Handle Imbalanced Datasets in LLM Fine-Tuning*, https://markaicode.com/handle-imbalanced-datasets-llm-fine-tuning/)
- **[Sourced]** Resampling, class weights, and threshold tuning are *equivalent* ways of making cost-sensitive decisions — they change how much each error type counts rather than what the model can discriminate; threshold adjustment after training on original data can reproduce the same decision shift. (Train in Data, *Machine Learning with Imbalanced Data*, https://blog.trainindata.com/machine-learning-with-imbalanced-data/)
- **[Sourced]** Google's ML crash course recommends, for heavily imbalanced data, downsampling the majority class *paired with* upweighting it by the downsample factor, tuned as a hyperparameter — i.e., balance the batches the model sees, then correct the induced prior shift in the loss. (Google for Developers, *Class-imbalanced datasets*, https://developers.google.cn/machine-learning/crash-course/overfitting/imbalanced-datasets)
- **[Sourced]** No source found gives a validated minimum minority-example count for a ~1.5B LoRA judge. Practitioner data-curation guidance for classification-style fine-tunes targets roughly balanced label distributions (the markaicode guide's worked examples rebalance to 1:1), and general LoRA guidance holds that a few hundred high-quality examples suffice for behavior/format adaptation — quality over volume. (MarkAIcode guide above; *Fine-Tune LLMs with LoRA and QLoRA: 2026 Guide*, https://dev.to/jangwook_kim_e31e7291ad98/fine-tune-llms-with-lora-and-qlora-2026-guide-33lf)

**Implied change for us**

- **[Inference]** Our ruled pairs were 78/22 keep/quarantine — the single most likely driver of keep-collapse, because in generative SFT the "class prior" is literally the frequency of the verdict token sequences. There is no per-class weight knob in a standard TRL SFTTrainer run, so the practical lever on our stack is **data-level: bring ruled pairs to ~50/50** (oversample *distinct* quarantine items; avoid exact-duplicate oversampling, which at 2–3 epochs invites memorization of those specific items rather than the boundary).
- **[Inference]** Threshold calibration is available to us for free at the pipeline level: the substance score is generated text, but the *pipeline* decides landing — a score-band rule (e.g., auto-land only above a cutoff, route the band to the rented judge) is the generative-judge analog of threshold tuning and can compensate residual prior skew without retraining. This does not fix a wrong verdict token, only the score→action mapping.

---

## Q2 — Hard negatives: fluent, confident, empty

**Findings**

- **[Sourced]** This failure is documented and named: fine-tuned judge models are **biased toward superficial quality**. On LLMBar's adversarial test sets — pairs where the *incorrect* answer has better superficial quality (more fluent, more verbose, better formatted) — JudgeLM-7B, PandaLM-7B, Auto-J-13B, and Prometheus-7B scored **below random guessing** (e.g., JudgeLM 23–28% on several adversarial splits vs ~62% on natural), while GPT-4 stayed at 64–77%. The authors conclude fine-tuned judges' in-domain performance can rest on "spurious statistical features" instead of actually differentiating good from bad. (*On the Limitations of Fine-tuned Judge Models for LLM Evaluation*, arXiv:2403.02839, https://arxiv.org/html/2403.02839v2)
- **[Sourced]** Verbosity bias is a general LLM-judge pathology, not just a fine-tuning artifact: in the MT-Bench judge study, both Claude-v1 and GPT-3.5 preferred a longer rephrased answer (same content, padded) over 90% of the time. (MT-Bench judge-bias summary, https://gist.github.com/bigsnarfdude/69503a9705e9015c8afcc59d45c36a3f)
- **[Sourced]** The standard construction for adversarial judge tests — and by extension training items — is the LLMBar recipe: take a substantively correct item and a substantively wrong/empty item, then *upgrade the wrong one's surface* (fluency, verbosity, formality) so surface and substance point in opposite directions. Debiasing practice also includes rubric-anchored scoring (score named axes — factuality, coverage, evidence — instead of a gestalt preference). (arXiv:2403.02839 above; *Debiasing Techniques: Position, Length, and Verbosity*, https://llmbook.icsgen-ai.org/part-9-llm-evaluation-observability/module-46-llm-as-judge-automated-evaluation/section-46.3.html)
- **[Sourced]** Hard-negative mining as an iterative loop — add challenging examples where the model previously hallucinated/erred, then retrain — is recommended practitioner practice for fine-tuned reliability, alongside preference tuning on targeted hard datasets (a cited NAACL 2025 result: 90–96% hallucination reductions from preference fine-tuning on synthetic datasets "designed to be hard to hallucinate on"). (*Prevent Overfitting and Hallucinations in Fine-Tuned LLMs*, https://www.blockchain-council.org/ai/preventing-overfitting-and-hallucinations-in-fine-tuned-llms/)
- **[Sourced]** Judges also confabulate rationales for wrong verdicts: in a baiting study, judges under injected/fluent wrong answers not only flipped but *wrote confident verification-style explanations for the wrong answer, never mentioning the bait* — i.e., a plausible reason string is not evidence the verdict was reasoned. (dev.to, *I tried to bait LLM judges into picking wrong answers*, https://dev.to/kongclaves/i-tried-to-bait-llm-judges-into-picking-wrong-answers-the-weak-ones-rewrote-the-math-to-agree-3ei6)

**Implied change for us**

- **[Inference]** Round 2's weighting toward fluent-but-empty quarantines is the right move and matches the literature; round 3 should go further in *construction*, not just proportion: build quarantine items by the LLMBar recipe — take real kept items and produce surface-upgraded empty twins (same polish, citations stripped/faked, specifics replaced with confident generalities) labeled quarantine, and pair them with *plain-looking but substantive* keeps, so fluency is decorrelated from the verdict in both directions. One-directional hard negatives (only fluent→quarantine) can teach the inverse shortcut "polished = bad."
- **[Inference]** Include reason-discipline in those examples: quarantine reasons should name the *missing evidence* ("no checkable claim; restates the prompt"), mirroring the rubric-anchor debiasing technique — our round-1 model fabricated a reason for the vapor item, which is exactly the confabulated-rationale failure above.
- **[Inference]** Mine our own errors iteratively: every production item the rented judge quarantines that Seshat-local would have kept (and vice versa) becomes a candidate training pair. This is the hard-negative-mining loop, sourced above, applied to our pipeline logs.

---

## Q3 — Format compliance / unparseable outputs

**Findings**

- **[Sourced]** Post-SFT format/termination failures are usually *mechanical*, not capability failures. A widely-cited HF-forum diagnosis lists the stack: (1) tokenizer/EOS mismatch, (2) **chat-template mismatch between training and inference**, (3) over-aggressive LR/epochs on an already-instruct model, (4) broken save/merge/quantization, (5) numerical corruption. (Hugging Face Forums, *SFT of Instruct Model Collapse*, https://discuss.huggingface.co/t/sft-of-instruct-model-collapse/170526/2)
- **[Sourced]** "The template is part of the model": training and serving must render the conversation **byte-for-byte identically**; the model only learns to stop if the end-of-turn marker is itself a loss target — if labels cover the reply text but not the turn-end token (or the trainer's EOS differs from the template's turn-end token), "the model learns to keep going: replies that run on into an invented user turn are the symptom." TRL documents setting `eos_token` to the template's turn-end token for this case. (*SFT, in depth*, https://www.aicassindra.com/blogs/slm/sft_supervised_finetuning.html)
- **[Sourced]** Padding-with-EOS during training can also teach the model to *ignore* EOS (the trainer fills with the same token it should learn to emit), degrading its ability to emit it at the end. (clay-atlas, *Mistral Cannot Generate eos_token After SFTTrainer Fine-tuning*, https://clay-atlas.com/us/blog/2024/01/01/mistral-sft-trainer-cannot-generate-eos-token/)
- **[Sourced]** Constrained decoding removes the failure class entirely at inference: grammar/schema-constrained decoding (llama.cpp GBNF / `--json-schema`, XGrammar-style) sets invalid tokens' probability to 0, so output is guaranteed parseable — "deterministic and free" in llama.cpp. It controls format only; the model still chooses the values. (*The local LLM ecosystem doesn't need Ollama — 5 llama.cpp tricks*, https://pengen.diewe.workers.dev/_cbd692d476c5faf3b61bcf/the-local-llm-ecosystem-doesnt-need-ollama-5-llamacpp-tricks-90-of-developers-are-missing-2olg; *Why Your LLM Prompts Break in Production*, https://dev.to/taqui/why-your-llm-prompts-break-in-production-and-how-to-fix-them-298o)

**Implied change for us**

- **[Inference]** One unparseable reply out of six is consistent with a small template/EOS/quantization seam rather than missing format knowledge — the same model produced parseable output in 5 of 6. Before adding data, audit the seams: (a) confirm the training render and the `proof-local-judge.cjs` / pipeline prompt render are byte-identical (same ChatML template, same system text); (b) confirm the turn-end token (`<|im_end|>` for Qwen2.5 ChatML) was inside the loss mask, not masked out by assistant-only loss cutting at content end; (c) re-test the *unquantized merged* model on the failing fixture — if it parses there, the seam is the GGUF conversion, per failure class (4) above.
- **[Inference]** Regardless of the audit, put a GBNF grammar for the verdict schema on the llama.cpp serving path. This is the highest-certainty fix in this whole memo: parse failures become impossible, and the proof then measures judgment only. Keep training-side template discipline too — grammar guarantees shape, not sense.

---

## Q4 — SFT vs preference tuning (DPO/ORPO) for judgment calibration

**Findings**

- **[Sourced]** Directly on point: *Learning LLM-as-a-Judge for Preference Alignment* (ICLR 2025) states existing judge training is SFT-imitation of correct judgments, and "we empirically find that SFT only is insufficient." Their fix is **contrastive DPO on judgment pairs**: for the *same item*, a correct judgment (j+) vs an incorrect/non-committal judgment (j−), trained with DPO loss plus a small SFT anchor term to mitigate overoptimization. (https://lacuna.tiptreesystems.com/pdf/art_f9057f5a557d468ba3f8b8ef31199edb)
- **[Sourced]** *Direct Judgement Preference Optimization* (DJPO, arXiv:2409.14664) does the same for generative judges: DPO loss **plus** SFT loss on the chosen judgment, so the judge "learns to both increase the likelihood of positive examples and decrease the likelihood of negative examples." (https://arxiv.org/pdf/2409.14664)
- **[Sourced]** Two-stage is the norm, not a choice: DPO assumes an SFT model that already answers in the right shape ("Skipping SFT: DPO on a base model learns format, not preference"); pairs should be *on-policy* (sampled from the SFT model itself, scored, best-vs-worst kept), length-balanced (else DPO length-hacks), with 5–10% held out; typical run is **1 epoch, sigmoid loss, β=0.1**, initial loss ≈ 0.693 as a sanity check. (*DPO, in depth: a practitioner's workflow for small models*, https://www.aicassindra.com/blogs/slm/dpo_direct_preference_optimization.html)
- **[Sourced]** Practicality on our stack: TRL `DPOTrainer` with a LoRA config uses the base/SFT model as reference when `ref_model=None` (no second model in memory), and its documented config for exactly this pattern is r16/α32 all-linear — our existing adapter shape. DPO learning rates are far below SFT: ~5e-7–5e-6 full-model, ~1e-5 for adapters per TRL-oriented guidance. ORPO is the single-stage alternative (SFT NLL + odds-ratio preference in one loss, no reference model at all; TRL `ORPOTrainer`, β=0.1, lr ~8e-6 in the HF smol-course example) — less memory, one run instead of two. (TRL DPO walkthrough, https://www.opodab.com/2026/08/llm-alignment-dpo-trl-implementation.html; *DPO Training on GPU, in depth*, https://www.aicassindra.com/blogs/gpu/gpu_dpo_training.html; HF smol-course ORPO notes, https://deepwiki.com/huggingface/smol-course/4.2-orpo-and-advanced-techniques)

**Implied change for us**

- **[Inference]** Our failure is precisely the shape preference tuning targets: the model can *produce* both verdicts (format learned) but assigns them wrong on hard items — SFT gives no gradient against the wrong verdict on the same item; DPO does. A **small DPO pass on top of the round-2 SFT adapter** is the literature-backed round-3 move: pairs = same digestion item, chosen = ruled-correct verdict+score+reason, rejected = the opposite verdict with a plausible-sounding reason (ideally the model's own sampled wrong outputs — on-policy, and we already have one: the 0.95-vapor judgment verbatim). A few hundred such pairs, 1 epoch, β=0.1, lr ~5e-6–1e-5, LoRA — comfortably within a Kaggle T4 session at 1.5B/seq-1024.
- **[Inference]** Keep the SFT anchor term (both judge-DPO papers add it) to protect format and the substantive keeps while the preference term attacks the boundary.

---

## Q5 — Hyperparameters: r16, lr 1e-4, 2–3 epochs on ~300–600 examples

**Findings**

- **[Sourced]** Our settings sit inside the commonly recommended band, not outside it: r16 is the standard default (start r16; raise to 32 only if validation plateaus, drop to 8 if overfitting fast); lr 1e-4 is the "conservative" LoRA rate (2e-4 standard QLoRA, 5e-5 suggested for <200 examples); epochs for small datasets (<1K) are typically quoted *higher* than ours — 4–8 in one guide, 3–10 in another — always with the caveat to watch validation loss for the overfitting turn. Safest-parameter summaries converge on 1–3 epochs, lr 1e-4–2e-4, rank 16. (*Fine-Tuning Open-Source LLMs with QLoRA and Unsloth: Complete 2026 Guide*, https://dev.to/pockit_tools/fine-tuning-open-source-llms-with-qlora-and-unsloth-the-complete-2026-guide-2ome; *Best LoRA Training Settings*, https://craveu.ai/tags/best-lora-training-settings; 2026 LoRA guide FAQ, https://dev.to/jangwook_kim_e31e7291ad98/fine-tune-llms-with-lora-and-qlora-2026-guide-33lf)
- **[Sourced]** Over-aggressive LR/too many epochs on an already-instruct model is a documented cause of degraded, format-breaking output (failure class 3 in the HF diagnosis above) — but the cited examples are more extreme (e.g., lr 1e-4 × 10 epochs turning a fluent model to gibberish). (HF Forums, https://discuss.huggingface.co/t/sft-of-instruct-model-collapse/170526/2)

**Implied change for us**

- **[Inference]** Hyperparameters are an unlikely primary cause of the *verdict* collapse: the model improved on substance (4/6 vs 2/6) and held format in 5/6 — an overtrained wreck does neither. The directional flip (over-quarantine → over-keep) tracks the data change (78% keeps in ruled pairs), not the optimizer. Verdict: **do not spend round 3 tuning lr/epochs.** Two cheap guards only: hold out a small validation slice and eval per-epoch checkpoints on it (we currently can't see *when* the flip sets in), and keep epochs at 2 rather than 3 for the judge pairs if v2.1's balance fix lets us — fewer passes over a small ruled set, less prior memorization. Both are [Inference], offered as hygiene, not as the fix.

---

## Q6 — Evaluation: a proof that catches majority-class collapse

**Findings**

- **[Sourced]** Accuracy on an imbalanced (or tiny, skewed) test set is the metric that hides collapse; the standard corrective kit is: **confusion matrix** (shows exactly how many minority items were absorbed into the majority class), **per-class precision/recall/F1** (classification report), macro-averaged F1, and threshold analysis on scores. A collapsed model's matrix has an empty minority row/column — visible at a glance, invisible in accuracy. (CodeSignal, *Comprehensive Evaluation Strategies for Imbalanced Data*, https://codesignal.com/learn/courses/evaluation-metrics-advanced-techniques/lessons/comprehensive-evaluation-strategies-for-imbalanced-data; TrueGeometry confusion-matrix explainers, https://www.truegeometry.com/api/exploreHTML?query=How%20does%20a%20confusion%20matrix%20help%20in%20evaluating%20classification%20models%20with%20imbalanced%20datasets,%20and%20what%20metrics%20can%20be%20calculated%20from%20it%20beyond%20accuracy?)
- **[Sourced]** For judge models specifically, the field's corrective is an **adversarial split**: LLMBar-style sets where surface quality and correctness are deliberately decorrelated (fluent-wrong vs plain-right), reported separately from natural accuracy — because fine-tuned judges that look strong on natural sets fell *below random* on adversarial ones. (arXiv:2403.02839, https://arxiv.org/html/2403.02839v2)
- **[Sourced]** Judge-evaluation hygiene also includes checking score distributions for drift toward length/verbosity (scores creeping with token count signals verbosity bias) and anchoring each score band to a concrete rubric description to fight scale compression. (*AI Evals, Part 4: LLM-as-Judge, Done Right*, https://dev.to/mrviduus/ai-evals-part-4-llm-as-judge-done-right-31eg)

**Implied change for us — what the 6-test proof should become**

- **[Inference]** Six tests cannot show a confusion matrix; a keep-everything model scored 4/6 *because* the set was 4 keeps / 2 quarantines in effect. Replace the single score with a **fixed, frozen, balanced proof set**: ≥20 items per quadrant — (a) substantive keeps, (b) plain/obvious quarantines, (c) **fluent-but-empty quarantines (LLMBar-style hard negatives)**, (d) plain-looking but substantive keeps — reported as a 2×2 confusion matrix plus per-class recall, with the pass bar stated per class (e.g., quarantine recall ≥ 0.8 *and* keep recall ≥ 0.8), not as a total. Add two standing checks: parse-failure rate (target 0 once grammar decoding lands) and mean substance score on the vapor quadrant (a rising mean is the earliest collapse alarm). Keep the set frozen across rounds so base/v2/v2.1/v3 numbers are comparable — the current 6 tests can live inside it as fixtures, unchanged.

---

## Ranked change list for Round 3

| # | Change | Type | Verdict | One-line reasoning |
|---|--------|------|---------|--------------------|
| 1 | GBNF grammar for the verdict schema on the llama.cpp serving path + train/serve template & EOS-in-loss audit | Format | **DO** | Kills the parse-failure class deterministically and isolates the proof to judgment only [Sourced mechanism; Inference that our seam is mechanical] |
| 2 | Balance ruled pairs to ~50/50 keep/quarantine; build hard negatives by the LLMBar recipe in *both* directions (fluent-empty quarantines + plain-substantive keeps) with evidence-naming quarantine reasons | Data | **DO** | 78/22 prior is the most likely collapse driver; fine-tuned judges are documented to fail exactly on surface-vs-substance decorrelation [Sourced] |
| 3 | Replace the 6-test proof with a frozen balanced proof set (≥20/quadrant incl. adversarial vapor quadrant), reported as confusion matrix + per-class recall with per-class pass bars | Evaluation | **DO** | A total score structurally cannot detect majority collapse — it already didn't [Sourced method; Inference on our numbers] |
| 4 | DPO pass (TRL, LoRA, β=0.1, lr ~5e-6–1e-5, 1 epoch, + small SFT anchor) on same-item chosen/rejected verdict pairs, seeded with the model's own wrong outputs (incl. the 0.95 vapor judgment) | Preference pass | **DO** | Two judge-specific papers find SFT-only insufficient and contrastive judgment DPO effective; fits our stack and T4 budget [Sourced] |
| 5 | Pipeline threshold band: auto-land only above a substance cutoff, route the middle band to the rented judge | Calibration | **CONSIDER** | Threshold tuning is equivalent to reweighting for decision purposes [Sourced] — cheap insurance while the local judge matures, but it routes around the model rather than fixing it |
| 6 | Per-epoch checkpoint eval on a held-out validation slice; cap judge-pair epochs at 2 | Hyperparams | **CONSIDER** | Hygiene to see when the flip sets in; our lr/rank/epochs are inside the recommended band, so this is instrumentation, not a fix [Sourced band; Inference on value] |
| 7 | Class-weighted / focal loss in SFT | Hyperparams | **SKIP** | No native per-class weighting in our generative SFT path; data-level balancing (item 2) achieves the prior correction directly [Inference] |
| 8 | Retune lr (1e-4), rank (16), or epochs as the primary fix | Hyperparams | **SKIP** | Settings are mid-band per multiple guides, and the model's substance gains argue against optimizer damage [Sourced band; Inference on causation] |
| 9 | More generic SFT epochs on more of the same distribution | Data | **SKIP** | SFT-only is the approach the judge literature found insufficient for calibration; volume without boundary contrast repeats round 1 [Sourced] |
