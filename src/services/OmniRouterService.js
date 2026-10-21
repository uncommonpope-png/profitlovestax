import fs from "fs";
import path from "path";
const DEFAULT_CONFIG = {
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
    configDir;
    configPath;
    statsPath;
    constructor() {
        // Storing config & stats inside .allie-brain/ as requested
        this.configDir = path.join(process.cwd(), ".allie-brain");
        this.configPath = path.join(this.configDir, "router-config.json");
        this.statsPath = path.join(this.configDir, "routing-stats.json");
        this.ensureDirectoryExists();
    }
    ensureDirectoryExists() {
        if (!fs.existsSync(this.configDir)) {
            fs.mkdirSync(this.configDir, { recursive: true });
        }
    }
    getConfig() {
        this.ensureDirectoryExists();
        if (fs.existsSync(this.configPath)) {
            try {
                const raw = fs.readFileSync(this.configPath, "utf-8");
                return JSON.parse(raw);
            }
            catch (e) {
                console.error("Failed to read OmniRouter config, returning default", e);
            }
        }
        return DEFAULT_CONFIG;
    }
    saveConfig(config) {
        this.ensureDirectoryExists();
        fs.writeFileSync(this.configPath, JSON.stringify(config, null, 2));
    }
    getStats() {
        this.ensureDirectoryExists();
        if (fs.existsSync(this.statsPath)) {
            try {
                const raw = fs.readFileSync(this.statsPath, "utf-8");
                return JSON.parse(raw);
            }
            catch (e) {
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
    saveStats(stats) {
        this.ensureDirectoryExists();
        fs.writeFileSync(this.statsPath, JSON.stringify(stats, null, 2));
    }
    reorderPriority(chain) {
        const config = this.getConfig();
        // Re-assign priorities based on order of array items
        const reordered = chain.map((c, idx) => ({
            ...c,
            priority: idx + 1
        }));
        config.chain = reordered;
        // Set the first item as the active provider
        if (reordered.length > 0) {
            config.active_provider = reordered[0].provider;
        }
        this.saveConfig(config);
        return config;
    }
    /**
     * Routes the LLM chat query through the fallback priority chain.
     */
    async routeChatQuery(message, currentProviderConfig) {
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
            const isPrimary = i === 0;
            try {
                // Simulate real response generation or API health test
                // If provider starts with 'nvidia', simulate potential high-load fails
                if (route.provider === "nvidia" && Math.random() < 0.25) {
                    throw new Error("Nvidia GPU node over capacity - 503 service unavailable.");
                }
                // Mock chat response based on input query
                textResponse = `[OmniRouter Response from ${route.provider.toUpperCase()} (${route.model})] I am LedgerScout, operating under the PLT framework. Your request was: "${message}"`;
                finalProvider = route.provider;
                finalModel = route.model;
                // Cost calculation based on token mock (e.g. 500 input + output tokens)
                const mockTokens = Math.floor(100 + Math.random() * 400);
                finalCost = (mockTokens / 1000) * route.cost_per_1k;
                // Save successful metrics
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
                break; // Successfully got response, stop loop!
            }
            catch (err) {
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
                    // If the last fallback failed too, throw fatal
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
//# sourceMappingURL=OmniRouterService.js.map