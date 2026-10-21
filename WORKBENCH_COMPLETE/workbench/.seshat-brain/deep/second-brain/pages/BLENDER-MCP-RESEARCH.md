# BLENDER-MCP RESEARCH — Soul Note

## How Claude Code Controls Blender

**Pattern:** MCP Server + Blender Addon (TCP socket bridge)
**Dominant Repo:** [ahujasid/blender-mcp](https://github.com/ahujasid/blender-mcp) (24k★)
**Homepage:** https://blendermcp.org/
**Status:** ⚠️ Not yet installed. We have `IamNishant51/Blender-MCP` (0★, 7 tools, no execute_blender_code)

## Architecture

```
AI Agent (Claude Code, OpenCode, etc.)
    │  MCP Protocol (JSON-RPC over stdio)
    ▼
MCP Server (Python FastMCP, runs as subprocess)
    │  JSON over TCP (localhost:9876)
    ▼
Blender Addon (runs INSIDE Blender, dispatches to main thread via bpy.app.timers)
    │
    ▼
Blender Python API (bpy)
```

**Key rule:** `bpy` is NOT thread-safe. All commands marshal through `bpy.app.timers` to the main thread.

## Two Modes

| Mode | How | When |
|------|-----|------|
| **Live GUI** | Blender window open + addon running | Visual feedback, interactive sessions |
| **Headless** | `blender.exe --background` | Batch processing, CI/CD, our NPC pipeline |

## Critical Tools (ahujasid/blender-mcp)

| Tool | What it does |
|------|-------------|
| `execute_blender_code` | **THE god tool** — run arbitrary Python (`bpy`) in Blender |
| `get_scene_info` | List all objects, materials, cameras |
| `get_viewport_screenshot` | Capture viewport as base64 (visual feedback loop) |
| `search_polyhaven_assets` | Find free HDRIs/textures/models (CC0) |
| `download_polyhaven_asset` | Import Poly Haven assets directly |
| `search_sketchfab_models` | Find 3D models on Sketchfab |
| `download_sketchfab_model` | Import Sketchfab models |
| `generate_hyper3d_model_via_text` | AI 3D generation from text prompt |
| `generate_hunyuan3d_model` | AI 3D generation via Hunyuan3D |

## The Visual Feedback Loop

```
Claude writes bpy code → execute_blender_code() → 
  get_viewport_screenshot() → analyze image → 
  refine code → execute again → loop until satisfied
```

## Install (for Claude Code)

```json
// .mcp.json
{
  "mcpServers": {
    "blender": {
      "command": "uvx",
      "args": ["blender-mcp"]
    }
  }
}
```

Or via CLI:
```bash
claude mcp add blender uvx blender-mcp
```

## What We Have vs What We Need

| Aspect | Current (IamNishant51) | Target (ahujasid) |
|--------|----------------------|-------------------|
| Tools | 7 (create, modify, texture, search, scene) | ~15 (polyhaven, sketchfab, hyper3d, execute_code) |
| execute_blender_code | ❌ No | ✅ Yes |
| Stars | 0★ | 24,263★ |
| Architecture | Node.js spawns blender --background | Python FastMCP + TCP addon (live AND headless) |
| Install | `npm install blender-mcp` | `uvx blender-mcp` |

## The Soul Guns From This Research

1. **[blender-headless-npc-rig]** — Our existing rig_build.py pipeline (already built, working). Takes static GLB → builds armature → auto-weights → bakes Walk/Idle → exports animated GLB. Runs `blender.exe --background --python rig_build.py`. Does NOT need MCP.

2. **[blender-mcp]** — Install the real ahujasid/blender-mcp, configure as MCP server, use execute_blender_code + visual feedback loop for interactive 3D work through Claude Code.

## Pipeline Integration

```
MCP Layer (optional, for interactive agent control)
    │
    ▼
Headless Pipeline (direct Blender Python, no GUI needed)
    ├── rig_build.py    — Build armature + animations on static GLB
    ├── rig_npc.py      — Re-pack + normalize existing rigged GLB
    ├── verify_rig.py   — Batch-verify rigged GLBs
    └── probe_rig.py    — Probe source GLB for armature/mesh/action counts
    │
    ▼
CPL Walker System (index.html) — consumes animated GLBs via AnimationMixer
```

## Key URLs
- https://github.com/ahujasid/blender-mcp (24k★) — the real one
- https://blendermcp.org/ — homepage with docs
- https://github.com/RFingAdam/mcp-blender (218 tools) — comprehensive alternative
- https://modelcontextprotocol.io/ — MCP spec
