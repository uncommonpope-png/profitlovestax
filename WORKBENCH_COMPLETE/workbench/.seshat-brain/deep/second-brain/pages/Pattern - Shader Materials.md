**type:: [[pattern]]**
**status::** [[status/validated]]
**date::** June 27, 2026
**category::** Shaders
**mined-from::** Three.js docs, @react-three/drei, three-custom-shader-material

---

## The Pattern

Three.js has 3 levels of custom materials:

### Level 1: ShaderMaterial (Unlit, Full Control)

```tsx
const material = new THREE.ShaderMaterial({
  uniforms: {
    uTime: { value: 0 },
    uColor: { value: new THREE.Color('#38bdf8') },
    uTexture: { value: texture },
  },
  vertexShader: `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    uniform float uTime;
    uniform vec3 uColor;
    varying vec2 vUv;
    void main() {
      float stripes = sin(vUv.y * 40.0 + uTime * 3.0) * 0.5 + 0.5;
      gl_FragColor = vec4(uColor * stripes, 1.0);
    }
  `,
})
```

**Auto-provided uniforms:** `projectionMatrix`, `modelViewMatrix`, `viewMatrix`, `modelMatrix`, `position`, `normal`, `uv`

### Level 2: Drei shaderMaterial (Reusable, Typed Props)

```tsx
import { shaderMaterial } from '@react-three/drei'
import { extend } from '@react-three/fiber'

const GlassMaterial = shaderMaterial(
  { uTime: 0, uIOR: 1.5, uColor: new THREE.Color('cyan') },
  vertexShader,
  fragmentShader
)

extend({ GlassMaterial })

// Usage — uniforms become direct JSX props
<mesh>
  <planeGeometry args={[2, 2]} />
  <glassMaterial ref={ref} uIOR={1.5} transparent />
</mesh>
```

### Level 3: three-custom-shader-material (Extend PBR)

```tsx
import CustomShaderMaterial from 'three-custom-shader-material'
import { MeshPhysicalMaterial } from 'three'

<CustomShaderMaterial
  baseMaterial={MeshPhysicalMaterial}
  vertexShader={`
    uniform float uTime;
    void main() {
      csm_Position = position + normal * sin(position.x * 10.0 + uTime);
    }
  `}
  fragmentShader={`
    uniform float uTime;
    void main() {
      csm_DiffuseColor = vec4(1.0, 0.0, 0.0, 1.0);
    }
  `}
  uniforms={{ uTime: { value: 0 } }}
  roughness={0.56}
  metalness={0.76}
/>
```

**CSM output variables:**

| Variable | Type | Description |
|----------|------|-------------|
| `csm_Position` | vec3 | Custom vertex position (auto-projected) |
| `csm_PositionRaw` | vec4 | Direct gl_Position |
| `csm_Normal` | vec3 | Custom normals |
| `csm_DiffuseColor` | vec4 | PBR-shaded diffuse color |
| `csm_FragColor` | vec4 | Override gl_FragColor (no PBR) |

## When to Use

| Approach | Use When |
|----------|----------|
| ShaderMaterial | Hologram, dissolve, plasma, portal (unlit) |
| Drei shaderMaterial | Reusable custom material, typed props |
| CSM | PBR + custom vertex displacement or color |
| onBeforeCompile | PBR + light `#include` patch |

## Anti-Patterns

- Don't create new ShaderMaterial per frame — hoist or useMemo
- Don't forget `instanceColor.needsUpdate = true` after setColorAt on InstancedMesh
- Don't put `<Suspense>` outside `<Canvas>` — always inside

## Related

- [[Pattern - Liquid Glass Shader]]
- [[Pattern - Post-Processing Stack]]
- [[Pattern - 3D Asset Pipeline]]
