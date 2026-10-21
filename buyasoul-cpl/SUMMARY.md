# SUMMARY — True Stacked Worlds (Underworld + Connecting Shaft)

## What Was Built

### Underworld Stratum (Y=-500)
- Dark cavern floor (55-unit radius disc with jagged ring, glowing inner ring, central fissure scar)
- 6 ruined arch structures (fallen civilization — leaning pillars, fallen beams, debris)
- 6 crystal clusters (35+ crystals alternating purple/cyan, pulse-animated per-frame)
- Pulsing Underworld Core (icosahedron with 3 rotating torus rings, breathing scale animation)
- 4 lava glow pools with PointLights (orange emission, small radius)
- Underworld return pad (purple/cyan lift with arch, clickable to return to surface)
- `underworldCollisionFootprints` array for future collision integration

### Connecting Vertical Shaft (Y=-500 to Y=640)
- Cylindrical semitransparent wall (shaftHeight=1145, radius=4.5, 32 segments)
- Structural rings every 40 units (horizontal torus rings at -480, -440, ..., 600)
- Central light beam (translucent blue column)
- Bright core line (thin bright column)
- Entry glow rings at Y=-498, Y=-2, Y=641 (stratum thresholds)

### Fog Curtains
- 4 horizontal fog rings at Y=250, Y=-200, Y=630, Y=-490
- `updateFogCurtains(camY)` called every frame — opacity fades based on camera Y proximity
- Creates smooth atmospheric transitions between strata

### Surface Underworld Lift
- Purple-toned lift at (10, 0, -52) — purplish base, magenta ring, purple beam
- Registered with `surface-underworld` connector (bidirectional)
- Click interaction via `verticalConnector` userData
- Added to `heavenGateTargets` → merged into click interaction list

### Code Changes
- `applyVerticalPlayerArrival()` — handles all 3 strata (heaven/underworld/surface)
- `activateVerticalConnector()` — 3-way routing based on connectorId
- Debug facade `activateConnector` — updated for underworld return pad
- Resume handler — genericized for any stratum name
- Fly height cap — extended from +600 to +1200 (heaven at Y=640 now reachable)
- SectorManager + Visibility registrations for underworld stratum
- All 3 strata registered with `VerticalStackManager` (surface:ACTIVE, underworld:LOADED, heaven:LOADED)

### How to Explore
1. **Fly mode (F key)**: Fly up past Y=300 toward heaven, fly down past Y=-200 toward underworld
2. **Surface lift**: Click the purple underworld lift (right of the gold heaven lift) to descend
3. **Return pad**: In the underworld, click the purple return arch to surface

## PLT
- **Profit +12**: True stacked worlds architecture — 3 physical layers with vertical shaft
- **Love +8**: Now you can literally explore the world beneath
- **Tax −4**: Variable name collision (`beamMat`), several hardcoded stratum references updated
- **Total: +16**
