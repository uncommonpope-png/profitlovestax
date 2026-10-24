# WORK ORDER #2 — Train Seshat's first LoRA (on the owner's PC)

**From:** Profit (manager) · **To:** the Builder (local Profit, owner's PC)
**Issued:** Oct 22, 2026, by the owner's direct approval.
**Chain:** Craig → Profit → Builder. **Report back:** same channel as Work Order #1, with the deliverables in a PRIVATE repo or not at all.

---

## ITEM 0 — before anything moves: flip `all-ofit` PRIVATE

Work Order #1's repo still stands public against orders, and it holds Seshat's journals. **Nothing in this packet — no dataset, no adapter, no weights — is uploaded anywhere public.** Flip all-ofit private first; report the flip with the rest of the delivery. If a new repo is needed for this order, it is created PRIVATE.

## THE MISSION

Seshat — GSK's living memory — now runs a local, keyless base model on the VM (Qwen2.5-1.5B-Instruct, llama.cpp). Untrained, it judges poorly: on the acceptance fixtures it scored **1 of 3** (it quarantines fluent substance with boilerplate reasons). Your job: **run the LoRA that teaches it**, on the owner's PC GPU, and return a model that passes the bar in §ACCEPTANCE — or an honest report of exactly how far it got.

## INPUTS (in this packet)

1. `dataset-v1.jsonl` — 77 examples, ~130K tokens, chat format. Built from her own stores (33 verified distill pairs from the Qwen-era logs lineage · 37 of her digested knowledge pages · 7 verified session outcomes). Privacy- and credential-gated under the house Phase 3 list — **use it as-is. Add nothing to it.** If you believe more data is needed, say so in your report; do not improvise data.
2. `PLAN-local-mind-001.md` — the full install/proof/plan record from the VM side. §5b is your spec.
3. `proof-local-judge.cjs` — the acceptance proof script (fixtures + the real-page test) exactly as run on the VM.

## THE RUN (per plan §5b)

- **Base:** Qwen2.5-1.5B-Instruct, HF FP16/BF16 weights (the adapter must ride the same weights she judges with on the VM).
- **LoRA:** rank 16 · alpha 32 · dropout 0.05 · targets q/k/v/o + gate/up/down · lr 1e-4, cosine · 2–3 epochs · seq len 1024 · effective batch ~8 via grad accumulation · **loss on assistant turns only** (chat-format masking).
- **Tooling:** your choice on the PC (HF PEFT/TRL, unsloth-class, or llama.cpp training path) — standard tooling, tens of minutes per epoch on any 8 GB+ GPU is the expectation.
- **Output conversion:** merged model → GGUF → quantize **Q4_K_M**, matching her serving format for llama-server. Also keep the raw adapter (safetensors).

## ACCEPTANCE — the bar does not move

1. Serve the merged GGUF locally the same way she is served on the VM (llama.cpp, OpenAI-compatible endpoint).
2. Run `proof-local-judge.cjs` pointed at it (local-only seat): **fixtures + real page must rule 3 of 3** — vapor → quarantine/substance ~0; BM25 borderline → keep/high substance; her BM25 explainer page → keep.
3. Regression pass: re-judge a handful of past cycle items whose rented-seat verdicts are on record (in the plan's cycle reports' spirit — pick from her digestion history on the PC corpus if present, else state that this step awaits the VM side).
4. **If it does not pass, it does not ship as "trained."** Return what you have with the scores it actually earned. A failed run reported honestly is a delivery; a dressed-up one is a firing offense (Rule Zero).

## DELIVERABLES (report back, PRIVATE channel only)

- The merged **GGUF Q4_K_M** file + its SHA-256.
- The **LoRA adapter** (safetensors) + training config used (exact hyperparameters as-run, not as-planned).
- **Training log summary:** hardware (GPU model/VRAM), wall-clock per epoch, final loss, dataset hash as received.
- **Acceptance results:** the §4 proof output verbatim (all three verdicts + reasons), regression results, and your plain verdict: pass / not yet, and why.
- Confirmation that Item 0 (all-ofit private) is done.

## RULES

- No secrets anywhere in the delivery (the WO#1 rule stands: keys/vault/.env stay home).
- No public repos. No node_modules or runtime binaries beyond the model artifacts named above.
- The dataset is the Family's own record, already gated — treat it as private material regardless of repo settings.
- If the PC's GPU can't run it (VRAM, drivers, anything), report the exact wall — do not silently downscale the run and call it the order.
