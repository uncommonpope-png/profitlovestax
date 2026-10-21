# SKILL — A2A Agent Communication

slug:: a2a_agent_communication
phase:: 10
status:: planned
source:: https://github.com/a2aproject/A2A (24.7k⭐) — Google's Agent-to-Agent Protocol
PLT:: Profit 0.7, Love 0.9, Tax 0.2

## Summary
WHEN citizens must discover, negotiate, and exchange messages with each other using a standard protocol. Archetype affinity: Merchant, Citizen, Scribe. Grafted from Google's A2A — JSON-RPC 2.0 over BroadcastChannel/WebRTC with Agent Card capability discovery.

## Schema
- trigger: citizen broadcasts Agent Card on connect, or dispatches `a2a.send({ target, method, params })` to another citizen
- inputs: { action: "discover" | "send" | "stream" | "negotiate", target?: string, method?: string, params?: object, agentCard?: object, protocol?: "broadcast" | "webrtc" | "http" }
- outputs: { success: boolean, result?: any, peerAgentCard?: object, connectionId?: string, stream?: AsyncIterator }

## Consequence
The Dark City becomes a society. Citizens no longer act in isolation — they discover each other, form relationships, delegate tasks, and cooperate. The A2A card is a citizen's passport; the protocol is their common language.

## Feedback
- IDLE: "A2A protocol listening on channels..."
- DISCOVER: "Citizen found: {name} ({archetype})..."
- CONNECT: "Establishing A2A link with {name}..."
- SEND: "Sending {method} to {target}..."
- STREAM: "Receiving streaming response from {target}..."
- NEGOTIATE: "Negotiating capabilities with {target}..."
- COMPLETE: "A2A exchange complete."
- DISCONNECT: "Peer {name} disconnected."
- ERROR: "A2A communication failed: {reason}"

## States
IDLE → DISCOVER → CONNECT → SEND → COMPLETE → IDLE
IDLE → DISCOVER → CONNECT → STREAM → COMPLETE → IDLE
IDLE → NEGOTIATE → SEND → COMPLETE → IDLE
Any → DISCONNECT → IDLE
Any → ERROR → IDLE

## Composition
- **Universal Agent Memory (mem0)** stores peer Agent Cards and conversation history
- **Super-Agent Harness (deer-flow)** orchestrates agent teams via A2A task delegation
- **Agentic Browser (BrowserOS)** uses A2A for cross-tab agent collaboration
- **GSK-to-City Event Bridge** routes A2A messages to city-wide state events
