# SOUL-GUN - Purposeful Realm Design

type:: [[Soul Gun]]
project:: [[Cosmic Pyramid Library]]
date:: [[2026_07_13]]
status:: [[usable]]

## Purpose

Prevent extended realms from becoming decorative dead rooms.

## Realm Contract

Every realm needs:

- A visible mission board.
- A central landmark.
- A persistent consequence.
- A click loop.
- A reason to revisit.

## CPL Realm Roles

- Scribe: memory archive plus Agent Terminal World.
- Merchant: claim discoveries and convert them into persistent contracts.
- Builder: commission GSK for blueprints and materialize them as schematics.
- Prophet: ask GSK for future-state predictions and archive prophecies.
- Chamber: preserve visited evidence and light permanent sockets.

## Implementation Hook

Use `makeRealmPlaque(title, subtitle, color)` for mission boards and add all mission/landmark meshes to each realm's click-target list.

## Rule

If a realm does not change memory, state, route, contract, build, prophecy, or chamber progress, it is decoration, not gameplay.
