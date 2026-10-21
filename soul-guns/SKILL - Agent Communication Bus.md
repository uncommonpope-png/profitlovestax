# SKILL — Agent Communication Bus

slug:: agent_communication_bus
phase:: build
status:: active
source:: Dark City Spatial OS — Phase 4
PLT:: Profit 0.6, Love 0.9, Tax 0.2

## Summary
WHEN TO USE: Any time a citizen needs to talk to another citizen, or the user sends a chat message to a citizen. Archetype affinity: MERCHANT (connector), HERMES (messenger). Problem solved: citizens in the Dark City need to communicate — same page, across browsers, and with the user — through a unified message bus that routes by citizen ID.

## Schema
- trigger: `citizen.sendMessage(to, payload)` OR `user.chatTo(citizenId, message)` OR citizen PAL loop broadcasts perception
- inputs: {
    message: { 
      from: string,
      to: string | "broadcast" | "hermes",
      type: "chat" | "coordinate" | "request" | "response" | "heartbeat" | "broadcast",
      payload: object,
      ttlMs: number | null
    }
  }
- outputs: {
    success: boolean,
    delivered: boolean,
    route: "broadcast_channel" | "webrtc" | "direct",
    latencyMs: number
  }

## Consequence
- Same-page citizens talk via BroadcastChannel (`new BroadcastChannel('dark-city')`)
- Cross-browser citizens sync via WebRTC Data Channel
- Bus routes messages to the correct Web Worker by citizen ID
- Citizens subscribe to message types they care about (coordinate, chat, request)
- Messages have TTL — expired messages are dropped with return-to-sender notification
- The bus logs all traffic for replay and debugging
- Hermes citizen monitors bus health and reroutes orphaned messages

## Feedback
- User sees: speech bubbles above citizens when they chat, message lines in Portal district chat panel
- Console: `[BUS] <from> → <to>: <type> — <latency>ms — delivered: <bool>`
- Visual: message orbs travel between citizens along light paths

## States
| State | Behavior | Visual |
|---|---|---|
| IDLE | No traffic, bus listening | Communication lines dim but present |
| ACTIVE | Routing messages between citizens | Light orbs travel between citizens, chat bubbles appear |
| COOLDOWN | Message processed, awaiting next | Brief trail fade on last message path |
| ERROR | Citizen offline, route not found, TTL expired | Red X over message path, "Message undelivered" toast |

## Composition
- **Hermes Citizen** — dedicated bus guardian that monitors health and handles undeliverable messages
- **Browser Citizen Runtime** — each citizen connects to the bus on spawn
- **Perception-Action Loop** — PAL's act phase can broadcast findings via the bus
- **Behavior Attacher** — behaviors can subscribe to bus message types
- **Combo: SOCIAL-CITY** — Agent Communication Bus + Browser Citizen Runtime + Hermes Citizen + Behavior Attacher = citizens that form social networks, coordinate labor, and evolve culture through message exchange
