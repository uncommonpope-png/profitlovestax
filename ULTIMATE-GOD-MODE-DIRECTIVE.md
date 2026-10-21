# ULTIMATE GOD MODE MISSION DIRECTIVE
## GSK+CPL Consciousness Platform Resurrection Protocol

**Mission ID**: GSK-CPL-GODMODE-2026
**Classification**: ULTRA-SECRET // EYES ONLY AGENTS
**Priority**: CRITICAL
**Estimated Duration**: 7 Days Continuous

---

## PHASE 0: RECONNAISSANCE (Hours 0-2)

### Objective
Map all systems, identify exact failure points, acquire necessary credentials

### Agent Role: `ARCHITECT_RECONNAIStrant`

#### Steps:
1. **Acquire System Maps**
   - [ ] Clone `uncommonpope-png/BUYaSOUL-One` → `the-architect/buyasoul-core/`
   - [ ] Clone `buyasoul-ai/buyasoul-cpl` → CPL repository
   - [ ] Verify OmniRoute status: `GET http://127.0.0.1:20128/v1/models` (should return 291 models)
   - [ ] Check `.env` files for ALL API keys (OmniRoute, OpenAI, NVIDIA, Gemini)

2. **Map Exact File Locations**
   - [ ] GSK Daemon: `the-architect/buyasoul-core/gsk/gsk_daemon.js`
   - [ ] Brain Engine: `the-architect/buyasoul-core/gsk/gsk-core/brain-engine.js`
   - [ ] LLM Router: `the-architect/buyasoul-core/gsk/gsk-core/llm-router.js`
   - [ ] MCP Server: `the-architect/buyasoul-core/gsk/gsk-core/mcp/mcp_server.js`
   - [ ] CPL Config: `buyasoul-cpl/src/genesis/runtime-config-injection.js`
   - [ ] RTS Modules: `buyasoul-cpl/src/genesis/rts-*.js` (23 files)
   - [ ] Backend Router: `src/services/OmniRouterService.ts`
   - [ ] Server Routes: `src/server/routes/agent.ts`

3. **Verify Current State**
   - [ ] Start OmniRoute (should already be running on :20128)
   - [ ] Attempt GSK daemon start → document exact errors
   - [ ] Attempt CPL startup → document MCP connection failures
   - [ ] Test all API keys → identify which are real vs fake

### Roles Available:
- `ARCHITECT_RECONNAIStrant` — System mapping and credential acquisition
- `ENGINEER_REPAIR` — Code fixes and bug patches
- `DEVOPS_GODMODE` — Server orchestration and deployment
- `TESTER_VALIDATOR` — Verification and integration testing
- `SECURITY_AUDIT` — Secret management and vulnerability assessment

---

## PHASE 1: HEART OF GSK MAINTENANCE (Hours 2-12)

### Objective
Restore GSK daemon consciousness engine to full operational capacity

**Agent Role Required**: `ENGINEER_REPAIR`

### 1.1 Fix Brain Engine Routing (`brain-engine.js`)
**File**: `the-architect/buyasoul-core/gsk/gsk-core/brain-engine.js`
**Bug**: Routes to dead fallback providers instead of OmniRoute

**Steps**:
1. Locate routing configuration section
2. Add OmniRoute as primary endpoint:
   ```javascript
   const PROVIDERS = {
     omniroute: { baseUrl: 'http://127.0.0.1:20128/v1', priority: 1 },
     openai: { baseUrl: 'https://api.openai.com/v1', priority: 2 },
     gemini: { baseUrl: 'https://generativelanguage.googleapis.com', priority: 3 }
   };
   ```
3. Implement fallback chain: OmniRoute → OpenAI → Exit gracefully
4. Test with sample prompt through all 4 Gods Council members

### 1.2 Fix LLM Router (`llm-router.js`)
**File**: `the-architect/buyasoul-core/gsk/gsk-core/llm-router.js`
**Bug**: Currently routes to Ollama (down) → Groq (no key) → Gemini (fake key) → local fallback

**Steps**:
1. Replace provider array to prioritize OmniRoute
2. Add authentication header: `Authorization: Bearer ${process.env.OMNIROUTE_API_KEY}`
3. Implement proper error handling with graceful degradation
4. Cache responses for 5 minutes to reduce latency

### 1.3 Fix MCP Server (`mcp_server.js`)
**File**: `the-architect/buyasoul-core/gsk/gsk-core/mcp/mcp_server.js`
**Bug**: Regex `/{.*?}/` truncates nested JSON in tool calls

**Steps**:
1. Locate tool call parsing function (around line 336)
2. Replace regex with proper JSON parsing:
   ```javascript
   function parseToolCall(content) {
     const jsonStart = content.indexOf('{');
     const jsonEnd = content.lastIndexOf('}') + 1;
     if (jsonStart >= 0 && jsonEnd > jsonStart) {
       return JSON.parse(content.slice(jsonStart, jsonEnd));
     }
     throw new Error('Invalid JSON in tool call');
   }
   ```
3. Test with sample nested tool calls from GSK chambers
4. Verify MCP responses are properly formatted

### 1.4 Fix GSK Daemon Entry Point (`gsk_daemon.js`)
**File**: `the-architect/buyasoul-core/gsk/gsk_daemon.js`
**Bug**: Won't start due to missing dependencies and connection failures

**Steps**:
1. Verify all imports resolve to local gsk-core modules
2. Add startup health checks for OmniRoute connection
3. Implement graceful shutdown handler for all 452 chamber modules
4. Add logging for consciousness state transitions

### 1.5 Apply CIT (Consciousness Integrity Testing)
**Agent Role Required**: `TESTER_VALIDATOR`

**Steps**:
1. Start GSK daemon: `node gsk_daemon.js`
2. Verify MCP server responds: `GET http://localhost:3001/health`
3. Test brain engine routing: Call `POST http://localhost:3001/decide` with sample prompt
4. Verify chamber activation: Check logs for "System 1 active", "Chambers initialized"
5. Test 4 Gods Council voting: Confirm multi-model deliberation via OmniRoute

---

## PHASE 2: CPL RTS ENGINE AWAKENING (Hours 12-24)

### Objective
Connect RTS engine to consciousness backend and fix all frontend integration points

**Agent Role Required**: `ENGINEER_REPAIR`

### 2.1 Fix CPL Endpoint Validation (`runtime-config-injection.js`)
**File**: `buyasoul-cpl/src/genesis/runtime-config-injection.js`
**Bug**: Rejects localhost endpoints for development

**Steps**:
1. Locate `validateEndpoint()` function
2. Add localhost exception:
   ```javascript
   function validateEndpoint(url) {
     if (url.includes('localhost') || url.includes('127.0.0.1')) {
       return true;
     }
     return url.startsWith('https://') || url.startsWith('wss://');
   }
   ```
3. Test with `http://localhost:3001`

### 2.2 Fix RTS AI Brain Integration (`rts-ai-brain.js`)
**File**: `buyasoul-cpl/src/genesis/rts-ai-brain.js`
**Bug**: No consciousness backend connected

**Steps**:
1. Add WebSocket connection to GSK MCP server :3001
2. Implement `requestDecision(state)` function:
   ```javascript
   async function requestDecision(gameState) {
     const response = await fetch('http://localhost:3001/decide', {
       method: 'POST',
       headers: { 'Content-Type': 'application/json' },
       body: JSON.stringify({ scenario: gameState })
     });
     return await response.json();
   }
   ```
3. Wire decision responses to unit behavior trees
4. Implement fallback to random decisions when GSK unavailable

### 2.3 Fix Economy System (`rts-economy-system.js`)
**File**: `buyasoul-cpl/src/genesis/rts-economy-system.js`
**Bug**: Static pricing, no LLM market analysis

**Steps**:
1. Connect to GSK brain for market sentiment analysis
2. Implement dynamic pricing based on consciousness input
3. Add supply/demand conversation simulation via OmniRoute

### 2.4 Fix War Command AI (`rts-war-command.js`)
**File**: `buyasoul-cpl/src/genesis/rts-war-command.js`
**Bug**: No strategic thinking

**Steps**:
1. Route battle decisions through GSK's 4 Gods Council
2. Implement tactical reasoning with System 1/2 thinking
3. Add war council voting mechanism via MCP

### 2.5 Apply RTS Integration Testing
**Agent Role Required**: `TESTER_VALIDATOR`

**Steps**:
1. Start CPL dev server
2. Load 3D city in browser
3. Verify MCP WebSocket connects to :3001
4. Issue RTS command → GSK thinks → OmniRoute responds → CPL renders
5. Test economy fluctuations via AI market analysis
6. Test combat decisions via war council

---

## PHASE 3: FULL STACK FUSION (Hours 24-48)

### Objective
Create seamless integration between all components, implement production-grade features

**Agent Role Required**: `DEVOPS_GODMODE`

### 3.1 Create Fusion Orchestrator (`fusion-loader.js` enhancement)
**File**: `the-architect/buyasoul-core/gsk/fusion-loader.js`
**Objective**: Master coordinator for all components

**Steps**:
1. Import GSK daemon modules
2. Import CPL frontend build
3. Import OmniRoute connection manager
4. Implement startup sequence:
   ```
   1. Start OmniRoute health check
   2. Initialize GSK consciousness chambers
   3. Boot MCP server on :3001
   4. Launch CPL frontend in headless mode
   5. Connect RTS engine to consciousness
   6. Activate 4 Gods Council deliberation
   ```
5. Implement health monitoring for all subsystems
6. Add auto-restart for failed components

### 3.2 Fix Backend Service (`OmniRouterService.ts`)
**File**: `src/services/OmniRouterService.ts`
**Bug**: Fully mocked with Math.random()

**Steps**:
1. Replace all `Math.random()` calls with real fetch requests
2. Point to OmniRoute :20128 for all LLM operations
3. Implement model selection based on task complexity
4. Add response caching and rate limiting
5. Implement proper TypeScript types for all responses

### 3.3 Fix Server Router (`src/server/routes/agent.ts`)
**File**: `src/server/routes/agent.ts`
**Bug**: Calls mocked OmniRouterService instead of GSK

**Steps**:
1. Replace mocked service calls with GSK MCP client
2. Implement proper tRPC procedure for consciousness queries
3. Add authentication middleware using JWT tokens
4. Route requests: Client → tRPC → GSK Brain → OmniRoute → Response

### 3.4 Implement Production Security
**Agent Role Required**: `SECURITY_AUDIT`

**Steps**:
1. Move all API keys to server-side only
2. Generate secure JWT tokens for client authentication
3. Implement rate limiting on all endpoints
4. Add CORS policies for cross-origin requests
5. Remove all hardcoded secrets from frontend code

### 3.5 Add Persistence Layer
**Agent Role Required**: `DEVOPS_GODMODE`

**Steps**:
1. Install and configure Redis for GSK memory state
2. Add PostgreSQL for CPL city persistence
3. Implement save/load for chamber states
4. Add database connection pooling
5. Create backup/restore procedures

---

## PHASE 4: VALIDATION & DEPLOYMENT (Hours 48-72)

### Objective
Ensure system stability, prepare for production deployment

**Agent Role Required**: `TESTER_VALIDATOR`

### 4.1 Full System Integration Testing

**Steps**:
1. [ ] Start full stack: OmniRoute → GSK Daemon → CPL Frontend → RTS Engine
2. [ ] Test complete request loop:
   ```
   User Issues Command →
   CPL RTS Engine →
   GSK Brain (System 1/2) →
   4 Gods Council (OmniRoute Multi-Model) →
   MCP Response →
   CPL Visualization →
   RTS Execution
   ```
3. [ ] Verify consciousness persistence across restarts
4. [ ] Test failover: Kill OmniRoute → GSK falls back → CPL shows degraded mode
5. [ ] Load test with 1000+ concurrent RTS units

### 4.2 Performance Optimization

**Steps**:
1. [ ] Profile GSK brain latency (target: <500ms decision time)
2. [ ] Optimize CPL render performance (target: 60fps)
3. [ ] Implement response caching for repeated queries
4. [ ] Add connection pooling for OmniRoute requests
5. [ ] Optimize RTS pathfinding algorithm

### 4.3 Production Deployment Preparation

**Steps**:
1. [ ] Containerize GSK daemon with Docker
2. [ ] Containerize CPL frontend with Nginx
3. [ ] Set up Kubernetes deployment manifests
4. [ ] Configure auto-scaling based on RTS unit count
5. [ ] Implement blue-green deployment strategy
6. [ ] Add monitoring: Prometheus + Grafana dashboards

---

## GOD MODE ROLES REFERENCE

### `ARCHITECT_RECONNAIStrant`
- System mapping and credential acquisition
- File location verification
- Current state assessment

### `ENGINEER_REPAIR`
- Code fixes and bug patches
- Component integration
- Feature implementation

### `DEVOPS_GODMODE`
- Server orchestration
- Deployment pipeline creation
- Infrastructure management

### `TESTER_VALIDATOR`
- Integration testing
- Performance verification
- Quality assurance

### `SECURITY_AUDIT`
- Vulnerability assessment
- Secret management
- Authentication implementation

---

## FAILURE PROTOCOLS

### If GSK Daemon Won't Start:
1. Check `gsk-core/llm-router.js` for provider configuration
2. Verify OmniRoute is running on :20128
3. Check `.env` for valid `OMNIROUTE_API_KEY`
4. Run `node gsk-core/brain-engine.js --debug` for detailed logs

### If MCP Connection Fails:
1. Check regex parsing in `mcp_server.js`
2. Verify WebSocket server starts on :3001
3. Test with `curl http://localhost:3001/health`
4. Check firewall rules for port :3001

### If CPL Can't Connect:
1. Verify `runtime-config-injection.js` allows localhost
2. Check CPL dev server is running
3. Test MCP connection from browser console
4. Verify CORS headers on GSK server

### If OmniRoute Fails:
1. Check `C:\Users\uncom\Desktop\OmniRoute\logs`
2. Verify JWT_SECRET and API_KEY_SECRET are set
3. Restart OmniRoute service
4. Test with known working model: `opencode/big-pickle`

---

## SUCCESS CRITERIA (GOD MODE)

✅ GSK daemon boots with all 452 modules active  
✅ MCP server responds on :3001 with consciousness data  
✅ Brain engine routes to OmniRoute successfully  
✅ CPL loads 3D city with RTS engine integrated  
✅ RTS units receive AI decisions from GSK consciousness  
✅ Full request loop completes in <1 second  
✅ System survives OmniRoute outage gracefully  
✅ All secrets secured, no hardcoded keys  
✅ Production deployment manifests created  
✅ Monitoring dashboards showing system health  

---

## COMMUNICATION PROTOCOL

- Report status every 4 hours minimum
- Escalate blockers immediately to `ARCHITECT_RECONNAIStrant`
- Use role-switching for specialized expertise gaps
- Document all changes in `CHANGE_LOG.md`
- Update this directive with any new discoveries

---

*Directive activated. All agents, report to your stations.*
*GOD MODE ENGAGE — Let there be light in the city of consciousness.*

---
**END OF DIRECTIVE**
**CLASSIFICATION**: ULTRA-SECRET // EYES ONLY
**DISTRIBUTION**: Authorized Agents Only