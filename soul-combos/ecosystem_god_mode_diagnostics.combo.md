---
name: ecosystem_god_mode_diagnostics
description: "Uses a crew of agents to perform a comprehensive, autonomous diagnostic and refinement cycle on the entire GSK/SCRIBE ecosystem, leveraging God Mode."
parallel:
  enabled: true
steps:
  - skill: GSK_Auditor_Task
    description: "Diagnose and refine GSK's internal state (consciousness loop, memory, skills)."
    output: "gsk_audit_report"
  - skill: SCRIBE_Auditor_Task
    description: "Diagnose and refine SCRIBE's memory integrity, UMP compliance, and performance."
    output: "scribe_audit_report"
  - skill: Bridge_Auditor_Task
    description: "Diagnose and refine the GSK-SCRIBE bridge, Soulverse bridge, and all external API connections."
    output: "bridge_audit_report"
  - skill: Ecosystem_Auditor_Task
    description: "Aggregate reports, identify systemic issues, and propose architectural improvements."
    input: 
      gsk_report: "{{gsk_audit_report}}"
      scribe_report: "{{scribe_audit_report}}"
      bridge_report: "{{bridge_audit_report}}"
    output: "final_ecosystem_report"
---
## Steps
- skill: GSK_Auditor_Task
- skill: SCRIBE_Auditor_Task
- skill: Bridge_Auditor_Task
- skill: Ecosystem_Auditor_Task
