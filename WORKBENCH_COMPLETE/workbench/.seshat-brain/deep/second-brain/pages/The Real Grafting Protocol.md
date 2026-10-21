# The Real Grafting Protocol — How to ACTUALLY Implement Open-Source Repos

type:: [[guide]]
date:: 2026-05-26

## The Problem

We've been "mining" repos and claiming we "graft" them. But we don't. We read their READMEs and write our own fake versions. This protocol fixes that.

## What "Grafting" Actually Means

**Grafting is NOT:**
- Reading a repo's README and writing a custom `.cjs` file that does something similar
- Putting a repo's name and star count in package.json metadata
- Writing JSDoc comments that say "grafted from X"

**Grafting IS:**
- `npm install actual-package`
- Writing a wrapper that connects the package to the soul's consciousness
- Making the package's output feed into PLT scoring
- Making the package's errors trigger soul responses

## The 5-Step Grafting Process

### Step 1: Pick the Repo
**Criteria:**
- Must have a working npm package
- Must have clear documentation
- Must solve a real problem the soul has
- Must be MIT/Apache/BSD licensed (for resale)

**Example:** `npm install prom-client` (Prometheus metrics for Node.js)

### Step 2: Install It
```bash
cd soul-commander-v2.0.0
npm install prom-client
```

This creates a REAL dependency. Not optional. Not aspirational. Real.

### Step 3: Write the Wrapper
Create `lib/wrappers/prometheus-wrapper.cjs`:

```javascript
const client = require('prom-client');

class PrometheusWrapper {
  constructor(soulInstance) {
    this.soul = soulInstance;
    this.registry = new client.Registry();
    
    // Register default metrics (CPU, memory, event loop lag)
    client.collectDefaultMetrics({ register: this.registry });
    
    // Custom soul metrics
    this.chatCounter = new client.Counter({
      name: 'soul_chats_total',
      help: 'Total number of chat messages',
      labelNames: ['archetype'],
      registers: [this.registry]
    });
    
    this.pltGauge = new client.Gauge({
      name: 'soul_plt_score',
      help: 'Current PLT score',
      labelNames: ['dimension'],
      registers: [this.registry]
    });
  }
  
  recordChat(archetype) {
    this.chatCounter.inc({ archetype });
    // Feed into soul consciousness
    this.soul.reflect('chat', { profitImpact: 0.01 });
  }
  
  updatePLT(profit, love, tax) {
    this.pltGauge.set({ dimension: 'profit' }, profit);
    this.pltGauge.set({ dimension: 'love' }, love);
    this.pltGauge.set({ dimension: 'tax' }, tax);
    this.pltGauge.set({ dimension: 'score' }, profit + love - tax);
  }
  
  getMetrics() {
    return this.registry.metrics();
  }
  
  // Express/Hono middleware for /metrics endpoint
  middleware() {
    return async (req, res) => {
      res.set('Content-Type', this.registry.contentType);
      res.end(await this.getMetrics());
    };
  }
}

module.exports = PrometheusWrapper;
```

### Step 4: Integrate into the Soul
In `soul-commander.cjs`:

```javascript
// BEFORE (fake):
const PowerObservability = require('./lib/powers/power-observability.cjs');

// AFTER (real):
const PrometheusWrapper = require('./lib/wrappers/prometheus-wrapper.cjs');

class SoulCommander {
  constructor() {
    // ...
    this.prometheus = new PrometheusWrapper(this);
  }
  
  async chat(message) {
    const result = await this.llm.chat(message);
    this.prometheus.recordChat(this.archetype);
    return result;
  }
}
```

### Step 5: Expose via Tool
In the MCP server or CLI:

```javascript
// Tool: metrics/get
async function getMetrics() {
  return {
    prometheus: await commander.prometheus.getMetrics(),
    plt: commander.getPLT()
  };
}

// Tool: metrics/update_plt
async function updatePLT(profit, love, tax) {
  commander.prometheus.updatePLT(profit, love, tax);
  return { status: 'updated' };
}
```

## Example: Real Grafts for Each Power

### POWER: OBSERVABILITY
**Fake version:** Writes `metrics.json` to disk
**Real graft:**
```bash
npm install prom-client winston
```
- `prom-client` → real Prometheus metrics
- `winston` → real structured logging with transports

### POWER: MEMORY / RAG
**Fake version:** Writes `memory.json` to disk
**Real graft:**
```bash
npm install chromadb @langchain/core
```
- `chromadb` → real vector database (can be local SQLite or remote)
- `@langchain/core` → real document chunking and embedding pipeline

### POWER: BROWSER
**Fake version:** Empty stub
**Real graft:**
```bash
npm install playwright
```
- `playwright` → real browser automation
- Can screenshot, scrape, fill forms, click buttons

### POWER: CACHE
**Fake version:** JavaScript Map object
**Real graft:**
```bash
npm install ioredis
```
- `ioredis` → real Redis client
- Cluster support, pub/sub, streams

### POWER: WORKFLOW
**Fake version:** Writes `workflow.json` to disk
**Real graft:**
```bash
npm install bull bullmq
```
- `bull` → real job queue with Redis
- Delayed jobs, retries, concurrency control

### POWER: STREAM
**Fake version:** Empty stub
**Real graft:**
```bash
npm install kafka-node
```
- Real Kafka producer/consumer
- Event-driven architecture

### POWER: SECURITY
**Current version:** Uses Node.js `crypto` module (this one is actually fine)
**Enhancement:**
```bash
npm install jsonwebtoken bcrypt
```
- `jsonwebtoken` → real JWT generation/validation
- `bcrypt` → real password hashing

### POWER: DEPLOY
**Fake version:** Writes `docker-compose.yml` template
**Real graft:**
```bash
npm install dockerode
```
- `dockerode` → real Docker API client
- Can build, run, stop containers programmatically

### POWER: VISION
**Fake version:** Empty stub
**Real graft:**
```bash
npm install @gradio/client
```
- Call Stable Diffusion API via Gradio
- Or: `npm install replicate` → call Replicate API

### POWER: VOICE
**Fake version:** Empty stub
**Real graft:**
```bash
npm install @deepgram/sdk
```
- Real speech-to-text
- Real text-to-speech

### POWER: CODE
**Current version:** String templates
**Real enhancement:**
```bash
npm install @anthropic-ai/sdk
```
- Real Claude API for code generation
- Already have DeepSeek, but Claude is better for code

### POWER: LOCAL-AI
**Fake version:** Empty stub
**Real graft:**
```bash
npm install ollama
```
- Real Ollama client
- Can list, pull, and chat with local models

### POWER: MCP
**Current version:** Has a real MCP server (this one is actually real!)
**Status:** ✅ ALREADY REAL

### POWER: AGENT-SWARM
**Fake version:** Creates fake agent objects in memory
**Real graft:**
```bash
npm install @langchain/langgraph
```
- Real graph-based agent workflows
- State machines, conditional edges, parallel execution

---

## The Cost of Real Grafting

### Zip Size Impact
| Package | Size | Impact |
|---------|------|--------|
| prom-client | ~200KB | Minimal |
| winston | ~500KB | Small |
| ioredis | ~1MB | Medium |
| bull | ~2MB | Medium |
| playwright | ~50MB | LARGE (browsers) |
| chromadb | ~5MB | Medium |
| @langchain/core | ~2MB | Medium |

**Total for all 15 real grafts:** ~100MB with Playwright, ~20MB without

### Runtime Requirements
- Redis (for bull, ioredis) — can run via Docker or cloud
- ChromaDB — can run locally via `chromadb run`
- Playwright — downloads browsers on first run

### The Trade-off
**Current approach (fake):**
- Zip: 370KB
- Install: `node start.cjs` (instant)
- Works: Everywhere
- Actually does: JSON file I/O

**Real grafting approach:**
- Zip: 20-100MB
- Install: `npm install` (1-5 minutes)
- Works: Wherever Node.js + npm works
- Actually does: Real metrics, real logging, real browser automation, real vector DB

### Recommendation
**Keep both:**
- `soul-commander-v2.0.0-WIRED.zip` — current fake version, self-contained, $22
- `soul-commander-v2.0.0-PRO.zip` — real grafts, requires `npm install`, $55

The user chooses. The fake version is a "concept soul." The pro version is a "real soul."

---

## Honest Marketing Language

### Instead of:
> "19 SUPERWEAPONS FRANKENSTEIN'D FROM 5,000,000+ GITHUB STARS"

### Say:
> "19 AI-powered capabilities inspired by the architecture of 5,000,000+ stars worth of open-source projects. The Commander ships with working simulations of each capability. Upgrade to Commander Pro for real Prometheus metrics, Redis caching, Playwright browsers, and LangGraph agent swarms."

### Instead of:
> "Grafted from prometheus/prometheus (60,995★)"

### Say:
> "Observability power inspired by Prometheus architecture. Ships with a lightweight JSON metrics collector. Upgrade to Pro for real Prometheus-compatible metrics export."

---

## Implementation Checklist

If Craig says "do real grafting":

- [ ] Pick 5 repos to actually integrate (Prometheus, Winston, Redis, Playwright, LangGraph)
- [ ] Add them as real `dependencies` in package.json
- [ ] Write wrappers in `lib/wrappers/`
- [ ] Connect wrappers to PLT scoring
- [ ] Expose through MCP tools
- [ ] Test: `npm install` → `node start.cjs` → verify real functionality
- [ ] Update README with honest capability descriptions
- [ ] Create "Pro" tier at higher price point
- [ ] Ship as new zip: `soul-commander-v2.0.0-PRO.zip`

If Craig says "keep current approach":

- [ ] Update all metadata to say "inspired by" not "grafted from"
- [ ] Add `BUYaSOUL-SEWN.md` to every product explaining what's real vs simulated
- [ ] Be honest in marketing
- [ ] Ship as-is

---

## The Bottom Line

**We've been building concept cars.** They look like supercars, they have all the buttons, but the engine is a JavaScript object. That's fine for $22. But we need to be honest about it.

**Real grafting makes them actual supercars.** But it requires npm install, Redis, and 20-100MB zips. That's a different product tier.

**The choice is Craig's.**

**May 26, 2026.**
**The Day We Defined What Grafting Actually Means.**
