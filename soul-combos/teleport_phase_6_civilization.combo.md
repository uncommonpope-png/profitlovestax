# Combo: Teleport Phase 6 — Civilization

steps:
  - skill: citizen_plugin_system
    params:
      load_pattern: dynamic_import
      trigger: drag_and_drop
    description: "Drag .js files into the city → new citizen types"

  - skill: midnight_tuning_cycle
    params:
      interval_ticks: 100
      persist_agent_deltas: true
    description: "City reshapes from seed, agent actions persist"

  - skill: cross_browser_citizens
    params:
      transport: webrtc_data_channel
      sync: crdt
    description: "Citizens across different browsers communicate via WebRTC"

  - skill: citizen_skill_writer
    params:
      format: agentskills.io
      trigger: problem_solved
    description: "Citizens auto-create SKILL.md when they solve hard problems"

purpose: "Teleport from Phase 5 to Phase 6 — a living civilization with plugins, midnight drama, cross-browser citizens, and self-improving skills"
PLT: Profit 0.9, Love 0.8, Tax 0.3
