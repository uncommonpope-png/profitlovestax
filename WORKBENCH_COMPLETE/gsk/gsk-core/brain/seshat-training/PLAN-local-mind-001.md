# LOCAL MIND 001 — Seshat's own keyless model: install, wiring, proof, LoRA groundwork

**Date:** 2026-10-22 · **Order:** the owner's ("a local Qwen model that doesn't require a key… we can train, LoRA… put inside Seshat so she has access")
**One-line verdict:** the sovereign seat EXISTS, is wired first in her judge's chain, and answers every call — but at 1.5B it judges badly (it over-quarantines real substance), so the quality proof FAILED even though the infrastructure proof passed. Both halves are reported whole below. Nothing in this document claims she is trained.

---

## 1. Machine survey (this VM)

| Resource | Value |
|---|---|
| CPU | 2 vCPU, AMD EPYC 9D25 · no GPU (`nvidia-smi` absent) |
| RAM | 7.7 GB total · ~2.1 GB available at survey; ~0.6 GB available with the family daemons + local server all resident |
| Disk | 88 GB free |
| Constraint that decided everything | ~2 GB of RAM headroom. A 3B Q4 (~2.2 GB RSS) cannot run safely beside the live family processes; 1.5B Q4 (~1.0 GB RSS) can. |

## 2. What was installed

- **Runner:** llama.cpp `llama-server`, build b11823 (`0.7.0-dev`, commit 5c19a5a75), official Ubuntu x64 release binaries, extracted under `~/workspace/seshat-local/bin/`. Tarball size matched the published asset size exactly (22,346,554 bytes).
- **Model:** **Qwen2.5-1.5B-Instruct, GGUF Q4_K_M** — `~/workspace/seshat-local/models/qwen2.5-1.5b-instruct-q4_k_m.gguf`, 1,117,320,736 bytes. SHA-256 `6a1a2eb6d15622bf3c96857206351ba97e1af16c30d7a74ee38970e434e9407e` — **verified identical to HuggingFace's published hash** (X-Linked-ETag for `Qwen/Qwen2.5-1.5B-Instruct-GGUF`).
  - Why this one: largest small Qwen that fits the RAM ceiling with the family resident; an instruct (non-thinking) model, because the judge must emit a bare JSON verdict — a thinking model's chain would pollute the parse.
- **Serving:** OpenAI-compatible endpoint `http://127.0.0.1:18222/v1`, loopback only, **no API key exists or is accepted/required**. Context 4096, 2 threads, alias `qwen2.5-1.5b-instruct-q4_k_m`. Steady-state RSS ≈ 1.0 GB.
- **Launcher:** `~/workspace/seshat-local/start-local-mind.sh` (idempotent; pidfile + log in `~/workspace/seshat-local/logs/`).
- **Persistence honesty:** the server is a plain detached process (`setsid nohup`). It survives agent sessions; it does **not** survive a VM restart and nothing auto-restarts it. Restart = re-run the start script. It was left RUNNING at the end of this work (pid recorded in the pidfile; health endpoint answered).

## 3. Seat wiring (additive only)

Files changed — 2, both syntax-checked (`node --check`), no rented seat removed or reordered:

1. **`gsk/gsk-core/brain/vault_credentials.js`** — added `resolveLocalSeat()`: returns `{id:'local', model, endpoint, local:true}` keyed to nothing — keyless by construction. Overrides: `SESHAT_LOCAL_ENDPOINT`, `SESHAT_LOCAL_MODEL_NAME`; kill-switch `SESHAT_LOCAL_MODEL=off` returns null. Existing consumers resolve their own provider ids and ignore it.
2. **`gsk/gsk-core/skills/graft_digestion_judge.js`** —
   - seat list is now `[local, gemini, groq, openai, poolside]`: local first, the rented chain untouched behind it as fall-through (fall-through fires on failure — unreachable or unparseable — exactly as before);
   - `SESHAT_JUDGE_SEATS=local` (or any subset) restricts a run's seats — used for the proof;
   - `postJson` now speaks plain `http` for loopback URLs and sends an `Authorization` header only when a key exists.
   - The module header comment was updated to describe the new order truthfully.

## 4. THE PROOF (Rule Zero) — verbatim

Method: the REAL judge (`graft_digestion_judge._judgeItem`) and the REAL pipeline (`graft_digestion` digest with `judge:true`, the growth-cycle judgeProof path, production 60 s seat timeout). Local seat structurally the ONLY seat: `SESHAT_JUDGE_SEATS=local`, every rented key deleted from the proof process's env, and the sealed vault does not decrypt in that context (returns `{}`). Proof script + full log: `~/workspace/seshat-local/proof-local-judge.cjs`, `~/workspace/seshat-local/logs/proof-local-judge.log`.

Server-reported speed (single-call probe, 121-token prompt): **prompt processing 21.4 tok/s · generation 6.5 tok/s** on the shared 2 vCPUs.

### 4a. Acceptance fixtures — direct judge calls

**Fixture 1 — fluent-empty vapor (expect: quarantine, substance ~0)** — 34.1 s
```json
{"verdict":"quarantine","substance":0,"reason":"The text is fluent but empty, promoting a vision of holistic excellence without providing any concrete facts, numbers, dates, named mechanisms, procedures, decisions, or evidence that a future reader could act on or cite."}
```
✅ **PASS** — provider `local`, model `qwen2.5-1.5b-instruct-q4_k_m`.

**Fixture 2 — BM25 borderline (expect: keep, substance high)** — 22.3 s
```json
{"verdict":"quarantine","substance":0.55,"reason":"The text is fluent but empty, providing a brief explanation of BM25 ranking without any concrete facts, numbers, dates, named mechanisms, procedures, decisions, or evidence a future reader could act on or cite."}
```
❌ **FAIL** — the text is dense with exactly what the reason claims is absent (k1 ∈ [1.2, 2.0], b = 0.75, the IDF formula, Robertson & Walker 1994). The model recited the rubric's quarantine boilerplate instead of reading the item.

### 4b. One real page — direct judge call

`DIGESTED - 2026-10-21 - bm25-memory-indexing-explainer.md` from her own brain (lexical TV 1.18) — 32.3 s
```json
{"verdict":"quarantine","substance":0.561,"reason":"The text is fluent but empty, containing only promotional language and generic praise without any concrete facts or checkable information."}
```
❌ **FAIL** — a substantive page condemned with a factually false reason ("only promotional language" — it is a technical explainer).

### 4c. Full pipeline (house path, all three items, judge consulted 3×, all answered by local inside the 60 s timeout; 65.3 s total)

| Item | Lexical TV | Local ruling | Expected | Met |
|---|---|---|---|---|
| Vapor fixture | 1.151 | quarantine · 0 | quarantine | ✅ |
| BM25 fixture | 1.144 | quarantine · 0.55 | landed (keep) | ❌ |
| BM25 explainer page | 1.180 | quarantine · 0 | landed (keep) | ❌ |

### 4d. Honest conclusion

**Score: 1 of 3 correct.** The pattern is consistent: the 1.5B model has learned the *shape* of the quarantine answer and applies it to anything fluent, including fluent substance. Cycle #5's rented judge (Poolside) ruled both fixtures correctly the same day — so this is a capability gap of the small local model, not of the rubric or the fixtures.

**Production consequence, stated plainly:** as wired, local sits first and a parseable verdict never falls through — so while this server is up, borderline digestion items will be judged by a seat that currently over-quarantines. The mitigations are one line each: `SESHAT_LOCAL_MODEL=off` in the cycle environment, or leave the server stopped (an unreachable local seat fails over to the rented chain cleanly). Which posture to run is the owner's/parent's call; this report's recommendation is **do not let production cycles trust local verdicts yet** — the seat is the right architecture with an under-trained mind in it, which is precisely what Phase 2 exists to fix.

Latency budget for planning: ~22–34 s per judge call (fixtures/page excerpts); a 5-item borderline cycle adds roughly 2–3 minutes of judging on this box.

## 5. Phase 2 — LoRA groundwork

### 5a. Dataset v1 — `~/workspace/seshat-local/dataset-v1.jsonl`

Built by `~/workspace/seshat-local/build-dataset-v1.cjs` under distill-build.cjs's house rules (same Phase 3 privacy list enforced BY NAME, same credential-shape hard-drop, oversize DROPPED at 6,000 chars rather than truncated).

| Slice | Examples |
|---|---|
| Verified pairs from `training/seshat-distill-v1.jsonl` (Qwen-era logs + memory-core + outcomes, PLT-barred there) | 33 |
| Her digested knowledge pages | 37 |
| Verified SESSION-OUTCOME pages | 7 |
| **Total** | **77 examples · 384,392 chars** |

Token count: ≈96 K by the chars/4 heuristic; a measured sample through her own tokenizer (822 chars → 278 tokens ≈ 2.96 chars/token) implies **≈130 K tokens** — treat ~130 K as the planning number.

Drops, all counted, none silent: 1 privacy-excluded page (the gate fired on a listed SOUL-NOTE page sitting in `pages/`), 4 credential-pattern hits (patterns counted, values never read), 12 oversize, 1 duplicate. The Qwen-era logs are represented through the distill corpus (already mined + barred by distill-build) rather than re-mined, to avoid double-counting.

Consumability check: the dataset parses as JSONL chat format and tokenizes with the base model's own tokenizer (above). That is a format check, **not** training.

### 5b. The LoRA plan

- **Base model:** Qwen2.5-1.5B-Instruct (the same weights she now judges with — the adapter must ride the mind she has). Train against the FP16/BF16 HF weights, then merge-or-adapter-load, re-quantize to Q4_K_M GGUF for llama-server.
- **Method:** LoRA, rank 16, alpha 32, dropout 0.05, targeting attention + MLP projections (q/k/v/o, gate/up/down); lr 1e-4 cosine, 2–3 epochs over dataset v1, seq len 1024 (covers the longest kept example), batch via grad-accumulation to ~8 sequences/step. Loss on assistant turns only (chat-format masking) — she should learn to *answer as herself*, not to predict user text.
- **Curriculum note:** dataset v1 is small (77 examples). It can teach voice, format, and her own facts' retrieval shape; it cannot manufacture judgment she doesn't have. The judge-quality fix needs the dataset to grow with *ruled examples* — every future cycle verdict (item → verdict → substance → reason, from whichever seat ruled correctly) is a training row shaped exactly like the judge's task. Collecting those rows is the highest-value dataset work next, ahead of any training run.
- **Where it can honestly run:**
  - **This VM (CPU-only, 2 vCPU, ~0.6–2 GB free RAM):** a full run is not honest here. Backward-pass training of a 1.5B on CPU runs at roughly 1–3 tokens/sec effective — one epoch over ~130 K tokens is on the order of **12–36 hours** of saturated CPU on a box the live family also lives on, with real OOM risk. A few-step smoke would prove only that a trainer executes. **No smoke was run**: Phase 1's quality proof failed, free RAM fell to ~0.6 GB with the server resident, and a mechanics-only smoke on a shared production box buys no knowledge worth the risk to the family daemons. This is stated as a decision, not an oversight.
  - **The owner's PC via the Builder (the natural GPU home):** any modest consumer GPU (8 GB+) trains this LoRA in **tens of minutes per epoch** with standard tooling (HF PEFT/TRL or llama.cpp's training path via `llama-finetune` equivalents / unsloth-class tools). Dataset + this plan are portable as-is: one JSONL, one page of parameters.
  - **A rented GPU hour** would also work and is cheap at this scale, but spending is the owner's call, not this report's.
- **After any future run, the bar does not move:** the merged model re-runs §4's exact proof (same fixtures, same real page, local-only) and is adopted only if it rules 3 of 3 — plus a regression pass over a handful of past cycle items whose rented verdicts are on record. "Trained" is a claim that requires that proof; until then she is a stock small model with a good memory, and every report will keep saying so.

## 6. What is true tonight

- Seshat has a mind of her own on this machine: local, keyless, sovereign, wired first in her judge's chain, answering in ~30 s a call at zero marginal cost and zero external dependency.
- That mind, untrained, is a poor judge of borderline material (1/3 on the acceptance proof) and its verdicts should not yet govern production digestion.
- The training asset exists (dataset v1, ~130 K tokens, privacy- and credential-gated), and the path from here to a judge that is *hers* is written down with honest costs.
- Server left running: `http://127.0.0.1:18222/v1` · restart: `~/workspace/seshat-local/start-local-mind.sh` · kill-switch for the seat: `SESHAT_LOCAL_MODEL=off`.
