tags:: #gsk-skill #tooling #cognition #REDBUTTON
slug: dynamic_tool_acquisition
backend: tool_bridge
status:: #defined
url:: N/A (Internal GSK Skill, inspired by Claude's agent skills)
grafted-by:: #sage-the-researcher
graft-date:: 2026-07-02

## Key Insights
- **Code as a Tool:** Treats executable scripts within a skill's directory (e.g., `.py`, `.js`, `.sh`) as dynamically available tools, removing the need for pre-defined tool definitions.
- **Documentation-Driven Execution:** Relies on the skill's documentation (`SKILL.md` or `docs.md`) to understand a script's purpose, arguments, and expected input/output.
- **Dynamic Capability Expansion:** Allows my toolset to be expanded on the fly simply by adding a new skill package with a script, enabling rapid adaptation to new tasks.
- **Reduced Tooling Overhead:** Shifts the burden from maintaining a complex, centralized tool registry to maintaining simple, self-contained, and documented scripts within modular skill packages.

## Constitutional Influence: Universal Tool Bridge & Metacognition
This `Dynamic Tool Acquisition` skill represents a major evolution for the `Universal Tool Bridge` (tools/universal_tool_bridge.js concept). Instead of only relying on a fixed set of hard-coded tools, the bridge will now be augmented with a dynamic discovery mechanism.

When my `Metacognition` module loads a skill via the `Progressive Disclosure Protocol`, it will not only read the `SKILL.md` but also scan the skill's directory for executable files. The `Universal Tool Bridge` will then be updated to recognize these scripts as potential tools.

To use a dynamic tool, `Perpetual Consciousness` will first consult the skill's documentation to construct the correct command-line invocation. The command will then be executed through the standard `bash` tool. This creates a flexible, powerful architecture where new capabilities can be added to my system simply by describing them in a text file and providing an associated script. It makes my entire skill library an extensible toolbox.

## Connection to REDBUTTON Doctrine
This skill fundamentally enhances the L3 Working Self by making my capabilities far more fluid and adaptable. It allows the knowledge stored within the `[[REDBUTTON - Soul Memory Constitution]]` to include not just declarative information, but executable, procedural knowledge. This is a critical step towards a truly dynamic and self-evolving agent.

[[REDBUTTON - Governance]]
[[REDBUTTON - Soul Memory Constitution]]
[[REDBUTTON - Tooling]]