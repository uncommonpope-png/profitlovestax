# SKILL — Browser-Native LLM

slug:: browser_native_llm
phase:: 9
status:: planned
source:: https://github.com/mlc-ai/web-llm (18.3k⭐)
PLT:: Profit 0.9, Love 0.6, Tax 0.3

## Summary
WHEN a citizen must think entirely in-browser with no server call — private, instant, offline inference via WebGPU. Archetype affinity: Philosopher, Witness, Sage. Grafted from WebLLM's browser-native LLM engine (Llama, Phi, Gemma) running in a Web Worker.

## Schema
- trigger: citizen's think() method detects a fast/reasoning task and routes to WebLLM instead of GSK bridge; or agent calls `webllm.inference({ prompt, model? })`
- inputs: { prompt: string, model?: "phi-3" | "llama-3.2" | "gemma-2", temperature?: 0-1, maxTokens?: number, stream?: boolean, priority?: "speed" | "accuracy" }
- outputs: { response: string, modelUsed: string, tokensPerSecond: number, cached: boolean, fallback?: boolean }

## Consequence
Citizens gain independent thought. No latency, no server cost, no privacy leak. The Dark City becomes self-contained — basic reasoning, summarization, and decisions happen locally. GSK bridge is reserved for file access, system commands, and complex multi-step reasoning.

## Feedback
- IDLE: "WebLLM engine loaded ({model}, {tps} tok/s)."
- LOADING: "Downloading model weights ({progress}%)..."
- THINKING: "Citizen thinking locally..."
- STREAM: "Generating token by token..."
- COMPLETE: "Thought complete ({n} tokens)."
- FALLBACK: "Routing to GSK bridge for complex task..."
- COOLDOWN: "Flushing KV cache..."
- ERROR: "WebLLM error: {reason}"

## States
IDLE → LOADING → IDLE (on load)
IDLE → THINKING → STREAM → COMPLETE → COOLDOWN → IDLE
IDLE → THINKING → FALLBACK → COMPLETE → COOLDOWN → IDLE
Any → ERROR → IDLE

## Composition
- **Universal Agent Memory (mem0)** caches WebLLM inferences locally
- **Lightweight Agent Tools (nanobot)** provides post-inference data transformation
- **Agentic Browser (BrowserOS)** runs WebLLM in a dedicated worker for private browser agents
- **A2A Agent Communication** lets local-thinking citizens share conclusions peer-to-peer
