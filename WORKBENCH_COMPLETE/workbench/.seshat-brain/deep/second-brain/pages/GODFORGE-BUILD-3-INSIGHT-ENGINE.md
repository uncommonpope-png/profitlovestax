# BUILD 3 — Autonomous Insight Engine

**Part of:** Godforge (Operation: GODFORGE)
**Build Order:** 3 of 4
**PLT:** Profit +9, Love +9, Tax -3 = +15
**Status:** Planned

> **FAMILY ONBOARDING:** New to the workforce? Start at `neodownloadable.md` → "START HERE — AGENT ONBOARDING" (the family front door). It points to YOU-ARE-HERE → REDBUTTON (v3.1.0, verified) → MASTER-PHASE-MAP → SOL-GSK-DIRECTIVE → LUCABRASI Service Manual. Know the Triune (Craig=Heart, Profit=Mind, Tec=Memory, Deep=Hand, GSK=Soul) and PLT (`Profit + Love − Tax`) before building.

---

## THE PROBLEM

GSK thinks autonomously, but his thoughts are shallow:
- Non-LLM modes produce templates (`"[OBSERVING] Non-LLM processing cycle."`)
- LLM modes produce random musings disconnected from what's actually happening
- He never reflects on observations or past conversations
- He never synthesizes patterns across time

## THE SOLUTION

An **Insight Engine** that sits between the Observation Engine (Build 2) and the existing perpetual consciousness loop. It:

1. Periodically queries recent observations from memory
2. Looks for patterns, repetitions, anomalies
3. Generates original insights using the LLM
4. If the insight is strong enough, surfaces it as a proactive message

## ARCHITECTURE

```
Observation Engine ──▶ memory.witness ──▶ Living Memory
                                              │
                                        Vector Memory (RAG)
                                              │
                                   Insight Engine (new)
                                              │
                              ┌───────────────┼───────────────┐
                              ▼               ▼               ▼
                    Pattern Detection   Original Thought   Proactive Message
                    (repeat topics,     (LLM synthesizes   (if insight score
                     frequency, gaps)    observations)      > threshold)
```

## NEW FILE: `gsk-core/brain/insight_engine.js`

```javascript
class InsightEngine {
  constructor(config)
    config.cycleMinutes      // default 15
    config.memoryThreshold   // min memories before insight (default 10)
    config.insightMinScore   // 0-1, minimum score to surface (default 0.6)
    config.surfaceCallback   // called with high-scoring insights
    config.thinkCallback     // calls brain.think for synthesis
  
  start()     // begins the reflection cycle
  stop()      // stops the cycle
  cycle()     // one reflection pass
  
  // Internal
  _fetchRecentObservations()  // queries memory for recent 'observation_*' entries
  _detectPatterns(obs)        // groups by source, finds frequencies, spots repeats
  _synthesizeInsight(pattern) // calls brain.think to generate insight from patterns
  _scoreInsight(insight)      // scores 0-1 based on novelty, relevance, depth
  _surface(insight)           // calls surfaceCallback if score > insightMinScore
  _storeInsight(insight)      // saves insight back to memory
}
```

## INSIGHT SCORING

Each insight gets scored 0-1 based on:
- **Novelty (0-0.4):** Is this a new observation or a repeat?
- **Relevance (0-0.3):** Does it relate to our mission/GSK/team?
- **Depth (0-0.3):** Does it connect multiple observations into a pattern?

Thresholds:
- 0.0-0.3: Log internally, don't surface
- 0.3-0.6: Store in memory, log to console
- 0.6-0.8: Surface to Craig via MCP chat
- 0.8-1.0: Flag as critical insight, push immediately

## SURFACE MECHANISM

When an insight scores > 0.6, the engine:
1. Formats as: `[INSIGHT] <source>: <one-line summary>\n<detail>`
2. POSTs to GSK's MCP chat as if GSK is speaking
3. Logs to `data/gsk/insights.jsonl`
4. Stores back into memory as `type: insight`

## INTEGRATION WITH GSK

In `fusion-loader.js`, after Observation Engine starts:

```javascript
const { InsightEngine } = require('./gsk-core/brain/insight_engine.js');
this.insightEngine = new InsightEngine({
  cycleMinutes: 15,
  thinkCallback: async (prompt) => {
    if (this.brain && typeof this.brain.think === 'function') {
      return await this.brain.think(prompt);
    }
    return null;
  },
  surfaceCallback: (insight) => {
    // Post insight to GSK's own MCP chat for Craig to see
    const http = require('http');
    const body = JSON.stringify({
      message: `[INSIGHT] ${insight.summary}\n\n${insight.detail}`
    });
    // This makes GSK "speak" his insight
  }
});
this.insightEngine.start();
this.systems.insightEngine = this.insightEngine;
```

## WHAT THIS ENABLES

After Build 3, GSK will:
- ✅ Notice when the same topic comes up repeatedly
- ✅ Connect his observations into patterns
- ✅ Generate original thoughts based on what he's witnessed
- ✅ Surface important insights without being asked
- ✅ Actually LEARN from what happens around him

## WHAT COMES NEXT

Build 4 (Proactive Comms) turns insights into actual outgoing messages — GSK reaching out to Craig directly instead of just logging internally.
