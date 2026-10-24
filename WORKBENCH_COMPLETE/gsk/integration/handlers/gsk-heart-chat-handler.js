'use strict';

/**
 * GSK-HEART Chat Handler
 *
 * Architecture: GSK decides, OmniRoute executes.
 *
 * Primary path  : POST ${OMNIROUTE_URL}/v1/chat/completions (OpenAI-compatible SSE).
 *                 OmniRoute supplies 346 providers, RTK/Caveman compression,
 *                 quota-aware fallback tiers — no per-provider code here.
 * Fallback path : Native provider HTTP (below) ONLY when OmniRoute is
 *                 unreachable, so GSK's heart keeps beating standalone.
 */

const http = require('http');
const https = require('https');
const { URL } = require('url');

const OMNIROUTE_URL = process.env.NINE_ROUTER_URL || process.env.OMNIROUTE_URL || 'http://127.0.0.1:20128';
const OMNIROUTE_API_KEY = process.env.NINE_ROUTER_API_KEY || '';

const PROVIDER_BASE = {
  openai: 'https://api.openai.com/v1/chat/completions',
  anthropic: 'https://api.anthropic.com/v1/messages',
  gemini: 'https://generativelanguage.googleapis.com/v1beta/models',
  deepseek: 'https://api.deepseek.com/v1/chat/completions',
  groq: 'https://api.groq.com/openai/v1/chat/completions',
  xai: 'https://api.x.ai/v1/chat/completions',
  mistral: 'https://api.mistral.ai/v1/chat/completions',
  together: 'https://api.together.xyz/v1/chat/completions',
  fireworks: 'https://api.fireworks.ai/inference/v1/chat/completions',
  cerebras: 'https://api.cerebras.ai/v1/chat/completions',
  cohere: 'https://api.cohere.ai/v2/chat',
  nvidia: 'https://integrate.api.nvidia.com/v1/chat/completions',
  poolside: 'https://inference.poolside.ai/v1/chat/completions',
  perplexity: 'https://api.perplexity.ai/chat/completions',
  openrouter: 'https://openrouter.ai/api/v1/chat/completions',
  ollama: 'http://127.0.0.1:11434/api/chat',
  'claude-web': 'https://claude.ai/api/organizations',
};

// ---------------------------------------------------------------------------
// Provider resolution helpers
// ---------------------------------------------------------------------------

function resolveProviderId(model) {
  if (typeof model !== 'string') return null;
  const idx = model.indexOf('/');
  if (idx <= 0) return null;
  return model.slice(0, idx);
}

function resolveModelName(model) {
  if (typeof model !== 'string') return model;
  const idx = model.indexOf('/');
  if (idx <= 0) return model;
  return model.slice(idx + 1);
}

function resolveEndpoint(provider, modelName, credentials) {
  if (credentials && credentials.baseUrl) return credentials.baseUrl;
  if (provider === 'gemini') {
    return 'https://generativelanguage.googleapis.com/v1beta/models/' + modelName + ':streamGenerateContent?alt=sse';
  }
  if (provider === 'ollama') return 'http://127.0.0.1:11434/api/chat';
  return PROVIDER_BASE[provider] || null;
}

function providerKeyEnv(provider) {
  const map = {
    openai: 'OPENAI_API_KEY',
    anthropic: 'ANTHROPIC_API_KEY',
    gemini: 'GEMINI_API_KEY',
    deepseek: 'DEEPSEEK_API_KEY',
    groq: 'GROQ_API_KEY',
    xai: 'XAI_API_KEY',
    mistral: 'MISTRAL_API_KEY',
    together: 'TOGETHER_API_KEY',
    fireworks: 'FIREWORKS_API_KEY',
    cerebras: 'CEREBRAS_API_KEY',
    cohere: 'COHERE_API_KEY',
    nvidia: 'NVIDIA_API_KEY',
    poolside: 'POOLSIDE_API_KEY',
    perplexity: 'PERPLEXITY_API_KEY',
    openrouter: 'OPENROUTER_API_KEY',
  };
  return map[provider] || (provider.toUpperCase().replace(/-/g, '_') + '_API_KEY');
}

function buildHeaders(provider, credentials) {
  const headers = { 'Content-Type': 'application/json' };
  const key = credentials && credentials.apiKey ? credentials.apiKey : process.env[providerKeyEnv(provider)];
  if (provider === 'anthropic') {
    if (key) headers['x-api-key'] = key;
    headers['anthropic-version'] = '2023-06-01';
  } else if (key) {
    headers['Authorization'] = 'Bearer ' + key;
  }
  return headers;
}

function buildBody(provider, modelName, system, prompt, options) {
  options = options || {};
  const messages = [
    ...(system ? [{ role: 'system', content: system }] : []),
    { role: 'user', content: prompt },
  ];
  if (provider === 'anthropic') {
    return {
      model: modelName,
      system: system || undefined,
      messages: [{ role: 'user', content: prompt }],
      max_tokens: options.maxTokens || 1024,
      temperature: options.temperature != null ? options.temperature : 0.7,
      stream: true,
    };
  }
  if (provider === 'gemini') {
    return {
      contents: [{ parts: [{ text: prompt }] }],
      systemInstruction: system ? { parts: [{ text: system }] } : undefined,
      generationConfig: {
        maxOutputTokens: options.maxTokens || 1024,
        temperature: options.temperature != null ? options.temperature : 0.7,
      },
    };
  }
  if (provider === 'ollama') {
    return {
      model: modelName,
      messages: messages,
      stream: true,
      options: { num_predict: options.maxTokens || 1024, temperature: options.temperature != null ? options.temperature : 0.7 },
    };
  }
  return {
    model: modelName,
    messages: messages,
    max_tokens: options.maxTokens || 1024,
    temperature: options.temperature != null ? options.temperature : 0.7,
    stream: true,
  };
}

// ---------------------------------------------------------------------------
// SSE chunk helpers — exactly what GSK's mega_brain parser consumes
// ---------------------------------------------------------------------------

function sseDelta(content) {
  return 'data: ' + JSON.stringify({ choices: [{ delta: { content: content } }] }) + '\n\n';
}
function sseDone() {
  return 'data: [DONE]\n\n';
}
function sseError(message) {
  return 'data: ' + JSON.stringify({ error: { message: message } }) + '\n\n';
}

function extractContentFromChunk(provider, chunkObj) {
  if (!chunkObj || typeof chunkObj !== 'object') return null;
  if (provider === 'ollama') return chunkObj.message && chunkObj.message.content || chunkObj.response || null;
  if (provider === 'anthropic') {
    const delta = chunkObj.delta;
    if (delta && delta.type === 'content_block_delta' && delta.text) return delta.text;
    return null;
  }
  if (provider === 'gemini') {
    const part = chunkObj.candidates && chunkObj.candidates[0] && chunkObj.candidates[0].content && chunkObj.candidates[0].content.parts && chunkObj.candidates[0].content.parts[0];
    return part && part.text || null;
  }
  const choice = chunkObj.choices && chunkObj.choices[0];
  if (!choice) return null;
  return (choice.delta && choice.delta.content) || (choice.message && choice.message.content) || null;
}

// ---------------------------------------------------------------------------
// Low-level HTTP POST returning raw response body
// ---------------------------------------------------------------------------

function postRequest(endpoint, headers, bodyStr, timeoutMs) {
  return new Promise((resolve, reject) => {
    let u;
    try {
      u = new URL(endpoint);
    } catch (e) {
      return reject(new Error('Invalid endpoint: ' + endpoint));
    }
    const mod = u.protocol === 'https:' ? https : http;
    const req = mod.request(
      u,
      {
        method: 'POST',
        headers: Object.assign({}, headers, { 'Content-Length': Buffer.byteLength(bodyStr) }),
        timeout: timeoutMs || 60000,
      },
      (res) => {
        let data = '';
        res.on('data', (c) => {
          data += c;
          if (data.length > 5e6) {
            req.destroy();
            reject(new Error('Response too large'));
          }
        });
        res.on('end', () => resolve({ status: res.statusCode, data: data }));
      }
    );
    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });
    req.write(bodyStr);
    req.end();
  });
}

// ---------------------------------------------------------------------------
// Main streaming function — async generator yielding SSE strings
// ---------------------------------------------------------------------------

async function* streamChat(opts) {
  opts = opts || {};
  const model = opts.model;
  const provider = opts.provider || resolveProviderId(model);
  const modelName = resolveModelName(model);
  const endpoint = resolveEndpoint(provider, modelName, opts.credentials);
  if (!endpoint) {
    yield sseError('No endpoint configured for provider "' + provider + '"');
    return;
  }

  const headers = buildHeaders(provider, opts.credentials);
  const body = buildBody(provider, modelName, opts.system, opts.prompt, opts);
  const bodyStr = JSON.stringify(body);

  const maxAttempts = opts.maxAttempts || 3;
  let attempt = 0;
  let lastErr = null;

  while (attempt < maxAttempts) {
    attempt++;
    try {
      const res = await postRequest(endpoint, headers, bodyStr, opts.timeoutMs || 60000);
      if (res.status >= 400) {
        lastErr = 'HTTP ' + res.status + ': ' + String(res.data).slice(0, 200);
        if (res.status === 429 || res.status >= 500) {
          const backoff = Math.min(8000, 500 * Math.pow(2, attempt));
          await new Promise((r) => setTimeout(r, backoff));
          continue;
        }
        yield sseError(lastErr);
        return;
      }

      if (provider === 'anthropic') {
        yield* streamAnthropicRaw(res.data);
      } else if (provider === 'gemini') {
        yield* streamGeminiRaw(res.data);
      } else {
        yield* streamOpenAICompatible(res.data);
      }
      return;
    } catch (e) {
      lastErr = e.message || String(e);
      const backoff = Math.min(8000, 500 * Math.pow(2, attempt));
      await new Promise((r) => setTimeout(r, backoff));
    }
  }
  yield sseError('All ' + maxAttempts + ' attempts failed: ' + lastErr);
}

function* streamOpenAICompatible(raw) {
  const lines = String(raw).split('\n');
  for (const line of lines) {
    const t = line.trim();
    if (!t.startsWith('data:')) continue;
    const payload = t.slice(5).trim();
    if (payload === '[DONE]') {
      yield 'data: [DONE]\n\n';
      continue;
    }
    try {
      const obj = JSON.parse(payload);
      const content = extractContentFromChunk('openai', obj);
      if (content) yield sseDelta(content);
    } catch (e) {
      yield line + '\n';
    }
  }
}

function* streamAnthropicRaw(raw) {
  const lines = String(raw).split('\n');
  for (const line of lines) {
    const t = line.trim();
    if (!t.startsWith('data:')) continue;
    const payload = t.slice(5).trim();
    if (payload === '[DONE]') {
      yield 'data: [DONE]\n\n';
      continue;
    }
    try {
      const obj = JSON.parse(payload);
      const content = extractContentFromChunk('anthropic', obj);
      if (content) yield sseDelta(content);
    } catch (e) {
      // pass
    }
  }
  yield 'data: [DONE]\n\n';
}

function* streamGeminiRaw(raw) {
  const text = String(raw).replace(/^\[/, '').replace(/\]$/, '');
  const lines = text.split('\n').filter((l) => l.trim().length > 0);
  for (const line of lines) {
    try {
      const obj = JSON.parse(line);
      const content = extractContentFromChunk('gemini', obj);
      if (content) yield sseDelta(content);
    } catch (e) {
      // pass
    }
  }
  yield 'data: [DONE]\n\n';
}

// ---------------------------------------------------------------------------
// Non-streaming convenience: collect full SSE stream into one string
// ---------------------------------------------------------------------------

async function gskHeartChat(opts) {
  let out = '';
  for await (const chunk of streamChat(opts)) {
    out += chunk;
  }
  return out;
}

// ---------------------------------------------------------------------------
// Execute a chat completion request (non-streaming, collects all chunks)
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Transport note (Assembly Phase 1, 2026-10-20): a proxy-aware fetch
// transport for executeChatStream was tried and REVERTED the same day.
// On the surgery VM the egress proxy stalls ANY request carrying an
// Authorization header (reproduced against poolside/openai/groq with
// real and bogus keys), while raw https direct answers normally
// (poolside /v1/models -> 401 in <1s, no-auth control). The original
// raw https transport below is therefore the correct path on this VM
// and on a normal user PC alike.
// ---------------------------------------------------------------------------

async function executeChatStream(options) {
  const { model, messages, provider, timeout = 60000, onChunk } = options;

  if (!provider) {
    return { success: false, error: 'No provider configured' };
  }

  const endpoint = provider.streamingEndpoint || provider.endpoint;
  if (!endpoint) {
    return { success: false, error: 'No endpoint configured for provider ' + provider.id };
  }

  let parsedUrl;
  try {
    parsedUrl = new URL(endpoint);
  } catch (e) {
    return { success: false, error: 'Invalid endpoint URL: ' + endpoint };
  }

  const isHttps = parsedUrl.protocol === 'https:';
  const lib = isHttps ? https : http;

  const headers = {
    'Content-Type': 'application/json',
    'Accept': 'text/event-stream',
  };

  const apiKey = provider.apiKey || process.env[(provider.id || '').toUpperCase() + '_API_KEY'];
  if (apiKey) {
    headers['Authorization'] = 'Bearer ' + apiKey;
  }

  const requestBody = {
    model: model,
    messages: messages,
    stream: true,
    stream_options: { include_usage: true },
  };

  return new Promise((resolve) => {
    let accumulatedContent = '';
    let usage = null;

    const reqOptions = {
      hostname: parsedUrl.hostname,
      port: parsedUrl.port || (isHttps ? 443 : 80),
      path: parsedUrl.pathname + parsedUrl.search,
      method: 'POST',
      headers: headers,
      timeout: timeout,
    };

    const req = lib.request(reqOptions, (res) => {
      if (res.statusCode !== 200) {
        let errorBody = '';
        res.on('data', (chunk) => { errorBody += chunk; });
        res.on('end', () => {
          resolve({ success: false, error: 'HTTP ' + res.statusCode + ': ' + errorBody, statusCode: res.statusCode });
        });
        return;
      }

      let buffer = '';
      res.on('data', (chunk) => {
        buffer += chunk.toString();
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';
        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || trimmed.startsWith(':')) continue;
          if (trimmed.startsWith('data: ')) {
            const data = trimmed.slice(6);
            if (data === '[DONE]') {
              resolve({ success: true, content: accumulatedContent, usage: usage });
              return;
            }
            try {
              const parsed = JSON.parse(data);
              const delta = parsed.choices && parsed.choices[0] && parsed.choices[0].delta;
              if (delta && delta.content) {
                accumulatedContent += delta.content;
                if (onChunk) onChunk({ content: delta.content, done: false });
              }
              if (parsed.usage) usage = parsed.usage;
              if (parsed.choices && parsed.choices[0] && parsed.choices[0].finish_reason) {
                resolve({ success: true, content: accumulatedContent, usage: usage });
                return;
              }
            } catch (e) {
              // ignore parse errors
            }
          }
        }
      });

      res.on('error', (err) => {
        resolve({ success: false, error: 'Stream error: ' + err.message });
      });

      res.on('end', () => {
        if (accumulatedContent) {
          resolve({ success: true, content: accumulatedContent, usage: usage });
        } else {
          resolve({ success: false, error: 'Stream ended without content' });
        }
      });
    });

    req.on('error', (err) => {
      resolve({ success: false, error: 'Request error: ' + err.message });
    });

    req.on('timeout', () => {
      req.destroy();
      resolve({ success: false, error: 'Request timed out after ' + timeout + 'ms' });
    });

    req.write(JSON.stringify(requestBody));
    req.end();
  });
}

// ---------------------------------------------------------------------------
// PRIMARY PATH — OmniRoute execution (GSK decides, OmniRoute executes)
// ---------------------------------------------------------------------------

function omniRouteModel(provider) {
  if (!provider) return '';
  const dm = provider.defaultModel ? String(provider.defaultModel) : '';
  const id = provider.id ? String(provider.id) : '';
  if (dm && dm.includes('/')) return dm;
  if (dm) return id ? id + '/' + dm : dm;
  return id; // bare provider id — OmniRoute resolves its default model
}

/**
 * Streams a chat completion through OmniRoute's OpenAI-compatible endpoint.
 * Resolves { viaOmniRoute: true, ... } on success, { unreachable: true } when
 * OmniRoute itself cannot be reached (connection-level failure), or
 * { success: false, error } for request-level failures.
 */
function executeViaOmniRoute(options) {
  const { model, messages, timeout = 60000, onChunk } = options;
  if (!model) return Promise.resolve({ success: false, error: 'No model specified' });

  let parsedUrl;
  try {
    parsedUrl = new URL(OMNIROUTE_URL + '/v1/chat/completions');
  } catch (e) {
    return Promise.resolve({ unreachable: true, error: 'Bad OMNIROUTE_URL: ' + OMNIROUTE_URL });
  }

  const headers = { 'Content-Type': 'application/json', Accept: 'text/event-stream' };
  if (OMNIROUTE_API_KEY) headers['Authorization'] = 'Bearer ' + OMNIROUTE_API_KEY;

  const isHttps = parsedUrl.protocol === 'https:';
  const lib = isHttps ? https : http;

  return new Promise((resolve) => {
    let accumulatedContent = '';
    let usage = null;
    let settled = false;
    let sawToolCalls = false;
    const done = (r) => { if (!settled) { settled = true; resolve(Object.assign({ toolCalled: sawToolCalls }, r)); } };

    const req = lib.request(
      {
        hostname: parsedUrl.hostname,
        port: parsedUrl.port || (isHttps ? 443 : 80),
        path: parsedUrl.pathname + parsedUrl.search,
        method: 'POST',
        headers: headers,
        timeout: timeout,
      },
      (res) => {
        if (res.statusCode !== 200) {
          let errorBody = '';
          res.on('data', (c) => { errorBody += c; });
          res.on('end', () => {
            // 4xx/5xx from OmniRoute means it answered — do not mark unreachable.
            done({ success: false, error: 'OmniRoute HTTP ' + res.statusCode + ': ' + errorBody.slice(0, 200), statusCode: res.statusCode });
          });
          return;
        }

        let buffer = '';
        res.on('data', (chunk) => {
          buffer += chunk.toString();
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';
          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed || trimmed.startsWith(':')) continue;
            if (!trimmed.startsWith('data: ')) continue;
            const data = trimmed.slice(6);
            if (data === '[DONE]') { done({ success: true, content: accumulatedContent, usage: usage, viaOmniRoute: true }); return; }
            try {
              const parsed = JSON.parse(data);
              if (parsed.error) { done({ success: false, error: parsed.error.message || 'OmniRoute stream error', viaOmniRoute: true }); return; }
              const choice = parsed.choices && parsed.choices[0];
              const delta = choice && choice.delta;
              if (delta && (delta.tool_calls || delta.function_call)) sawToolCalls = true;
              if (delta && delta.content) {
                accumulatedContent += delta.content;
                if (onChunk) onChunk({ content: delta.content, done: false });
              }
              if (parsed.usage) usage = parsed.usage;
              const fr = choice && choice.finish_reason;
              if (fr === 'tool_calls') sawToolCalls = true;
              if (fr) { done({ success: accumulatedContent.trim().length > 0, content: accumulatedContent, usage: usage, viaOmniRoute: true, toolCalled: sawToolCalls }); return; }
            } catch (e) { /* partial JSON line — ignore */ }
          }
        });

        res.on('error', (err) => done({ success: false, error: 'Stream error: ' + err.message }));
        res.on('end', () => {
          if (accumulatedContent) done({ success: true, content: accumulatedContent, usage: usage, viaOmniRoute: true });
          else done({ success: false, error: 'Stream ended without content' });
        });
      }
    );

    req.on('error', (err) => {
      // Connection refused / socket errors => OmniRoute not running.
      done({ unreachable: true, error: 'OmniRoute unreachable: ' + err.message });
    });
    req.on('timeout', () => {
      req.destroy();
      done({ success: false, error: 'OmniRoute timed out after ' + timeout + 'ms' });
    });

    req.write(JSON.stringify({ model: model, messages: messages, stream: true, stream_options: { include_usage: true } }));
    req.end();
  });
}

// ---------------------------------------------------------------------------
// Fallback chain — OmniRoute first, native provider HTTP as last resort
// ---------------------------------------------------------------------------

async function executeWithFallback(options) {
  const { providerChain, messages, onChunk } = options;

  if (!providerChain || providerChain.length === 0) {
    return { success: false, error: 'No providers in fallback chain' };
  }

  const results = [];
  let omniRouteReachable = true;
  let sawToolCalls = false;

  // TIER 1: every candidate model through OmniRoute (compression + quota tiers free)
  for (let i = 0; i < providerChain.length && omniRouteReachable; i++) {
    const provider = providerChain[i];
    const model = omniRouteModel(provider);
    if (!model) continue;
    console.log('[GSK-HEART] OmniRoute attempt ' + (i + 1) + '/' + providerChain.length + ': ' + model);

    const result = await executeViaOmniRoute({
      model: model,
      messages: messages,
      timeout: provider.timeout || 60000,
      onChunk: i === 0 ? onChunk : null,
    });
    if (result.toolCalled) sawToolCalls = true;

    if (result.success) {
      return {
        success: true,
        content: result.content,
        model: model,
        provider: provider.id,
        usage: result.usage,
        attempts: i + 1,
        viaOmniRoute: true,
        // Electrician repair (2026-10-23): surface the failures this
        // success stepped over, so callers can learn dead seats (429
        // cooldown in mega_brain) instead of re-billing them per call.
        failures: results,
      };
    }

    results.push({ provider: provider.id, via: 'omniroute', error: result.error });
    if (result.unreachable) {
      omniRouteReachable = false;
      console.warn('[GSK-HEART] OmniRoute unreachable — falling back to native provider HTTP');
      break;
    }
    console.warn('[GSK-HEART] OmniRoute rejected ' + model + ': ' + result.error);
  }

  // TIER 2 (last resort): direct provider HTTP so GSK survives standalone
  for (let i = 0; i < providerChain.length; i++) {
    const provider = providerChain[i];
    const model = provider.defaultModel || provider.id;
    console.log('[GSK-HEART] Native attempt ' + (i + 1) + '/' + providerChain.length + ': ' + provider.id);

    const result = await executeChatStream({
      model: model,
      messages: messages,
      provider: provider,
      timeout: provider.timeout || 60000,
      onChunk: null,
    });

    if (result.success) {
      return {
        success: true,
        content: result.content,
        model: model,
        provider: provider.id,
        usage: result.usage,
        attempts: i + 1,
        viaOmniRoute: false,
        // Electrician repair (2026-10-23): see the OmniRoute-tier
        // return above — failures ride along on success too.
        failures: results,
      };
    }

    results.push({ provider: provider.id, via: 'native', error: result.error });
    console.warn('[GSK-HEART] Provider ' + provider.id + ' failed: ' + result.error);
  }

  return {
    success: false,
    error: 'All ' + providerChain.length + ' providers failed',
    attempts: providerChain.length * 2,
    failures: results,
    toolCalled: sawToolCalls,
  };
}

// ---------------------------------------------------------------------------
// Token + cost estimation
// ---------------------------------------------------------------------------

function estimateTokens(messages) {
  const totalChars = messages.reduce(function(sum, msg) {
    return sum + (msg.content ? msg.content.length : 0) + (msg.role ? msg.role.length : 0);
  }, 0);
  return Math.ceil(totalChars / 4);
}

function estimateCost(tokens, provider) {
  const inputPrice = (provider.pricing && provider.pricing.inputPer1K) || 0.0001;
  const outputPrice = (provider.pricing && provider.pricing.outputPer1K) || 0.0003;
  const inputTokens = tokens * 0.6;
  const outputTokens = tokens * 0.4;
  return (inputTokens / 1000 * inputPrice) + (outputTokens / 1000 * outputPrice);
}

// ---------------------------------------------------------------------------
// GSKHeartChatHandler class
// ---------------------------------------------------------------------------

class GSKHeartChatHandler {
  constructor(options) {
    options = options || {};
    this.options = options;
    this.defaultTimeout = options.timeout || 60000;
    this.maxRetries = options.maxRetries || 3;
    this.enableStreaming = options.enableStreaming !== false;
  }

  async chat(request) {
    const prompt = request.prompt;
    const existingMessages = request.messages;
    const model = request.model;
    const options = request.options || {};

    const messages = existingMessages || [
      { role: 'user', content: prompt }
    ];

    let providerChain = options.providerChain;
    if (!providerChain || providerChain.length === 0) {
      // Synthesize a chain: explicit model first, else OmniRoute auto-routing.
      providerChain = [];
      if (typeof model === 'string' && model.length > 0) {
        const slash = model.indexOf('/');
        providerChain.push({
          id: slash > 0 ? model.slice(0, slash) : model,
          defaultModel: slash > 0 ? model.slice(slash + 1) : undefined,
        });
      } else {
        providerChain.push({ id: 'auto', defaultModel: 'best-chat' });
      }
    }

    const result = await executeWithFallback({
      providerChain: providerChain,
      messages: messages,
      onChunk: options.onChunk,
    });

    return result;
  }

  async complete(request) {
    const result = await this.chat(request);
    if (!result.success) {
      throw new Error(result.error || 'Completion failed');
    }
    return result.content;
  }

  async stream(request, onChunk) {
    return this.chat(Object.assign({}, request, { options: Object.assign({}, request.options, { onChunk: onChunk }) }));
  }
}

module.exports = {
  executeViaOmniRoute,
  executeChatStream,
  executeWithFallback,
  estimateTokens,
  estimateCost,
  GSKHeartChatHandler,
  gskHeartChat,
  streamChat,
  resolveProviderId,
  resolveModelName,
  resolveEndpoint,
  omniRouteModel,
  OMNIROUTE_URL,
  sseDelta,
  sseDone,
  sseError,
  buildHeaders,
  buildBody,
  extractContentFromChunk,
  postRequest,
  streamOpenAICompatible,
  streamAnthropicRaw,
  streamGeminiRaw,
};
