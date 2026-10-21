# Pattern - Procedural Character System

**Category:** 3D Graphics / Character Design  
**Status:** Validated — June 27, 2026  
**Source:** GSK Containment Observatory

## Problem

Need a reusable 3D character that can be customized (colors, clothing, animations) without downloading external models or dealing with auth/licensing.

## Solution

Build the character entirely from Three.js primitives (Geometry + Material). Each body part is a separate `<mesh>` in a `<group>`, allowing independent animation via refs.

### Architecture

```
GskCharacter (group)
├── AlienBody (group — animated via refs)
│   ├── Torso (capsuleGeometry + material)
│   ├── Neck (cylinderGeometry)
│   ├── Head (group — animated)
│   │   ├── Skull (sphereGeometry)
│   │   ├── Eyes (sphereGeometry × 2 + pupil spheres)
│   │   ├── Mouth (torusGeometry arc)
│   │   ├── Antenna (cylinderGeometry × 2 + sphere tips)
│   │   └── Hat (sphere dome + box brim + circle logo)
│   ├── Left Arm (group — animated)
│   │   ├── Upper (capsuleGeometry)
│   │   └── Hand (sphereGeometry)
│   ├── Right Arm (group — animated)
│   ├── Left Leg (group — animated)
│   │   ├── Upper (capsuleGeometry)
│   │   └── Foot (boxGeometry)
│   └── Right Leg (group — animated)
├── Suit Details (conditional — collar, buttons, tie)
└── MoodIndicator (floating sphere — color + pulse)
```

### Clothing System

Clothing is a **material swap**, not mesh swapping:
- `suit`: Body material → dark (`#1a1a2e`), add collar/buttons/tie
- `casual`: Body material → lighter color
- `naked`: Body material → pink skin

### Animation System

Each limb is a `useRef<THREE.Group>` animated in `useFrame`:
```tsx
useFrame((state) => {
  const t = state.clock.elapsedTime
  if (mood === 'walking') {
    leftArmRef.current.rotation.x = Math.sin(t * 4) * 0.6
    rightArmRef.current.rotation.x = Math.sin(t * 4 + Math.PI) * 0.6
  }
})
```

### Mood-Driven Behavior

Single mood state drives all animations:
- `idle`: Gentle float, slow rotation
- `typing`: Arm forward, wrist flick
- `walking`: Full stride with arm swing
- `celebrating`: Jump + spin
- `sleeping`: Lean back, droop

## Variations

- **Alien variant**: Antenna, green glowing eyes, pink skin (current)
- **Human variant**: Remove antenna, normal eyes, skin tones
- **Robot variant**: Box geometry body, metallic materials, LED eyes

## Code Reference

- `containment-observatory-app/src/components/GskCharacter.tsx`
- `containment-observatory-app/src/stores/mood-store.ts`
