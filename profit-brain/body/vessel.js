import { readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));

const CONFIG_PATHS = [
  join(HERE, '..', 'config.json'),
  join(HERE, 'config.json'),
];

export const loadVesselConfig = () => {
  for (const path of CONFIG_PATHS) {
    if (existsSync(path)) {
      try {
        const cfg = JSON.parse(readFileSync(path, 'utf8'));
        return normalizeConfig(cfg);
      } catch {
        continue;
      }
    }
  }
  return normalizeConfig({
    provider: process.env.PROFIT_PROVIDER,
    model: process.env.PROFIT_MODEL,
    apiKey: process.env.PROFIT_API_KEY,
    baseUrl: process.env.PROFIT_BASE_URL,
    temperature: process.env.PROFIT_TEMPERATURE,
  });
};

const OPENAI_COMPATIBLE = new Set([
  'openai', 'ollama', 'custom', 'openrouter', 'deepseek', 'groq', 'nvidia', 'opencode', 'oxalpha', 'omniroute',
]);

const DEFAULT_BASE_URLS = {
  openai: 'https://api.openai.com/v1',
  openrouter: 'https://openrouter.ai/api/v1',
  deepseek: 'https://api.deepseek.com/v1',
  groq: 'https://api.groq.com/openai/v1',
  nvidia: 'https://integrate.api.nvidia.com/v1',
  ollama: 'http://localhost:11434/v1',
  anthropic: 'https://api.anthropic.com/v1',
  gemini: 'https://generativelanguage.googleapis.com/v1beta',
  oxalpha: 'https://tokenra.io/v1',
  omniroute: 'http://127.0.0.1:20128/v1',
};

const normalizeConfig = (raw) => {
  const provider = String(raw.provider || 'ollama').toLowerCase();
  const baseUrl = raw.baseUrl || DEFAULT_BASE_URLS[provider] || '';
  return {
    provider,
    model: raw.model || defaultModel(provider),
    apiKey: raw.apiKey || '',
    baseUrl: baseUrl.replace(/\/$/, ''),
    temperature: Number(raw.temperature ?? 0.7),
    family: provider === 'gemini' ? 'gemini' : provider === 'anthropic' ? 'anthropic' : 'openai',
    models: Array.isArray(raw.models) ? raw.models.filter((m) => typeof m === 'string') : [],
    fleet: Array.isArray(raw.fleet) ? raw.fleet.filter((f) => f && typeof f.model === 'string') : [],
  };
};

const defaultModel = (provider) => {
  if (provider === 'gemini') return 'gemini-2.0-flash';
  if (provider === 'anthropic') return 'claude-3-5-haiku-latest';
  if (provider === 'ollama') return 'qwen2.5:0.5b';
  return 'gpt-4o-mini';
};

export const MODEL_CATALOG = [
  { id: 'stealth/ox-alpha', provider: 'openrouter', label: 'Ox-Alpha (unlimited)', baseUrl: 'https://openrouter.ai/api/v1' },
  { id: 'omniroute/auto/best-coding', provider: 'omniroute', label: 'OmniRoute Auto (when on)', baseUrl: 'http://127.0.0.1:20128/v1' },
  { id: 'auto/best-coding', provider: 'omniroute', label: 'OmniRoute Best Coding', baseUrl: 'http://127.0.0.1:20128/v1' },
  { id: 'auto/best-chat', provider: 'omniroute', label: 'OmniRoute Best Chat', baseUrl: 'http://127.0.0.1:20128/v1' },
  { id: 'minimax/minimax-m3:free', provider: 'openrouter', label: 'MiniMax M3 (free)', baseUrl: 'https://openrouter.ai/api/v1' },
  { id: 'google/gemma-4-31b-it:free', provider: 'openrouter', label: 'Gemma 4 31B (free)', baseUrl: 'https://openrouter.ai/api/v1' },
  { id: 'nvidia/nemotron-3-ultra-550b-a55b:free', provider: 'openrouter', label: 'Nemotron Ultra (free)', baseUrl: 'https://openrouter.ai/api/v1' },
];

export const buildRequest = (config, system, turns) => {
  if (config.family === 'gemini') {
    return {
      url: `${config.baseUrl}/models/${config.model}:generateContent${config.apiKey ? `?key=${config.apiKey}` : ''}`,
      headers: { 'content-type': 'application/json' },
      body: {
        systemInstruction: { parts: [{ text: system }] },
        contents: turns.map((t) => ({
          role: t.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: t.text }],
        })),
        generationConfig: { temperature: config.temperature },
      },
      extract: extractGemini,
    };
  }
  if (config.family === 'anthropic') {
    return {
      url: `${config.baseUrl}/messages`,
      headers: {
        'content-type': 'application/json',
        'x-api-key': config.apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: {
        model: config.model,
        max_tokens: 2048,
        temperature: config.temperature,
        system,
        messages: turns.map((t) => ({
          role: t.role === 'assistant' ? 'assistant' : 'user',
          content: t.text,
        })),
      },
      extract: extractAnthropic,
    };
  }
  if (!OPENAI_COMPATIBLE.has(config.provider)) {
    throw new Error(`Unknown vessel provider: ${config.provider}`);
  }
  return {
    url: `${config.baseUrl}/chat/completions`,
    headers: {
      'content-type': 'application/json',
      ...(config.apiKey ? { authorization: `Bearer ${config.apiKey}` } : {}),
    },
    body: {
      model: config.model,
      temperature: config.temperature,
      stream: false,
      messages: [
        { role: 'system', content: system },
        ...turns.map((t) => ({ role: t.role === 'assistant' ? 'assistant' : 'user', content: t.text })),
      ],
    },
    extract: extractOpenAI,
  };
};

const textOf = (value) => (typeof value === 'string' ? value : '');

const extractGemini = (json) => {
  const candidates = Array.isArray(json?.candidates) ? json.candidates : [];
  const parts = candidates[0]?.content?.parts;
  if (!Array.isArray(parts)) return '';
  return parts.map((p) => textOf(p?.text)).join('').trim();
};

const extractAnthropic = (json) => {
  const content = Array.isArray(json?.content) ? json.content : [];
  return content.map((c) => textOf(c?.text)).join('').trim();
};

const extractOpenAI = (json) => {
  const choices = Array.isArray(json?.choices) ? json.choices : [];
  return textOf(choices[0]?.message?.content).trim();
};

const TRANSIENT = /429|502|503|504|fetch failed|ECONNREFUSED|ENOTFOUND|ETIMEDOUT|socket hang up/i;

export const speak = async (config, system, turns, log) => {
  const trace = typeof log === 'function' ? log : null;
  const attempts = [];
  if (Array.isArray(config.models) && config.models.length > 0) {
    for (const model of config.models) attempts.push({ provider: config.provider, baseUrl: config.baseUrl, apiKey: config.apiKey, temperature: config.temperature, family: config.family, model });
  } else {
    attempts.push({ ...config });
  }
  for (const entry of Array.isArray(config.fleet) ? config.fleet : []) {
    attempts.push({
      provider: entry.provider,
      baseUrl: entry.baseUrl || DEFAULT_BASE_URLS[entry.provider] || '',
      apiKey: entry.apiKey ?? '',
      temperature: config.temperature,
      family: entry.provider === 'gemini' ? 'gemini' : entry.provider === 'anthropic' ? 'anthropic' : 'openai',
      model: entry.model,
    });
  }
  let lastError = null;
  for (const attempt of attempts) {
    try {
      if (trace) trace(`trying ${attempt.provider}/${attempt.model}`);
      return await speakOnce(attempt, system, turns);
    } catch (err) {
      if (trace) trace(`failed ${attempt.provider}/${attempt.model}: ${err.message.slice(0, 90)}`);
      lastError = err;
      if (!TRANSIENT.test(`${err.message}|${err.cause?.code || ''}`)) throw err;
    }
  }
  throw lastError;
};

const parseSSE = (raw) => {
  let out = '';
  for (const line of raw.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed.startsWith('data:')) continue;
    const payload = trimmed.slice(5).trim();
    if (!payload || payload === '[DONE]') continue;
    try {
      const json = JSON.parse(payload);
      out += extractOpenAI(json);
      if (typeof json?.delta?.content === 'string') out += json.delta.content;
      const choice = Array.isArray(json?.choices) ? json.choices[0] : null;
      if (choice?.delta && typeof choice.delta.content === 'string') {
        if (!out.includes(choice.delta.content)) out += choice.delta.content;
      }
    } catch {
      continue;
    }
  }
  return out.trim();
};

const speakOnce = async (config, system, turns) => {
  const req = buildRequest(config, system, turns);
  const res = await fetch(req.url, {
    method: 'POST',
    headers: req.headers,
    body: JSON.stringify(req.body),
  });
  const contentType = res.headers.get('content-type') || '';
  if (contentType.includes('text/event-stream')) {
    const raw = await res.text();
    if (!res.ok) throw new Error(`Vessel ${config.provider}/${config.model} refused (${res.status})`);
    const reply = parseSSE(raw);
    if (!reply) throw new Error('Vessel streamed silence');
    return reply;
  }
  const raw = await res.text();
  let json = null;
  try {
    json = JSON.parse(raw);
  } catch {
    json = null;
  }
  if (!res.ok) {
    const detail = json?.error?.message || raw.slice(0, 300);
    throw new Error(`Vessel ${config.provider}/${config.model} refused (${res.status}): ${detail}`);
  }
  if (!json) {
    if (raw.includes('data:')) {
      const reply = parseSSE(raw);
      if (reply) return reply;
    }
    throw new Error(`Vessel returned non-JSON: ${raw.slice(0, 200)}`);
  }
  const reply = req.extract(json);
  if (!reply) throw new Error('Vessel spoke silence (empty reply)');
  return reply;
};
