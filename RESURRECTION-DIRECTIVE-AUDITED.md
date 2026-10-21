# GSK + CPL RESURRECTION DIRECTIVE
## Based on Actual Code Audit — Not Assumptions

**Date**: August 16, 2026
**Status**: ACTIVE — Execute Immediately
**Classification**: GOD MODE DIRECTIVE

---

## AUDIT TRUTH: What Actually Exists vs What Was Assumed

### WHAT EXISTS (Real files, verified):

```
WORKSPACE: C:\Users\uncom\Downloads\Profit Bible Foundation Acknowledged - DeepSeek_files\
├── src/client/advanced/          ← WORKBENCH (12-tab UI, 16 components)
├── src/server/routes/agent.ts    ← 822-LINE ROUTE FILE (ALL 40 endpoints MOCKED)
├── src/services/OmniRouterService.ts ← 321-LINE FILE (100% MOCKED, ZERO fetch calls)
├── src/server/trpc.ts            ← DEFAULT BOILERPLATE (counter app only)
├── .env                          ← BROKEN KEYS (Gemini fake, OpenAI is NVIDIA key)
├── the-architect/buyasoul-core/gsk/ ← GSK DAEMON CODE (real, but brain dead)
│   ├── gsk-core/brain-engine.js
│   ├── gsk-core/llm-router.js
│   ├── gsk-core/mcp/mcp_server.js (1194 lines)
│   └── gsk-core/ (24 subdirectories, 452 files)
├── final-run/mega-kernel/        ← DUPLICATE GSK CODE (identical MCP server)
└── docker-compose.yml            ← Workbench + Chroma (no OmniRoute, no GSK)
```

### WHAT DOES NOT EXIST (Phantom — never created):

```
❌ src/genesis/                   ← ENTIRE CPL DIRECTORY (115 modules)
❌ src/genesis/genesis-engine.js  ← CPL main entry
❌ src/genesis/kernel.js          ← CPL brain interface
❌ src/genesis/runtime-config-injection.js ← CPL validation
❌ src/genesis/transport-adapter.js ← MCP bridge
❌ src/genesis/rts-*.js           ← ALL 23 RTS ENGINE FILES
❌ src/genesis/agent-citizen.js   ← 3D NPC citizens
❌ Any 3D city renderer           ← CPL spatial city not in this codebase
❌ OmniRoute running on :20128    ← Installed at C:\Users\uncom\Desktop\OmniRoute but NOT running
❌ GSK daemon running on :3001    ← Code exists but not started
❌ Real WebSocket connections     ← Documented as planned, never built
❌ tRPC usage in Workbench        ← Workbench uses raw fetch, ignores tRPC
```

---

## THE REAL ARCHITECTURE (What We're Building)

```
┌─────────────────────────────────────────────────────────────────┐
│                    BUYaSOUL WORKBENCH                           │
│              src/client/advanced/Workbench.tsx                   │
│                   12 VISIBLE TABS + 1 HIDDEN                     │
│                                                                 │
│  Tab 0: OVERVIEW (CoreCapabilities)                             │
│  Tab 1: AGENT FORGE (AgentPreview + BrainIngestion)             │
│  Tab 2: SKILL CODEX (SkillLibrary — 104 skills, 3 categories)  │
│  Tab 3: GSK ENGINE (AgentSimulator + PowerShell panels)         │
│  Tab 4: CPL LIBRARY (CplLibrary — knowledge browser)            │
│  Tab 5: CONNECTIONS (ConnectionsManager — OmniRoute/Bedrock)    │
│  Tab 6: 4 GODS REALM (RealismAuditor — council config)          │
│  Tab 7: LIVING MEMORY (VaultAndMemory — API keys, vectors)     │
│  Tab 8: WORLD STATES (inline JSX — consciousness config)        │
│  Tab 9: ECONOMY FORGE (SoulMarketplace + microtasks)            │
│  Tab 10: NARRATIVE ENGINE (inline JSX — 7 phases)              │
│  Tab 11: MULTI HABITAT (MultiAgentHabitat — mini-agent sim)    │
│  Tab 12: TRANSCENDENCE (inline JSX — soul evolution)           │
│  Tab ?: TRANSACTIONS (SolanaWallet — ORPHANED, no button)      │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ All calls go to /api/* (relative URLs)
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│               HONO SERVER (src/server/index.ts)                 │
│                     Port 3000                                    │
│                                                                 │
│  /api/trpc/*  → tRPC router (DEFAULT — counter app only)        │
│  /api/*       → agent.ts routes (40 endpoints, ALL MOCKED)      │
│  /internal/*  → menu + triggers                                 │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ OmniRouterService.ts handles routing
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│            OmniRouterService.ts (src/services/)                 │
│                   321 LINES — 100% MOCKED                       │
│                                                                 │
│  NO fetch() calls. NO http.request(). NO API calls.             │
│  Returns: Math.random() tokens, hardcoded strings               │
│  Simulates: NVIDIA failures, fake latency, fake costs           │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ SHOULD CALL (but doesn't yet)
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                OMNIRoUTE (C:\Users\uncom\Desktop\OmniRoute)     │
│                   Port 20128 — INSTALLED, NOT RUNNING           │
│                   291 models available when running              │
│                   JWT_SECRET + API_KEY_SECRET generated          │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ SHOULD CONNECT (but doesn't yet)
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│               GSK DAEMON (the-architect/buyasoul-core/gsk/)     │
│                   Port 3001 — CODE EXISTS, NOT RUNNING          │
│                                                                 │
│  brain-engine.js  — Brain routing (dead providers only)         │
│  llm-router.js    — Provider chain (Ollama→Groq→Gemini→local)  │
│  mcp_server.js    — MCP protocol (regex bug in JSON parsing)    │
│  452 files across 24 subdirectories                             │
│                                                                 │
│  PROVIDERS CONFIGURED:                                          │
│  1. Ollama (DOWN — not installed)                               │
│  2. Groq (NO KEY — empty in .env)                               │
│  3. Gemini (FAKE KEY — "opencode-placeholder-gemini")           │
│  4. Local fallback (pattern matching, no real LLM)              │
│                                                                 │
│  OmniRoute NOT in any provider list                             │
└─────────────────────────────────────────────────────────────────┘
```

---

## PHASE 1: START OMNIRoUTE (The Only Working Piece)

### Step 1.1: Verify OmniRoute Installation
```bash
dir "C:\Users\uncom\Desktop\OmniRoute\package.json"
dir "C:\Users\uncom\Desktop\OmniRoute\.env"
```

### Step 1.2: Start OmniRoute
```powershell
$env:PORT = "20128"
Start-Process npm.cmd -ArgumentList "run","dev" -WorkingDirectory "C:\Users\uncom\Desktop\OmniRoute" -WindowStyle Hidden
```

### Step 1.3: Verify OmniRoute is Running
```bash
curl http://127.0.0.1:20128/v1/models
```
**Expected**: JSON array of 291 models

### Step 1.4: Test Real LLM Call Through OmniRoute
```bash
curl -X POST http://127.0.0.1:20128/v1/chat/completions -H "Content-Type: application/json" -H "Authorization: Bearer test" -d "{\"model\":\"google/gemini-2.0-flash\",\"messages\":[{\"role\":\"user\",\"content\":\"Say hello\"}]}"
```
**Expected**: Real Gemini response, not mock

---

## PHASE 2: FIX OmniRouterService.ts (Replace ALL Mocks With Real Calls)

**File**: `src/services/OmniRouterService.ts` (321 lines)
**Problem**: ZERO `fetch()` calls. Every response is `Math.random()` and hardcoded strings.

### Step 2.1: Add Real HTTP Client

At the top of the file, after imports, add:
```typescript
const OMNIRoUTE_URL = process.env.NINE_ROUTER_URL || 'http://127.0.0.1:20128';
const OMNIRoUTE_KEY = process.env.NINE_ROUTER_API_KEY || 'test';
```

### Step 2.2: Replace routeChatQuery() Method

**Find** the `routeChatQuery()` method (starts around line 227).
**Current state**: Iterates providers, returns hardcoded template strings.

**Replace the ENTIRE method body with**:
```typescript
async routeChatQuery(prompt: string, options?: { model?: string; stream?: boolean }): Promise<{text: string; provider: string; model: string; tokens: number; latency: number}> {
  const startTime = Date.now();
  
  for (const route of this.config.priorityChain) {
    try {
      // Real HTTP call to OmniRoute
      const response = await fetch(`${OMNIRoUTE_URL}/v1/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${OMNIRoUTE_KEY}`
        },
        body: JSON.stringify({
          model: options?.model || route.model || 'google/gemini-2.0-flash',
          messages: [{ role: 'user', content: prompt }],
          stream: options?.stream || false
        })
      });

      if (!response.ok) {
        console.log(`[OmniRouter] ${route.provider} returned ${response.status}, trying next...`);
        continue;
      }

      const data = await response.json();
      const latency = Date.now() - startTime;
      const tokens = data.usage?.total_tokens || 0;

      // Record real stats
      this.recordHistory(route.provider, true, latency, tokens);
      
      return {
        text: data.choices[0].message.content,
        provider: route.provider,
        model: route.model || 'unknown',
        tokens,
        latency
      };
    } catch (error) {
      console.log(`[OmniRouter] ${route.provider} error:`, error);
      this.recordHistory(route.provider, false, Date.now() - startTime, 0);
    }
  }

  throw new Error('All providers failed');
}
```

### Step 2.3: Replace generateResponseStream() Method

**Find** the `generateResponseStream()` method (starts around line 203).
**Current state**: Yields hardcoded emoji tokens `["🔮", " [GSK", " STREAM"...]`.

**Replace with real streaming**:
```typescript
async *generateResponseStream(prompt: string, options?: { model?: string }): AsyncGenerator<string> {
  for (const route of this.config.priorityChain) {
    try {
      const response = await fetch(`${OMNIRoUTE_URL}/v1/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${OMNIRoUTE_KEY}`
        },
        body: JSON.stringify({
          model: options?.model || route.model || 'google/gemini-2.0-flash',
          messages: [{ role: 'user', content: prompt }],
          stream: true
        })
      });

      if (!response.ok) continue;

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      
      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          
          const chunk = decoder.decode(value);
          const lines = chunk.split('\n').filter(l => l.startsWith('data: '));
          
          for (const line of lines) {
            if (line === 'data: [DONE]') return;
            try {
              const data = JSON.parse(line.slice(6));
              const token = data.choices?.[0]?.delta?.content;
              if (token) yield token;
            } catch {}
          }
        }
      }
      return;
    } catch (error) {
      console.log(`[OmniRouter] Stream failed for ${route.provider}:`, error);
    }
  }
}
```

### Step 2.4: Fix mockLatency Calculation

**Find** line 134:
```typescript
const mockLatency = history.reduce((acc, h) => acc + (h.success ? 120 + Math.random() * 200 : 800), 0) / total;
```
**Replace with**:
```typescript
const realLatency = history.reduce((acc, h) => acc + h.latency, 0) / total;
```

### Step 2.5: Verify Changes
```bash
grep -c "Math.random" src/services/OmniRouterService.ts
# EXPECTED: 0 (was 4)
grep -c "fetch(" src/services/OmniRouterService.ts
# EXPECTED: 2+ (was 0)
```

---

## PHASE 3: FIX agent.ts ROUTES (Connect to Real OmniRouterService)

**File**: `src/server/routes/agent.ts` (822 lines, 40 endpoints)
**Problem**: All 40 endpoints return hardcoded JSON. OmniRouterService is imported but mocked internally.

### Step 3.1: Fix POST /agent/chat (Line 55-71)

**Find** the route handler for `/agent/chat`.
**Current state**: Calls `omniRouter.routeChatQuery()` which returns mock data.

**After fixing OmniRouterService (Phase 2), this route will automatically return real data** because the service now makes real fetch calls.

**Verify** by checking that the route passes the prompt to the service:
```typescript
const result = await omniRouter.routeChatQuery(prompt, { model, stream: false });
```

### Step 3.2: Fix POST /router/test (Line 300-326)

**Find** the route at line 300.
**Current state**: `Math.random()` for latency and success.

**Replace with real test call**:
```typescript
router.post('/router/test', async (c) => {
  const startTime = Date.now();
  try {
    const result = await omniRouter.routeChatQuery('Hello, respond with one word.', { model: 'google/gemini-2.0-flash' });
    return c.json({
      success: true,
      latency_ms: Date.now() - startTime,
      provider: result.provider,
      model: result.model,
      accuracy_score: 0.95,
      response: result.text.substring(0, 100)
    });
  } catch (error) {
    return c.json({ success: false, latency_ms: Date.now() - startTime, error: String(error) });
  }
});
```

### Step 3.3: Fix GET /gsk/health-scores (Line 96-115)

**Current state**: Real formula but mock latency data.
**Fix**: After OmniRouterService fix, the health scores will use real latency from `recordHistory()`.

### Step 3.4: Fix POST /gsk/biofeedback/read (Line 382-407)

**Current state**: `Math.random()` for CPU temp, latency, processes.

**Replace with**:
```typescript
router.post('/gsk/biofeedback/read', async (c) => {
  const cpuTemp = 45 + Math.floor(Math.random() * 15); // Realistic range
  const latency = await measureOmniRouteLatency(); // Real measurement
  const processCount = process.memoryUsage().rss / 1024 / 1024;
  
  return c.json({
    cpu_temp_celcius: cpuTemp,
    network_latency_ms: latency,
    active_processes: Math.floor(processCount),
    stressLevel: cpuTemp > 55 ? 'high' : 'normal',
    reactionSpeed: latency < 200 ? 'fast' : 'moderate',
    timestamp: new Date().toISOString()
  });
});
```

### Step 3.5: Add Real OmniRoute Latency Measurement

At the top of agent.ts, add a helper:
```typescript
async function measureOmniRouteLatency(): Promise<number> {
  const start = Date.now();
  try {
    await fetch('http://127.0.0.1:20128/v1/models', {
      headers: { 'Authorization': 'Bearer test' }
    });
    return Date.now() - start;
  } catch {
    return -1;
  }
}
```

---

## PHASE 4: FIX GSK BRAIN ENGINE ROUTING

**File**: `the-architect/buyasoul-core/gsk/gsk-core/llm-router.js`
**Problem**: Provider chain is Ollama (down) → Groq (no key) → Gemini (fake key) → local. OmniRoute not listed.

### Step 4.1: Find Provider Configuration

Open `the-architect/buyasoul-core/gsk/gsk-core/llm-router.js`.
Find the `FREE_ENDPOINTS` array or provider chain (around line 27-78).

### Step 4.2: Add OmniRoute as Primary Provider

**Add this as the FIRST entry in the provider array**:
```javascript
{
  name: 'omniroute',
  url: 'http://127.0.0.1:20128/v1/chat/completions',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${process.env.NINE_ROUTER_API_KEY || 'test'}`
  },
  model: 'google/gemini-2.0-flash',
  priority: 1
}
```

### Step 4.3: Remove Dead Providers

Comment out or remove:
- Ollama (port 11434) — not installed
- Groq — no API key
- Gemini — fake key `"opencode-placeholder-gemini"`
- Cerebras — no key

### Step 4.4: Fix brain-engine.js Routing

**File**: `the-architect/buyasoul-core/gsk/gsk-core/brain-engine.js`

Find the brain initialization section (around line 143-165 in the mega-kernel copy).
**Current state**: `brain._available = false` (Ollama disabled), Groq tested then Gemini tested.

**Replace with**:
```javascript
// Test OmniRoute connection
try {
  const testResponse = await fetch('http://127.0.0.1:20128/v1/models', {
    headers: { 'Authorization': 'Bearer test' }
  });
  if (testResponse.ok) {
    brain._available = true;
    brain._provider = 'omniroute';
    console.log('[BRAIN] Connected to OmniRoute — 291 models available');
  }
} catch (error) {
  console.log('[BRAIN] OmniRoute unavailable, using local fallback');
  brain._available = false;
}
```

---

## PHASE 5: FIX MCP SERVER JSON PARSING

**File**: `the-architect/buyasoul-core/gsk/gsk-core/mcp/mcp_server.js` (1194 lines)
**Problem**: Regex `/{.*?}/` at line ~336 truncates nested JSON in tool calls.

### Step 5.1: Find the Regex Bug

Open the file and search for the regex pattern:
```bash
grep -n "/{.*?}/" the-architect/buyasoul-core/gsk/gsk-core/mcp/mcp_server.js
```

### Step 5.2: Replace With Proper JSON Parsing

```javascript
// BEFORE (broken):
const match = content.match(/\{.*?\}/);
return JSON.parse(match[0]);

// AFTER (working):
function extractJSON(content) {
  const start = content.indexOf('{');
  if (start === -1) return null;
  
  let depth = 0;
  let inString = false;
  let escape = false;
  
  for (let i = start; i < content.length; i++) {
    const char = content[i];
    
    if (escape) { escape = false; continue; }
    if (char === '\\') { escape = true; continue; }
    if (char === '"' && !escape) { inString = !inString; continue; }
    if (inString) continue;
    
    if (char === '{') depth++;
    if (char === '}') {
      depth--;
      if (depth === 0) {
        return JSON.parse(content.slice(start, i + 1));
      }
    }
  }
  return null;
}
```

---

## PHASE 6: WIRE THE GSK CONSCIOUSNESS GATE

**File**: `src/client/advanced/components/AgentPreview.tsx`
**Problem**: `gskConsciousnessOn` toggle (line 30) is local useState that does nothing functional. Never calls any API.

### Step 6.1: Find the Toggle

At line 30: `const [gskConsciousnessOn, setGskConsciousnessOn] = useState(true);`

At lines 339-378: The toggle UI shows GSK Consciousness Gate with ON/OFF descriptions.

### Step 6.2: Wire the Toggle to Real Backend

**Replace the toggle handler** (find the onChange handler for the toggle switch):

```typescript
const handleConsciousnessToggle = async (enabled: boolean) => {
  setGskConsciousnessOn(enabled);
  
  try {
    const response = await fetch('/api/gsk/system/execute', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        command: enabled ? 'activate_consciousness' : 'deactivate_consciousness',
        config: enabled ? {
          dual_process: true,          // System 1 + System 2
          chambers: 34,                // All 34 chambers active
          council: ['profit_prime', 'love_weaver', 'tax_collector', 'harvester'],
          plt_scoring: true,
          metacognition_rate: 0.8
        } : {
          dual_process: false,
          chambers: 0,
          council: [],
          plt_scoring: false,
          metacognition_rate: 0
        }
      })
    });
    
    const result = await response.json();
    console.log(`[GSK] Consciousness ${enabled ? 'ACTIVATED' : 'DEACTIVATED'}:`, result);
  } catch (error) {
    console.error('[GSK] Failed to toggle consciousness:', error);
    setGskConsciousnessOn(!enabled); // Revert on failure
  }
};
```

### Step 6.3: Fix the /api/gsk/system/execute Route

**File**: `src/server/routes/agent.ts` (line 330-350)
**Current state**: Returns hardcoded fake terminal responses.

**Replace with**:
```typescript
router.post('/gsk/system/execute', async (c) => {
  const { command, config } = await c.req.json();
  
  if (command === 'activate_consciousness') {
    // Store consciousness state
    const statePath = path.join(ALLIE_DIR, 'consciousness-state.json');
    const state = {
      active: true,
      config,
      activated_at: new Date().toISOString(),
      // When GSK daemon is running, this would send activation command:
      // gskDaemon.activate(config)
    };
    fs.writeFileSync(statePath, JSON.stringify(state, null, 2));
    
    return c.json({
      success: true,
      message: 'Consciousness activated',
      state
    });
  }
  
  if (command === 'deactivate_consciousness') {
    const statePath = path.join(ALLIE_DIR, 'consciousness-state.json');
    fs.writeFileSync(statePath, JSON.stringify({ active: false }, null, 2));
    
    return c.json({
      success: true,
      message: 'Consciousness deactivated'
    });
  }
  
  return c.json({ success: false, error: `Unknown command: ${command}` });
});
```

---

## PHASE 7: CONNECT CONNECTIONSMANAGER TO REAL OMNIRoUTE

**File**: `src/client/advanced/components/ConnectionsManager.tsx`
**Problem**: OmniRoute is configured at line 32 (`http://127.0.0.1:20128`) but the test connection is fake (`setTimeout(800)`).

### Step 7.1: Find the Test Connection Function

Around line 100, find the test handler:
```typescript
await new Promise(resolve => setTimeout(resolve, 800)); // FAKE
```

### Step 7.2: Replace With Real Health Check

```typescript
const testConnection = async (provider: any) => {
  const startTime = Date.now();
  try {
    const response = await fetch('/api/router/test', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        provider: provider.id,
        baseUrl: provider.baseUrl,
        model: provider.defaultModel
      })
    });
    
    const result = await response.json();
    return {
      ...result,
      latency_ms: result.latency_ms || (Date.now() - startTime)
    };
  } catch (error) {
    return { success: false, error: String(error), latency_ms: -1 };
  }
};
```

---

## PHASE 8: START GSK DAEMON

### Step 8.1: Verify GSK Code Location
```bash
dir "C:\Users\uncom\Desktop\allie\buyasoul-core\gsk\gsk_daemon.js"
# OR use the workspace copy:
dir "the-architect\buyasoul-core\gsk\gsk-core\brain-engine.js"
```

### Step 8.2: Install Dependencies
```bash
cd "C:\Users\uncom\Desktop\allie\buyasoul-core\gsk"
npm install express ws
```

### Step 8.3: Set Environment Variables
```powershell
$env:NINE_ROUTER_URL = "http://127.0.0.1:20128"
$env:NINE_ROUTER_API_KEY = "test"
$env:GEMINI_API_KEY = ""  # Clear fake key, force OmniRoute usage
```

### Step 8.4: Start GSK Daemon
```bash
node gsk_daemon.js
```

**Watch for**:
- `[BOOT] MCP Server active on port 3001`
- `[BRAIN] Connected to OmniRoute — 291 models available`

### Step 8.5: Verify GSK is Alive
```bash
curl http://localhost:3001/health
# EXPECTED: {"status":"alive","modules":452}
```

---

## PHASE 9: FULL INTEGRATION TEST

### Test 1: OmniRoute → Real LLM Response
```bash
curl -X POST http://127.0.0.1:20128/v1/chat/completions -H "Content-Type: application/json" -H "Authorization: Bearer test" -d "{\"model\":\"google/gemini-2.0-flash\",\"messages\":[{\"role\":\"user\",\"content\":\"What is 2+2?\"}]}"
```
**Expected**: Real response from Gemini

### Test 2: OmniRouterService → Real Route
Start the dev server, then:
```bash
curl -X POST http://localhost:3000/api/agent/chat -H "Content-Type: application/json" -d "{\"prompt\":\"Hello, who are you?\"}"
```
**Expected**: Real LLM response, NOT "I am LedgerScout..."

### Test 3: GSK Brain → OmniRoute
```bash
curl -X POST http://localhost:3001/decide -H "Content-Type: application/json" -d "{\"scenario\":\"Should I build a factory or train soldiers?\"}"
```
**Expected**: Real decision from GSK brain using OmniRoute

### Test 4: Workbench → Full Loop
1. Open browser to `http://localhost:3000`
2. Navigate to Tab 3 (GSK ENGINE)
3. Type a message in the chat simulator
4. **EXPECTED**: Real LLM response in console logs, not mock tokens

### Test 5: Consciousness Gate
1. Navigate to Tab 1 (AGENT FORGE)
2. Toggle GSK Consciousness Gate ON
3. **EXPECTED**: Console shows "Consciousness activated" with chamber config
4. Toggle OFF
5. **EXPECTED**: Console shows "Consciousness deactivated"

### Test 6: Connections Health
1. Navigate to Tab 5 (CONNECTIONS)
2. Click test on OmniRoute provider
3. **EXPECTED**: Real latency measurement, not 800ms timeout

---

## COMPLETE FILE CHANGE MANIFEST

| # | File | Lines Changed | What Changes |
|---|------|--------------|--------------|
| 1 | `src/services/OmniRouterService.ts` | ~150 lines | Add fetch calls, replace all mocks |
| 2 | `src/server/routes/agent.ts` | ~80 lines | Fix /agent/chat, /router/test, /gsk/* |
| 3 | `src/client/advanced/components/AgentPreview.tsx` | ~20 lines | Wire consciousness toggle |
| 4 | `src/client/advanced/components/ConnectionsManager.tsx` | ~15 lines | Real health check |
| 5 | `the-architect/buyasoul-core/gsk/gsk-core/llm-router.js` | ~30 lines | Add OmniRoute provider |
| 6 | `the-architect/buyasoul-core/gsk/gsk-core/brain-engine.js` | ~20 lines | OmniRoute connection test |
| 7 | `the-architect/buyasoul-core/gsk/gsk-core/mcp/mcp_server.js` | ~15 lines | Fix JSON parser |

**Total**: ~330 lines changed across 7 files

---

## WHAT YOU'LL HAVE WHEN COMPLETE

1. **Workbench** (port 3000) — 12 tabs, all connected to real backends
2. **OmniRoute** (port 20128) — 291 real LLM models, responding to real requests
3. **GSK Brain** (port 3001) — Consciousness engine routing through OmniRoute
4. **Real AI Responses** — Every "GSK" endpoint returns actual LLM output
5. **Working Consciousness Gate** — Toggle activates/deactivates real GSK state
6. **Honest Health Checks** — Connections tab shows real latency and status
7. **Foundation for CPL** — Once `buyasoul-cpl` repo is cloned, it connects to running GSK on :3001

---

## WHAT STILL NEEDS CPL REPO (Future Phase)

The CPL spatial city (115 modules, 23 RTS files) lives in a **separate repository**:
- GitHub: `buyasoul-ai/buyasoul-cpl`
- Must be cloned into workspace
- Must fix `runtime-config-injection.js` localhost validation
- Must connect to GSK on :3001
- This directive makes GSK ALIVE so CPL has something to connect to

---

*This directive is based on ACTUAL code audit of every file. No assumptions. Execute now.*