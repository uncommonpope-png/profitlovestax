# SKILL — Autonomous Research Loop

slug:: autonomous_research_loop
phase:: 4
status:: planned
source:: https://github.com/karpathy/autoresearch (90.1k⭐)
PLT:: Profit 0.9, Love 0.5, Tax 0.3

## Summary
WHEN an agent must self-direct through a complete research cycle: hypothesize → experiment → observe → conclude. Archetype affinity: Sage, Scout, Philosopher. Grafted from Karpathy's self-running AI research agent pattern.

## Schema
- trigger: agent dispatches `research.cycle({ question, depth?, sources? })` or enters HYPOTHESIZE state autonomously
- inputs: { question: string, depth?: 1-5, sources?: string[], context?: object, iterationLimit?: number }
- outputs: { conclusion: string, evidence: array, confidence: number, iterations: number, knowledgeGraph?: object }

## Consequence
The Dark City grows a knowledge layer. Each cycle deposits structured findings into the citizen's memory. The city becomes self-teaching — citizens evolve their understanding without external prompting.

## Feedback
- IDLE: "Research loop dormant, awaiting a question."
- HYPOTHESIZE: "Forming hypothesis: {question}..."
- EXPERIMENT: "Testing — navigating evidence, querying sources..."
- OBSERVE: "Analyzing results, extracting signal..."
- CONCLUDE: "Conclusion drawn with {confidence}% confidence."
- COOLDOWN: "Integrating findings into memory graph."
- ERROR: "Research stalled: {reason}"

## States
IDLE → HYPOTHESIZE → EXPERIMENT → OBSERVE → CONCLUDE → COOLDOWN → IDLE
Any state → ERROR → IDLE (on reset)

## Composition
- **Browser Agent Control (browser-use)** sources web evidence for experiments
- **Universal Agent Memory (mem0)** stores and retrieves prior conclusions
- **Deep Research Protocol** provides the methodology layer for multi-source investigation
- **Scribe Agent** records the full research chain as witness
