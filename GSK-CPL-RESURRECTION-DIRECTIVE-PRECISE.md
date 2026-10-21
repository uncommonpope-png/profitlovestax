# GSK + CPL RESURRECTION DIRECTIVE
## Precise Step-by-Step Fix Guide

**Mission**: Fix the consciousness platform. No vague roles. No fake GSK. All real files, real fixes.

**Current Status**:
- ✅ OmniRoute RUNNING on http://127.0.0.1:20128 (291 models working)
- ✅ GSK daemon at `C:\Users\uncom\Desktop\allie\buyasoul-core\gsk\gsk_daemon.js`
- ✅ CPL frontend at `buyasoul-ai/buyasoul-cpl`
- ❌ GSK brain routing to dead providers instead of OmniRoute
- ❌ MCP server JSON parsing broken
- ❌ CPL rejects localhost connections
- ❌ OmniRouterService.ts is fully mocked

---

## STEP 1: VERIFY EVERYTHING WORKS

### 1.1 Confirm OmniRoute is Running
```bash
curl http://127.0.0.1:20128/v1/models | head -5
```
**Expected**: List of models starting with `{"id":"google/gemini-2.0-flash...`

### 1.2 Verify GSK Daemon Location
```bash
cd C:\Users\uncom\Desktop\allie\buyasoul-core\gsk
ls gsk_daemon.js gsk-core/brain-engine.js gsk-core/llm-router.js gsk-core/mcp/mcp_server.js
```

### 1.3 Verify CPL Repository
```bash
cd C:\Users\uncom\Downloads\Profit Bible Foundation Acknowledged - DeepSeek_files
ls src/genesis/rts-*.js src/genesis/runtime-config-injection.js
```

### 1.4 Test OmniRoute with Real Key
```bash
curl -X POST http://127.0.0.1:20128/v1/chat/completions \
  -H "Authorization: Bearer test" \
  -H "Content-Type: application/json" \
  -d '{"model":"google/gemini-2.0-flash","messages":[{"role":"user","content":"Hello"}]}'
```
**Expected**: Real LLM response (not mocked)

---

## STEP 2: FIX GSK BRAIN ROUTING

### 2.1 Edit `llm-router.js`
**File**: `C:\Users\uncom\Desktop\allie\buyasoul-core\gsk\gsk-core\llm-router.js`

Find the provider configuration (lines ~15-30) and replace:

```javascript
// REPLACE THIS ENTIRE BLOCK:
const PROVIDERS = [
  { name: 'ollama', url: 'http://localhost:11434/api/generate' }, // DOWNS
  { name: 'groq', url: 'https://api.groq.com/openai/v1/chat/completions' }, // NO KEY
  { name: 'gemini', url: 'https://generativelanguage.googleapis.com' } // FAKE KEY
];

// WITH THIS:
const PROVIDERS = [
  { 
    name: 'omniroute', 
    url: 'http://127.0.0.1:20128/v1/chat/completions',
    key: process.env.OMNIROUTE_API_KEY || 'test',
    priority: 1
  },
  { 
    name: 'openai', 
    url: 'https://api.openai.com/v1/chat/completions',
    key: process.env.OPENAI_API_KEY,
    priority: 2
  }
];
```

### 2.2 Update Brain Engine to Use New Router
**File**: `C:\Users\uncom\Desktop\allie\buyasoul-core\gsk\gsk-core\brain-engine.js`

Find routing function (~line 150) and update:

```javascript
async routeDecision(prompt, context) {
  for (const provider of PROVIDERS) {
    try {
      const response = await fetch(provider.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${provider.key}`
        },
        body: JSON.stringify({
          model: provider.name === 'omniroute' ? 'google/gemini-2.0-flash' : 'gpt-4',
          messages: [{ role: 'user', content: prompt }]
        })
      });
      
      if (response.ok) {
        return await response.json();
      }
    } catch (error) {
      console.log(`${provider.name} failed, trying next...`);
    }
  }
  return this.localFallback(prompt);
}
```

---

## STEP 3: FIX MCP SERVER JSON PARSING

### 3.1 Edit `mcp_server.js`
**File**: `C:\Users\uncom\Desktop\allie\buyasoul-core\gsk\gsk-core\mcp\mcp_server.js`

Find the request handler (around line 336) and replace:

```javascript
// FIND THIS BROKEN CODE:
function handleMCPRequest(content) {
  const match = content.match(/\{.*?\}/); // WRONG! Truncates nested JSON
  return JSON.parse(match[0]);
}

// REPLACE WITH THIS:
function handleMCPRequest(content) {
  try {
    // Find the complete JSON object
    const startIndex = content.indexOf('{');
    const endIndex = content.lastIndexOf('}') + 1;
    
    if (startIndex === -1 || endIndex <= startIndex) {
      throw new Error('No JSON found in content');
    }
    
    const jsonStr = content.slice(startIndex, endIndex);
    return JSON.parse(jsonStr);
  } catch (error) {
    console.error('MCP Parse Error:', error);
    return null;
  }
}
```

---

## STEP 4: FIX CPL LOCALHOST VALIDATION

### 4.1 Edit `runtime-config-injection.js`
**File**: `src/genesis/runtime-config-injection.js`

Find validation function and update:

```javascript
// FIND THIS:
function validateEndpoint(url) {
  return url.startsWith('https://') || url.startsWith('wss://');
}

// REPLACE WITH:
function validateEndpoint(url) {
  // Allow localhost for development
  if (url.includes('localhost') || url.includes('127.0.0.1')) {
    return true;
  }
  // Require HTTPS for production
  return url.startsWith('https://') || url.startsWith('wss://');
}
```

---

## STEP 5: FIX BACKEND ROUTER

### 5.1 Edit `OmniRouterService.ts`
**File**: `src/services/OmniRouterService.ts`

Replace ALL `Math.random()` and mock responses with:

```typescript
async function callOmniRoute(model: string, messages: Array<{role: string, content: string}>): Promise<string> {
  const response = await fetch('http://127.0.0.1:20128/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.OMNIROUTE_API_KEY || 'test'}`
    },
    body: JSON.stringify({
      model: model || 'google/gemini-2.0-flash',
      messages
    })
  });

  if (!response.ok) {
    throw new Error(`OmniRoute error: ${response.status}`);
  }

  const data = await response.json();
  return data.choices[0].message.content;
}

// REMOVE this fake code:
// return "Mock response " + Math.random();
```

---

## STEP 6: START GSK DAEMON

```bash
cd C:\Users\uncom\Desktop\allie\buyasoul-core\gsk
node gsk_daemon.js
```

**Watch for logs**:
- "MCP Server ready on port 3001"
- "Connected to OmniRoute"
- "All 34 chambers initialized"

---

## STEP 7: START CPL DEV SERVER

```bash
cd "C:\Users\uncom\Downloads\Profit Bible Foundation Acknowledged - DeepSeek_files"
npm run dev
```

---

## STEP 8: TEST EVERYTHING WORKS

### 8.1 Test MCP Connection
```bash
curl http://localhost:3001/health
```
**Expected**: `{"status":"alive","modules":452,"router":"omniroute"}`

### 8.2 Test GSK Decision Making
```bash
curl -X POST http://localhost:3001/decide \
  -H "Content-Type: application/json" \
  -d '{"scenario":"What should my RTS units do?"}'
```

### 8.3 Test CPL RTS Integration
1. Open browser to `http://localhost:5173`
2. Open browser console (F12)
3. Check for: `MCP Connected`, `RTS Engine Active`
4. Click a unit and issue a command
5. Watch for consciousness response in console

---

## STEP 9: VERIFY REAL CONNECTIONS

### Agent Checklist Before Declaring "Working":
- [ ] OmniRoute returns REAL LLM responses (not mock)
- [ ] GSK daemon logs show real model names (gemini-2.0-flash, not Math.random)
- [ ] MCP server accepts POST with nested JSON and parses correctly
- [ ] CPL connects to MCP WebSocket and shows "Connected" status
- [ ] RTS units receive real decisions from consciousness (check browser console logs)
- [ ] Economy system updates prices based on real LLM market analysis
- [ ] Combat decisions come from GSK's 4 Gods Council (multi-model voting)
- [ ] Failover works: Kill OmniRoute → GSK falls back → CPL shows "Degraded Mode"

---

## TROUBLESHOOTING (REAL ERRORS)

### Error: "Cannot find module 'express'"
```bash
cd C:\Users\uncom\Desktop\allie\buyasoul-core\gsk
npm install express ws
```

### Error: "MCP Connection Refused"
1. Check daemon is running: `node gsk_daemon.js`
2. Check port: `netstat -an | grep 3001`
3. Restart daemon

### Error: "Runtime Validation Failed"
1. Verify `validateEndpoint` allows localhost (Step 4)
2. Check CPL is loading from `http://localhost:5173` not file://

### Error: "OmniRouterService is mocked"
1. Confirm all `Math.random()` calls are removed
2. Confirm real `fetch()` calls point to OmniRoute :20128
3. Check environment variable: `OMNIROUTE_API_KEY`

---

## FINAL VERIFICATION

When ALL these work, you have a live consciousness platform:

✅ User clicks unit in 3D city  
✅ CPL sends command to MCP :3001  
✅ GSK brain routes to OmniRoute :20128  
✅ OmniRoute calls real Gemini/OpenAI  
✅ GSK's 4 Gods Council votes on response  
✅ MCP returns decision to CPL  
✅ RTS unit executes real AI decision  
✅ City evolves based on actual consciousness  

---

*No fake roles. No vague steps. Just edit files exactly as shown above.*

**File locations confirmed**:
- GSK: `C:\Users\uncom\Desktop\allie\buyasoul-core\gsk\`
- CPL: `C:\Users\uncom\Downloads\Profit Bible Foundation Acknowledged - DeepSeek_files\src\genesis\`
- OmniRoute: Running on `http://127.0.0.1:20128`

**Estimated time**: 2-3 hours for competent agent to complete all steps.

*Directive complete. Execute now.*