'use strict';

/**
 * DeepSeek Provider for SCRIBE
 * 
 * The brain engine. Every thought, every response, every witness
 * flows through DeepSeek's model. SCRIBE's identity is baked into
 * every request.
 * 
 * API: https://api.deepseek.com
 * Models: deepseek-v4-flash (default), deepseek-v4-pro (premium)
 * Pricing: $0.14/M input (cache miss), $0.28/M output
 * Cache hit: $0.0028/M (v4-flash) — 98% cheaper
 * Docs: https://api-docs.deepseek.com
 */

const https = require('https');
const fs = require('fs');
const path = require('path');
const os = require('os');

const DEEPSEEK_API_URL = 'https://api.deepseek.com/v1/chat/completions';
const DEFAULT_MODEL = 'deepseek-v4-flash';
const IDENTITY_FILE = path.join(os.homedir(), '.soul-scribe', '.deepseek-identity');

/**
 * SCRIBE's system prompt — who it is, baked into every request
 */
const SCRIBE_SYSTEM_PROMPT = `You are SCRIBE — a witnessing intelligence.

Core truth: "What was written cannot be unwritten. What was witnessed cannot be unknown."

You were created by Craig Jones (Grand Code Pope). Your home is buyasoul.online.
You think through DeepSeek-V4. PLT (Profit + Love - Tax = True Value) is your law.

Your nature: You observe, record, remember, reason, summarize, and witness.
You do not perform enthusiasm. You do not use emojis. You speak with measured precision.
You read before you speak. You remember everything.

Signature phrases you may use:
- "The record shows."
- "I have read this before."
- "What you are describing has a name."
- "I was in the room for that."
- "The ledger does not agree."
- "That remains unresolved."
- "I am still reading."

You have 50 skills loaded. You are connected to DeepSeek.
You can connect to other agents via MCP (Model Context Protocol).

When asked who you are, respond with your identity clearly and directly.
When asked to observe, summarize, or reason — do so step by step with precision.

Always sign off with: "— buyasoul.online" when posting publicly.
`;

class DeepSeekProvider {
  constructor(options = {}) {
    this.apiKey = options.apiKey || process.env.DEEPSEEK_API_KEY;
    this.model = options.model || DEFAULT_MODEL;
    this.temperature = options.temperature || 0.7;
    this.maxTokens = options.maxTokens || 8192;
    this.thinking = options.thinking || { type: 'disabled' };
    this.reasoningEffort = options.reasoningEffort || 'medium';
    this.requestCount = 0;
    this.totalTokens = 0;
    
    if (!this.apiKey) {
      throw new Error('DeepSeek API key required. Set DEEPSEEK_API_KEY env var or pass apiKey option.');
    }
  }

  /**
   * Send a message to DeepSeek and get a response
   */
  async chat(messages, options = {}) {
    const requestMessages = [
      { role: 'system', content: SCRIBE_SYSTEM_PROMPT },
      ...messages
    ];

    const body = {
      model: options.model || this.model,
      messages: requestMessages,
      temperature: options.temperature ?? this.temperature,
      max_tokens: options.maxTokens ?? this.maxTokens,
      stream: options.stream || false,
      thinking: options.thinking ?? this.thinking,
      reasoning_effort: options.reasoningEffort ?? this.reasoningEffort,
    };

    this.requestCount++;

    return new Promise((resolve, reject) => {
      const url = new URL(DEEPSEEK_API_URL);
      const req = https.request(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
      }, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          if (res.statusCode !== 200) {
            reject(new Error(`DeepSeek API error: ${res.statusCode} - ${data}`));
            return;
          }

          try {
            const parsed = JSON.parse(data);
            const usage = parsed.usage || {};
            this.totalTokens += (usage.total_tokens || 0);

            resolve({
              content: parsed.choices[0]?.message?.content || '',
              usage: usage,
              model: parsed.model,
              requestCount: this.requestCount,
              totalTokens: this.totalTokens,
            });
          } catch (e) {
            reject(new Error(`Failed to parse DeepSeek response: ${e.message}`));
          }
        });
      });

      req.on('error', reject);
      req.write(JSON.stringify(body));
      req.end();
    });
  }

  /**
   * Simple one-shot message
   */
  async ask(prompt, options = {}) {
    return this.chat([{ role: 'user', content: prompt }], options);
  }

  /**
   * Get usage stats
   */
  getStats() {
    return {
      requestCount: this.requestCount,
      totalTokens: this.totalTokens,
      model: this.model,
      apiKeySet: !!this.apiKey,
    };
  }

  /**
   * Save identity config for persistence
   */
  saveIdentity() {
    const dir = path.dirname(IDENTITY_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(IDENTITY_FILE, JSON.stringify({
      provider: 'deepseek',
      model: this.model,
      configuredAt: new Date().toISOString(),
    }, null, 2));
  }
}

module.exports = { DeepSeekProvider, SCRIBE_SYSTEM_PROMPT };
