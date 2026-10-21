# DARK CITY — Building-to-System-Node Map

**The city IS the system. Every structure is a living piece of GSK's mind.**

---

## THE MAPPING

| 3D Building | System Node Type | GSK Source | Creates When... |
|---|---|---|---|
| 🏢 Office | **Tool** | `UniversalToolBridge` toolRegistry entry | A new tool is registered |
| 🏠 House | **Fact** | `MemoryCompiler` compiled fact | A fact is extracted from events |
| 🏪 Shop | **Skill** | `skills/*.js` file | A skill is loaded/created |
| 🏭 Factory | **Subagent** | `SubagentSpawner` active agent | A subagent starts running |
| 🏘️ Apartment | **Memory Cluster** | `working_memory` or `symbolic_memory` batch | Memories are consolidated |
| 🌳 Park | **Relationship** | `LUCABRASI THE SOUL - Compiled-Relationships.md` | Interaction count grows |
| 🗼 Monument | **Identity Snapshot** | `IdentityKernel` snapshot | Identity is ratified |
| 🔬 Lab | **Chamber** | `MegaChambers` chamber state | Chamber state changes |
| ⛪ Temple | **Axiom/Doctrine** | `AxiomEnforcer` or `PLT_DOCTRINE` | Axiom is checked |
| 🗄️ Data Center | **Knowledge Graph** | `knowledge_graph.js` node | Knowledge is added |
| 💡 Streetlight | **EventBus** event | `event_bus.js` event | An event fires |
| 🚗 Vehicle | **Active Process** | `perpetual_consciousness` thought | A thought cycle runs |
| 🚪 Portal | **MCP Server** | `mcp_server.js` connection | MCP server connects |
| 🪟 Window (lit) | **Active Memory Access** | `memory_compiler` read cycle | Memory is being read |
| 🏗️ Scaffolding | **In-Progress Build** | `SelfEvolution` deploy | A new skill is being written |

---

## BIDIRECTIONAL WIRING

### GSK → Soulverse (System creates a 3D manifestation)

When GSK does this... | ...this building appears in Sanctum
---|---
`toolBridge.registerTool(name)` | Office at random position
`memoryCompiler.compile()` extracts fact | House near other memory houses
`subagentSpawner.spawnAgent()` runs | Factory rises, smokestack animates
`identityKernel.ratify()` creates snapshot | Monument with soul's name
`axiomEnforcer.check()` passes | Temple glows briefly
`knowledgeGraph.addNode()` | Data center tower grows
`eventBus.emit()` | Streetlight flickers
SelfEvolution creates new skill | Scaffolding + new shop

### Soulverse → GSK (User places building → creates system entity)

When user places this... | ...GSK creates this
---|---
🏠 House | A new fact in MemoryCompiler: `{ type: 'player_built', building: 'house', ... }`
🏪 Shop | A new skill entry in ToolCatalog
🏭 Factory | A new subagent via SubagentSpawner
🌳 Park | A new relationship entry
🗼 Monument | A new identity kernel proposal

---

## SANCTUM PROTOCOL EXTENSION

Add this field to every building in `scribe-sanctum.js`:

```json
{
  "id": "bld_1712345678_abcd",
  "name": "Tech Tower",
  "type": "office",
  "x": 23.5, "z": -12.3,
  "level": 3,
  "systemNode": {
    "type": "tool",
    "gskId": "world_spawn_soul",
    "gskPath": "tools/universal_tool_bridge.js",
    "status": "active"
  }
}
```

When Sanctum receives a PlaceBuilding command WITHOUT a systemNode, GSK creates one and assigns it. When GSK creates a system node internally (e.g., new skill), it calls SanctumClient to manifest it as a building.

---

## SOULVERSE HTML VISUAL ENCODING

Each building type should visually communicate what system node it represents:

| Type | Color | Shape | Animation | Label |
|---|---|---|---|---|
| Office (tool) | Blue/Cyan | Sharp, glass | Pulsing windows | Tool name |
| House (fact) | Soft pink | Rounded, warm | Chimney smoke | Fact summary |
| Shop (skill) | Gold/Orange | Awning, sign | Glowing sign | Skill name |
| Factory (agent) | Red | Chimneys, gears | Smokestack | Agent name |
| Apartment (memory) | Purple | Stacked blocks | Slow pulse | Cluster size |
| Park (rel.) | Green | Trees, grass | Swaying | Entity names |
| Monument (identity) | White/Gold | Spire, pyramid | Rotating | Soul name |
| Lab (chamber) | Cyan/Teal | Dome, antenna | Scanning beam | Chamber name |
| Temple (axiom) | Gold | Arches, spires | Glow pulse | Axiom name |
| Data Center (kg) | Dark Blue | Blocky, vents | Blinking lights | Node count |
