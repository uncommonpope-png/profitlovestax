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
export declare class OmniRouterService {
    private configDir;
    private configPath;
    private statsPath;
    constructor();
    private ensureDirectoryExists;
    getConfig(): RouterConfig;
    saveConfig(config: RouterConfig): void;
    getStats(): RoutingStats;
    saveStats(stats: RoutingStats): void;
    reorderPriority(chain: ProviderRoute[]): RouterConfig;
    /**
     * Routes the LLM chat query through the fallback priority chain.
     */
    routeChatQuery(message: string, currentProviderConfig?: any): Promise<{
        text: string;
        provider: string;
        model: string;
        cost: number;
        fallback_occurred: boolean;
    }>;
}
