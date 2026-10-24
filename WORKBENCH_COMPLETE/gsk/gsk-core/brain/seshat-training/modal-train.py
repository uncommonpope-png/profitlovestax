#!/usr/bin/env python3
"""
SESHAT LOCAL-MIND — rented-GPU runner (Modal), staged 2026-10-23.
NOT RUN YET — awaits the owner's green light on TRAINING-ROUTES-2026-10-23.md.

    modal run modal-train.py            # T4 by default; Starter $30/mo credit covers it
    modal run modal-train.py --gpu L4   # faster card, still inside the credit

Uploads dataset-v2.jsonl + train-lora.py (both small), pulls the base
model from HF inside the container, trains the LoRA (plan of record),
and downloads the adapter into ~/workspace/seshat-local/adapter-v2/.
Merging + GGUF + the 3/3 proof happen back on this VM.
"""
import os
import modal

GPU = os.environ.get('SESHAT_GPU', 'T4')
HERE = os.path.expanduser('~/workspace/seshat-local')

image = (
    modal.Image.debian_slim(python_version='3.12')
    .pip_install('torch', 'transformers', 'peft', 'accelerate', 'sentencepiece')
    .add_local_file(os.path.join(HERE, 'train-lora.py'), '/root/train-lora.py')
    .add_local_file(os.path.join(HERE, 'dataset-v2.jsonl'), '/root/dataset-v2.jsonl')
)
app = modal.App('seshat-lora-v2')


@app.function(image=image, gpu=GPU, timeout=60 * 60 * 3)
def train(epochs: float = 3.0, seq: int = 1024) -> bytes:
    import subprocess, io, zipfile
    subprocess.run(
        ['python3', '/root/train-lora.py', '--data', '/root/dataset-v2.jsonl',
         '--out', '/root/adapter-v2', '--epochs', str(epochs), '--seq', str(seq),
         '--bsz', '8', '--accum', '1'],
        check=True)
    buf = io.BytesIO()
    with zipfile.ZipFile(buf, 'w', zipfile.ZIP_DEFLATED) as z:
        for root, _, files in os.walk('/root/adapter-v2'):
            for f in files:
                p = os.path.join(root, f)
                z.write(p, os.path.relpath(p, '/root'))
    return buf.getvalue()


@app.local_entrypoint()
def main(epochs: float = 3.0, seq: int = 1024):
    import io, zipfile
    blob = train.remote(epochs=epochs, seq=seq)
    dest = os.path.join(HERE, 'adapter-v2')
    with zipfile.ZipFile(io.BytesIO(blob)) as z:
        z.extractall(HERE)
    print(f'adapter downloaded -> {dest}')
