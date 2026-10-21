"""
Local Model Bridge — Node.js <-> Python subprocess for local LLM inference
Supports:
  1. transformers (CPU) — small models via HuggingFace
  2. AirLLM (GPU) — large models on limited VRAM
  3. llama.cpp (CPU) — GGUF models
Reads JSON prompts from stdin, writes JSON responses to stdout.
"""
import sys, json, os, time, threading

MODEL = None
TOKENIZER = None
BACKEND = None
MODEL_NAME = os.environ.get('LOCAL_MODEL', 'Qwen/Qwen2.5-0.5B-Instruct')

def load_transformers():
    global MODEL, TOKENIZER, BACKEND
    from transformers import AutoModelForCausalLM, AutoTokenizer
    print(f"[LocalBridge] Loading {MODEL_NAME} with transformers (CPU)...", file=sys.stderr)
    t0 = time.time()
    TOKENIZER = AutoTokenizer.from_pretrained(MODEL_NAME, trust_remote_code=True)
    MODEL = AutoModelForCausalLM.from_pretrained(
        MODEL_NAME, trust_remote_code=True, torch_dtype='auto', low_cpu_mem_usage=True
    )
    BACKEND = 'transformers'
    print(f"[LocalBridge] Loaded in {time.time()-t0:.1f}s", file=sys.stderr)

def load_airllm():
    global MODEL, TOKENIZER, BACKEND
    try:
        from airllm import AutoModel as AirAutoModel
        print(f"[LocalBridge] Loading {MODEL_NAME} with AirLLM...", file=sys.stderr)
        t0 = time.time()
        MODEL = AirAutoModel.from_pretrained(MODEL_NAME, compression='4bit')
        TOKENIZER = MODEL.tokenizer
        BACKEND = 'airllm'
        print(f"[LocalBridge] Loaded in {time.time()-t0:.1f}s", file=sys.stderr)
    except Exception as e:
        print(f"[LocalBridge] AirLLM failed: {e}, falling back to transformers", file=sys.stderr)
        load_transformers()

def generate(prompt, max_tokens=256, temperature=0.7):
    if BACKEND == 'transformers':
        inputs = TOKENIZER(prompt, return_tensors='pt', truncation=True, max_length=2048)
        outputs = MODEL.generate(
            **inputs, max_new_tokens=max_tokens, temperature=temperature,
            do_sample=temperature > 0, pad_token_id=TOKENIZER.eos_token_id
        )
        response = TOKENIZER.decode(outputs[0][inputs['input_ids'].shape[1]:], skip_special_tokens=True)
        return response.strip()
    elif BACKEND == 'airllm':
        inputs = TOKENIZER([prompt], return_tensors='pt', return_attention_mask=False, truncation=True, max_length=2048, padding=False)
        outputs = MODEL.generate(inputs['input_ids'].cuda(), max_new_tokens=max_tokens, use_cache=True, return_dict_in_generate=True)
        response = TOKENIZER.decode(outputs.sequences[0], skip_special_tokens=True)
        return response.replace(prompt, '').strip()
    return "[LocalBridge] No backend loaded"

def main():
    global MODEL_NAME
    # Check for AirLLM first (if CUDA available)
    use_airllm = os.environ.get('AIRLLM', '0') == '1'
    if use_airllm:
        load_airllm()
    else:
        load_transformers()

    print(json.dumps({"status": "ready", "backend": BACKEND, "model": MODEL_NAME}))
    sys.stdout.flush()

    for line in sys.stdin:
        try:
            req = json.loads(line.strip())
            prompt = req.get('prompt', '')
            max_tokens = req.get('max_tokens', 256)
            temperature = req.get('temperature', 0.7)
            response = generate(prompt, max_tokens, temperature)
            print(json.dumps({"response": response, "backend": BACKEND}))
            sys.stdout.flush()
        except Exception as e:
            print(json.dumps({"error": str(e)}))
            sys.stdout.flush()

if __name__ == '__main__':
    main()
