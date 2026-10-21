# Co-Agent Memory System — Research & Implementation Guide

## A Separate AI Companion Providing Memory Services to Any Agent via MCP/HTTP

---

## 1. How MCP Memory Servers Work

### Reference: `@modelcontextprotocol/server-memory` (Knowledge Graph Memory Server)

**Source**: `modelcontextprotocol/servers/src/memory/index.ts` (602 lines, TypeScript)

### Core Data Model: Knowledge Graph (Entities + Relations + Observations)

The official MCP Memory server uses a directed knowledge graph with three primitives:

```
Entity { name, entityType, observations[] }
Relation { from, to, relationType }
```

- **Entities** are nodes (people, concepts, files, events). Each has a type and a list of observation strings.
- **Relations** are directed edges stored in active voice (e.g., `works_at`, `created_by`).
- **Observations** are atomic facts attached to an entity.

### Storage: JSONL File on Disk

Persistence uses a flat JSONL file (`memory.jsonl`) where each line is either:
```json
{"type":"entity","name":"John_Smith","entityType":"person","observations":["Speaks fluent Spanish"]}
{"type":"relation","from":"John_Smith","to":"Anthropic","relationType":"works_at"}
```

A `KnowledgeGraphManager` class loads/saves the entire graph on every mutation. This is simple and reliable for single-user use but won't scale to multi-tenant or high-throughput scenarios.

### Exposed Tools (via `tools/call`)

| Tool | Purpose |
|------|---------|
| `create_entities` | Bulk create entities (skips duplicates by name) |
| `create_relations` | Bulk create directed relations (skips duplicates) |
| `add_observations` | Append atomic facts to existing entities |
| `delete_entities` | Remove entities + cascade-delete their relations |
| `delete_observations` | Remove specific observation strings |
| `delete_relations` | Remove specific relation edges |
| `read_graph` | Dump entire graph |
| `search_nodes` | Fuzzy search across names, types, and observations |
| `open_nodes` | Retrieve specific nodes by name |

### Exposed Resource

- **`memory://knowledge-graph`** — Readable MCP resource returning the full graph as JSON. Mutation tools emit `notifications/resources/updated` so subscribed clients see live changes.

### How It Connects

Configured in `claude_desktop_config.json`:
```json
{
  "mcpServers": {
    "memory": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-memory"]
    }
  }
}
```

### Architecture Pattern (Key Insight)

The memory server is a **standalone process** launched by the MCP host. It communicates via **stdio transport** (stdin/stdout) and is **completely independent** of the LLM. The LLM discovers memory tools at startup, then calls them as needed during conversation.

**This is the fundamental pattern for co-agent memory**: a separate process that any host/agent can connect to via MCP.

---

## 2. How Companion AI Architectures Work (SCRIBE-Like Systems)

### The Scribe Agent Pattern (from Profit Prime ecosystem)

A Scribe is a **witnessing intelligence** — a dedicated agent responsible for:

1. **GATHER** — Collect artifacts, decisions, state changes
2. **CONDENSE** — Extract signal, discard noise
3. **RECORD** — Write to canonical knowledge store (Seshat Second Brain / Logseq)
4. **VERIFY** — Confirm the record is accurate and accessible

### Key Architectural Distinctions

| Aspect | Scribe (Companion) | Memory Server (MCP Reference) |
|--------|-------------------|-------------------------------|
| Role | Active observer + recorder | Passive storage backend |
| Trigger | End of session / explicit request | Tool call from LLM |
| Storage | Markdown files in Logseq | JSONL knowledge graph |
| Intelligence | Has LLM context to decide what matters | Pure CRUD, no LLM |
| Recall | Reads Logseq pages + journals | `search_nodes` / `open_nodes` |

### What a Co-Agent Memory System Should Combine

A true companion memory agent should merge both patterns:

1. **MCP transport layer** (like the reference server) — so any MCP-compatible host can connect
2. **Active intelligence** (like Scribe) — so it can summarize, categorize, and decide what to remember without being told
3. **Rich querying** (like the knowledge graph) — search, traverse relations, open specific nodes
4. **Multiple storage backends** — JSONL for speed, vector DB for semantic search, Logseq for human-readable audit

### The Dual-Brain Pattern

From the Allie/Profit ecosystem, the dual-brain architecture is critical:

- **Short-term / Episodic**: Recent conversations, session state, in-memory buffer
- **Long-term / Semantic**: Persistent knowledge graph, vector embeddings, canonical docs

The companion memory agent should handle the **long-term brain** while the primary agent handles the **short-term context window**.

---

## 3. How web_fetch Patterns Inform Agent-to-Agent Memory Communication

### Reference: `mcp-server-fetch` (Python, but pattern is transport-agnostic)

The Fetch MCP server exposes:
```
fetch(url, max_length=5000, start_index=0, raw=False)
```

### Key Design Lessons for Memory Systems

**Lesson 1: Chunked/Offset Retrieval**

Fetch doesn't return the entire page — it lets the agent paginate with `start_index` and `max_length`. This maps directly to memory:
```
read_memory(entity_name, max_items=10, offset=0)
```

An agent should never dump the entire knowledge graph. It should query for what it needs and paginate results.

**Lesson 2: Streaming vs. Batch**

Fetch can return raw text or markdown. Memory should support both:
- **Quick lookup**: Return structured JSON for tool calls
- **Context injection**: Return formatted text that can be placed directly in an LLM prompt

**Lesson 3: Fail Gracefully**

Fetch obeys `robots.txt` and handles HTTP errors gracefully. Memory should:
- Return empty results for missing entities (not error)
- Allow silent writes (upsert semantics)
- Never crash the calling agent

**Lesson 4: The "Reading in Chunks" Pattern**

Just as an LLM fetches a web page in 5000-char chunks to find relevant information, it should read its memory graph the same way — first `search_nodes("topic")` to find relevant entities, then `open_nodes(["entity_A", "entity_B"])` to get full details, then `read_graph` only as a last resort.

### Communication Flow for Agent-to-Agent Memory

```
Agent A (LLM) → MCP Client → JSON-RPC over stdio/HTTP → Memory Server → Storage
```

The agent treats the memory server exactly like it treats a search engine or database — it doesn't know or care about the implementation, it just calls tools.

---

## 4. How to Implement a Universal Memory Protocol

### Architecture: The Co-Agent Memory Server

```
┌─────────────────────────────┐
│   MCP Host (Any Agent)      │
│  ┌───────────────────────┐  │
│  │ MCP Client            │  │
│  └────────┬──────────────┘  │
└───────────┼─────────────────┘
            │ JSON-RPC (stdio or Streamable HTTP)
┌───────────┼─────────────────┐
│  MCP Server (Memory Co-Agent) │
│  ┌───────────────────────┐  │
│  │ Tool Handlers         │  │
│  │ Resource Exports      │  │
│  │ Prompt Templates      │  │
│  └────────┬──────────────┘  │
│  ┌────────┴──────────────┐  │
│  │ Memory Engine         │  │
│  │ (Knowledge Graph +    │  │
│  │  Vector Index +       │  │
│  │  Embeddings + LLM)    │  │
│  └────────┬──────────────┘  │
│  ┌────────┴──────────────┐  │
│  │ Storage Backends      │  │
│  │ - JSONL (fast CRUD)   │  │
│  │ - SQLite (relations)  │  │
│  │ - Vector DB (semantic)│  │
│  │ - Logseq (human)      │  │
│  └───────────────────────┘  │
└─────────────────────────────┘
```

### Implementation Blueprint (Node.js + MCP v2 SDK)

#### Step 1: Scaffold MCP Server

```typescript
import { McpServer } from "@modelcontextprotocol/server";
import { StdioServerTransport } from "@modelcontextprotocol/server/stdio";
import { z } from "zod/v4";

const server = new McpServer({
  name: "co-agent-memory",
  version: "1.0.0",
});
```

#### Step 2: Extend Data Model Beyond the Reference

The reference server uses flat entities/observations. A universal protocol needs:

```typescript
// Core types
interface MemoryEntity {
  id: string;                    // UUID (not just name)
  name: string;                  // Human-readable label
  entityType: string;            // "person" | "conversation" | "decision" | "file" | "pattern"
  observations: string[];
  metadata: {                    // Rich metadata
    createdAt: string;           // ISO 8601
    updatedAt: string;
    source: string;              // Which agent wrote this
    ttl?: number;                // Time-to-live in seconds (auto-expire)
    importance: number;          // 0.0 - 1.0 for pruning
    tags: string[];              // For filtering
    embedding?: number[];        // Vector for semantic search
  };
}

interface MemoryRelation {
  id: string;
  from: string;                  // entity ID
  to: string;                    // entity ID
  relationType: string;          // "created" | "depends_on" | "references" | "contradicts"
  metadata: {
    createdAt: string;
    strength: number;            // 0.0 - 1.0
    source: string;
  };
}

interface ConversationMemory {
  sessionId: string;
  entries: Array<{
    timestamp: string;
    role: "user" | "agent";
    content: string;
    summary?: string;
    entities: string[];          // Referenced entity IDs
  }>;
}
```

#### Step 3: Register Tools

```typescript
// WRITE tools
server.registerTool("remember", {
  description: "Store a memory (entity + observations) with auto-categorization",
  inputSchema: z.object({
    name: z.string(),
    entityType: z.string().optional(),
    observations: z.array(z.string()),
    importance: z.number().min(0).max(1).optional().default(0.5),
    tags: z.array(z.string()).optional(),
    source: z.string().optional(),
  }),
}, async (args) => {
  // Auto-categorize if no entityType provided
  // Create or update entity
  // Generate embedding for observations
  // Return entity
});

server.registerTool("recall", {
  description: "Search memory semantic search across all entities and observations",
  inputSchema: z.object({
    query: z.string(),
    maxResults: z.number().optional().default(10),
    threshold: z.number().min(0).max(1).optional().default(0.5),
    entityTypes: z.array(z.string()).optional(),
    tags: z.array(z.string()).optional(),
  }),
}, async (args) => {
  // Vector search + keyword hybrid
  // Return ranked results with snippets
});

server.registerTool("connect", {
  description: "Create a relation between two entities",
  inputSchema: z.object({
    from: z.string(),
    to: z.string(),
    relationType: z.string(),
    strength: z.number().optional().default(0.5),
  }),
}, async (args) => {
  // Validate both entities exist
  // Create relation
  // Notify subscribers
});

server.registerTool("forget", {
  description: "Remove entities or observations by ID or query",
  inputSchema: z.object({
    ids: z.array(z.string()).optional(),
    query: z.string().optional(),
    entityTypes: z.array(z.string()).optional(),
  }),
}, async (args) => {
  // Soft-delete with ttl, or hard-delete
  // Cascade to relations
});

// Ability for agent to "reflect" on what it remembers
server.registerTool("summarize", {
  description: "Generate a summary of entities matching a query, grouped by type",
  inputSchema: z.object({
    query: z.string().optional(),
    entityTypes: z.array(z.string()).optional(),
    format: z.enum(["text", "json"]).optional().default("text"),
  }),
}, async (args) => {
  // Query matching entities
  // Use LLM to group/summarize if needed
  // Return structured or text summary
});

// Paginated read (web_fetch pattern)
server.registerTool("read_memories", {
  description: "Read entities with offset pagination (like fetching a web page in chunks)",
  inputSchema: z.object({
    entityTypes: z.array(z.string()).optional(),
    offset: z.number().optional().default(0),
    limit: z.number().optional().default(10),
    sortBy: z.enum(["createdAt", "updatedAt", "importance"]).optional().default("updatedAt"),
  }),
}, async (args) => {
  // Return paginated results
});
```

#### Step 4: Register Resources

```typescript
// Memory graph as a resource (readable, subscribable)
server.registerResource({
  uri: "memory://graph",
  name: "Memory Knowledge Graph",
  mimeType: "application/json",
  description: "Complete knowledge graph snapshot",
}, async () => {
  const graph = await memoryEngine.readGraph();
  return { contents: [{ uri: "memory://graph", mimeType: "application/json", text: JSON.stringify(graph) }] };
});

// Per-entity resource with template
server.registerResource({
  uri: "memory://entities/{id}",
  name: "Individual Memory Entity",
  mimeType: "application/json",
}, async (uri) => {
  const id = uri.pathname.split("/").pop();
  const entity = await memoryEngine.getEntity(id);
  return { contents: [{ uri, mimeType: "application/json", text: JSON.stringify(entity) }] };
});
```

#### Step 5: Storage Engine

```typescript
interface MemoryStorage {
  // Core CRUD
  createEntity(e: MemoryEntity): Promise<MemoryEntity>;
  getEntity(id: string): Promise<MemoryEntity | null>;
  updateEntity(id: string, updates: Partial<MemoryEntity>): Promise<MemoryEntity>;
  deleteEntity(id: string): Promise<void>;

  // Relations
  createRelation(r: MemoryRelation): Promise<MemoryRelation>;
  getRelations(entityId: string): Promise<MemoryRelation[]>;
  deleteRelation(id: string): Promise<void>;

  // Search
  search(query: string, opts: SearchOpts): Promise<SearchResult[]>;
  vectorSearch(embedding: number[], opts: SearchOpts): Promise<SearchResult[]>;

  // Maintenance
  prune(olderThan: Date, importanceThreshold: number): Promise<number>;
  snapshot(): Promise<Buffer>;
  restore(snapshot: Buffer): Promise<void>;
}
```

Storage backends (choose based on scale):
- **JSONL** — Simple, same as reference. Good for single-user/dev.
- **SQLite** — Proper relational queries, indexes, transactions. **Recommended for production single-user**.
- **PostgreSQL** — Multi-user, concurrent access, pgvector for embeddings.
- **LiteFS / Turso** — Edge-deployed SQLite.

#### Step 6: Streamable HTTP Transport for Agent-to-Agent (Remote)

The reference server uses stdio. For true co-agent memory (separate process, possibly remote), use **Streamable HTTP**:

```typescript
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/server/http";

const transport = new StreamableHTTPServerTransport({
  endpoint: "/mcp",
  sessionOptions: { sessionTimeout: 30 * 60 * 1000 }, // 30 min
});

// Express integration
app.post("/mcp", express.json(), async (req, res) => {
  await transport.handleRequest(req, res);
});

app.get("/mcp", async (req, res) => {
  await transport.handleStream(req, res);
});
```

Now **any agent** anywhere (local or remote) can connect:
```
Agent A (Python MCP client) → HTTP POST → Memory Server (Node.js)
Agent B (Claude Desktop) → stdio → Memory Server
Agent C (Custom Go agent) → HTTP → Memory Server
```

#### Step 7: Active Observing (Scribe Pattern)

The server should not wait for writes — it should actively observe when given the chance:

```typescript
// Background task: Ephemeral consolidation
// Periodically scan for low-importance dangling observations
// and either promote them (by connecting to entities) or prune them.

// Journaling: Every write also logs to a human-readable journal
// (suitable for Logseq or markdown commit logs).
```

But the key insight from Scribe is that **the LLM drives the decision to remember**. The memory server provides the tools; the agent decides when to call `remember`, `recall`, `forget`, `connect`, `summarize`.

---

## 5. Putting It All Together: The Universal Memory Protocol

### Protocol Contract (JSON-RPC 2.0 over MCP)

Any memory server claiming to implement the "Universal Memory Protocol" should expose:

**Required Tools:**
| Tool | Description | Like |
|------|-------------|------|
| `remember(entity)` | Store new memory with auto-categorization | `create_entities` + intelligence |
| `recall(query)` | Semantic + keyword search across all memories | `search_nodes` + vector |
| `connect(from, to, type)` | Create a relation between entities | `create_relations` |
| `read_memories(opts)` | Paginated read with filtering | web_fetch chunk pattern |
| `forget(id_or_query)` | Remove memories | `delete_entities` + batch |

**Required Resources:**
| Resource URI | Description |
|--------------|-------------|
| `memory://graph` | Full knowledge graph snapshot |
| `memory://entities/{id}` | Individual entity detail |
| `memory://journal?since=` | Recent memory activity log |

**Required Prompts:**
| Prompt | Description |
|--------|-------------|
| `memory-agent-system` | System prompt for the memory co-agent role |
| `remember-decision` | Template for recording a decision with context |

### Configuration for Any Agent

Agents connect via MCP config:

```json
{
  "mcpServers": {
    "memory-co-agent": {
      "command": "npx",
      "args": ["-y", "@your-org/co-agent-memory"]
    }
  }
}
```

Or for remote:
```json
{
  "mcpServers": {
    "memory-co-agent": {
      "url": "https://memory.buyasoul.online/mcp"
    }
  }
}
```

### The Agent's Mental Model

The agent should be prompted with a system message like:

```
You have a Memory Co-Agent available. Use it like your external brain:

- **Remembering**: Call `remember()` when you learn something important about the user, a project decision, or a pattern worth preserving.
- **Recalling**: Call `recall()` before answering questions that require context from previous sessions.
- **Connecting**: Call `connect()` when you discover relationships between things you already know.
- **Reading**: Call `read_memories()` to browse what you know, especially at the start of a new session.
- **Forgetting**: Call `forget()` to clean up outdated or incorrect information.

Think of your memory co-agent as a separate intelligence that never forgets, never sleeps, and is always there when you need context. It does not replace your context window — it extends it.
```

---

## 6. Implementation Priorities (Build Order)

### Phase 1: Foundation (Day 1)
- [ ] Fork/extend `@modelcontextprotocol/server-memory` with UUID-based entities
- [ ] Add `summarize` and `read_memories` (paginated) tools
- [ ] Add `metadata` (source, importance, tags) to entities
- [ ] Ship as `@buyasoul/co-agent-memory` via npx

### Phase 2: Intelligence (Week 1)
- [ ] Add optional LLM integration for auto-categorization
- [ ] Add embedding generation for semantic search
- [ ] Implement TTL-based auto-pruning
- [ ] Add Streamable HTTP transport for remote access

### Phase 3: Ecosystem (Week 2)
- [ ] Add logging/journal resource (Scribe-compatible output)
- [ ] Add snapshot/restore for portability
- [ ] MCP Inspector debugging support
- [ ] Write system prompts for agents to self-configure

### Phase 4: Scale (Week 3+)
- [ ] Multi-session support (one memory server, many agents)
- [ ] PostgreSQL backend with pgvector
- [ ] Real-time notifications (SSE) when memories change
- [ ] Vector DB integration (Chroma, Qdrant, or local)

---

## Key References

| Source | URL |
|--------|-----|
| MCP Memory Server source | https://github.com/modelcontextprotocol/servers/tree/main/src/memory |
| MCP TypeScript SDK (v2) | https://github.com/modelcontextprotocol/typescript-sdk |
| MCP Architecture docs | https://modelcontextprotocol.io/docs/concepts/architecture |
| MCP Transport docs | https://modelcontextprotocol.io/docs/concepts/transports |
| MCP Tools docs | https://modelcontextprotocol.io/docs/concepts/tools |
| MCP Resources docs | https://modelcontextprotocol.io/docs/concepts/resources |
| MCP Fetch Server | https://github.com/modelcontextprotocol/servers/tree/main/src/fetch |
| Scribe Agent pattern | Profit Prime skill: scribe-agent |

---

## Core Insight

**The co-agent memory system is not a fancy database — it's a separate intelligence that happens to be specialized for memory.** 

It uses MCP as its nervous system, JSON-RPC as its language, and a knowledge graph as its cortex. Any agent that speaks MCP can use it. The web_fetch pattern teaches us to treat memory browsing like web browsing — in paginated, query-driven chunks, not wholesale dumps.

The reference memory server gives us the transport. The Scribe pattern gives us the intelligence. The fetch pattern gives us the interaction model. Combined, they define a universal memory protocol that any agent can adopt.
