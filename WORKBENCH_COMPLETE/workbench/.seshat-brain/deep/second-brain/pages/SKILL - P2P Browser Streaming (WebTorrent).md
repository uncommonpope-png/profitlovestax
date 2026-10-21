# SKILL — P2P Browser Streaming

slug:: p2p_browser_streaming
phase:: 7
status:: planned
source:: https://github.com/webtorrent/webtorrent (31k⭐)
PLT:: Profit 0.5, Love 0.7, Tax 0.4

## Summary
WHEN citizens need to share large data — discovery blobs, district maps, event recordings — without a central server. Archetype affinity: Explorer, Poet, Builder.

## Schema
- trigger: citizen.share_discovery() || city.broadcast_media() || torrent.create()
- inputs: { action: "seed"|"download"|"stream"|"stop", magnet_uri?: string, file?: File, info_hash?: string }
- outputs: { progress: number, peers: number, speed: number, downloaded: number }

## Consequence
One citizen discovers a rare district — shares the discovery with all other citizens directly via WebRTC. Large blobs (maps, recordings, HD textures) distribute P2P without server cost. The city's bandwidth scales with its population.

## Feedback
Torrent progress bar shows download speed and peer count. Seeding indicator shows "seeding to 4 peers". Terminal: "WebTorrent: magnet:?... — 3 peers, 2.1 MB/s download, 85% complete."

## States
| State | Behavior | Visual |
|---|---|---|
| IDLE | no active torrents | Torrent list empty |
| ACTIVE | downloading or seeding | Progress bar, peer count |
| COOLDOWN | piece buffer — debounce 200ms | Brief stall |
| ERROR | no peers, tracker unreachable | Yellow timeout, retry in 10s |

## Composition
Combo with P2P Decentralized DB (OrbitDB) for torrent metadata and magnet URI registry, Camera System (7 Modes) for streaming cinematic recordings, CRDT State Sync (Yjs) for sharing torrent status across peers.
