---
tags: [pattern, 3d, assets, glb, threejs, r3f]
date: 2026-06-27
session: 13
status: active
---

# Pattern - 3D Asset Pipeline

## Asset Sources

| Source | License | Auth |
|---|---|---|
| Poly Haven | CC0 | No |
| Sketchfab | CC-BY | Yes |
| Meshy | CC0 (AI-generated) | No |
| Khronos samples | CC0/CC-BY | No |
| OS3A | Open source | No |
| Three.js examples | Varies | No |

## Download Tools

- **curl**: Direct URLs
- **Sketchfab**: API token or browser auth
- **Poly Haven**: Direct API

## Optimization

- `gltf-pipeline --draco.compressionLevel=10` for compression
- **GLB over glTF**: Smaller, single file

## Loading in R3F

```jsx
import { useGLTF, DRACOLoader, MeshoptDecoder } from '@react-three/drei'
import { Suspense } from 'react'

function Model({ url }) {
  const { scene } = useGLTF(url, true, {
    dracoLoader: new DRACOLoader(),
    meshoptDecoder: MeshoptDecoder,
  })
  return <primitive object={scene} />
}

// Wrap in Suspense
<Suspense fallback={<Loader />}>
  <Model url="/model.glb" />
</Suspense>
```

`useGLTF` preload for caching.

## Best Practices

- Max 1-2MB per model
- Use DRACO compression
- Name meshes properly for animation
- Separate meshes for interactivity
