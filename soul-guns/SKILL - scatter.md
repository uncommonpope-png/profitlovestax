# SKILL — scatter (Drop Light Props into Clear Ground, Never on Buildings)

slug:: scatter
phase:: build
status:: active (verified — angel/computer/ifa/misc grafted, no black screen)
source:: cosmic-pyramid-library/index.html (`dropProp`, `clearSpot`)
PLT:: Profit 0.8, Love 0.5, Tax 0.3

## Summary
WHEN TO USE: To place several small/medium open-world props (statues, furniture, characters, mystery props) around the city WITHOUT hitting the batch-crash ceiling or stacking them on procedural buildings. Archetype affinity: GARDENER (place in clear soil), BUILDER (fit). Problem solved: a naive scatter that batch-loads everything (including 40MB Porsches) crashed the tab; and props dropped at fixed coords landed on top of box buildings.

## Schema
- trigger: needing N decorative props distributed across the city ground
- inputs: { list: [{url, targetFoot}], radius }
- outputs: { placed: THREE.Group[] }

## Consequence
- **clearSpot(radius):** reject a candidate point if within 3u (dist² < 9) of any building center in `buildings[]`. Up to 40 tries; fallback to random scatter far out. Guarantees clear ground, no obstruction.
- **dropProp(url, targetFoot):** load one GLB, normalize via `Box3`, scale to `targetFoot`, drop `box.min.y` to ground, place at a `clearSpot()`.
- **Light-only rule:** only load props < ~18MB. Heavy Porsches (40–46MB in `porsche-extra`) are DEFERRED — do not include them in the scatter list.
- **No batching of heavies:** each `dropProp` uses its own `new GLTFLoader()` and fires independently, so the total tab memory stays under the crash ceiling.

## Feedback
- Correct: props sit on open ground between buildings, no overlap, no black screen after load.
- Wrong: props intersect a building box, or the tab whites out (means a heavy prop slipped into the list).

## States
| State | Behavior | Visual |
|---|---|---|
| QUEUED | in scatter list | not yet loaded |
| CLEAR | clearSpot found valid ground | no obstruction |
| DROPPED | GLB placed at ground | prop visible, normalized |
| OVERLOADED | heavy prop included | tab crash |

## Gaps (mechanics not yet consequences)
- No `window.__scatter` registry array to inspect/reposition later (showroom has `window.__showroom`).
- `clearSpot` only avoids `buildings[]`, not satellite districts or world-plate or cars.
- `targetFoot` is manual per asset; no auto-size-by-category table.

## Composition
- **clear-obstruction** (`clear-obstruction`) — sibling: ensures any swap nearby is clean before scatter lands.
- **swap-building** (`swap-building`), **world-plate** (`world-plate`) — district placement; clear areas matter there too.
- **CPL ASSET MAP** (`CPL ASSET MAP`) — records each scattered asset + status.
- **DOUR-BIBLE** (`DOUR-BIBLE`) — the 3JS Soul Gun Bible cluster.

## Cross-Links
- Bible: [[DOUR-BIBLE]] · Catalog: [[neodownloadable]] (SECTION 15) · Map: [[CPL ASSET MAP]]
- Sibling guns: [[SKILL - clear-obstruction]] · [[SKILL - swap-building]] · [[SKILL - world-plate]] · [[SKILL - gt3rs]]
