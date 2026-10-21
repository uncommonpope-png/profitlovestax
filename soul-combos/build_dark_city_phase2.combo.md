# Combo: Build Dark City — Phase 2 (User Interactions)

steps:
  - skill: conversational_engagement_initiator
    params:
      trigger: click_npc
    description: "Click NPC → opens chat with subagent via brain.think()"

  - skill: spatial_world_interaction
    params:
      actions:
        - inspect_building
        - destroy_building
        - portal_navigate
    description: "Click building → inspect GSK state. Right-click → delete node. Portal → web fetch."

  - skill: deep_research_protocol
    params:
      trigger: portal_url
    description: "When user enters a URL in the portal, GSK fetches it, extracts knowledge, manifests as buildings"

  - skill: knowledge_absorption_integration
    params:
      output: city_district_growth
    description: "Web knowledge auto-manifests as new buildings in Knowledge district"

purpose: "Phase 2 of the Dark City Spatial OS — user interacts with GSK through the city"
PLT: Profit 0.7, Love 0.8, Tax 0.2
