# SOUL-GUN - Staged GLB Character Pool

type:: [[Soul Gun]]
project:: [[Cosmic Pyramid Library]]
date:: [[2026_07_13]]
status:: [[usable]]

## Purpose

Use real GLB bodies for players/NPCs without destroying load time.

## Pattern

1. Define a small `kind -> GLB path` character library.
2. Load each kind once on demand.
3. Use `SkeletonUtils.clone()` for skinned/rigged clones.
4. Queue loads one at a time with a delay between jobs.
5. Show primitive placeholders immediately.
6. Swap placeholders to GLB clones after the world is already interactive.
7. Stamp interaction metadata (`npcTalk`, `denizen`, `isAvatar`) onto cloned meshes.

## CPL Hooks

- `avatarAssets`
- `avatarLoadQueue`
- `pumpAvatarLoadQueue()`
- `cloneAvatarModel(kind)`
- `scheduleGlbNpcBody(group, kind, talkData, primitiveParts)`

## Rule

Never load one GLB per NPC. Load one GLB per body kind, then clone.
