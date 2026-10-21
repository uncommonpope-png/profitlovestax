**type:: [[decision]]**
**status::** [[status/accepted]]
**date::** June 27, 2026
**extracted-from::** [[2026_06_27]]

---

## Context

The containment observatory dashboard V1 exists (React + Vite + Three.js basic icosahedron). But it's visually flat compared to soul-dashboard. We need to upgrade to V2 with production patterns.

## Decision

**Port soul-dashboard's proven 3D patterns + liquid glass shaders + GLTF models into the React app.**

The dashboard V2 will use:
1. **PyramidCore** replacing basic icosahedron (double pyramid, beam, glow, particles)
2. **FloatingPlatform** below the pyramid (rings, spokes, radar sweep)
3. **MatrixRain** as canvas background (katakana rain)
4. **ParticleField** for ambient particles (2000 points, additive)
5. **PostEffects** for cinematic feel (N8AO + Bloom + ChromaticAb + Noise + Scanline + Vignette)
6. **Liquid glass panels** with real GLSL shaders (SDF, refraction, Fresnel)
7. **GLTF models** loaded via useGLTF (sword, helmet, dragon from Sketchfab/Khronos)
8. **oklch color system** replacing hex (plasma-cyan, plasma-magenta, plasma-gold)

## Rationale

- Soul-dashboard's patterns are proven — already built and tested
- Liquid glass CSS (`backdrop-filter`) looks flat — real GLSL is photorealistic
- GLTF models add real 3D depth to the alien artifact world
- oklch is perceptually uniform — better for glass effects and gradients
- 10 free models already downloaded from Khronos (CC0/CC-BY)
- 4 reusable skills created for future reference

## Consequences

- Performance: More complex scene may drop FPS on low-end devices → mitigate with quality settings
- Size: GLTF models add ~100 MB to asset folder → acceptable for local dev
- Complexity: GLSL shaders harder to debug than CSS → but the visual payoff is worth it
- Reusability: Skills + patterns now documented in Seshat for future projects

## Related

- [[Pattern - 3D Dashboard Scene]]
- [[Pattern - Liquid Glass Shader]]
- [[Pattern - Post-Processing Stack]]
- [[Pattern - 3D Asset Pipeline]]

---

*"The soul-dashboard proved these patterns work. Now the containment observatory inherits them."*
