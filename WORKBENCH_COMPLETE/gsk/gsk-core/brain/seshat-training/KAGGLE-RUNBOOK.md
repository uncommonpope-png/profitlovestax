# KAGGLE RUNBOOK — Seshat LoRA v2 (staged 2026-10-23)

**State:** STAGED, NOT RUN. No Kaggle account exists yet. The owner picked the
Kaggle route Oct 23 and accepted the one owner-only step (phone verification).
Everything below is the exact sequence for whoever executes once the account
is verified. **Nothing here authorizes spending: the run is $0 — Kaggle free
GPU tier (~30 GPU-hrs/week reported, 12 h per-session cap). If any step asks
for a card, STOP — that's a wrong door.**

**What runs:** `train-kaggle.py` — train-lora.py's plan of record (LoRA
r16/α32, lr 1e-4 cosine, 3 epochs, seq 1024, loss on assistant turns only)
on dataset-v2.jsonl (283 examples), base `Qwen/Qwen2.5-1.5B-Instruct`.
Sizing: ~265K trained tokens/epoch at the cap, ~0.9M total; bf16 weights
~3.1 GB + <1 GB optimizer (LoRA params only); batch 8×1024 ≈ 6–10 GB VRAM.
T4 (16 GB) or P100 (16 GB) both fit. Expected wall-clock: **30–75 min end to
end**, setup-dominated. Adapter out ≈ 75 MB.

---

## 0. One-time prerequisites (owner + executor)

1. **Owner** creates the Kaggle account (uncommonpope) and completes
   **phone verification** (Settings → Phone Verification). Without this,
   GPU kernels will not run. This is the only step the owner must do.
2. Executor installs the Kaggle CLI and drops in the owner's API token
   (Kaggle → Settings → API → "Create New Token" → `kaggle.json` —
   the OWNER downloads it and hands it over; never scrape credentials):

   ```bash
   ~/workspace/seshat-local/train-venv/bin/pip install kaggle
   mkdir -p ~/.kaggle && cp <path-to>/kaggle.json ~/.kaggle/kaggle.json
   chmod 600 ~/.kaggle/kaggle.json
   ~/workspace/seshat-local/train-venv/bin/kaggle --version   # sanity
   ```

   Every `kaggle` command below means
   `~/workspace/seshat-local/train-venv/bin/kaggle`.

## 1. Create the private dataset (once)

```bash
mkdir -p /tmp/seshat-dataset-v2
cp ~/workspace/seshat-local/dataset-v2.jsonl /tmp/seshat-dataset-v2/
cp ~/workspace/seshat-local/kaggle-kernel/dataset-metadata.json /tmp/seshat-dataset-v2/
kaggle datasets create -p /tmp/seshat-dataset-v2 --dir-mode zip
kaggle datasets status uncommonpope/seshat-dataset-v2   # wait for: ready
```

- The dataset MUST stay **private** — it is the Family's own digestion
  records (privacy exclusions already enforced at build). Verify on the
  Kaggle web UI that visibility = Private before continuing.
- Re-uploading a changed dataset later = `kaggle datasets version -p
  /tmp/seshat-dataset-v2 -m "v2.1"` (and bump nothing else; the kernel
  reads whatever `dataset-v2.jsonl` is attached).

## 2. Push the kernel

```bash
cd ~/workspace/seshat-local/kaggle-kernel
kaggle kernels push -p .
```

`kernel-metadata.json` already sets: id `uncommonpope/seshat-lora-v2`,
private, GPU on, internet on (required — the base model downloads from the
HF Hub inside the kernel), dataset source `uncommonpope/seshat-dataset-v2`.

## 3. Watch it

```bash
kaggle kernels status uncommonpope/seshat-lora-v2
```

Poll every few minutes. States: `queued` → `running` → `complete` (good) or
`error` (go to §6). Expected runtime 30–75 min. The kernel log must end with:

```
SESHAT_TRAIN_DONE loss=<avg loss> adapter=/kaggle/working/adapter-out
```

Read the log via `kaggle kernels pull uncommonpope/seshat-lora-v2 -p /tmp/kpull -m`
(metadata + output files land there) or the web UI's Output/Log tab.

## 4. Pull the adapter

```bash
mkdir -p ~/workspace/seshat-local/kaggle-output
kaggle kernels output uncommonpope/seshat-lora-v2 \
    -p ~/workspace/seshat-local/kaggle-output --force
ls -lh ~/workspace/seshat-local/kaggle-output/adapter-out/
# expect: adapter_config.json, adapter_model.safetensors (~75 MB),
#         tokenizer files
cp -r ~/workspace/seshat-local/kaggle-output/adapter-out \
      ~/workspace/seshat-local/adapter-v2
```

## 5. Merge → GGUF → proof (back on this VM — the adoption bar)

Exact chain from `merge-adapter.py`'s header; do not improvise:

```bash
cd ~/workspace/seshat-local
train-venv/bin/python merge-adapter.py \
    --adapter ~/workspace/seshat-local/adapter-v2 \
    --out     ~/workspace/seshat-local/merged-v2
git clone --depth 1 --branch b11823 https://github.com/ggml-org/llama.cpp /tmp/llama.cpp
python3 /tmp/llama.cpp/convert_hf_to_gguf.py ~/workspace/seshat-local/merged-v2 \
    --outfile ~/workspace/seshat-local/models/qwen2.5-1.5b-instruct-v2-f16.gguf
~/workspace/seshat-local/bin/llama-quantize \
    ~/workspace/seshat-local/models/qwen2.5-1.5b-instruct-v2-f16.gguf \
    ~/workspace/seshat-local/models/qwen2.5-1.5b-instruct-v2-q4_k_m.gguf Q4_K_M
```

Then serve the v2 Q4_K_M in place of the base GGUF (same llama-server setup
as `start-local-mind.sh`, pointed at the v2 file) and run the proof:

```bash
node ~/workspace/seshat-local/proof-local-judge.cjs   # local seats ONLY
```

**ADOPTION BAR (unchanged, non-negotiable):** the v2 model must pass the
proof **3/3 + the regression set**, outscoring the base model's record
(1/3, Oct 22 — see `growth-reports/local-mind-001.md`). Pass → flip
`SESHAT_LOCAL_MODEL` on. Fail → it stays **off**, the adapter and logs are
kept, and the failure is reported straight — no rerun-and-pray, no silent
flip. Compare against the base: re-serve the original
`models/qwen2.5-1.5b-instruct-q4_k_m.gguf` and re-run the same proof for
the honest before/after.

## 6. Failure branches

| Symptom | Meaning / move |
|---|---|
| `kernels push` rejected: GPU not allowed | Phone verification incomplete. Owner finishes §0.1; nothing else helps. |
| Status `error` in < 2 min, log shows "dataset-v2.jsonl not found" | Dataset not attached / not `ready`. Check §1 status; confirm slug in `kernel-metadata.json` matches the dataset's real slug; re-push. |
| Log: "No CUDA GPU visible" | Kernel ran without GPU (metadata drift or quota). Confirm `enable_gpu: true`; check quota (below); re-push. |
| **Quota exhausted** (~30 GPU-hrs/week, floats) | Wait for the weekly reset or accept a shorter run: set env in the script is not exposed via CLI — edit a copy: `SESHAT_EPOCHS=2` still satisfies the 2–3 epoch plan. Never split mid-epoch if it can be avoided; a full 2-epoch run beats a killed 3-epoch one. |
| **12 h session cap** | The run needs < 1.5 h. Hitting the cap means something is hung (usually the Hub download with internet off). Cancel in the web UI, confirm internet is on in `kernel-metadata.json`, re-push. Do not let a zombie session eat the weekly quota. |
| CUDA OOM in log | The script already retries bsz 4×2 → 2×4 → 1×8 (effective batch stays 8). If it OOMs at 1×8 on a 16 GB card, the card isn't 16 GB or something else holds VRAM — pull the log, check the `gpu:` line, report. Manual override: env `SESHAT_BSZ`/`SESHAT_ACCUM`. |
| Hub download 401 / model not found | `Qwen/Qwen2.5-1.5B-Instruct` is public; a 401 means internet is off or HF is throttling. Re-push once; if it repeats, pre-stage the model as a second private dataset and point `SESHAT_BASE` at its `/kaggle/input/` path. |
| Kernel `complete` but no `adapter-out` in output | Training crashed after status flip or the save path moved. Pull full log (`kaggle kernels pull ... -m`), find the last traceback, fix, re-push. Never merge a partial adapter. |
| Proof < 3/3 after merge | NOT a Kaggle failure. Adapter stays unadopted (`SESHAT_LOCAL_MODEL` off). Next lever is data (v2.1 expansion reserve: ~90 absorption pairs + hunts 1–12), not more epochs on the same data. |

## 7. The one-line command sequence (once §0 is done)

```bash
cp ~/workspace/seshat-local/dataset-v2.jsonl /tmp/seshat-dataset-v2/ && cp ~/workspace/seshat-local/kaggle-kernel/dataset-metadata.json /tmp/seshat-dataset-v2/ && kaggle datasets create -p /tmp/seshat-dataset-v2 --dir-mode zip && cd ~/workspace/seshat-local/kaggle-kernel && kaggle kernels push -p . && kaggle kernels status uncommonpope/seshat-lora-v2
```

(then §3 watch → §4 pull → §5 merge/proof, in that order, no skips)

---

*Staged by the Kaggle staging task, Oct 23 2026. Local checks at staging
time: `py_compile` clean; module import pass clean (find_dataset/out_dir
resolve correctly); dependency stack confirmed in train-venv (torch
2.10.0+cpu, transformers 5.20.2, peft 0.21.2, accelerate 1.15.0 — the
script's pinned fallbacks match); **data-pipeline smoke PASSED** (2 examples
through the ported SFTData + collate: seq cap 1024 respected, assistant-tail
loss tokens present at 558 and 429, batch shapes correct). The full 1-step
**training** smoke was NOT run locally: a CPU benchmark of train-lora.py was
actively running on this 2-vCPU box at staging time, and a concurrent
model-load step would have corrupted that measurement and risked OOM.
Consequence: watch the first in-kernel run from minute one; optionally set
`SESHAT_SMOKE=1` in a scratch kernel copy first for a 1-step, 2-example
in-kernel sanity pass (~2 min) before committing to the real run.*
