# VOID COORDINATE SYSTEM

Reference for placing void content. All coordinates are in world units (u) relative to CPL City at (0, 0, 0).

## Key Locations

| # | Name | Type | Position (X, Y, Z) | Distance | Angle |
|---|------|------|-------------------|----------|-------|
| 0 | Neon Citadel | combat | (2090, 39.6, 221) | 2102u | 6.0° |
| 1 | Shadow Forge | crafting | (2301, 19.1, 632) | 2386u | 15.4° |
| 2 | Crystal Nexus | trading | (1111, 33.6, 1709) | 2038u | 57.0° |
| 3 | Void Empire | exploration | (-23, -27.3, 1409) | 1409u | 90.9° |
| 4 | Ember Sanctum | breeding | (-976, -22.6, 510) | 1101u | 152.4° |
| 5 | Frost Wilds | governance | (-668, 23, -85) | 674u | 187.3° |
| 6 | Storm Hub | economy | (-2211, -14.1, -567) | 2282u | 194.4° |
| 7 | Soul Arena | building | (-1048, -8.8, -2792) | 2982u | 249.4° |
| 8 | Cosmic Garden | conversation | (1553, 17.3, -2135) | 2640u | 306.0° |
| 9 | Phantom Spire | districts | (1152, 32.5, -561) | 1282u | 334.1° |

## Special Points

| Point | Position | Notes |
|-------|----------|-------|
| CPL City | (0, 0, 0) | Origin — NEVER place anything here |
| Pyramidion | (0, 0, 0) | Dual pyramids at Y=0 and Y=200, Z offset TBD |
| Bifrost Bridge | (0, 0, 0) | Future — void-cosmos group center |

## Void Cosmos Shell

| Element | Distance | Description |
|---------|----------|-------------|
| Void Sky Dome | 8000u radius | Dark tinted dome (BackSide) |
| Stars | 1500-3500u | 4000 stars, colored, additive blend |
| Nebulae | 800-1400u | 4 sprite nebulae, scattered |
| Suns | per world | At each world position + Y offset |
| Planets | per world | Orbiting each world |

## Distance Guidelines

| Range | Zone | Placement Rules |
|-------|------|----------------|
| 0-600u | CPL Inner | NOTHING — city visual space only |
| 600-3000u | Lost Worlds Ring | 10 worlds already placed here |
| 3000-5000u | Outer Void | OK for subtle/dark elements |
| 5000-8000u | Deep Void | Good for bright/large structures |
| 8000u+ | Far Void | Any scale, won't affect city |

## Rules

1. **NEVER touch CPL code** — index.html, city scene, city lights, fog, sky, bloom
2. **NEVER place bright lights/particles at < 3000u**
3. **Y = height** — ground level is Y=0, pyramidion inverted at Y=200
4. **Z axis** — positive Z goes "forward" into the distance (behind the city)
5. **X axis** — horizontal, positive = right
6. **Always check the map** (`void-map.html`) before placing new content

## How to Address

To request placement, use format: `(X, Y, Z) + description`

Example: `"Put the void market at (5000, 0, 6000)"`

Open `void-map.html` in a browser to visualize.
