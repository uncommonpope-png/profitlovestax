#!/usr/bin/env python3
"""
Merge the trained LoRA adapter into the base model -> HF directory,
ready for llama.cpp convert_hf_to_gguf.py (F16) + llama-quantize (Q4_K_M).

    train-venv/bin/python merge-adapter.py \
        --adapter ~/workspace/seshat-local/adapter-v2 \
        --out     ~/workspace/seshat-local/merged-v2
Then:
    git clone --depth 1 --branch b11823 https://github.com/ggml-org/llama.cpp /tmp/llama.cpp
    python3 /tmp/llama.cpp/convert_hf_to_gguf.py ~/workspace/seshat-local/merged-v2 \
        --outfile ~/workspace/seshat-local/models/qwen2.5-1.5b-instruct-v2-f16.gguf
    ~/workspace/seshat-local/bin/llama-quantize \
        ~/workspace/seshat-local/models/qwen2.5-1.5b-instruct-v2-f16.gguf \
        ~/workspace/seshat-local/models/qwen2.5-1.5b-instruct-v2-q4_k_m.gguf Q4_K_M
ADOPTION BAR (unchanged): the merged Q4_K_M re-runs proof-local-judge.cjs
local-only and must pass 3/3 + the regression set before SESHAT_LOCAL_MODEL
flips on.
"""
import argparse, torch
from transformers import AutoModelForCausalLM, AutoTokenizer
from peft import PeftModel

p = argparse.ArgumentParser()
p.add_argument('--base', default='Qwen/Qwen2.5-1.5B-Instruct')
p.add_argument('--adapter', required=True)
p.add_argument('--out', required=True)
a = p.parse_args()

base = AutoModelForCausalLM.from_pretrained(a.base, dtype=torch.bfloat16)
model = PeftModel.from_pretrained(base, a.adapter)
model = model.merge_and_unload()
model.save_pretrained(a.out)
AutoTokenizer.from_pretrained(a.base).save_pretrained(a.out)
print(f'merged -> {a.out}')
