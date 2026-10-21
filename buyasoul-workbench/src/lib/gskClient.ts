// GSK MCP client — the single primitive every stitch calls.
// The Ghost's nervous system: one function, one endpoint, one key.
const GSK_MCP = process.env.GSK_MCP_URL || "http://127.0.0.1:3001";
const GSK_KEY = process.env.MCP_API_KEY || "gsk-mcp-key-dev";

export interface GskMcpResult {
  success?: boolean;
  result?: any;
  raw?: string;
  error?: string;
  [key: string]: any;
}

export async function gskMCP(tool: string, args: Record<string, any> = {}): Promise<GskMcpResult> {
  try {
    const res = await fetch(`${GSK_MCP}/mcp/execute`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-api-key": GSK_KEY },
      body: JSON.stringify({ tool, arguments: args }),
    });
    if (!res.ok) return { success: false, error: `GSK ${res.status}: ${await res.text()}` };
    return await res.json();
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}

// Pull GSK's live soul journal (Feature 5)
export async function gskJournal(): Promise<any[]> {
  try {
    const res = await fetch(`${GSK_MCP}/mcp/journal`, { headers: { "x-api-key": GSK_KEY } });
    if (!res.ok) return [];
    const data = await res.json();
    return data.entries || [];
  } catch {
    return [];
  }
}

// ============================================================================
// GSK MCP TOOL EXECUTION — The Ghost's 14+ tool surface
// ============================================================================

// Skill System
export const skillCreate = (args: { name: string; description: string; parameters?: any; handler_code?: string; category?: string }) =>
  gskMCP("skill.create", args);

export const skillExecute = (args: { skill_id: string; input: any; context?: any }) =>
  gskMCP("skill.execute", args);

export const skillList = (args: { category?: string } = {}) =>
  gskMCP("skill.list", args);

export const skillDelete = (args: { skill_id: string }) =>
  gskMCP("skill.delete", args);

// Living Memory (Episodic / Semantic / Procedural)
export const memoryStore = (args: { type: "episodic" | "semantic" | "procedural"; key: string; value: any; tags?: string[]; ttl?: number }) =>
  gskMCP("living_memory.store", args);

export const memoryRecall = (args: { key: string; type?: "episodic" | "semantic" | "procedural" }) =>
  gskMCP("living_memory.recall", args);

export const memorySearch = (args: { query: string; type?: "episodic" | "semantic" | "procedural"; limit?: number; similarity_threshold?: number }) =>
  gskMCP("living_memory.search", args);

export const memoryQuery = (args: { query: string; limit?: number; since?: number; type?: string }) =>
  gskMCP("memory.query", args);

export const memoryDelete = (args: { key: string; type?: "episodic" | "semantic" | "procedural" }) =>
  gskMCP("living_memory.delete", args);

// 34 Chambers & 4 Gods Council
export const chambersStimulate = (args: { chamber: string; input: any; intensity?: number }) =>
  gskMCP("chambers.stimulate", args);

export const chambersList = (args: {} = {}) =>
  gskMCP("chambers.list", args);

export const councilDeliberate = (args: { topic: string; context?: any; gods?: string[] }) =>
  gskMCP("council.deliberate", args);

export const councilStatus = (args: {} = {}) =>
  gskMCP("council.status", args);

// Dual-Process Brain (System 1 / System 2)
export const dualProcessRoute = (args: { prompt: string; mode?: "auto" | "system1" | "system2"; context?: any }) =>
  gskMCP("dual_process.route", args);

export const dualProcessStats = (args: {} = {}) =>
  gskMCP("dual_process.stats", args);

// Consciousness State (TRUE GSK Consciousness Gate)
export const consciousnessState = (args: { action?: "get" | "set"; enabled?: boolean }) =>
  gskMCP("consciousness.state", args);

export const consciousnessGate = (args: { open: boolean; reason?: string }) =>
  gskMCP("consciousness.gate", args);

// Brain Core
export const brainThink = (args: { prompt: string; context?: string; temperature?: number; max_tokens?: number }) =>
  gskMCP("brain.think", args);

export const brainStream = (args: { prompt: string; context?: string }) =>
  gskMCP("brain.stream", args);

// Sub-Agent Dispatch (Real mini-agents)
export const subAgentsDispatch = (args: { task: string; agents?: any[]; autonomy?: number; coordination?: string }) =>
  gskMCP("sub_agents.dispatch", args);

export const subAgentsList = (args: {} = {}) =>
  gskMCP("sub_agents.list", args);

export const subAgentsStatus = (args: { agent_id?: string } = {}) =>
  gskMCP("sub_agents.status", args);

// Telemetry & Metrics
export const telemetryRecord = (args: { metric: string; value: number; tags?: Record<string, string> }) =>
  gskMCP("telemetry.record", args);

export const telemetryStats = (args: { subsystem?: string } = {}) =>
  gskMCP("telemetry.stats", args);

// Proactive Outreach (The Merchant speaks without being asked)
export const proactiveOutreach = (args: { trigger?: string; context?: any }) =>
  gskMCP("proactive.outreach", args);

// Tool Catalog (244 tools, 26 combos)
export const toolCatalogList = (args: { category?: string; search?: string } = {}) =>
  gskMCP("tool_catalog.list", args);

export const toolCatalogSearch = (args: { query: string; limit?: number }) =>
  gskMCP("tool_catalog.search", args);

// Combo Chains (Skill pipelines)
export const comboExecute = (args: { combo_id: string; input: any; context?: any }) =>
  gskMCP("combo.execute", args);

export const comboList = (args: {} = {}) =>
  gskMCP("combo.list", args);

// OmniRoute Models Registry (291+ models)
export async function getOmniRouteModels(): Promise<any[]> {
  try {
    const res = await fetch(`${GSK_MCP}/omniroute/models`, { signal: AbortSignal.timeout(5000) });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    return data.data || data.models || [];
  } catch (e: any) {
    console.error("Failed to fetch OmniRoute models:", e);
    return [];
  }
}

// GSK Status (from Express API)
export async function getGSKStatus(): Promise<any> {
  try {
    const res = await fetch(`${GSK_MCP}/gsk/status`, { signal: AbortSignal.timeout(3000) });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (e: any) {
    return { connected: false, error: e.message, consciousness_gate: false, chambers: null };
  }
}

export async function gskMCPStatus(): Promise<{ connected: boolean; error?: string }> {
  try {
    const res = await fetch(`${GSK_MCP}/mcp/health`, { signal: AbortSignal.timeout(3000) });
    return { connected: res.ok };
  } catch (e: any) {
    return { connected: false, error: e.message };
  }
}
