# SKILL — heaven-city (Angels' Own Floating Sky Realm)

slug:: heaven-city
phase:: build
status:: active (verified — "fucking perfect", no black screen)
source:: cosmic-pyramid-library/index.html (`heaven` group + `heavenAngels` + animate loop)
PLT:: Profit 0.8, Love 0.9, Tax 0.3

## Summary
WHEN TO USE: To give a class of entities (here, angels) their OWN distinct district instead of scattering them into the main city. Archetype affinity: ARCHITECT (separate realm), GARDENER (place in own soil). Problem solved: scattering angels on ground mixed them with the city; Pope wanted angels in "heaven" — a floating sky-city they orbit.

## Schema
- trigger: a creature/prop belongs to a themed realm, not the main grid
- inputs: { angelUrl, center: Vector3, count }
- outputs: { heaven: Group, heavenAngels: [{obj, angle, radius, yOff, ySpeed, yPhase, orbit}] }

## Consequence
- **Separate group**: `const heaven = new THREE.Group(); heaven.position.set(0, 40, -95); cityGroup.add(heaven);` — far above/behind the main city so it reads as its own realm.
- **Realm base**: glowing gold platform (`CylinderGeometry`), a halo `TorusGeometry` ring, 6 emissive pillars, and a warm `PointLight` — makes it read as a "city", not a bare patch.
- **Angels orbit + bob**: load `angel.glb` N times; each gets random `angle`, `radius (6–22)`, `yOff (8–22)`, and is pushed to `heavenAngels` with `ySpeed`, `yPhase`, `orbit`. In the animate loop: advance `angle`, set x/z on circle, `y = yOff + sin(time*ySpeed+yPhase)*1.2`, face tangent `rotation.y = -angle + PI/2`.
- **Removed from ground scatter**: the two `dropProp('assets/angel/angel.glb')` calls in `scatter` were deleted so angels no longer appear in the main city.

## Feedback
- Correct: a floating gold realm with angels circling/bobbing above it; main city has no angels.
- Wrong: `const platform` redeclared → parse error → BLACK SCREEN. `platform` already exists at line ~1252 (book platform). Must rename to `heavenPlatform`/`heavenHalo` (this bug caused the first black screen — fixed).

## States
| State | Behavior | Visual |
|---|---|---|
| GROUND | angels in scatter | mixed into city (wrong) |
| REALM | heaven group + orbit | angels in own sky-city (BASE) |

## Gaps (mechanics not yet consequences)
- Heaven is static/unreachable (no teleport/orbit-camera to it); found only by zooming out.
- No cloud/atmosphere volume; just a platform + pillars.
- Angel count (7) and position hardcoded; no occupancy check vs other realms.

## Composition
- **scatter** (`scatter`) — angels removed from here; scatter now covers computers/ifa/misc only.
- **clear-obstruction** (`clear-obstruction`), **swap-building** (`swap-building`) — unrelated realms.
- **graphics-ibl** (`graphics-ibl`) — IBL lights the heaven platform metallics; **graphics-color** (`graphics-color`) colors it.
- **CPL ASSET MAP** (`CPL ASSET MAP`), **DOUR-BIBLE** (`DOUR-BIBLE`) — recorded.

## Cross-Links
- Bible: [[DOUR-BIBLE]] · Catalog: [[neodownloadable]] (SECTION 15) · Map: [[CPL ASSET MAP]]
- Sibling guns: [[SKILL - scatter]] · [[SKILL - graphics-color]] · [[SKILL - graphics-ibl]] · [[SKILL - swap-building]]
