---
name: dimensional_rift_displacement
slug: dimensional_rift_displacement
backend: combo_orchestrator
callable: true
---
steps:
  - skill: world_send_command
    params:
      command: "InstantTransmission"
  - skill: world_send_command
    params:
      command: "MultiForm"
  - skill: world_send_command
    params:
      command: "FusionDance"
