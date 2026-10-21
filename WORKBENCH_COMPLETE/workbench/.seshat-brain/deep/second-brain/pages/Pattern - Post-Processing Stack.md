**type:: [[pattern]]**
**status::** [[status/validated]]
**date::** June 27, 2026
**category::** 3D Graphics
**mined-from::** soul-dashboard PostEffects.tsx, pmndrs/postprocessing

---

## The Pattern

Post-processing creates cinematic cyberpunk visuals. The stack applies effects in order after the 3D scene renders:

1. **N8AO** — Screen-space ambient occlusion (crevice shadows)
2. **Bloom** — Glow around bright objects (mipmap blur)
3. **ChromaticAberration** — R/G/B channel split at edges
4. **Noise** — Film grain overlay
5. **Scanline** — Horizontal CRT lines
6. **Vignette** — Dark corners

## Tuning Table

| Effect | Parameter | Value | Effect |
|--------|-----------|-------|--------|
| N8AO | aoSamples | 12 | Quality (4=fast, 12=high) |
| N8AO | intensity | 40 | Darkness of crevices |
| Bloom | luminanceThreshold | 0.8 | Only bloom bright pixels |
| Bloom | intensity | 2.5 | Glow strength |
| ChromaticAberration | offset | 0.004 | RGB split distance |
| Noise | opacity | 0.5 | Grain intensity |
| Scanline | density | 1.2 | Line spacing |
| Vignette | offset | 0.43 | Darkening start radius |
| Vignette | darkness | 0.7 | Corner darkness |

## Mental Model

```
3D Scene → [N8AO] → [Bloom] → [ChromaticAb] → [Noise] → [Scanline] → [Vignette] → Screen
```

## When to Use

- Any Three.js scene that needs cinematic feel
- Dashboards with cyberpunk/alien aesthetic
- Games or interactive experiences

## Anti-Patterns

- Don't put PostEffects BEFORE 3D objects — it processes the final frame
- Don't use multisampling=0 on desktop — it makes edges jagged
- Don't forget `depthWrite={false}` on transparent materials

## Related

- [[Pattern - 3D Dashboard Scene]]
- [[Pattern - Liquid Glass Shader]]
