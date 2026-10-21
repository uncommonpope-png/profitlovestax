# Decision - Procedural Over Downloaded Models

**Status:** [[status/accepted]]  
**Date:** June 27, 2026  
**Context:** GSK Containment Observatory — building pink alien character

## Decision

Build GSK's character from Three.js primitives instead of downloading 3D models from Sketchfab.

## Options

### Option A: Download from Sketchfab
- **Pros**: High-quality models, realistic proportions, textures included
- **Cons**: Requires auth token, licensing complexity, can't customize colors/animations easily, large file sizes (5-76 MB), dependency on external service

### Option B: Build from Three.js Primitives (CHOSEN)
- **Pros**: Full control over colors, clothing, animations, zero dependencies, tiny bundle size, instant iteration, mood-driven animation system
- **Cons**: Simpler geometry, no textures, more code upfront

## Rationale

1. **Control**: We need the character to change color (pink), wear clothes (snapback hat, suit), and animate based on mood. Downloaded models require complex bone rigging for this.
2. **Speed**: Procedural = instant changes. Download = upload, inspect, rig, retarget animations.
3. **Size**: Our character is ~50 lines of geometry. A Sketchfab model is 5-76 MB of GLB.
4. **Integration**: Mood system drives character directly via refs. No animation retargeting needed.
5. **Licensing**: No CC-BY attribution needed for procedural geometry.

## Consequences

- Character looks stylized/low-poly (intentional for alien aesthetic)
- Can upgrade to Sketchfab models later for higher fidelity
- Procedural props (laptop, TV, Cadillac) follow same pattern
- Pattern documented for reuse in other soul products

## Related

- [[Pattern - Procedural Character System]]
- [[Pattern - Mood-Driven Scene System]]
- [[Decision - Dashboard V2 Architecture]]
