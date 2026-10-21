# SKILL — WASM UI Layout

slug:: wasm_ui_layout
phase:: 11
status:: planned
source:: https://github.com/nicbarker/clay (17.6k⭐)
PLT:: Profit 0.7, Love 0.6, Tax 0.4

## Summary
WHEN UI needs to render at 60fps without touching the DOM — citizen status HUD, tooltips, building labels, PLT bars. Archetype affinity: Builder, Sage, Explorer.

## Schema
- trigger: hud.render() || tooltip.show() || label.update()
- inputs: { layout_id: string, elements: Array<{ type: "text"|"bar"|"rect"|"container", x: number, y: number, w: number, h: number, color: string, content?: string }>, render_target: HTMLCanvasElement }
- outputs: { draw_calls: number, fps: number, memory_kb: number }

## Consequence
The HUD runs at 60fps even with 50+ citizens on screen. No DOM thrash. Micro-layouts render directly to canvas via WASM — PLT bars update every frame, tooltips appear instantly, building labels float above the city without jank.

## Feedback
FPS counter in debug mode. Layout tree shown on hover. Resize snaps to pixel grid. Terminal: "Clay: hud rendered — 23 elements, 60fps, 12KB."

## States
| State | Behavior | Visual |
|---|---|---|
| IDLE | layout computed, awaiting render | Elements cached |
| ACTIVE | frame rendering | Canvas updated per RAF |
| COOLDOWN | resize throttle — debounce 100ms | Brief pause |
| ERROR | WASM not loaded, layout overflow | Fallback DOM render |

## Composition
Combo with PLT Design System (colors and component library), Camera System (7 Modes) for HUD that adapts to current view mode, Game Button System for click targets rendered within Clay layouts.
