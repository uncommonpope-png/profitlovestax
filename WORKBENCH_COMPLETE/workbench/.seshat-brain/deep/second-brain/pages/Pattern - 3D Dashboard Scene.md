**type:: [[pattern]]**
**status::** [[status/validated]]
**date::** June 27, 2026
**category::** 3D Graphics
**mined-from::** soul-dashboard (PyramidCore, FloatingPlatform, MatrixRain, ParticleField)

---

## The Pattern

Every dashboard needs a living background. The 3D scene pattern uses React Three Fiber with these layers:

1. **PyramidCore** — Double cone (ConeGeometry top+bottom), vertical beam, glow discs, 30 orbiting particles with sin/cos orbit
2. **FloatingPlatform** — 16 concentric rings (R2.5→0.5, 0.25 step), 24 radial spokes, 48 nodes, radar arc sweep via clock.getElapsedTime
3. **MatrixRain** — Canvas 256x256, katakana charset, 20 columns × 14 rows, 2px font, fade trail (rgba 0,0,0,0.05)
4. **ParticleField** — 2000 random particles, BufferGeometry + PointsMaterial, additive blending, animated Y drift

All layers render as fixed background (z-index: 0), HTML panels overlay at z-index: 1.

## Mental Model

```
3D Canvas (fixed, full-screen)
├── PyramidCore (center, y+1.5)
├── FloatingPlatform (below, y-1)
├── MatrixRain (background plane)
├── ParticleField (2000 points, additive)
└── PostEffects (N8AO + Bloom + ChromaticAb)
    │
HTML Panels (relative, z:1)
├── Topbar
├── Sidebar
└── Content panels (glass, draggable)
```

## Key Code

```tsx
// Three.js particle animation pattern
useFrame(({ clock }) => {
  const t = clock.getElapsedTime()
  ref.current.rotation.y = t * 0.5  // slow orbit
  // For particles, drift Y upward, wrap at boundary
  for (let i = 0; i < arr.length; i += 3) {
    arr[i + 1] += 0.002
    if (arr[i + 1] > 10) arr[i + 1] = -10
  }
})
```

## When to Use

- Dashboard backgrounds that need to feel alive
- Operator consoles with alien/cyberpunk aesthetic
- Any React app where static backgrounds feel dead

## Anti-Patterns

- Don't use too many draw calls — 2000 particles is the sweet spot
- Don't forget `depthWrite: false` with additive blending
- Don't animate in useEffect — use useFrame for per-frame updates

## Related

- [[Pattern - Post-Processing Stack]]
- [[Pattern - Liquid Glass Shader]]
- [[Pattern - 3D Asset Pipeline]]
