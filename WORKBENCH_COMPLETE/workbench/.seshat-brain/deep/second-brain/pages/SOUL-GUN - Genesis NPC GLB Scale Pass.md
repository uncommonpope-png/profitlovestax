---
type:: [[soul-gun]] [[page]]
mission:: [[NORTH STAR ODYSSEY]]
phase:: P69
status:: FORGED
---

# SOUL-GUN - Genesis NPC GLB Scale Pass

## Purpose
The NPC GLB Scale Pass gun normalizes rigged GLB citizens to the shared CPL humanoid reference height so the city does not spawn giant or tiny NPC bodies.

## Files
- Module: `C:\Users\uncom\Desktop\cosmic-pyramid-library\src\genesis\npc-scale-pass.js`
- Hooks: static import in `index.html`, walker rig `assignWalkerRig()`, persisted `worldState.npcScaleAudit`.

## Contract
- Install as `Genesis.NPCScalePass`.
- Normalize clone scale from source rig bounds against `NPC_SIZE_REF`.
- Clamp to safe range `0.4..2.2`.
- Ground feet to world floor after scaling.
- Persist compact audit records in `worldState.npcScaleAudit`.
- Emit `genesis:npc:scale-pass` for Witness and Immortality audit systems.

## PLT
- **Profit:** real NPC bodies become predictable reusable assets.
- **Love:** citizens appear human-scale and believable in GSK's city.
- **Tax:** bounding boxes can still vary by source rig; audit records reveal outliers.

## Status
FORGED for P69.
