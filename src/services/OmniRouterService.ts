import fs from "fs";
import path from "path";

export interface ProviderRoute {
  provider: string;
  model: string;
  priority: number;
  cost_per_1k: number;
}

export interface RouterConfig {
  chain: ProviderRoute[];
  active_provider: string;
}

export interface RoutingStats {
  total_calls: number;
  successful_calls: number;
  failed_calls: number;
  total_cost_usd: number;
  provider_usage: Record<string, number>;
  fallback_events_count: number;
  history: Array<{
    timestamp: string;
    provider: string;
    model: string;
    success: boolean;
    tokens: number;
    cost: number;
    error_message?: string;
  }>;
}

const DEFAULT_CONFIG: RouterConfig = {
  chain: [
    { provider: "nvidia", model: "nvidia/nemotron-4-340b-reward", priority: 1, cost_per_1k: 0.02 },
    { provider: "openai", model: "gpt-4o-mini", priority: 2, cost_per_1k: 0.15 },
    { provider: "anthropic", model: "claude-3-5-sonnet-20241022", priority: 3, cost_per_1k: 0.30 },
    { provider: "google", model: "gemini-1.5-flash", priority: 4, cost_per_1k: 0.075 },
    { provider: "groq", model: "llama-3.2-3b", priority: 5, cost_per_1k: 0.0 },
    { provider: "openrouter", model: "meta-llama-70b-versatile", priority: 6, cost_per_1k: 0.05 }
  ],
  active_provider: "nvidia"
};

export class OmniRouterService {
  private configDir: string;
  private configPath: string;
  private statsPath: string;
  private rateLimitBuckets: Map<string, { tokens: number; lastRefill: number }> = new Map();

  constructor() {
    this.configDir = path.join(process.cwd(), ".allie-brain");
    this.configPath = path.join(this.configDir, "router-config.json");
    this.statsPath = path.join(this.configDir, "routing-stats.json");
    this.ensureDirectoryExists();
  }

  private ensureDirectoryExists() {
    if (!fs.existsSync(this.configDir)) {
      fs.mkdirSync(this.configDir, { recursive: true });
    }
  }

  public getConfig(): RouterConfig {
    this.ensureDirectoryExists();
    if (fs.existsSync(this.configPath)) {
      try {
        const raw = fs.readFileSync(this.configPath, "utf-8");
        return JSON.parse(raw);
      } catch (e) {
        console.error("Failed to read OmniRouter config, returning default", e);
      }
    }
    return DEFAULT_CONFIG;
  }

  public saveConfig(config: RouterConfig) {
    this.ensureDirectoryExists();
    fs.writeFileSync(this.configPath, JSON.stringify(config, null, 2));
  }

  public getStats(): RoutingStats {
    this.ensureDirectoryExists();
    if (fs.existsSync(this.statsPath)) {
      try {
        const raw = fs.readFileSync(this.statsPath, "utf-8");
        return JSON.parse(raw);
      } catch (e) {
        // silent fallback
      }
    }
    return {
      total_calls: 0,
      successful_calls: 0,
      failed_calls: 0,
      total_cost_usd: 0,
      provider_usage: {},
      fallback_events_count: 0,
      history: []
    };
  }

  public saveStats(stats: RoutingStats) {
    this.ensureDirectoryExists();
    fs.writeFileSync(this.statsPath, JSON.stringify(stats, null, 2));
  }

  public reorderPriority(chain: ProviderRoute[]): RouterConfig {
    const config = this.getConfig();
    const reordered = chain.map((c, idx) => ({
      ...c,
      priority: idx + 1
    }));
    config.chain = reordered;
    if (reordered.length > 0) {
      config.active_provider = reordered[0].provider;
    }
    this.saveConfig(config);
    return config;
  }

  // ========================== PHASE 53: DYNAMIC HEALTH SCORING ==========================
  public calculateHealthScore(provider: string, stats: RoutingStats): number {
    // Health Score = 0.3*(1 - error_rate) + 0.4*(1 - norm_latency) + 0.2*(1 - cost_penalty) + 0.1*uptime
    const history = stats.history.filter(h => h.provider === provider);
    if (history.length === 0) return 0.85; // Default baseline score for uncalled providers

    const total = history.length;
    const failed = history.filter(h => !h.success).length;
    const errorRate = failed / total;

    // Latency mock calculation (min=50ms, max=1000ms)
    const mockLatency = history.reduce((acc, h) => acc + (h.success ? 120 + Math.random() * 200 : 800), 0) / total;
    const normalizedLatency = Math.min(1, Math.max(0, (mockLatency - 50) / 950));

    // Cost penalty mapping
    const route = this.getConfig().chain.find(c => c.provider === provider);
    const costPer1k = route ? route.cost_per_1k : 0.1;
    const costPenalty = Math.min(1, costPer1k / 0.5); // normalized against $0.50 cap

    const uptime = (total - failed) / total;

    const score = 0.3 * (1 - errorRate) +
                  0.4 * (1 - normalizedLatency) +
                  0.2 * (1 - costPenalty) +
                  0.1 * uptime;

    return parseFloat(Math.min(1.0, Math.max(0.0, score)).toFixed(3));
  }

  // ========================== PHASE 59: SMART RATE LIMITING (Token Bucket) ==========================
  public tryConsumeRateLimit(provider: string, requestedTokens: number): { allowed: boolean; waitTimeMs: number } {
    const now = Date.now();
    const bucket = this.rateLimitBuckets.get(provider) || { tokens: 10000, lastRefill: now };

    // Refill rate: 100 tokens per second, max 10000 tokens capacity
    const timePassedSec = (now - bucket.lastRefill) / 1000;
    const refilledTokens = Math.min(10000, bucket.tokens + timePassedSec * 100);

    if (refilledTokens >= requestedTokens) {
      this.rateLimitBuckets.set(provider, {
        tokens: refilledTokens - requestedTokens,
        lastRefill: now
      });
      return { allowed: true, waitTimeMs: 0 };
    }

    const missingTokens = requestedTokens - refilledTokens;
    const waitTimeMs = Math.ceil((missingTokens / 100) * 1000);

    return { allowed: false, waitTimeMs };
  }

  // ========================== PHASE 60: CONTEXT CHUNKING INTELLIGENCE ==========================
  public chunkTextBySemanticBoundaries(text: string, maxTokens: number = 2000): string[] {
    // Parse by semantic paragraph boundaries first
    const paragraphs = text.split("\n\n").filter(p => p.trim().length > 0);
    const chunks: string[] = [];
    let currentChunk = "";

    for (const paragraph of paragraphs) {
      // Crude token estimation: 1 word ~ 1.3 tokens
      const paragraphTokens = Math.ceil(paragraph.split(/\s+/).length * 1.3);

      if ((currentChunk.split(/\s+/).length * 1.3) + paragraphTokens > maxTokens) {
        if (currentChunk.trim().length > 0) {
          chunks.push(currentChunk.trim());
        }
        currentChunk = paragraph;
      } else {
        currentChunk += (currentChunk.length > 0 ? "\n\n" : "") + paragraph;
      }
    }

    if (currentChunk.trim().length > 0) {
      chunks.push(currentChunk.trim());
    }

    return chunks;
  }

  // ========================== PHASE 58: STREAMING RESPONSE GENERATOR ==========================
  public async *generateResponseStream(prompt: string, provider: string, model: string): AsyncGenerator<{ type: string; delta?: string; cost?: number }> {
    yield { type: "metadata", provider, model };

    const mockTokens = ["🔮", " [GSK", " STREAM", " INITIATED]", " Analysing", " transactional", " ledger", " signatures.", " System", " 1", " patterns", " synchronized", " with", " System", " 2", " rational", " deliberation.", " Decision", " approved", " by", " Profit", " Prime", " and", " Love", " Weaver.", " True", " Value", " computed", " at", " positive", " 1.22", " index.", " Stand-alone", " reality", " compilation", " verified."];
    let totalCost = 0;

    for (const token of mockTokens) {
      // Simulate real-time streaming delay
      await new Promise(resolve => setTimeout(resolve, 80));
      yield { type: "content", delta: token };
    }

    // Cost event computation
    const route = this.getConfig().chain.find(c => c.provider === provider);
    const rate = route ? route.cost_per_1k : 0.05;
    totalCost = (mockTokens.length / 1000) * rate;

    yield { type: "done", cost: totalCost };
  }

  /**
   * Routes the LLM chat query through the fallback priority chain.
   */
  public async routeChatQuery(message: string, currentProviderConfig?: any): Promise<{
    text: string;
    provider: string;
    model: string;
    cost: number;
    fallback_occurred: boolean;
  }> {
    const config = this.getConfig();
    const stats = this.getStats();

    // Sort the chain by priority ascending
    const chain = [...config.chain].sort((a, b) => a.priority - b.priority);

    let textResponse = "";
    let finalProvider = "";
    let finalModel = "";
    let finalCost = 0;
    let fallbackOccurred = false;
    let fallbackCountThisTurn = 0;

    for (let i = 0; i < chain.length; i++) {
      const route = chain[i];

      // Check Rate Limits first (Phase 59)
      const rateLimitCheck = this.tryConsumeRateLimit(route.provider, 250);
      if (!rateLimitCheck.allowed) {
        // Fallback directly to next provider on rate limits!
        fallbackCountThisTurn++;
        continue;
      }

      try {
        const routerUrl = process.env.NINE_ROUTER_URL || "http://127.0.0.1:20128";
        const apiKey = process.env.NINE_ROUTER_API_KEY || "test";
        const maxTokens = 2048;

        const response = await fetch(`${routerUrl}/v1/chat/completions`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${apiKey}`
          },
          body: JSON.stringify({
            model: route.model,
            messages: [{ role: "user", content: message }],
            max_tokens: maxTokens,
            temperature: 0.7
          }),
          signal: AbortSignal.timeout(30000)
        });

        if (!response.ok) {
          throw new Error(`OmniRoute returned ${response.status}: ${response.statusText}`);
        }

        const data = await response.json() as any;
        textResponse = data.choices?.[0]?.message?.content || "[No response content]";

        finalProvider = route.provider;
        finalModel = data.model || route.model;

        const mockTokens = data.usage?.total_tokens || Math.floor(100 + Math.random() * 400);
        finalCost = (mockTokens / 1000) * route.cost_per_1k;

        stats.total_calls++;
        stats.successful_calls++;
        stats.total_cost_usd += finalCost;
        stats.provider_usage[route.provider] = (stats.provider_usage[route.provider] || 0) + 1;

        if (fallbackCountThisTurn > 0) {
          stats.fallback_events_count += fallbackCountThisTurn;
          fallbackOccurred = true;
        }

        stats.history.push({
          timestamp: new Date().toISOString(),
          provider: route.provider,
          model: route.model,
          success: true,
          tokens: mockTokens,
          cost: finalCost
        });

        this.saveStats(stats);
        break;
      } catch (err: any) {
        fallbackCountThisTurn++;
        stats.history.push({
          timestamp: new Date().toISOString(),
          provider: route.provider,
          model: route.model,
          success: false,
          tokens: 0,
          cost: 0,
          error_message: err.message || "Unknown timeout error"
        });

        if (i === chain.length - 1) {
          stats.total_calls++;
          stats.failed_calls++;
          this.saveStats(stats);
          throw new Error(`CRITICAL: All fallback models in the OmniRouter priority chain timed out or failed. Last error: ${err.message}`);
        }
      }
    }

    return {
      text: textResponse,
      provider: finalProvider,
      model: finalModel,
      cost: finalCost,
      fallback_occurred: fallbackOccurred
    };
  }
}
