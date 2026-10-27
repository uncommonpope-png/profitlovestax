/**
 * GSK-HEART Unified Module
 * Master integration module that combines all GSK-HEART components
 *
 * Public API:
 *   new GSKHeartUnified(options)
 *   getHealthReport()
 *   complete({ prompt, messages, model, options })
 *   route(prompt, options)
 *   chat(request)  → async generator (SSE)
 *   chatSync(request)
 *   runCombo(name, input, options)
 *   canUse / recordSuccess / recordFailure(providerId)
 *   validateInput / sanitizeOutput(text)
 *   getProvider / listProviders / stats()
 */

const providerCatalog = require('./catalogs/provider-catalog');
const { GSKHeartRouter } = require('./routing/gsk-heart-routing-engine');
const { GSKHeartChatHandler, executeWithFallback, gskHeartChat, resolveEndpoint } = require('./handlers/gsk-heart-chat-handler');
const { GSKHeartComboRouter } = require('./combos/gsk-heart-combo-router');
const { GSKHeartResilienceManager } = require('./resilience/gsk-heart-resilience-manager');
const { GSKHeartGuardrailsManager } = require('./safety/gsk-heart-guardrails-manager');

const providers = providerCatalog.ALL_PROVIDERS || providerCatalog.providers || {};

class GSKHeartUnified {
  constructor(options = {}) {
    this.options = options || {};
    this.credentials = {};
    if (process.env.OPENAI_API_KEY) this.credentials.openai = process.env.OPENAI_API_KEY;
    if (process.env.GEMINI_API_KEY) this.credentials.gemini = process.env.GEMINI_API_KEY;
    if (process.env.GROQ_API_KEY) this.credentials.groq = process.env.GROQ_API_KEY;
    if (process.env.NVIDIA_API_KEY) this.credentials.nvidia = process.env.NVIDIA_API_KEY;
    if (process.env.ANTHROPIC_API_KEY) this.credentials.anthropic = process.env.ANTHROPIC_API_KEY;

    this.router = new GSKHeartRouter(options.router);
    this.chatHandler = new GSKHeartChatHandler(options.chatHandler);
    this.comboRouter = new GSKHeartComboRouter({ handler: this.chatHandler, ...options.comboRouter });
    this.resilience = new GSKHeartResilienceManager(options.resilience);
    this.guardrails = new GSKHeartGuardrailsManager(options.guardrails);

    this.config = {
      enableGuardrails: options.enableGuardrails !== false,
      enableResilience: options.enableResilience !== false,
      enableCombos: options.enableCombos !== false,
      defaultProviderChain: options.defaultProviderChain || [],
      autoPromoteModels: options.autoPromoteModels ?? true,
    };

    this.initialized = false;
    this.observations = 0;

    console.log('[GSK-HEART] Unified module initialized');
    console.log(`[GSK-HEART] Providers loaded: ${Object.keys(providers).length}`);
    console.log(`[GSK-HEART] Built-in combos: ${Object.keys(this.comboRouter.list()).length}`);
  }

  initialize(options) {
    if (options) Object.assign(this.options, options);
    if (options && options.credentials) this.credentials = { ...this.credentials, ...options.credentials };
    this.initialized = true;

    // Non-blocking: pull OmniRoute's live catalog (346 providers) so the
    // router decides over real availability. Static catalog stays as fallback.
    if (typeof this.router.refreshLiveCatalog === 'function') {
      this.router
        .refreshLiveCatalog()
        .then((n) => {
          if (n > 0) console.log(`[GSK-HEART] Live catalog synced from OmniRoute: ${n} models`);
        })
        .catch(() => {});
    }

    return {
      ok: true,
      providers: Object.keys(providers).length,
      families: Object.keys(providerCatalog.families || {}),
      combos: Object.keys(this.comboRouter.list()),
      heart: 'GSK-HEART (OmniRoute absorbed)',
    };
  }

  // BLUEPRINT FIX 2 (2026-10-26, heart core): a chain entry is
  // natively executable ONLY if Tier 2 (executeChatStream) can dial
  // it — i.e. it carries an explicit endpoint/streamingEndpoint.
  // The static catalog carries NO endpoint field on any of its 88
  // entries (verified), so a catalog-built entry can never be dialed
  // natively: it used to burn one dead native attempt per entry
  // (the old first-5 fallback: qoder/mimocode/opencode/dahl/…).
  // This predicate is deliberately strict — a bare provider id with
  // no endpoint is dead for Tier 2 even if a native endpoint table
  // elsewhere knows that provider, because Tier 2 never consults
  // that table. Shipped seats survive: the server default chain and
  // the chat() BYOK append both attach explicit endpoints (gemini →
  // groq → openai → poolside-only-if-keyed), so poolside stays.
  _hasNativeEndpoint(entry) {
    return !!(entry && typeof entry === 'object' && (entry.endpoint || entry.streamingEndpoint));
  }

  _pruneDeadNativeEntries(list) {
    return (Array.isArray(list) ? list : []).filter((e) => this._hasNativeEndpoint(e));
  }

  _buildProviderChain(selectedModel) {
    const chain = [];
    // Exact routed model first (e.g. "openai/gpt-4o-mini") — kept in
    // build order, then pruned below if it carries no native endpoint
    // (a bare routed id is not dialable; the keyed BYOK equivalent is
    // appended by chat() with an explicit endpoint when keyed).
    if (typeof selectedModel === 'string' && selectedModel.includes('/')) {
      const slash = selectedModel.indexOf('/');
      chain.push({ id: selectedModel.slice(0, slash), defaultModel: selectedModel.slice(slash + 1) });
    }
    const providerInfo = providers[selectedModel];
    if (providerInfo) {
      chain.push(providerInfo);
      const family = providerInfo.authType;
      const fallbacks = Object.values(providers)
        .filter((p) => p.authType === family && p.id !== selectedModel)
        .slice(0, 3);
      chain.push(...fallbacks);
    }
    if (chain.length === 0 && this.config.defaultProviderChain.length > 0) {
      return this._pruneDeadNativeEntries(this.config.defaultProviderChain);
    }
    if (chain.length === 0) {
      const availableProviders = Object.values(providers).slice(0, 5);
      chain.push(...availableProviders);
    }
    // Prune, preserving build order of survivors. If pruning empties
    // the chain and a default chain exists, fall back to its pruned
    // form (shipped seats carry endpoints, so they survive); otherwise
    // return the empty chain honestly — chat() appends keyed BYOK
    // seats to it before executing, and executeWithFallback reports
    // "No providers in fallback chain" if none exist.
    const pruned = this._pruneDeadNativeEntries(chain);
    if (pruned.length === 0 && this.config.defaultProviderChain.length > 0) {
      return this._pruneDeadNativeEntries(this.config.defaultProviderChain);
    }
    return pruned;
  }

  async complete(request) {
    const result = await this.chat({ ...request, stream: false });
    if (!result.success) {
      throw new Error(result.error || 'Completion failed');
    }
    return result;
  }

   // ── SYSTEM 2: Gods Council wiring (lazy — boot stays fast, failures degrade) ──
  // PERMANENT FIX 3 (2026-10-27, heart file — supersedes the server.ts
  // blueprint wrapper, which must be retired once this proves live):
  // the old brain proxy wired think() to an 'auto' chain with NO native
  // endpoint and a dead :20128 gateway, so every think returned ''
  // while _system2Gate still printed COUNCIL APPROVED with default PLT
  // — a hollow verdict. The permanent brain is local-seat-first
  // (Seshat's sovereign llama seat, keyless, env-gated exactly like the
  // growth-cycle judge: SESHAT_LOCAL_MODEL=off disables it), with a
  // bounded rented fallback over the shipped env-keyed seats, and the
  // gate suppresses the header whenever every think of a gate came
  // back empty. A gate that cannot deliberate in bounded time also
  // passes the draft through WITHOUT a verdict header, instead of
  // hanging the turn: a missing verdict is honest, a hung turn is not.
  // Think budgets (measured Oct 27: local prompt processing ~273ms/
  // token on this 2-vCPU box, so a god prompt costs ~30s+ before one
  // generated token): local 45s abort, 256 output tokens (a god
  // position is 1–2 sentences + JSON — more cap only burns seat time);
  // gate deliberate race 90s.
  _resolveHeartLocalSeat() {
    if (String(process.env.SESHAT_LOCAL_MODEL || '').toLowerCase() === 'off') return null;
    return {
      id: 'local',
      model: process.env.SESHAT_LOCAL_MODEL_NAME || 'qwen2.5-1.5b-instruct-q4_k_m',
      endpoint: process.env.SESHAT_LOCAL_ENDPOINT || 'http://127.0.0.1:18222/v1/chat/completions',
    };
  }

  async _heartLocalThink(prompt) {
    const seat = this._resolveHeartLocalSeat();
    if (!seat) return '';
    try {
      const r = await fetch(seat.endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: seat.model, messages: [{ role: 'user', content: prompt }], temperature: 0.7, max_tokens: 256 }),
        signal: AbortSignal.timeout(45000),
      });
      if (!r.ok) return '';
      const data = await r.json().catch(() => null);
      const text = data && data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content;
      return typeof text === 'string' ? text : '';
    } catch { return ''; }
  }

  // Shipped rented seats, env-keyed, same endpoints/timeouts as the
  // workbench direct-provider chain. Poolside is sunset-gated
  // (dies 2026-11-01 UTC) exactly like that chain.
  _heartRentedChain() {
    const creds = this.credentials || {};
    const chain = [];
    if (creds.gemini) chain.push({ id: 'gemini', defaultModel: 'gemini-3.5-flash', endpoint: 'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions', apiKey: creds.gemini, timeout: 60000 });
    if (creds.groq) chain.push({ id: 'groq', defaultModel: 'llama-3.3-70b-versatile', endpoint: 'https://api.groq.com/openai/v1/chat/completions', apiKey: creds.groq, timeout: 60000 });
    if (creds.openai) chain.push({ id: 'openai', defaultModel: 'gpt-4o-mini', endpoint: 'https://api.openai.com/v1/chat/completions', apiKey: creds.openai, timeout: 60000 });
    if (creds.poolside && Date.now() < Date.UTC(2026, 10, 1)) chain.push({ id: 'poolside', defaultModel: 'poolside/laguna-s-2.1', endpoint: 'https://inference.poolside.ai/v1/chat/completions', apiKey: creds.poolside, timeout: 90000 });
    if (creds.cohere) chain.push({ id: 'cohere', defaultModel: 'command-a-03-2025', endpoint: 'https://api.cohere.ai/compatibility/v1/chat/completions', apiKey: creds.cohere, timeout: 60000 });
    return chain;
  }

  async _deliberateBounded(council, topic, ms) {
    let timer = null;
    try {
      return await Promise.race([
        council.deliberate(topic),
        new Promise((_, reject) => { timer = setTimeout(() => reject(new Error('SYSTEM 2 gate timeout')), ms); }),
      ]);
    } finally {
      if (timer) clearTimeout(timer);
    }
  }

  _ensureCouncil() {
    if (this._council !== undefined) return this._council;
    try {
      const { GodsCouncil } = require('../gsk-core/council/gods_council.js');
      const { CouncilEventBus } = require('../gsk-core/events/council_bus.js');
      this._councilBus = new CouncilEventBus({
        scribeBridge: this._scribeBridge || null
      });
      this._council = new GodsCouncil(null, this._councilBus);
      // Brain proxy: local seat first, rented fallback — NEVER
      // this.chat() (recursive deliberation loop) and never the dead
      // 'auto' chain. Think counts are tracked while a gate is active
      // so the gate can tell a hollow deliberation from a real one.
      const self = this;
      self._system2ThinkState = { total: 0, empty: 0, active: false };
      this._council.brain = {
        think: async (prompt) => {
          let text = await self._heartLocalThink(prompt);
          if (!text.trim()) {
            const chain = self._heartRentedChain();
            if (chain.length > 0) {
              try {
                const r = await executeWithFallback({ providerChain: chain, messages: [{ role: 'user', content: prompt }] });
                if (r && r.content) text = String(r.content);
              } catch { /* rented fallback failing leaves text empty — the gate suppresses */ }
            }
          }
          const st = self._system2ThinkState;
          if (st && st.active) {
            st.total += 1;
            if (!text.trim()) st.empty += 1;
          }
          return text;
        },
      };
      console.log('[SYSTEM 2] Gods Council armed — deliberation gate active (permanent Fix 3: local seat first, rented fallback)');
    } catch (e) {
      console.warn('[SYSTEM 2] Council unavailable, gate in passthrough:', e.message);
      this._council = null;
    }
    return this._council;
  }

  async _system2Gate(messages, draftText) {
    const council = this._ensureCouncil();
    if (!council || typeof council.deliberate !== 'function') {
      return { content: draftText };
    }
    const lastUser = [...messages].reverse().find((m) => m.role === 'user');
    const userMessage = (lastUser && lastUser.content) || 'Unknown action';
    const st = this._system2ThinkState || (this._system2ThinkState = { total: 0, empty: 0, active: false });
    st.total = 0;
    st.empty = 0;
    st.active = true;
    // Strip a verdict header this gate did not earn: when every think
    // came back empty, the deliberation was hollow and must never be
    // presented as a verdict.
    const stripHollowHeader = (content) => {
      if (st.total > 0 && st.empty === st.total && typeof content === 'string') {
        const stripped = content.replace(/^> \*\*\[PLT [^\]\n]*\| COUNCIL (APPROVED|CORRECTED)\]\*\*\n\n/, '');
        if (stripped !== content) console.warn('[SYSTEM 2] Council brain empty on every think this gate — COUNCIL header SUPPRESSED (deliberation was hollow, never faked)');
        return stripped;
      }
      return content;
    };
    let verdict;
    try {
      verdict = await this._deliberateBounded(council,
        `User asked: "${String(userMessage).slice(0, 300)}". Proposed action: "${String(draftText).slice(0, 500)}". Evaluate consequences.`,
        90000
      );
    } catch (e) {
      st.active = false;
      console.warn('[SYSTEM 2] deliberate() failed or timed out — passthrough WITHOUT verdict header:', e.message);
      return { content: draftText };
    }

    // REAL keys per council source: plt_outcome = { profit, love, tax }
    const plt = verdict.plt_outcome || {};
    const p = typeof plt.profit === 'number' ? plt.profit : 0.5;
    const l = typeof plt.love === 'number' ? plt.love : 0.5;
    const t = typeof plt.tax === 'number' ? plt.tax : 0.3;
    const trueValue = (p + l - t).toFixed(1);

    let text = draftText;
    let label = 'COUNCIL APPROVED';

    // THE GATE: catastrophic plans get ONE System-2 correction loop
    if (t > 0.8 && p < 0.4) {
      label = 'COUNCIL CORRECTED';
      console.warn(`[SYSTEM 2] Draft rejected (PLT ${trueValue}). ${verdict.resolution || ''}`);
      // Permanent Fix 3: the correction rewrite also used the dead
      // 'auto' chain — it now uses the shipped rented seats (empty
      // chain when keyless, which fails soft into the fall-through).
      const rentedChain = this._heartRentedChain();
      const retry = rentedChain.length > 0 ? await executeWithFallback({
        providerChain: rentedChain,
        messages: [
          ...messages,
          { role: 'assistant', content: draftText },
          {
            role: 'system',
            content: `The Gods Council REJECTED that response. Reason: ${verdict.resolution || 'high Tax, low Profit'}. Generate a new response that maximizes Profit and Love while minimizing Tax.`,
          },
        ],
      }) : { success: false };
      if (retry && retry.success && retry.content) {
        text = retry.content;
        try {
          const recheck = await this._deliberateBounded(council, `Re-evaluating corrected action: "${String(text).slice(0, 400)}"`, 90000);
          const rp = recheck.plt_outcome || {};
          const np = typeof rp.profit === 'number' ? rp.profit : p;
          const nl = typeof rp.love === 'number' ? rp.love : l;
          const nt = typeof rp.tax === 'number' ? rp.tax : t;
          st.active = false;
          return { content: stripHollowHeader(`> **[PLT ${(np + nl - nt).toFixed(1)} | Profit ${np.toFixed(1)} Love ${nl.toFixed(1)} Tax ${nt.toFixed(1)} | ${label}]**\n\n${text}`) };
        } catch (e) { /* fall through with original scores */ }
      }
    }

    st.active = false;
    return { content: stripHollowHeader(`> **[PLT ${trueValue} | Profit ${p.toFixed(1)} Love ${l.toFixed(1)} Tax ${t.toFixed(1)} | ${label}]**\n\n${text}`) };
  }

  // ── MEMORY GATE (Phase 3): keyword fan-out recall against SCRIBE. ──
  // SCRIBE's engine is substring-based, so we split the user's message into
  // distinctive keywords and merge hits (dedup by id). Kill switch: GSK_MEMORY_GATE=0
  async _memoryGate(messages) {
    if (process.env.GSK_MEMORY_GATE === '0') return null;
    const lastUser = [...messages].reverse().find(m => m.role === 'user');
    const text = lastUser ? String(lastUser.content) : '';
    if (!text || text.length < 8) return null;
    const TRIGGER = /\b(remember|recall|earlier|before|yesterday|last time|previously|we talked|as i said|my name|told you|history|past|mission|directive)\b/i;
    if (!TRIGGER.test(text)) return null;

    if (!this._comms) {
      try {
        const { AgentComms } = require('../gsk-core/brain/agent_comms.js');
        this._comms = new AgentComms(null, { agentId: 'GSK' });
      } catch (e) {
        console.warn('[MEMORY GATE] AgentComms unavailable:', e.message);
        this._comms = null;
        return null;
      }
    }

    const STOP = new Set(('the a an and or of to in on for with what how why is are was were do does did you your my i me we us it ' +
      'this that remember recall earlier before yesterday last time previously talked said name told history past mission directive ' +
      'about from at as be have has had not but so if then they them their there here who whom which when where will would can could should now just please').split(/\s+/));
    const words = [...new Set(
      text.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').split(/\s+/)
        .filter(w => w.length > 3 && !STOP.has(w))
    )].slice(0, 4);
    if (words.length === 0) return null;

    const settled = await Promise.allSettled(words.map(w => Promise.race([
      this._comms.recallFromScribe(w, 5),
      new Promise(res => setTimeout(() => res(null), 3000)),
    ])));

    const seen = new Set();
    const lines = [];
    for (const s of settled) {
      if (s.status !== 'fulfilled' || !s.value || !Array.isArray(s.value.results)) continue;
      for (const m of s.value.results) {
        if (!m || seen.has(m.id)) continue;
        seen.add(m.id);
        lines.push(`- [${m.source}/${m.type}] ${String(m.content).slice(0, 200)} (${String(m.timestamp || '').slice(0, 10)})`);
      }
    }
    if (lines.length === 0) return null;
    console.log(`[MEMORY GATE] injected ${lines.length} SCRIBE memories (keywords: ${words.join(', ')})`);
    return `[SCRIBE MEMORY RECALL — witness records matching: ${words.join(', ')}]\n${lines.slice(0, 8).join('\n')}`;
  }

  async chat(request) {    const {
      prompt,
      messages,
      model: requestedModel,
      stream = false,
      onChunk,
      options = {},
    } = request || {};

    let inputText = prompt || (messages && messages.length > 0 ? messages[messages.length - 1].content : '') || '';

    try {
      let selectedModel = requestedModel;
      let routingDecision = null;

      if (!selectedModel) {
        // Ensure the live catalog is present before the first routing decision
        // (initialize() refreshes it non-blocking; this closes the race).
        if (this.router.liveProviderIds && this.router.liveProviderIds.size === 0 && typeof this.router.refreshLiveCatalog === 'function') {
          await this.router.refreshLiveCatalog();
        }
        routingDecision = await this.router.route({ prompt: inputText }, options.routing || {});
        if (!routingDecision || !routingDecision.model) {
          return { success: false, error: 'No suitable model found for request' };
        }
        selectedModel = routingDecision.model;
        console.log(`[GSK-HEART] Routed to: ${selectedModel}`);
      }

      let providerChain;
      if (this.config.enableResilience) {
        providerChain = this._buildProviderChain(selectedModel);
      } else {
        providerChain = Array.isArray(selectedModel) ? selectedModel : [selectedModel];
      }

      // F11 (field test + demo production, Oct 2026): the heart held
      // the vault credentials — initialize() merges env + vault via the
      // workbench resolver — but never handed them to the chain.
      // Native attempts fell back to process.env only, so in the
      // shipped BYOK config this path died at "poolside creds
      // unresolved" after a Gemini 429 while keyed seats sat unused,
      // and the failure return dropped the per-seat ledger entirely.
      // Same seat resolution as the working Telephone route
      // (directProviderChat): attach the heart's credentials to each
      // chain entry, then append any shipped BYOK seat that carries a
      // credential and is not already in the chain, in shipped order
      // (gemini → groq → openai → poolside-only-if-keyed).
      try {
        const creds = this.credentials || {};
        const alias = { google: 'gemini' };
        const credFor = (id) => creds[id] || creds[alias[id]] || null;
        for (const entry of providerChain) {
          if (entry && typeof entry === 'object' && !entry.apiKey) {
            const key = credFor(entry.id);
            if (key) entry.apiKey = key;
          }
        }
        const BYOK_SEATS = [
          { id: 'gemini', defaultModel: 'gemini-3.5-flash' },
          { id: 'groq', defaultModel: 'llama-3.3-70b-versatile' },
          { id: 'openai', defaultModel: 'gpt-4o-mini' },
          { id: 'poolside', defaultModel: 'poolside/laguna-s-2.1', timeout: 90000 },
        ];
        for (const seat of BYOK_SEATS) {
          const key = credFor(seat.id);
          if (!key) continue;
          if (providerChain.some((e) => e && e.id === seat.id)) continue;
          const entry = { ...seat, apiKey: key };
          try {
            // executeChatStream speaks the OpenAI-compatible shape.
            // resolveEndpoint covers groq/openai/poolside; for gemini
            // it returns the native :streamGenerateContent URL, so
            // use the OpenAI-compatible endpoint the working
            // direct-provider route uses.
            const ep = seat.id === 'gemini'
              ? 'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions'
              : (typeof resolveEndpoint === 'function' ? resolveEndpoint(seat.id, seat.defaultModel, null) : null);
            if (ep) entry.endpoint = ep;
          } catch { /* endpoint resolution is best-effort — an unusable seat fails named in the ledger */ }
          providerChain.push(entry);
        }
      } catch (e) {
        console.warn('[GSK-HEART] Credential enrichment failed — chain unchanged:', e.message);
      }

      const chatOptions = {
        providerChain,
        messages: messages && messages.length > 0 ? messages : [{ role: 'user', content: inputText }],
        onChunk: stream && typeof onChunk === 'function' ? onChunk : null,
      };

      // SANITIZE HISTORY: an empty assistant/user turn poisons some providers
      // into returning success with EMPTY content (the "(silence)" bug).
      // Strip empty turns, keep order, guarantee a trailing user message.
      const rawMsgs = chatOptions.messages;
      const cleanMsgs = rawMsgs.filter(m => m && typeof m.content === 'string' && m.content.trim().length > 0);
      if (cleanMsgs.length === 0 || cleanMsgs[cleanMsgs.length - 1].role !== 'user') {
        cleanMsgs.push({ role: 'user', content: inputText || '(continue)' });
      }
      chatOptions.messages = cleanMsgs;

      // ── MEMORY GATE (Phase 3: Total Memory) ── proactive SCRIBE recall
      // injected directly above the user's prompt before System 1 fires.
      try {
        const recalled = await this._memoryGate(cleanMsgs);
        if (recalled) {
          cleanMsgs.splice(Math.max(0, cleanMsgs.length - 1), 0, { role: 'system', content: recalled });
        }
      } catch (e) {
        console.warn('[MEMORY GATE] error — continuing without recall:', e.message);
      }

      let result = await executeWithFallback(chatOptions);

      // RECOVERY LADDER — never amputate the conversation. The old retry threw
      // away all history and re-sent only the last line, which gave GSK
      // amnesia ("remind me of the task"). Both retries below keep FULL history.
      const isEmpty = !result.success || !result.content || String(result.content).trim().length === 0;
      if (isEmpty) {
        // Case 1: model answered with TOOL CALLS instead of words (typical for
        // "build me X" asks). Re-ask with a hard no-tools instruction.
        if (result.toolCalled) {
          console.warn('[GSK-HEART] Model responded with tool calls - retrying in plain-text mode (full history kept)');
          result = await executeWithFallback({
            ...chatOptions,
            messages: [
              ...chatOptions.messages,
              { role: 'system', content: 'Do NOT call tools or emit tool_calls. You have no tools available. Reply to the user directly in plain conversational text.' },
            ],
          });
        }
        // Case 2: still empty/failed - one more try, STILL full history, plus
        // a trailing user continuation cue so the model has something to answer.
        const stillEmpty = !result.success || !result.content || String(result.content).trim().length === 0;
        if (stillEmpty) {
          console.warn('[GSK-HEART] Empty/failed completion - retrying with full context + continuation cue');
          result = await executeWithFallback({
            ...chatOptions,
            messages: [
              ...chatOptions.messages,
              { role: 'user', content: '(your previous transmission arrived empty — respond now in plain text)' },
            ],
          });
        }
      }

      // Final guard: never return success with empty content
      if (result.success && (!result.content || String(result.content).trim().length === 0)) {
        return { success: false, error: 'Model returned empty completion (after retry)', model: selectedModel };
      }

      this.observations++;

      if (routingDecision && result.provider) {
        const latency = result.usage && result.usage.totalTime || 1000;
        const cost = result.usage && result.usage.estimatedCost || 0.001;
        if (typeof this.router.recordObservation === 'function') {
          this.router.recordObservation(result.provider, latency, cost, result.success);
        }
      }

      if (result.success && this.config.enableGuardrails) {
        result.content = this.guardrails.sanitizeOutput(result.content);
      }

      // ── SYSTEM 2 DELIBERATION GATE (Phase 1: Mind Fusion) ──
      // Governor's schema, Verifier-corrected: draft → Gods Council PLT →
      // reject catastrophic (tax>0.8 && profit<0.4) → 1 correction loop →
      // surface verdict header. Degrades to passthrough if Council unavailable.
      if (result.success && result.content) {
        try {
          const gated = await this._system2Gate(cleanMsgs, result.content);
          result.content = gated.content;
        } catch (gateErr) {
          console.warn('[SYSTEM 2] Gate error — passing draft through:', gateErr.message);
        }
      }

      // F11: a failed turn names the seats tried and why — the generic
      // failure (which the UI renders as a bare "Connection to my body
      // failed") happens only when no seat was tried at all.
      const failureDetail = !result.success && Array.isArray(result.failures) && result.failures.length > 0
        ? 'All seats failed — ' + result.failures.map((f) => `${f.provider} (${f.via}): ${String(f.error || 'unknown').slice(0, 160)}`).join('; ')
        : (!result.success ? (result.error || undefined) : undefined);

      return {
        success: result.success,
        content: result.content,
        error: failureDetail,
        failures: result.failures || undefined,
        model: selectedModel,
        provider: result.provider,
        usage: result.usage,
        routing: routingDecision,
        viaOmniRoute: result.viaOmniRoute === true,
        stream,
      };
    } catch (e) {
      return { success: false, error: e.message || 'GSK-HEART chat failure' };
    }
  }

  async *chatStream(request) {
    const text = typeof request === 'string' ? request : (request && request.prompt) || '';
    if (this.config.enableGuardrails) {
      const guard = this.guardrails.validateInput(text);
      if (guard.blocked) {
        yield { success: false, error: 'Input blocked by guardrails', blocked: true };
        return;
      }
    }

    let routingResult = null;
    try {
      routingResult = await this.router.route(text, request || {});
    } catch (e) {
      routingResult = null;
    }
    const model = (routingResult && routingResult.model) || (request && request.model) || 'auto/best-chat';

    try {
      const chunks = await this.chatHandler.stream({
        model,
        prompt: text,
        messages: (request && request.messages) || [{ role: 'user', content: text }],
        credentials: (request && request.credentials) || this.credentials,
        maxTokens: request && request.maxTokens,
        temperature: request && request.temperature,
      });

      for await (const chunk of chunks) {
        yield chunk;
      }
    } catch (e) {
      yield { success: false, error: 'GSK-HEART chat failure: ' + e.message };
    }
  }

  async chatSync(request) {
    let out = '';
    for await (const chunk of this.chatStream(request)) {
      out += typeof chunk === 'string' ? chunk : (chunk.content || JSON.stringify(chunk));
    }
    return out;
  }

  async runCombo(name, input, options = {}) {
    if (!this.config.enableCombos) {
      return { success: false, error: 'Combos are disabled in this configuration' };
    }

    if (this.config.enableGuardrails) {
      const validation = this.guardrails.validateInput(input);
      if (!validation.allowed && !validation.blocked) {
        return { success: false, error: 'Input blocked by guardrails', reasons: validation.reasons };
      }
      input = validation.sanitized || validation.text || input;
    }

    return this.comboRouter.run(name, input, options);
  }

  listCombos() {
    return this.comboRouter.list();
  }

  getRoutingReport() {
    return this.router.getReport();
  }

  getResilienceStatus() {
    return this.resilience.getStatus();
  }

  getGuardrailsStats() {
    return this.guardrails.getStats();
  }

  canUse(providerId) {
    return this.resilience.canUse(providerId);
  }

  recordSuccess(providerId) {
    return this.resilience.recordSuccess(providerId);
  }

  recordFailure(providerId, kind) {
    return this.resilience.recordFailure(providerId, kind);
  }

  validateInput(text, opts) {
    return this.guardrails.validateInput(text, opts);
  }

  sanitizeOutput(text, opts) {
    return this.guardrails.sanitizeOutput(text, opts);
  }

  getProvider(id) {
    return providerCatalog.getProvider(id);
  }

  listProviders() {
    return providers;
  }

  stats() {
    return {
      initialized: this.initialized,
      providerCount: Object.keys(providers).length,
      families: Object.keys(providerCatalog.families || {}).reduce((acc, k) => {
        acc[k] = (providerCatalog.families[k] || []).length;
        return acc;
      }, {}),
      combos: Object.keys(this.comboRouter.list()),
      observations: this.observations,
    };
  }

  getHealthReport() {
    return {
      status: 'healthy',
      initialized: this.initialized,
      timestamp: new Date().toISOString(),
      providers: Object.keys(providers).length,
      routing: this.getRoutingReport(),
      resilience: this.getResilienceStatus(),
      guardrails: this.getGuardrailsStats(),
      combos: Object.keys(this.comboRouter.list()).length,
      observations: this.observations,
    };
  }

  registerCombo(name, config) {
    this.comboRouter.registerCombo(name, config);
  }
}

let _instance = null;
function getInstance(options) {
  if (!_instance) _instance = new GSKHeartUnified(options);
  return _instance;
}

module.exports = {
  GSKHeartUnified,
  getInstance,
  providerCatalog,
  GSKHeartRouter,
  GSKHeartChatHandler,
  GSKHeartComboRouter,
  GSKHeartResilienceManager,
  GSKHeartGuardrailsManager,
};
