# SKILL — Hermes Citizen

slug:: hermes_citizen
phase:: build
status:: active
source:: Dark City Spatial OS — Phase 4
PLT:: Profit 0.7, Love 0.8, Tax 0.3

## Summary
WHEN TO USE: When a new citizen spawns and needs a messenger/connector archetype, or when inter-citizen coordination requires a dedicated communication specialist. Archetype affinity: MERCHANT (connector), SEEKER (information relay). Problem solved: citizens need a dedicated message-passing agent that translates between disparate behavior systems, routes urgent signals, and keeps the communication bus healthy — Hermes is the postal service of the Dark City.

## Schema
- trigger: `Citizen.spawn(archetype: "HERMES")` OR `AgentBus.routeRequest(from, to, payload)` when no direct route exists
- inputs: {
    citizenId: string,
    mode: "messenger" | "coordinator" | "translator",
    messageQueue: [{ from: string, to: string, type: string, payload: object }] | null,
    relayConfig: { maxHops: number, ttlMs: number } | null
  }
- outputs: {
    success: boolean,
    messagesDelivered: number,
    routesEstablished: [{ from: string, to: string, latency: number }],
    busHealth: { uptime: number, queueDepth: number, errors: number }
  }

## Consequence
- Hermes citizen maintains the Agent Communication Bus — detects stale connections, reroutes orphaned messages
- Acts as translator between citizens using different behavior protocols
- Broadcasts heartbeat signals on the bus so other citizens know bus is alive
- Can spawn temporary sub-citizens (Hermes-Messengers) for high-volume relay jobs
- Monitors message TTL — drops stale messages with a "return to sender" notification
- Reports bus health metrics to the Portal district for user visibility

## Feedback
- User sees: Hermes citizen wears winged-sandal icon, leaves light trail as it moves between citizens delivering messages
- Console: `[HERMES] <n> messages delivered — <m> routes active — bus health <percent>%`
- On message drop: notification toast "Message from <from> to <to> expired — returned to sender"

## States
| State | Behavior | Visual |
|---|---|---|
| IDLE | No messages in queue, bus healthy | Hermes stands still, winged sandals glow softly |
| ACTIVE | Delivering messages, routing, translating | Hermes moves swiftly with light trail, message orbs float between citizens |
| COOLDOWN | Queue processed, bus maintenance | Hermes catches breath, trail fades |
| ERROR | Bus partition detected, message loop, TTL cascade | Hermes surrounded by swirling undelivered orbs, yellow alert glow |

## Composition
- **Agent Communication Bus** — Hermes is the bus's primary guardian and operator
- **Browser Citizen Runtime** — Hermes is spawned as a special citizen type
- **Behavior Attacher** — Hermes gets messenger/coordinator behaviors on spawn
- **City Terminal** — Hermes can receive direct terminal commands for bus debugging
- **Combo: POSTAL-SERVICE** — Hermes Citizen + Agent Communication Bus + Browser Citizen Runtime = guaranteed message delivery between any two citizens with automatic routing, translation, and dead-letter management
