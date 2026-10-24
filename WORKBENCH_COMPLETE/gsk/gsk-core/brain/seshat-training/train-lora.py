#!/usr/bin/env python3
"""
SESHAT LOCAL-MIND — LoRA training (plan of record, 2026-10-23).
Trains Qwen2.5-1.5B-Instruct on dataset-v2.jsonl. Used for:
  (a) the CPU micro-benchmark on this VM (--max-steps / --max-examples),
  (b) the real run, here or on a rented GPU (same script, --device auto).

Plan of record: LoRA r16 / alpha32, lr 1e-4 cosine, 2-3 epochs,
seq 1024, loss on assistant turns ONLY. Long examples: the USER side
is truncated (middle-out) so the assistant turn always survives —
a truncated teacher teaches truncation; a truncated question does not.

Adapter is saved at the end. Merging + GGUF conversion are separate
steps (merge-adapter.py + llama.cpp convert_hf_to_gguf.py + quantize).
"""
import argparse, json, os, sys, time
import torch
from torch.utils.data import Dataset
from transformers import (AutoModelForCausalLM, AutoTokenizer,
                          TrainingArguments, Trainer)
from peft import LoraConfig, get_peft_model

def parse_args():
    p = argparse.ArgumentParser()
    p.add_argument('--data', default=os.path.expanduser('~/workspace/seshat-local/dataset-v2.jsonl'))
    p.add_argument('--base', default='Qwen/Qwen2.5-1.5B-Instruct')
    p.add_argument('--out', default=os.path.expanduser('~/workspace/seshat-local/adapter-v2'))
    p.add_argument('--epochs', type=float, default=3.0)
    p.add_argument('--seq', type=int, default=1024)
    p.add_argument('--lr', type=float, default=1e-4)
    p.add_argument('--bsz', type=int, default=1, help='per-device batch')
    p.add_argument('--accum', type=int, default=8)
    p.add_argument('--max-steps', type=int, default=-1)
    p.add_argument('--max-examples', type=int, default=-1)
    p.add_argument('--device', default='auto')
    return p.parse_args()

class SFTData(Dataset):
    def __init__(self, path, tok, seq, max_examples=-1):
        self.rows = []
        skipped = 0
        for line in open(path):
            if not line.strip():
                continue
            d = json.loads(line)
            msgs = d['messages']
            if len(msgs) < 2 or msgs[-1]['role'] != 'assistant':
                skipped += 1
                continue
            self.rows.append(msgs)
            if max_examples > 0 and len(self.rows) >= max_examples:
                break
        self.tok, self.seq = tok, seq
        print(f'dataset: {len(self.rows)} examples (skipped {skipped})', flush=True)

    def __len__(self):
        return len(self.rows)

    def __getitem__(self, i):
        msgs = self.rows[i]
        full = self.tok.apply_chat_template(msgs, tokenize=False)
        head = self.tok.apply_chat_template(msgs[:-1], tokenize=False, add_generation_prompt=True)
        full_ids = self.tok(full, add_special_tokens=False)['input_ids']
        head_ids = self.tok(head, add_special_tokens=False)['input_ids']
        if len(full_ids) > self.seq:
            # middle-out truncate the HEAD (prompt) so the assistant tail survives
            overflow = len(full_ids) - self.seq
            keep_head = max(0, len(head_ids) - overflow)
            full_ids = full_ids[:keep_head] + full_ids[len(head_ids):]
            head_len = keep_head
        else:
            head_len = len(head_ids)
        labels = [-100] * head_len + full_ids[head_len:]
        return {'input_ids': full_ids, 'labels': labels, 'length': len(full_ids)}

def collate(batch, pad_id):
    maxlen = max(len(b['input_ids']) for b in batch)
    input_ids, labels, attn = [], [], []
    for b in batch:
        n = len(b['input_ids'])
        pad = maxlen - n
        input_ids.append(b['input_ids'] + [pad_id] * pad)
        labels.append(b['labels'] + [-100] * pad)
        attn.append([1] * n + [0] * pad)
    return {'input_ids': torch.tensor(input_ids), 'labels': torch.tensor(labels),
            'attention_mask': torch.tensor(attn)}

def main():
    a = parse_args()
    torch.set_num_threads(os.cpu_count() or 2)
    tok = AutoTokenizer.from_pretrained(a.base)
    ds = SFTData(a.data, tok, a.seq, a.max_examples)
    total_tokens = 0
    # honest token accounting at the training cap
    tmp = SFTData.__new__(SFTData); tmp.rows, tmp.tok, tmp.seq = ds.rows, tok, a.seq
    for i in range(len(ds)):
        total_tokens += ds[i]['length']
    print(f'tokens at seq cap {a.seq}: {total_tokens} ({total_tokens/len(ds):.0f}/example avg)', flush=True)

    dtype = torch.bfloat16
    model = AutoModelForCausalLM.from_pretrained(a.base, dtype=dtype)
    model.config.use_cache = False
    model.gradient_checkpointing_enable()
    lcfg = LoraConfig(r=16, lora_alpha=32, lora_dropout=0.0, bias='none',
                      task_type='CAUSAL_LM',
                      target_modules=['q_proj', 'k_proj', 'v_proj', 'o_proj',
                                      'gate_proj', 'up_proj', 'down_proj'])
    model = get_peft_model(model, lcfg)
    model.print_trainable_parameters()

    args = TrainingArguments(
        output_dir=a.out + '-ckpt',
        num_train_epochs=a.epochs,
        max_steps=a.max_steps,
        per_device_train_batch_size=a.bsz,
        gradient_accumulation_steps=a.accum,
        learning_rate=a.lr,
        lr_scheduler_type='cosine',
        warmup_steps=3,
        logging_steps=1,
        save_strategy='no',
        report_to=[],
        bf16=False, fp16=False,  # CPU-safe: model weights are bf16, optimizer fp32 master via Trainer defaults
        optim='adamw_torch',
        seed=222,
    )
    pad_id = tok.pad_token_id if tok.pad_token_id is not None else tok.eos_token_id
    trainer = Trainer(model=model, args=args, train_dataset=ds,
                      data_collator=lambda b: collate(b, pad_id))
    t0 = time.time()
    trainer.train()
    dt = time.time() - t0
    steps = trainer.state.global_step
    print(f'BENCH/RESULT: {steps} optimizer steps in {dt:.1f}s '
          f'({dt/max(steps,1):.2f}s/step, eff. batch {a.bsz*a.accum})', flush=True)
    model.save_pretrained(a.out)
    tok.save_pretrained(a.out)
    print(f'adapter saved -> {a.out}', flush=True)

if __name__ == '__main__':
    main()
