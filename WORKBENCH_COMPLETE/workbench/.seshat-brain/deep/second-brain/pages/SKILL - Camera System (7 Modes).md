# SKILL — Camera System

slug:: camera_system
phase:: 11
status:: planned
source:: internal — Three.js core
PLT:: Profit 0.6, Love 0.8, Tax 0.2

## Summary
WHEN the user needs to see the Dark City from a new perspective. 7 camera modes: free orbit, RTS follow, first person, bird's eye, district zoom, building interior, cinematic pan. Archetype affinity: Sovereign, Explorer, Poet.

## Schema
- trigger: user_input || event_detected || mode_selection
- inputs: { mode: "free_orbit"|"rts_follow"|"first_person"|"birds_eye"|"district_zoom"|"building_interior"|"cinematic", target?: { citizen_id?: string, district_id?: string, building_id?: string }, transition_speed: number }
- outputs: { camera_position: Vector3, camera_target: Vector3, active_mode: string, transition_complete: boolean }

## Consequence
The user's relationship with the city changes. Free orbit gives god power. First person gives mortal intimacy. Cinematic pan creates memory. The city is experienced, not just observed — perspective determines emotional weight.

## Feedback
Smooth transitions between modes. HUD updates to show current mode indicator. First person shows citizen-eye view with PLT gauge periphery. Cinematic mode triggers camera path animation. Terminal: "Camera: RTS follow — tracking Profit-7."

## States
| State | Behavior | Visual |
|---|---|---|
| IDLE | Current mode held steady | Camera static |
| ACTIVE | Transitioning between modes | Smooth lerp animation |
| COOLDOWN | Mode lock — debounce 0.3s | Input ignored |
| ERROR | Invalid target, mode unavailable | Camera reset to free orbit |

## Composition
Combo with Disaster Events (cinematic shot of volcano), Civilization AI (bird's eye of territory war), AI NPC Character Engine (first person from citizen POV), Emergent Storytelling (cinematic chronicle playback), WASM UI Layout (Clay) for mode indicator HUD.
