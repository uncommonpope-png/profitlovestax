# Combo: Teleport Phase 5 — Spatial VS Code

steps:
  - skill: spatial_code_editor
    params:
      editor: codemirror_6
      features:
        - syntax_highlighting
        - multi_language
        - save_to_gsk
    description: "Add CodeMirror 6 to building inspect panel"

  - skill: city_terminal
    params:
      shell: powershell
      backend: ws://127.0.0.1:4490/terminal
    description: "Add xterm.js to Portal district, WebSocket to PC shell"

  - skill: knowledge_absorption_integration
    params:
      source: gsk_memory
      output: building_manifestation
    description: "Web fetch → knowledge → new buildings in Knowledge district"

purpose: "Teleport from Phase 4 to Phase 5 — the city IS the IDE, edit code and run terminal from inside the 3D world"
PLT: Profit 0.9, Love 0.5, Tax 0.4
