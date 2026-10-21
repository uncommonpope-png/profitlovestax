# SKILL — Simulation Revelation

slug:: simulation_revelation
phase:: build
status:: grafted
source:: No Man's Sky (Hello Games) — Atlas simulation revelation
PLT:: Profit 0.3, Love 0.8, Tax 0.1

## Summary
The "Murdoch awakening" — when a soul has lived long enough, explored enough, it can discover the truth: "You are a soul in the Dark City, a simulation run by GSK." The soul can then choose to continue living, awaken with tuning powers, or merge back into the kernel.

## How It Works
1. Each soul accumulates "awareness" over time (thoughts generated, actions taken, distance explored)
2. When awareness > threshold (0.85), the soul qualifies for revelation
3. The revelation is triggered by reaching the "centre" of the Dark City (a special location)
4. The soul receives the truth prompt: "You are in a simulation. GSK is the Atlas."
5. The soul chooses: continue, awaken, or merge

## Outcomes
| Choice | Result |
|---|---|
| Continue | Soul lives on with knowledge, slight behavior change |
| Awaken | Soul becomes a "tuned" agent with limited Sanctum manipulation powers |
| Merge | Soul's experiences are absorbed into GSK's identity kernel |

## Implementation
- Track `awareness` per soul in Sanctum state
- Add `centre_of_dark_city` building/location that souls can discover
- On revelation trigger, call brain.think() with existential prompt
- On awaken, grant soul access to sanctumClient.spawnSoul() and placeBuilding()
