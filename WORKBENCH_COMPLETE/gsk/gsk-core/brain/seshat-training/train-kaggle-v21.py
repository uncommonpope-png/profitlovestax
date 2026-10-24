#!/usr/bin/env python3
"""
SESHAT LOCAL-MIND — LoRA training, KAGGLE edition, ROUND 2 / v2.1 (2026-10-23).
Copy of train-kaggle.py with ONLY the dataset identity changed
(dataset-v21.jsonl / seshat-dataset-v21); hyperparams identical.
NOT RUN YET — fires only after the owner's Kaggle account is phone-verified
and the private dataset `uncommonpope/seshat-dataset-v21` exists.
See KAGGLE-RUNBOOK.md in this folder for the exact end-to-end sequence.

What this is: train-lora.py (the plan of record) ported faithfully to a
single self-contained Kaggle kernel script. Same data logic, same
hyperparameters, same seed. The diffs vs train-lora.py are GPU/Kaggle
adaptations ONLY, listed here so nothing drifts silently:

  DIFF 1 (batching)   : per-device batch 8 x grad-accum 1 (effective batch 8,
                        identical to the CPU plan's 1 x 8). On CUDA OOM the
                        script retries 4x2, then 2x4, then 1x8 — the
                        effective batch never changes. Override the starting
                        point with env SESHAT_BSZ / SESHAT_ACCUM.
  DIFF 2 (precision)  : TrainingArguments bf16=True on GPU (the CPU script
                        leaves bf16/fp16 off because its optimizer runs an
                        fp32 master on CPU; weights are bf16 in both).
  DIFF 3 (model load) : dtype kwarg with a torch_dtype fallback so the script
                        runs on both transformers 5.x (local venv) and the
                        4.x stack Kaggle images have historically shipped.
  DIFF 4 (paths)      : dataset is found under /kaggle/input/** (or env
                        SESHAT_DATA); adapter is saved to
                        /kaggle/working/adapter-out/ (or env SESHAT_OUT;
                        locally: ./adapter-out beside this script).
  DIFF 5 (deps)       : Kaggle images preinstall a CUDA torch + transformers/
                        peft/accelerate, and reinstalling torch on Kaggle
                        breaks its CUDA build — so pinned installs happen
                        ONLY for packages that are actually missing
                        (transformers/peft/accelerate pinned to the local
                        venv's versions). torch is never reinstalled here;
                        if torch exists but CUDA is unavailable, the script
                        says so and exits instead of silently training on CPU
                        inside a 12h-capped session.
  DIFF 8 (subprocess) : Run 002 (2026-10-23) OOM'd at EVERY batch size,
                        even bsz=1: each failed in-process attempt's model
                        stayed alive via the caught exception's traceback
                        (frame locals), so attempts stacked ~3.1 GB models
                        until the card filled. The ladder now runs each
                        attempt as a fresh subprocess of this script
                        (SESHAT_ATTEMPT_BSZ/ACCUM); process exit reclaims
                        all GPU memory between attempts. Exit codes:
                        0 = done (SESHAT_TRAIN_DONE printed), 3 = OOM
                        (step down), anything else = real failure.
  DIFF 7 (torchao)    : Run 001 (2026-10-23) died in get_peft_model: the
                        Kaggle image ships torchao 0.10.0 and its peft's
                        is_torchao_available() RAISES ImportError (floor is
                        0.16.0) instead of returning False, so the torchao
                        dispatcher poisons every LoRA injection. Training
                        here never uses torchao (bf16 weights, no
                        quantization), so ensure_deps() uninstalls a stale
                        torchao (< 0.16.0) from the kernel env; peft then
                        cleanly skips that dispatcher. A current torchao
                        (>= 0.16.0) is left untouched.
  DIFF 6 (smoke mode) : env SESHAT_SMOKE=1 -> 2 examples, 1 optimizer step,
                        epochs 1. Used for the local syntax/smoke check and
                        for a 2-minute in-kernel sanity pass before the real
                        run. It is NOT a training run.

Plan of record (unchanged from train-lora.py): LoRA r16 / alpha32 on all
linear layers, dropout 0, lr 1e-4 cosine, warmup 3, 3 epochs, seq 1024,
loss on assistant turns ONLY (prompt tokens masked -100), long examples
truncated middle-out on the USER side so the assistant turn always
survives, seed 222, adamw_torch, gradient checkpointing on.
Dataset: dataset-v21.jsonl — 283 examples (92 ruled judge / 114 absorption
/ 77 v1 carryover), ~265K trained tokens/epoch at the seq-1024 cap,
~0.9M tokens over 3 epochs. Expected wall-clock on a Kaggle T4/P100:
30-75 min end to end (setup-dominated). Adapter out ~75 MB.

On success the last training line printed is:
    SESHAT_TRAIN_DONE loss=<avg train loss> adapter=<abs path>
"""
import glob
import json
import os
import subprocess
import sys
import time

# ---------------------------------------------------------------- deps ----
PINNED = {  # the local train-venv's versions (TRAINING-ROUTES §3 stack)
    "transformers": "5.20.2",
    "peft": "0.21.2",
    "accelerate": "1.15.0",
    # sentencepiece: Qwen tokenizer fallback on some stacks; cheap insurance.
    "sentencepiece": None,
}


def ensure_deps():
    """Install pinned versions ONLY for packages that fail to import."""
    missing = []
    for pkg in list(PINNED) + ["torch"]:
        try:
            __import__(pkg)
        except ImportError:
            missing.append(pkg)
    if not missing:
        print("deps: torch/transformers/peft/accelerate all importable — "
              "using the image's stack, installing nothing", flush=True)
        neutralize_stale_torchao()
        return
    if "torch" in missing:
        # Never pip a torch build inside Kaggle blind: report and stop.
        raise RuntimeError(
            "torch is not importable in this image and this script will not "
            "guess a CUDA build. Use a standard Kaggle GPU image "
            "(Settings -> Accelerator -> GPU) and re-run.")
    specs = [f"{p}=={PINNED[p]}" if PINNED[p] else p
             for p in missing if p != "torch"]
    print(f"deps: installing pinned fallback for missing: {specs}", flush=True)
    subprocess.check_call([sys.executable, "-m", "pip", "install", "-q",
                           *specs])
    neutralize_stale_torchao()


def neutralize_stale_torchao():
    """DIFF 7: a torchao older than peft's 0.16.0 floor makes peft's
    is_torchao_available() raise ImportError inside get_peft_model
    (Kaggle run 001, 2026-10-23). It is unused here — remove it so peft
    skips the torchao dispatcher. importlib.metadata reflects a
    subprocess uninstall in-process (verified), and peft is not yet
    imported at this point, so the removal lands before any dispatch."""
    from importlib.metadata import PackageNotFoundError, version

    def parse(v):
        out = []
        for part in v.replace("+", ".").split("."):
            out.append(int(part) if part.isdigit() else 0)
        return (out + [0, 0, 0])[:3]

    try:
        v = version("torchao")
    except PackageNotFoundError:
        return
    if parse(v) >= [0, 16, 0]:
        return
    print(f"deps: torchao {v} is below peft's 0.16.0 floor and unused "
          "here (bf16, no quantization) — uninstalling it so peft skips "
          "the torchao dispatcher", flush=True)
    subprocess.check_call([sys.executable, "-m", "pip", "uninstall",
                           "-y", "-q", "torchao"])


# --------------------------------------------------------------- paths ----
def find_dataset():
    env = os.environ.get("SESHAT_DATA")
    if env and os.path.isfile(env):
        return env
    pats = [
        "/kaggle/input/seshat-dataset-v21/dataset-v21.jsonl",
        "/kaggle/input/**/dataset-v21.jsonl",
        os.path.join(os.path.dirname(os.path.abspath(__file__)),
                     "dataset-v21.jsonl"),
        os.path.expanduser("~/workspace/seshat-local/dataset-v21.jsonl"),
    ]
    for pat in pats:
        for hit in sorted(glob.glob(pat, recursive=True)):
            if os.path.isfile(hit):
                return hit
    raise FileNotFoundError(
        "dataset-v21.jsonl not found. Attach the private Kaggle dataset "
        "uncommonpope/seshat-dataset-v21 to this kernel (Add Input -> "
        "Datasets) or set SESHAT_DATA to its path. Searched: "
        + ", ".join(pats))


def out_dir():
    env = os.environ.get("SESHAT_OUT")
    if env:
        return env
    if os.path.isdir("/kaggle/working"):
        return "/kaggle/working/adapter-out"
    return os.path.join(os.path.dirname(os.path.abspath(__file__)),
                        "adapter-out")


# ---------------------------------------------------------------- data ----
# SFTData + collate are ported VERBATIM from train-lora.py (same masking,
# same middle-out truncation) — do not "improve" them here; change them in
# train-lora.py first and re-port.
class SFTData:
    def __init__(self, path, tok, seq, max_examples=-1):
        import json as _json
        self.rows = []
        skipped = 0
        for line in open(path):
            if not line.strip():
                continue
            d = _json.loads(line)
            msgs = d["messages"]
            if len(msgs) < 2 or msgs[-1]["role"] != "assistant":
                skipped += 1
                continue
            self.rows.append(msgs)
            if max_examples > 0 and len(self.rows) >= max_examples:
                break
        self.tok, self.seq = tok, seq
        print(f"dataset: {len(self.rows)} examples (skipped {skipped})",
              flush=True)

    def __len__(self):
        return len(self.rows)

    def __getitem__(self, i):
        msgs = self.rows[i]
        full = self.tok.apply_chat_template(msgs, tokenize=False)
        head = self.tok.apply_chat_template(
            msgs[:-1], tokenize=False, add_generation_prompt=True)
        full_ids = self.tok(full, add_special_tokens=False)["input_ids"]
        head_ids = self.tok(head, add_special_tokens=False)["input_ids"]
        if len(full_ids) > self.seq:
            # middle-out truncate the HEAD (prompt) so the assistant tail
            # survives (train-lora.py, verbatim)
            overflow = len(full_ids) - self.seq
            keep_head = max(0, len(head_ids) - overflow)
            full_ids = full_ids[:keep_head] + full_ids[len(head_ids):]
            head_len = keep_head
        else:
            head_len = len(head_ids)
        labels = [-100] * head_len + full_ids[head_len:]
        return {"input_ids": full_ids, "labels": labels,
                "length": len(full_ids)}


def collate(batch, pad_id, torch):
    maxlen = max(len(b["input_ids"]) for b in batch)
    input_ids, labels, attn = [], [], []
    for b in batch:
        n = len(b["input_ids"])
        pad = maxlen - n
        input_ids.append(b["input_ids"] + [pad_id] * pad)
        labels.append(b["labels"] + [-100] * pad)
        attn.append([1] * n + [0] * pad)
    return {"input_ids": torch.tensor(input_ids),
            "labels": torch.tensor(labels),
            "attention_mask": torch.tensor(attn)}


# -------------------------------------------------------------- training ---
def train_once(bsz, accum, smoke):
    """One training attempt at the given batch shape. Returns (loss, out)."""
    import torch
    from torch.utils.data import Dataset  # noqa: F401  (parity w/ original)
    from transformers import (AutoModelForCausalLM, AutoTokenizer,
                              Trainer, TrainingArguments)
    from peft import LoraConfig, get_peft_model

    base = os.environ.get("SESHAT_BASE", "Qwen/Qwen2.5-1.5B-Instruct")
    seq = int(os.environ.get("SESHAT_SEQ", "1024"))
    epochs = 1.0 if smoke else float(os.environ.get("SESHAT_EPOCHS", "3"))
    lr = float(os.environ.get("SESHAT_LR", "1e-4"))
    data_path = find_dataset()
    out = out_dir()

    tok = AutoTokenizer.from_pretrained(base)
    ds = SFTData(data_path, tok, seq, max_examples=2 if smoke else -1)
    total_tokens = sum(ds[i]["length"] for i in range(len(ds)))
    print(f"tokens at seq cap {seq}: {total_tokens} "
          f"({total_tokens / max(len(ds), 1):.0f}/example avg)", flush=True)

    # DIFF 3: dtype (transformers >= 4.56 / 5.x) with torch_dtype fallback.
    try:
        model = AutoModelForCausalLM.from_pretrained(
            base, dtype=torch.bfloat16)
    except TypeError:
        model = AutoModelForCausalLM.from_pretrained(
            base, torch_dtype=torch.bfloat16)
    if torch.cuda.is_available():
        model = model.cuda()
    model.config.use_cache = False
    model.gradient_checkpointing_enable()
    lcfg = LoraConfig(
        r=16, lora_alpha=32, lora_dropout=0.0, bias="none",
        task_type="CAUSAL_LM",
        target_modules=["q_proj", "k_proj", "v_proj", "o_proj",
                        "gate_proj", "up_proj", "down_proj"])
    model = get_peft_model(model, lcfg)
    model.print_trainable_parameters()

    on_gpu = torch.cuda.is_available()
    args = TrainingArguments(
        output_dir=out + "-ckpt",
        num_train_epochs=epochs,
        max_steps=1 if smoke else -1,
        per_device_train_batch_size=bsz,
        gradient_accumulation_steps=accum,
        learning_rate=lr,
        lr_scheduler_type="cosine",
        warmup_steps=3,
        logging_steps=1,
        save_strategy="no",
        report_to=[],
        bf16=on_gpu,          # DIFF 2
        fp16=False,
        optim="adamw_torch",
        seed=222,
    )
    pad_id = tok.pad_token_id if tok.pad_token_id is not None \
        else tok.eos_token_id
    trainer = Trainer(model=model, args=args, train_dataset=ds,
                      data_collator=lambda b: collate(b, pad_id, torch))
    t0 = time.time()
    result = trainer.train()
    dt = time.time() - t0
    steps = trainer.state.global_step
    print(f"BENCH/RESULT: {steps} optimizer steps in {dt:.1f}s "
          f"({dt / max(steps, 1):.2f}s/step, eff. batch {bsz * accum})",
          flush=True)
    model.save_pretrained(out)
    tok.save_pretrained(out)
    return result.training_loss, out


def main():
    import torch  # after ensure_deps() in __main__; see bottom of file

    smoke = os.environ.get("SESHAT_SMOKE") == "1"
    if not smoke and not torch.cuda.is_available():
        raise RuntimeError(
            "No CUDA GPU visible. On Kaggle: open the kernel, Settings -> "
            "Accelerator -> GPU (T4 x1 or P100), Save, then re-run. "
            "Refusing to spend a 12h session crawling on CPU. "
            "(For a local smoke check set SESHAT_SMOKE=1.)")
    if torch.cuda.is_available():
        print(f"gpu: {torch.cuda.get_device_name(0)} "
              f"({torch.cuda.get_device_properties(0).total_memory / 2**30:.1f} GiB)",
              flush=True)

    # DIFF 1 + DIFF 8: OOM fallback ladder, effective batch pinned at 8,
    # each attempt a fresh subprocess so a failed attempt's GPU memory is
    # fully reclaimed by process exit before the next attempt starts.
    start_bsz = int(os.environ.get("SESHAT_BSZ", "8"))
    start_acc = int(os.environ.get("SESHAT_ACCUM", "1"))
    ladder = [(start_bsz, start_acc)]
    for b, a in [(4, 2), (2, 4), (1, 8)]:
        if (b, a) != (start_bsz, start_acc) and b * a == 8:
            ladder.append((b, a))
    for bsz, accum in ladder:
        print(f"train attempt: bsz={bsz} accum={accum} "
              f"(eff. batch {bsz * accum})", flush=True)
        env = dict(os.environ)
        env["SESHAT_ATTEMPT_BSZ"] = str(bsz)
        env["SESHAT_ATTEMPT_ACCUM"] = str(accum)
        rc = subprocess.run([sys.executable,
                             os.path.abspath(__file__)], env=env).returncode
        if rc == 0:
            return
        if rc == 3:
            print(f"CUDA OOM at bsz={bsz}; stepping down the ladder",
                  flush=True)
            continue
        raise RuntimeError(
            f"training attempt bsz={bsz} accum={accum} exited rc={rc} "
            "(not OOM — see the child output above)")
    raise RuntimeError("training failed at every batch shape (all OOM)")


if __name__ == "__main__":
    ensure_deps()
    _att_bsz = os.environ.get("SESHAT_ATTEMPT_BSZ")
    if _att_bsz:
        # DIFF 8: single-attempt child process. Exit 0 = trained + saved,
        # 3 = CUDA OOM (parent steps down the ladder), 1 = other failure.
        try:
            _loss, _out = train_once(
                int(_att_bsz), int(os.environ["SESHAT_ATTEMPT_ACCUM"]),
                os.environ.get("SESHAT_SMOKE") == "1")
            print(f"adapter saved -> {_out}", flush=True)
            print(f"SESHAT_TRAIN_DONE loss={_loss:.4f} adapter={_out}",
                  flush=True)
            sys.exit(0)
        except RuntimeError as _e:
            if "out of memory" in str(_e).lower():
                print(f"attempt OOM: {_e}", flush=True)
                sys.exit(3)
            raise
    main()
