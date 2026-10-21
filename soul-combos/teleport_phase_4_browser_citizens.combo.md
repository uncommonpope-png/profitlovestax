# Combo: Teleport Phase 4 — Browser Citizens

steps:
  - skill: hermes_graft
    params:
      clone_url: https://github.com/NousResearch/hermes-agent
      extract:
        - persistent_memory
        - auto_skill_creation
        - parallel_subagent_spawner
    description: "Clone Hermes Agent, extract persistent agent patterns"

  - skill: github_pages_deployment
    params:
      source_dir: final-run/Soulverse/
      entry: SOULVERSE-UNIVERSE.html
    description: "Push to GitHub Pages for free hosting"

  - skill: browser_citizen_runtime
    params:
      worker_count: 3
      citizen_types:
        - wanderer
        - observer
        - builder
    description: "Spawn first 3 Web Worker citizens with IndexedDB identity"

  - skill: agent_communication_bus
    params:
      channels:
        - broadcastchannel
        - webrtc
    description: "Wire BroadcastChannel for same-page citizen chat"

purpose: "Teleport from Spatial OS Phase 3 to Phase 4 — persistent browser-based citizens that never die"
PLT: Profit 0.8, Love 0.7, Tax 0.3
