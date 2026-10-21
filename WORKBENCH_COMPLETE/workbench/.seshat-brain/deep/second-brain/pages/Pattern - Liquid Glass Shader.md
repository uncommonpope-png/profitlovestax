**type:: [[pattern]]**
**status::** [[status/validated]]
**date::** June 27, 2026
**category::** Shaders
**mined-from::** ybouane/liquidglass, ektogamat/apple-liquid-glass

---

## The Pattern

Real liquid glass panels use a 3-stage WebGL GLSL pipeline, not CSS backdrop-filter:

1. **BlitTexture** — Copy input texture to framebuffer
2. **BlurTexture** — 9-tap Gaussian blur (two passes, 9x9 kernel)
3. **GlassComposite** — GLSL shader with SDF, bevel, refraction, Fresnel, specular

## Key Math

```
// Anti-aliased rounded rectangle SDF
float sdRoundedRect(vec2 p, vec2 halfSize, float r) {
  vec2 q = abs(p) - halfSize + r;
  return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - r;
}

// Bevel height from SDF distance (pill profile)
float bevelHeight(float d, float zR) {
  return sqrt(d * (2.0 * zR - d));
}

// Bevel normal via SDF gradient
vec3 normal = normalize(vec3(dx, dy, eps * 2.0));

// Dual-surface refraction (IOR 1.5, chromatic aberration)
float refrR = 1.0 / u_ior;
float refrG = 1.0 / (u_ior + 0.02);
float refrB = 1.0 / (u_ior + 0.04);

// Fresnel
float fresnel = pow(1.0 - max(dot(viewDir, normal), 0.0), 5.0);

// Blinn-Phong specular
float specular = pow(max(dot(normal, halfVec), 0.0), 64.0);
```

## Mental Model

```
Input Texture → [SDF Panel Shape] → [Bevel Normals]
                     ↓                    ↓
              [Panel Mask α]      [Refraction IOR 1.5]
                     ↓                    ↓
              [Fresnel Tint]  ← [Chromatic Aberration]
                     ↓
              [Blinn-Phong Specular]
                     ↓
              Final Glass Color + Alpha
```

## When to Use

- Dashboard panels that need real glass appearance
- UI overlays where backdrop-filter looks flat
- Cyberpunk/alien aesthetic dashboards

## Anti-Patterns

- CSS `backdrop-filter: blur()` is NOT liquid glass — it's just blur
- Don't use IOR < 1.0 — physically impossible
- Don't forget anti-aliasing on SDF edges (smoothstep)

## Related

- [[Pattern - 3D Dashboard Scene]]
- [[Pattern - Post-Processing Stack]]
