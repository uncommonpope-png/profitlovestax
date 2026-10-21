---
name: implement_ump_with_god_mode
description: "Uses a crew of agents to implement the Universal Memory Protocol in SCRIBE, leveraging god mode."
parallel:
  enabled: true
steps:
  - skill: MemorySchemaArchitect_Task
    description: "Implements Constitutional Class Filtering (A1) and Temporal Truth Model (A2) in memory.js."
    output: "memory_schema_complete"
  - skill: MCPInterfaceEngineer_Task
    description: "Implements MCP Transport Layer (C1) by creating scribe-mcp-server.js."
    output: "mcp_interface_complete"
  - skill: IntelligenceSystemsIntegrator_Task
    description: "Implements Auto-Categorization (B1), Summarization (B2), Contradiction Detection (B3), and Lesson Extraction (B4)."
    output: "intelligence_systems_complete"
  - skill: GovernanceProtocolOfficer_Task
    description: "Implements Provenance Enforcement (A5), Four-Layer Evaluation (D1), Structured Receipts (D2), and Constitutional Integrity Checking (D3)."
    output: "governance_protocol_complete"
---
## Steps
- skill: MemorySchemaArchitect_Task
- skill: MCPInterfaceEngineer_Task
- skill: IntelligenceSystemsIntegrator_Task
- skill: GovernanceProtocolOfficer_Task
