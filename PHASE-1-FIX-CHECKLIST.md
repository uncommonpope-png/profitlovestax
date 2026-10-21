# PHASE 1 FIX CHECKLIST: SYSTEM RESURRECTION

## Immediate Actions Required

### 1. Fix GSK Brain Routing (`llm-router.js`)
**File**: `the-architect/buyasoul-core/gsk/gsk-core/llm-router.js`
**Problem**: Routes to dead/fallback providers, ignores working OmniRoute
**Fix**:
```javascript
// Add OmniRoute as primary provider
const OmniRoute = {
  baseUrl: 'http://127.0.0.1:20128/v1',
  headers: { 'Authorization': `Bearer ${process.env.OMNIROUTE_KEY}` }
};

// Priority order: OmniRoute → OpenAI → Fail gracefully
async function routeToLLM(prompt, context) {
  try {
    const response = await fetch(`${OmniRoute.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: OmniRoute.headers,
      body: JSON.stringify({
        model: 'google/gemini-2.0-flash-thinking',
        messages: [{ role: 'user', content: prompt }]
      })
    });
    return await response.json();
  } catch (error) {
    console.log('Falling back to local...');
    return mockResponse(); // Graceful degradation
  }
}
```

### 2. Fix MCP Server Regex (`mcp_server.js`)
**File**: `the-architect/buyasoul-core/gsk/gsk-core/mcp/mcp_server.js`
**Problem**: `/{.*?}/` truncates nested JSON in tool calls
**Fix**:
```javascript
// Replace regex-based JSON parsing with proper parser
function parseToolCall(content) {
  // Old broken way:
  // const match = content.match(/\{.*?\}/);
  
  // New correct way:
  try {
    const jsonStart = content.indexOf('{');
    const jsonEnd = content.lastIndexOf('}') + 1;
    if (jsonStart >= 0 && jsonEnd > jsonStart) {
      return JSON.parse(content.slice(jsonStart, jsonEnd));
    }
  } catch (e) {
    console.error('JSON parse error:', e);
    return null;
  }
}
```

### 3. Fix CPL Endpoint Validation (`runtime-config-injection.js`)
**File**: `src/genesis/runtime-config-injection.js`
**Problem**: Rejects `http://localhost:3001` for production
**Fix**:
```javascript
validateEndpoint(url) {
  // Allow localhost for development
  if (url.includes('localhost') || url.includes('127.0.0.1')) {
    return true;
  }
  
  // Production requires HTTPS/WSS
  return url.startsWith('https://') || url.startsWith('wss://');
}
```

### 4. Start GSK Daemon with Working Connection
**Command**: 
```bash
cd the-architect/buyasoul-core/gsk
node gsk_daemon.js
```
**Verify**: Check if MCP server responds on :3001

### 5. Replace Mocked OmniRouterService (`OmniRouterService.ts`)
**File**: `src/services/OmniRouterService.ts`
**Problem**: Uses `Math.random()` instead of real LLM calls
**Fix**:
```typescript
async function callOmniRoute(model: string, prompt: string): Promise<string> {
  const response = await fetch('http://127.0.0.1:20128/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.OMNIROUTE_API_KEY}`
    },
    body: JSON.stringify({
      model,
      messages: [{ role: 'user', content: prompt }]
    })
  });
  
  const data = await response.json();
  return data.choices[0].message.content;
}
```

### 6. Verify API Keys Work
**File**: `.env`
**Check**:
- `OPENAI_API_KEY` — Verify with `curl -H "Authorization: Bearer $OPENAI_API_KEY" https://api.openai.com/v1/models`
- `NVIDIA_API_KEY` — Verify with OmniRoute test
- `GEMINI_API_KEY` — **Must replace fake key** with working one or remove Gemini from routing

---

## Verification Tests

### Test 1: GSK Daemon Connectivity
```bash
curl http://localhost:3001/health
# Should return: {"status": "alive", "modules": 452}
```

### Test 2: OmniRoute Integration
```bash
curl http://localhost:20128/v1/models
# Should return list of 291 models
```

### Test 3: CPL-RTS Connection
```bash
# Load CPL in browser, open dev tools
# Check console for "MCP Connected" message
# Check Network tab for WebSocket connection to :3001
```

---

## Success Criteria

✅ GSK daemon starts without errors  
✅ MCP server responds on :3001  
✅ Brain engine routes to OmniRoute successfully  
✅ CPL accepts localhost endpoints  
✅ RTS modules receive AI decisions from GSK  
✅ Full loop works: User Input → GSK → OmniRoute → CPL → RTS  

---

## Next Steps After Phase 1

Once these fixes are deployed:
1. Start GSK daemon: `npm run dev:gsk`
2. Start CPL dev server: `cd buyasoul-cpl && npm run dev`
3. Verify RTS modules are receiving consciousness input
4. Begin Phase 2: Full RTS awakening and multiplayer integration

---

*Checklist created for immediate implementation prioritization*