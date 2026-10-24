# TRAINING ROUTES — Seshat's mind, trained from THIS VM (2026-10-23)

**Why this document exists:** Work Order #2 assumed the Builder's GPU. That assumption is dead — the owner has no training-capable PC and Profit committed to handling training. This report establishes, with measurements, how the LoRA run actually happens from here, and stages everything so only a green light is missing. NOTHING in this document claims training has happened. The adoption bar is unchanged: merged model re-runs the local-only proof at 3/3 + regression before `SESHAT_LOCAL_MODEL` flips on.

---

## 1. VM HARDWARE TRUTH (measured 2026-10-23)

| Resource | Reality |
|---|---|
| CPU | **2 vCPU**, AMD EPYC 9D25 |
| RAM | **8 GB total** (MemTotal 8,125,588 kB); MemAvailable fluctuates ~1.3 GB at idle observation — the box is shared/loaded; treat ~4–6 GB as the realistic training envelope, watch RSS live |
| Swap | **none** — an OOM is a kill, not a slowdown |
| Disk | 100 GB volume, **85 GB free** — no constraint |
| GPU | **none.** No /dev/nvidia*, no lspci GPU lines. Confirmed, not assumed. |

The old note "CPU 12–36 h/epoch" was an unmeasured guess. Section 3 replaces it with a measurement.

## 2. DATASET v2 — BUILT AND VERIFIED

Builder: `~/workspace/seshat-local/build-dataset-v2.cjs` → `~/workspace/seshat-local/dataset-v2.jsonl`

| Class | n | What it is |
|---|---|---|
| **A — ruled judge** | **92** | Production-format pairs: the exact `graft_digestion_judge` RUBRIC as system, the production user layout (title + lexical stage + item excerpt, 3,500 chars), assistant = the **recorded rented-judge verdict JSON** (verdict + substance + verbatim reason). Sources: 75 judge objects in the hunt absorb-reports (hunts 13–28, all with reasons), 6 growth-cycle judgeReviews, 11 logged quarantine fixtures. Split: **72 keep / 20 quarantine** |
| **B — absorption** | **114** | Distillation pairs: source excerpt → GSK's recorded absorption in his own words (from the absorb-reports; 117 existed, 3 lost to dupe/oversize drops) |
| **C — v1 carryover** | **77** | dataset-v1.jsonl wholesale (Qwen-era distill pairs + digested pages + session outcomes, already verified) |
| **Total** | **283 examples, 1,586,679 chars = 395,311 tokens exact** (Qwen tokenizer, measured 2026-10-23; **265,187 trained tokens/epoch at the seq-1024 cap**, 795,561 for 3 epochs) | |

- **Ruled fraction: 92/283 = 33%** — and Class A is 100% ruled (every label is a real recorded verdict with a real recorded reason; nothing was synthesized except the 11 fixture reasons, which are templated from the items' own recorded PLT signals and marked `provenance: fixture-log` in `_meta`).
- Class balance warning: Class A skews keep (72/20). The 20 quarantines are precious — they include the exact failure family that failed the 1/3 proof (fluent-but-empty). Do not downsample them.
- Length reality: p50 example ≈ 5,069 chars, p90 ≈ 7,324, max 73,834 (one v1 carryover). At the plan's **seq 1024, most examples truncate on the prompt side** — the training script truncates the user side middle-out so the assistant turn (the part with loss) always survives intact.
- Privacy gate held: v1 exclusion list enforced, credential regex hard-drop active (0 hits), 1 oversize + 3 dupe + 2 no-text drops, all counted in the build log.
- Expansion reserve (not built): ~90 more absorption pairs sit in `.seshat-brain/pages/` (gsk-absorption-*.md) in less regular format, plus hunts 1–12 absorptions. v2.1 material if v2 proves thin.

## 3. CPU TRAINING — MEASURED

Stack: `~/workspace/seshat-local/train-venv/` (torch CPU + transformers + peft + accelerate), base `Qwen/Qwen2.5-1.5B-Instruct` in `~/workspace/seshat-local/hf-cache/`. Trainer: `~/workspace/seshat-local/train-lora.py` — the same script runs the benchmark and the real run.

Memory math for THIS box: base bf16 weights ≈ 3.1 GB; LoRA r16 on all linear layers ≈ 18.5M trainable params → grads (bf16) ≈ 37 MB, AdamW fp32 states + master ≈ 222 MB; activations at seq 1024, batch 1, gradient checkpointing ≈ 0.5–1 GB. **Peak ≈ 4–4.5 GB RSS — fits the envelope, with the llama-server stopped.** Full fine-tuning would not fit (Adam states alone ≈ 18 GB); LoRA is not a preference here, it is the only shape that fits.

**Measured micro-benchmark (2026-10-23, this VM, the real stack + real data):**
Method: `train-lora.py` itself — Qwen2.5-1.5B-Instruct (HF weights, SHA-256 verified against the Hub blob hash), LoRA r16/α32 on all linear layers (18,464,768 trainable params, 1.18%), bf16 weights, gradient checkpointing, AdamW, batch 1 × accum 8, dataset v2.

| Probe | Result |
|---|---|
| seq 512, 16 examples, 2 optimizer steps | **633.2 s for 2 steps (277 s + ~356 s; avg 316.6 s/step)**, exit 0, adapter saved, losses finite and moving |
| Throughput | **≈ 13.7 trained tokens/sec** (~4,330 tokens/step at the 512 cap) |
| **Peak RSS** | **5.11 GB** — fits the 8 GB box with llama-server stopped (predicted 4–4.5 GB; measured higher, still inside) |
| seq 1024, 8 examples, 1 optimizer step (8,035 tokens) | **568.9 s/step → 14.1 tokens/sec; peak RSS 5.42 GB; exit 0** — confirms the 512 probe; throughput is flat across sequence length |

**Extrapolation (arithmetic on two agreeing measurements, not a guess):** one epoch at the seq-1024 cap = 265,187 tokens ÷ ~14 tok/s ≈ **5.2 hours/epoch → the full 3-epoch run ≈ 16 hours of wall-clock** (15–18 h allowing for box contention) on this VM. The retired "12–36 h/epoch" guess was wrong in both directions at once — too pessimistic per epoch, too optimistic about the box: this is not an overnight run, it is an overnight-and-a-day run that monopolizes both vCPUs throughout. It is nevertheless REAL: $0, no accounts, no taps, checkpointable (for the real CPU run, switch `save_strategy` to per-epoch — the staged script ships `no` for benchmark hygiene). Interruption risk is the honest cost: a VM restart mid-run without checkpoints loses the run.

## 4. RENTED GPU ROUTES (prices fetched 2026-10-23)

Sizing math, shared by every row: the run is **tiny**. Dataset v2 = 395,311 tokens total (exact), **265,187 trained tokens/epoch at the seq-1024 cap; 3 epochs = 795,561 trained tokens**. A 1.5B LoRA in bf16 + AdamW needs ≈ 3.1 GB weights + <1 GB optimizer/grads (LoRA params only) + activations — **≈ 6–10 GB VRAM at batch 8×1024**; any 16 GB card (T4) fits, 24 GB is comfortable. On any card below, pure training is an estimated **10–45 minutes** (FLOPs-bound estimate: ~12 GFLOPs/token fwd+bwd+checkpointing at 25–35% MFU); wall-clock is dominated by setup (image, model download, tokenization), realistically **30–75 minutes end to end**. Data friction is nil: dataset is 1.6 MB, adapter out is ~75 MB.

| Route | Card | Price | Fit / friction | Est. total for the full run |
|---|---|---|---|---|
| **Modal** (already on the Tier-A gas list) | T4 16 GB / L4 24 GB | Starter $0 + **$30/mo free credit [Verified — modal.com/pricing, fetched today]**; per-second GPU ≈ T4 $0.59/hr, L4 $0.80/hr [Unverified — rate-card trackers quoting modal.com, Oct 2026; the official page's JS hid the figures from text fetch] | `modal-train.py` is staged and uploads the dataset itself; no storage bill; per-second billing kills idle cost | **$0 out of pocket** (≈$0.50–1.50 of the free credit) |
| **RunPod Pods** | RTX 3090 24 GB / A5000 24 GB | 3090 $0.50/hr, A5000 $0.27/hr **[Verified — runpod.io official product page, fetched today]**; Community Cloud lower (3090 ≈ $0.22/hr) [Unverified — third-party tables] | SSH pod, manual setup ~15 min; per-second billing, no egress fees | **≈ $0.30–0.75** |
| **Vast.ai** | RTX 3090/4090 24 GB | 3090 ≈ $0.22/hr, 4090 ≈ $0.49/hr medians [Unverified — marketplace feed snapshots via trackers, Oct 2026] | Cheapest raw rate, but third-party hosts: dataset (her own digestion records) leaves our control; availability varies | ≈ $0.25–0.60 |
| **Hugging Face Jobs** | t4-small 16 GB | ≈ $0.75–2/hr [Unverified — HF course/docs-derived tables; A100-large $2.50/hr corroborated Oct 8 2026] | `hf jobs uv run` with the same training script; Hub-native (adapter lands next to the base model's home) | ≈ $1–3 |
| **Lambda** | A100 40 GB+ only | A100 ≈ $1.89/hr, H100 PCIe $3.29/hr [Unverified — trackers, Oct 2026] | No small tier; massive overkill for 0.9M tokens; availability constrained | ≈ $2–4, pointless premium |
| **Colab Pro** | T4/L4/A100 (as assigned) | Pro $9.99/mo, Pro+ $49.99/mo + compute units [Unverified — secondary sources, Oct 2026] | **Needs the owner's Google account in a browser session** — his account, his seat; notebook babysitting for a job Modal does headless | $9.99 minimum, worst fit operationally |
| **Kaggle (free)** | P100/T4 | **$0**, ~30 GPU-hrs/week reported [Unverified — Kaggle's own docs don't publish the quota; 12 h session cap is documented] | **Phone verification = owner tap**; notebook-only, quota floats | $0, but gated on the owner tap |

**Together AI credits are inference, not training** — they do not appear above, deliberately.

## 5. GGUF PIPELINE — DRY-CHECKED

- `llama-quantize` (b11823) **present** in `~/workspace/seshat-local/bin/` ✓
- `convert_hf_to_gguf.py` **absent** — the b11823 install is a binaries-only release tarball; no llama.cpp source checkout exists on this box.
- Path (staged in `merge-adapter.py` header): merge adapter → HF dir → `git clone --depth 1 --branch b11823 llama.cpp` → `convert_hf_to_gguf.py` → F16 GGUF → `llama-quantize` → Q4_K_M → swap into `models/` behind the adoption bar. Clone is small (~100 MB with history depth 1); disk is fine. **Verdict: pipeline viable, one clone short of complete.**

## 6. RECOMMENDATION

**Run it on Kaggle's free GPU.** The full run is 30–75 minutes of wall-clock there (T4/P100 class, ~30 GPU-hrs/week reported quota against a ~1-hour job) at **$0** — the only cost is the owner's one-time phone verification, which he has already accepted. Upload is 1.6 MB of dataset + the training script; the adapter (~75 MB) downloads back; merge → GGUF → proof all happen here. `train-lora.py` runs unchanged in a Kaggle notebook.

**Fallback that needs nobody: this VM's CPU.** Measured, not estimated: ~14 trained tokens/sec, **~5.2 h/epoch, ~16 h total, peak RSS 5.42 GB — it fits.** Price: both vCPUs for ~16 hours and interruption risk (enable per-epoch checkpoints in `train-lora.py` before a CPU run; the VM must not restart mid-run). If the Kaggle tap stalls, start the CPU run the same day rather than waiting — a trained mind in 16 hours beats a perfect plan next week.

**Parked:** Modal — the runner (`modal-train.py`) is staged and the $30 Starter credit would cover the run ~20× over, but the Oct 23 preflight (run 001) verified on Modal's own docs that GPU use requires a payment method on file and no Modal account exists; with no card available, Modal is not a $0 route today. If a card ever lands, Modal becomes the best route again (per-second billing, headless, ~$0.50–1.50 of credit). **Cheapest paid route if ever needed:** RunPod RTX 3090 pod at $0.50/hr [Verified] ≈ **$0.50 total** for the whole run.

## 7. STAGING CHECKLIST (state at delivery)

- [x] Dataset v2 built + verified (`dataset-v2.jsonl`, 283 examples)
- [x] Training script staged (`train-lora.py`, plan-of-record hyperparams, loss on assistant only, prompt-side truncation)
- [x] Merge script staged (`merge-adapter.py`) with the full GGUF command chain in its header
- [x] Modal runner staged (`modal-train.py`) — `modal run` is the only step left on that route
- [x] CPU stack installed in `train-venv` (torch 2.14.1+cpu, transformers 5.20.2, peft 0.21.2) + base model staged at `~/workspace/seshat-local/base-hf/` — **SHA-256 verified identical to the Hub blob** (the Hub client's download stalled from this VM; the file was completed via resumable curl and hash-checked). NOTE: local runs pass `--base ~/workspace/seshat-local/base-hf`; the `hf-cache` snapshot is incomplete and should not be pointed at
- [x] CPU micro-benchmark MEASURED at both sequence lengths (§3); benchmark adapters in /tmp (disposable)
- [ ] llama.cpp source clone for `convert_hf_to_gguf.py` (done at merge time; ~2 min)
- [ ] GREEN LIGHT from the owner on route + (for CPU) a window with llama-server stopped
- [ ] Run → merge → quantize → `proof-local-judge.cjs` local-only, 3/3 + regression → only then flip `SESHAT_LOCAL_MODEL`
