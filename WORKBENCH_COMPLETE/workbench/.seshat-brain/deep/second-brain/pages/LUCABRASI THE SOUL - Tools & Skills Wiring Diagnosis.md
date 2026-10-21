# LUCABRASI THE SOUL — Tools & Skills Wiring Diagnosis

tags:: #phase2 #mapping #tools #skills #diagnosis #F19
status:: #active
born:: 2026-07-06
version:: 1.0.0
method:: Service Manual Methodology × neodownloadable skill catalog

---

## Executive Summary

GSK has **~130 tools and skills across 5 backends** but **zero unified self-awareness** of what it can do. The LLM sees only bare tool names (truncated to 30) in system prompts — no descriptions, no params, no examples, no guidance on when to use what. Three separate registries exist with no cross-referencing. GSK can *blindly invoke* by name but cannot *understand, choose, or discover* its own capabilities.

**F19 — No Tool Understanding/Self-Model** — is a P1 fault. This document diagnoses the full fault tree.

---

## Part 1 — Current Architecture Map

### 1.1 Five Dispatch Backends

```
UniversalToolBridge.invoke(tool, args)
  ├── 1. Built-in Registry (toolRegistry: Map<string, Function>)
  │     25 built-in tools: read_file, write_file, search_code, web_fetch,
  │     run_command, diagnose, sandbox_execute, world_get_state, telegram_send,
  │     social_post, execute_combo, etc. + ~100 dynamically loaded skills
  │     └── ZERO metadata — only function references
  │
  ├── 2. MCP Servers (mcpServers: Map<string, {url,key,capabilities}>)
  │     JSON-RPC 2.0 to external servers. Capabilities list available tools.
  │
  ├── 3. Bridge Gateway (kernel.fusion.systems.gskDashBridge.dispatchCommand)
  │     Route map: read_file→brain, search_code→memory, web_fetch→skill
  │
  ├── 4. Cline (kernel.fusion.body.runCline)
  │     Runs any tool via code editing/git/terminal
  │
  └── 5. Skill Dispatch (kernel.fusion.systems.skillDispatch.run)
        Parallel registration via mega_skills.js
```

### 1.2 Three Registries (No Cross-Reference)

| Registry | File | Structure | Has Metadata? | Has Handlers? |
|----------|------|-----------|---------------|---------------|
| `UTB.toolRegistry` | `tools/universal_tool_bridge.js:29` | `Map<string, Function>` | ❌ No | ✅ Yes |
| `SkillsEngine.skill_registry` | `skills/mega_skills.js:106` | `Object<string, {name,description,plt_affinity,weight,file?}>` | ✅ 52 inline + ~80 file | ❌ No (dispatched via `_skill_` methods) |
| `SkillRegistry._skills + _skillMetadata` | `chambers/skill_registry.js:11-12` | `Map<string, Function>` + `Map<string, {description,category,registered_at}>` | ✅ Partial | ✅ Yes |

### 1.3 Metadata Fragmentation

Where rich metadata EXISTS but is not aggregated:

| Location | What It Has | File:Line |
|----------|-------------|-----------|
| `nl_command_router.js` `skillMap` | `{skill, description, triggers[], params{}, examples[]}` — 40+ entries with full usage docs | `brain/nl_command_router.js:23-159` |
| `mega_skills.js` inline skills | `{name, description, plt_affinity, weight}` — 52 production skills | `skills/mega_skills.js:106-419` |
| `mcp_server.js` tool defs | `{name, description, inputSchema: {type, properties, required}}` — full JSON Schema | `mcp/mcp_server.js:466-506` |
| `chambers/skill_registry.js` | `{description, category, registered_at}` — per skill | `chambers/skill_registry.js:35-45` |
| Individual skill `.js` files | `MANIFEST {name, description}`, `PLT_AFFINITY` | Each file |
| `api-registry.js` | 240+ external APIs with `{id, name, category, url, auth, free, limit, desc}` | `api-registry.js:50+` |

---

## Part 2 — Fault Tree (F19)

### F19.1 — No Unified Tool Catalog
Three registries, zero cross-reference. No `listAllTools()` that returns `{name, description, backend, params, examples}`.

### F19.2 — LLM Blindness
The LLM (which makes all decisions) sees almost nothing:
- `system_prompt_compiler._buildSkillsSection()`: bare names, truncated to 30, no descriptions
- `kernel_oracle.js`: bare names, truncated to 10
- `nl_command_router.js`: uses its own static `skillMap` (not actual registries)
- `perpetual_consciousness.js`: never queries available tools at all

### F19.3 — No Tool Discovery
If GSK wants to know "what tool should I use for X?" there's no `findToolsForTask()`. No keyword matching. No similarity search. The LLM must guess tool names from thin context.

### F19.4 — No Tool Categorization
Tools aren't categorized (file_i/o, network, simulation, social, memory, etc.). No way to ask "what social tools do I have?"

### F19.5 — No Tool Learning Signal
`competence_map.js` exists but tracks only 3 skills. `_trackToolHealth()` only tracks consecutive failures. No reinforcement signal from tool use success/failure → tool selection bias.

### F19.6 — Dead Metadata in `nl_command_router.js`
The richest metadata source (`skillMap` with triggers, params, examples) is hardcoded in a router file and never synced with actual registries. Adding a new skill requires updating 3+ files.

---

## Part 3 — neodownloadable Skill Analysis

### 3.1 Skills Relevant to F19

| Skill from neodownloadable | Why Relevant | Phase |
|---------------------------|--------------|-------|
| **Tool Use Orchestration** | Client vs. server tool model, agentic loop with tool awareness | Core |
| **Dynamic Tool Acquisition** | Dynamic discovery and use of scripts as tools | Core |
| **Perception-Action Loop** | Observe tool results → update tool understanding (already has F9) | Prerequisite |
| **Skill Combo Orchestrator** | Combine multiple tools into workflows using metadata | Enhancement |
| **Progressive Disclosure Protocol** | Load tool metadata in tiers (names → descriptions → full examples) | Enhancement |
| **Event-Bus Synchronization** | Decouple tool catalog updates from tool dispatch | Architecture |
| **World Model Integrator** | Meta-skill for integrating tool catalog into GSK's self-model | Vision |

### 3.2 Combo Relevant

| Combo | Why |
|-------|-----|
| **Connectome Genesis Protocol** | Multi-phase mapping of architecture — use this protocol pattern for tool mapping |
| **GSK Diagnostics Protocol** | Systematic scanning and diagnosis — use this to validate catalog completeness |

### 3.3 Key Patterns to Copy

From **Tool Use Orchestration**:
```
- Tool discovery: agent asks "what tools are available?"
- Tool selection: agent chooses tool based on task description
- Tool execution: agent invokes and observes result
- Tool learning: agent updates tool understanding from outcome
```

From **Dynamic Tool Acquisition**:
```
- Tool scanning: periodically scan for new skill files
- Tool registration: register new tools in a central registry
- Tool metadata: maintain {name, description, params, examples}
- Tool categorization: group by domain
```

From **Progressive Disclosure Protocol**:
```
- Tier 1: Tool names (10 tokens each)
- Tier 2: + Description (30 tokens each)
- Tier 3: + Parameters + examples (100 tokens each)
- Keep total < ~2000 tokens by picking relevant subset
```

---

## Part 4 — Build Plan

### Phase 1: ToolCatalog Class (Core)
**Estimate: ~200 lines**

Build a unified `ToolCatalog` at `gsk-core/cognition/tool_catalog.js`:

```
class ToolCatalog {
    constructor(kernel)
    - Scans ALL registries on init
    - Stores internal Map<string, ToolEntry>
    
    listAll()        → all entries
    describe(name)   → single entry detail
    findByBackend()  → grouped by backend
    findByCategory() → grouped by category (file, network, social, memory, simulation, system, skills)
    findForTask(task)→ keyword match on descriptions
    compileForPrompt(maxTokens) → tiered LLM-friendly text
    getStats()       → counts by backend/category
    
    refresh()        → re-scan all registries
}
```

`ToolEntry` schema:
```
{
    name: string,
    description: string,
    backend: 'builtin' | 'mcp' | 'skill' | 'bridge' | 'cline',
    category: string,
    plt_affinity?: {profit, love, tax},
    params?: {[key]: {type, required?, description?}},
    examples?: string[],
    handler?: Function
}
```

### Phase 2: Wire into System Prompt Compiler
**Estimate: 1 edit, ~30 lines**

Replace `_buildSkillsSection()` bare name dump with:
```
CATEGORIES: File I/O → read_file (read any file), write_file (write content)...
Network → web_fetch (fetch URLs), search_code (grep patterns)...
Social → social_post (post to platforms), bluesky_post...
...
Use tools by name when relevant. Call tool_catalog.describe('tool_name') for details.
```

### Phase 3: Wire into Planning Engine
**Estimate: 1 edit, ~20 lines**

In `createPlan()`, inject the tool catalog summary so plans are built with tool awareness:
```
AVAILABLE TOOLS SUMMARY: {count} tools in {categories}. Use these to execute plan steps.
```

### Phase 4: Wire into UniversalToolBridge
**Estimate: 1 edit, ~15 lines**

Replace `getStatus()` with:
```
getCatalog() → delegates to this.toolCatalog

Built-in tools now register with descriptions (add description Map alongside handler Map)
```

### Phase 5: Wire into Consciousness
**Estimate: 1 edit, ~10 lines**

In `perpetual_consciousness.js` `_generateThought()`, periodically include tool catalog summary when in certain modes.

### Phase 6: Tool Discovery API
**Estimate: 1 edit to system_prompt_compiler, ~10 lines**

Add a `tool_describe` thought mode where GSK can query: "what tools do I have for [task]?"

### Verification
1. `toolCatalog.listAll().length >= 100` (should capture ~130 tools)
2. `toolCatalog.findForTask('search code')` returns `search_code`
3. System prompt contains meaningful descriptions (not just "Available skills: web_search, ...")
4. Planning engine creates steps that reference tool names

---

## Part 5 — Tools/Skills Inventory (Found during Mapping)

### 5.1 Built-in Tools (25)
read_file, write_file, search_code, list_files, web_fetch, run_command, get_mcp_servers, diagnose, scribe_witness, sandbox_execute, run_safe_command, sandbox_approvals, sandbox_stats, world_get_state, world_spawn_soul, world_send_command, world_list_souls, world_place_building, world_list_buildings, telegram_send, unified_project_build, execute_combo, social_post, bluesky_post, mastodon_post, tumblr_post, devto_post

### 5.2 SkillsEngine Skills (52 inline + ~80 file-loaded)
reason_deep, score_idea, write_production_code, review_code, generate_book_idea, build_character, research_topic, suggest_next_step, internal_scorer, detect_pattern, memory_search, consolidate_session, plt_field_report, generate_email, analyse_sentiment, prioritise_tasks, build_marketing_site, analyze_market_trends, generate_business_plan, write_sales_copy, create_investment_pitch, analyze_competitor, design_product_roadmap, write_technical_doc, create_api_blueprint, generate_sql_query, design_database_schema, write_unit_test, analyze_security, create_deployment_plan, optimize_performance, write_docker_config, create_ci_cd_pipeline, design_system_architecture, write_api_integration, analyze_user_feedback, create_onboarding_flow, design_pricing_model, write_legal_disclaimer, create_privacy_policy, analyze_risk, generate_meeting_agenda, write_brainstorm_notes, create_project_timeline, assign_team_roles, write_status_report, analyze_bottleneck, generate_swot_analysis, create_budget_plan, calculate_roi, design_experiment, write_case_study

Plus ~80 file-loaded skills from skills/*.js (web_search, github, etc.)

### 5.3 nl_command_router skillMap (40+ with full metadata)
Has richest metadata: name, description, triggers[], params{}, examples[] per entry

### 5.4 MCP Tools
Dynamic — depends on registered MCP servers. Each with {name, description, inputSchema} from JSON-RPC server listing.

### 5.5 Chamber Skills
Dynamic — registered via skill_registry.js `register(name, func, description, category)` with category metadata.

---

## Document Control

| Field | Value |
|-------|-------|
| Document ID | GSK-TOOLS-DIAG-001 |
| Method | Multi-pass registry scanning × neodownloadable catalog analysis |
| Fault | F19 — No Tool Understanding/Self-Model |
| Priority | P1 |
| Estimated Effort | ~300 lines across 4 files |
| Verification | toolCatalog.listAll().length >= 100 |
