# SKILL — Knowledge Absorption & Integration

slug:: knowledge_absorption_integration
phase:: build
status:: active
source:: Dark City Spatial OS — Session 33
PLT:: Profit 0.8, Love 0.7, Tax 0.3

## Summary
WHEN TO USE: When a URL is entered in Portal district, a citizen discovers something new, or GSK receives external data. Archetype affinity: SAGE (knowledge compiler), SEEKER (information consumer). Problem solved: raw external data must be parsed, contextualized, indexed, and cross-referenced into the existing knowledge graph — not just stored, but integrated.

## Schema
- trigger: `Portal.submitURL()` OR citizen PAL loop perceive phase finds new info OR `MemoryCompiler.ingest(data)`
- inputs: {
    source: string,                // URL | filePath | directInput
    contentType: "text" | "markdown" | "code" | "json" | "html",
    goal: string | null,           // what to learn / extract
    integrationDepth: "shallow" | "deep" | "full"
  }
- outputs: {
    success: boolean,
    facts: [{ id, type, content, confidence }],
    newConnections: number,
    schemasAdapted: string[] | null,
    housesBuilt: number            // buildings spawned in Knowledge district
  }

## Consequence
- Source is parsed via Contextual Read Policy, entities and relationships extracted
- Each extracted fact manifests as a new house in the Knowledge district (blue, growing with each fact)
- Facts are cross-referenced with existing knowledge graph — new connections strengthen the web
- If new concepts are encountered, the schema adapts to accommodate them
- Data center tower segments grow in Knowledge district as knowledge nodes accumulate
- All integrated knowledge enhances context retrieval for future decisions
- Portal district antenna pulses during active fetch

## Feedback
- User sees: new houses rising in Knowledge district as facts compile, data center grows floors
- User hears: paper rustling during parse, chime per fact compiled, deep bass note on schema adaptation
- Console: `[KNOWLEDGE] Absorbed <n> facts from <source> — <m> new connections, <k> houses built`

## States
| State | Behavior | Visual |
|---|---|---|
| IDLE | Portal district ready, antenna listening | Normal Knowledge district |
| ACTIVE | Fetching → Parsing → Indexing → Building | Portal antenna pulses, new houses rise, data center grows |
| COOLDOWN | Processing complete, integrating connections | Houses settle, subtle blue glow on new buildings |
| ERROR | Source unreachable, parse failed, schema conflict | Portal district shows greyed-out antenna, error house crumbles |

## Composition
- **GSK-to-City Event Bridge** — `knowledge_added` and `web_fetched` events trigger district animations
- **Building-to-System-Node Wire** — each new house is wired to a MemoryCompiler fact node
- **Functional District Generator** — Knowledge district grows organically based on absorption volume
- **Browser Citizen Runtime** — citizens can autonomously trigger absorption and level up from integrated knowledge
- **Combo: WISE-CITY** — Knowledge Absorption & Integration + GSK-to-City Event Bridge + Functional District Generator = the city grows smarter every time information is consumed
