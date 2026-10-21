# Pattern - Mood-Driven Scene System

**Category:** 3D Graphics / State Management  
**Status:** Validated — June 27, 2026  
**Source:** GSK Containment Observatory

## Problem

Need a way to make a 3D scene react to internal state (what the AI is doing, feeling, thinking) without hardcoding every combination.

## Solution

Single **mood state** drives everything: character animation, scene selection, lighting, props.

### Architecture

```
mood-store (Zustand)
├── mood: 'idle' | 'typing' | 'walking' | 'watching' | 'driving' | 'celebrating' | 'sleeping'
├── scene: 'desk' | 'outside' | 'car' | 'sofa'
├── cycleMood() — next mood in list
└── cycleScene() — next scene in list
```

### Scene Router

```tsx
function SceneRouter() {
  const scene = useMoodStore((s) => s.scene)
  switch (scene) {
    case 'desk': return <DeskScene />    // character + desk + laptop + TV
    case 'outside': return <OutsideScene />  // character + stars + artifacts
    case 'car': return <CarScene />      // character + Cadillac
    case 'sofa': return <SofaScene />    // character + sofa + TV
  }
}
```

### Mood → Animation Mapping

Each scene component reads mood and passes to character:
```tsx
const mood = useMoodStore((s) => s.mood)
<GskCharacter mood={mood} clothing="suit" />
```

### Brain-Reactive Lighting

```tsx
<ambientLight intensity={brainOnline ? 0.3 : 0.1} />
```

## Variations

- **Auto-mood**: Wire to GSK bridge telemetry (brain busy → typing, memory write → watching)
- **Time-based**: Day/night cycle changes scene automatically
- **Event-driven**: Council active → celebrating, error → sleeping

## Code Reference

- `containment-observatory-app/src/stores/mood-store.ts`
- `containment-observatory-app/src/components/GskScene.tsx`
