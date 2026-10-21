# SPACE ENGINE STUDY — Learning from the Universe Simulator

**Studied:** July 25, 2026
**Source:** https://spaceengine.org/
**Purpose:** Learn how SpaceEngine fills the void with procedural planets, stars, and galaxies — so we can make the CPL void a living cosmos instead of an empty black box.

**MANDATE:** We are NOT adding anything yet. We are LEARNING.

---

## What SpaceEngine Is

A realistic virtual universe simulator. Procedural generation at every scale — trillions of galaxies, billions of star systems in each, all seamlessly traversable from the surface of a planet to the most distant galaxy. Based on real scientific knowledge. Real celestial objects (HIPPARCOS, NGC/IC, Messier, NASA Exoplanet Archive) coexist with procedurally generated ones.

---

## Core Architecture Lessons

### 1. Hierarchical Universe Structure

```
Universe
  └─ Galaxies (trillions, procedural + catalogued)
       └─ Star Systems (billions per galaxy)
            └─ Stars (classes: OBAFGKM, white dwarfs, neutron, black holes)
                 └─ Planets (classes: Terra, Desert, Selena, Oceania, IceWorld, Titan, GasGiant, IceGiant)
                      └─ Moons (same classes as planets)
                           └─ Asteroids / Comets
```

**For CPL:** Our Lost Worlds are the "star systems." The void needs the layers above them — a cosmic backdrop with galaxies, nebula, distant stars, and maybe planetary bodies that create a sense of scale.

### 2. Procedural Generation at Every Level

SpaceEngine generates everything from noise functions. The key parameters for each level:

| Level | Generated From |
|-------|---------------|
| Galaxy shape | Spiral/elliptical/irregular parameters |
| Star type | Mass, temperature, spectral class |
| Planet class | Distance from star, mass, composition |
| Surface terrain | Noise frequency/magnitude for each feature type |
| Atmosphere | Precomputed model + composition + density |
| Clouds | Coverage + height + velocity + noise params |
| Life | Chemical class + development level + biome |

**For CPL:** We don't need full procedural generation. We need curated cosmic elements that feel alive. The procedural approach we DO want:
- Starfield (positions, colors, sizes) — already done as a stash
- Planets (size, color, orbit, rings) — we attempted this in `ad4b355`
- Nebula (color, position, scale) — the existing code has `createNebulaTexture` at index.html line 4623

### 3. Planet Definition System (Script DSL)

SpaceEngine defines planets through a rich declarative script. Each planet has:

```
Planet "Name" {
  ParentBody  "StarName"
  Class       "Terra" | "Desert" | "Selena" | "GasGiant" | ...
  Mass        <Earth masses>
  Radius      <km>
  RotationPeriod <hours>
  AlbedoBond  <0..1>
  Color       (R G B)

  Life { Class "Organic" Type "Multicellular" Biome "Terrestrial" }

  Surface {
    // Terrain noise parameters
    mainFreq, oceanStyle, seaLevel, snowLevel
    mountainFreq, mountainMagn
    canyonFreq, canyonMagn
    craterFreq, craterMagn, craterDensity
    volcanoFreq, volcanoMagn, volcanoActivity
    // Color table
    colorSea, colorBeach, colorLowland, colorUpland, colorRock, colorSnow
  }

  Atmosphere { Model "Earth" Height 124 Density 4.8 Pressure 2.6 }

  Clouds { Height 4.3 Velocity 117 Coverage 0.4 }

  Rings { InnerRadius 7000 OuterRadius 14000 }

  Aurora { Height 53 NorthLat 57 ... }

  Orbit {
    SemiMajorAxis 1.0  // AU
    Eccentricity  0.01
    Inclination   0.02
    Period        0.96  // years
  }
}
```

**For CPL:** Our `realm-world.js` already has a similar pattern for Lost Worlds. Each world has a config with type, color, PLT values. We could extend this to include celestial body parameters. The `void-population.js` beacon system is the always-visible marker — planets would be additional celestial objects in the background.

### 4. Planet Surface Classes

| Class | Description | Atmosphere | Water | Example |
|-------|-------------|-----------|-------|---------|
| Asteroid | Irregular shape | None | No | Ceres |
| Selena | Rocky, airless | None | No | Moon, Mercury, Io |
| Desert | Rocky, atmo, no water | Yes | No | Venus, Mars |
| **Terra** | Rocky, atmo, water | Yes | Yes | **Earth** |
| Oceania | Ocean world | Yes | Global | Waterworld |
| IceWorld | Icy surface | Maybe | Ice | Europa, Ganymede |
| Titan | Icy + atmo + hydrocarbons | Yes | Methane | Titan |
| IceGiant | Ice giant | Thick | No | Uranus, Neptune |
| GasGiant | Gas giant | Very thick | No | Jupiter, Saturn |

**For CPL:** Each Lost World currently has a TYPE (combat/crafting/trading/etc.). We could also give each a PLANET CLASS that determines its visual appearance as a celestial body when viewed from far away.

### 5. What Makes It Feel Like a Real Universe

1. **Depth at every scale** — Zoom from galaxy → star → planet → mountain → rock grain. Each level has its own procedural detail.
2. **Seamless transitions** — No loading screens. Fly from a planet surface to another galaxy in one continuous motion.
3. **Motion** — Everything orbits. Time can be sped up/slowed/reversed. Planets rotate, moons orbit, rings precess.
4. **Atmospheric lighting** — Sunsets, sunrises, sky color based on atmospheric composition. Stars visible from space, blue sky from surface.
5. **Catalog + procedural blend** — Real known objects coexist with generated ones. You can find real exoplanets AND explore uncharted regions.
6. **Classification** — Every object has a type. You know what you're looking at (G2V star, Terra planet, SA galaxy).
7. **Labels + data** — Click any object → see its physical parameters (mass, radius, temperature, composition, orbital elements).
8. **Soundtrack** — Context-dependent music that changes based on what you're observing.

---

## Applying to CPL: What a "Living Void" Needs

### Background Layer (Always Visible)

The void needs a cosmic backdrop so it's not just black:

| Element | How SpaceEngine Does It | How We Could Do It |
|---------|------------------------|-------------------|
| **Starfield** | Thousands of points, varying size/color | Procedural stars (our stash) or improved starfield |
| **Galaxies** | 3D spiral/elliptical models at distance | We already have `createSpiralGalaxy` at index.html:4537 — 5 galaxies already exist |
| **Nebula** | Volumetric glowing clouds, additive blend | We already have `createNebulaTexture` at index.html:4623 — rotating sprites |
| **Universe Sky Dome** | Not needed (seamless universe) | We already have one at index.html:4468 |

**Wait — most of this already exists in the BASE MODEL!** The base already has:
- Stars (5000-point field, line 4400)
- 5 spiral galaxies at positions around the scene (line 4569-4574)
- Nebula background sprites with rotation (line 4623-4667)
- Universe Sky Dome with clouds (line 4468-4513)
- Gradient ground (line 4578)
- Horizon planets (line 4516)

The base already has a cosmic background! The question is whether it's visible behind the Lost Worlds or if the fog/camera distance hides it.

### Midground Layer (Distant Celestial Bodies)

What's MISSING from the base that would make the void feel full:

| Element | Description |
|---------|-------------|
| **Distant planets** | Large spheres visible from far away, with glow + atmosphere |
| **Orbital motion** | Planets slowly orbiting, moons orbiting planets |
| **Sun with corona** | A central star or distant suns with visible corona/glow |
| **Planetary rings** | Tilted ring systems around some planets |
| **Multiple star systems** | Binary stars visible in the distance |

These were attempted in commit `ad4b355` (planets, suns, moons) but were reverted because of issues. The approach was:
- Each Lost World had a planet (radius 12-20) with aura glow + 2 tilted rings
- A sun (radius 6) with glow + corona + PointLight
- 2-3 moons orbiting each planet

### Foreground Layer (Lost Worlds)

Already populated — 10 worlds with beacons, cities, denizens, portals, quests.

---

## Key Technical Insights

### Noise-Based Generation
SpaceEngine's terrain is driven by layered noise parameters:
- `mainFreq` — continent/ocean distribution
- `montesFreq/magn` — mountain ranges
- `craterFreq/magn/density` — impact craters
- `volcanoFreq/magn/activity` — volcanic features
- `riversFreq/magn/sin` — river networks
- `colorSea/colorBeach/colorLowland/...` — altitude-based color table

**For CPL:** Our procedural city builder (`createCitySkeleton`) uses a similar noise-based approach for building placement. We could use noise for terrain generation on Lost Worlds.

### Atmosphere Models
Precomputed binary models (`.atm` files) with adjustable parameters:
- Earth, Mars, Venus, Jupiter, Neptune, Titan, Pluto, custom thick/thin
- Parameters: height, density, pressure, greenhouse, brightness, opacity, hue, saturation, composition

**For CPL:** Our per-world atmosphere domes (currently just tinted transparent spheres) could be enhanced with proper sky color gradients, horizon glow, and FogExp2 adjustments per world.

### Rings System
- Inner/Outer radius, front/back brightness, rotation period
- Procedural texture generation if no texture specified
- Alpha channel for opacity variation

**For CPL:** Rings were in `ad4b355` (2 tilted rings per planet). The code exists but was reverted.

### Keplerian Orbits
Full orbital elements: semi-major axis, eccentricity, inclination, ascending node, argument of periapsis, mean anomaly. Reference plane options: Equator, Ecliptic, Extrasolar, Static, Fixed.

**For CPL:** Our moons in `ad4b355` used simple circular orbits (theta += speed). For proper orbits we'd want at minimum: semi-major axis, eccentricity, inclination, orbital period.

---

## What to Study Next

1. **SpaceEngine's star system generator** — how it places planets at realistic distances from stars
2. **SpaceEngine's planet texture generator** — how it produces believable surface colors from noise
3. **SpaceEngine's LOD system** — how it handles rendering at galaxy/star/planet/terrain scale seamlessly
4. **The existing CPL sky system** — what's already in `index.html` around lines 4468-4691 (Universe Sky Dome, spiral galaxies, nebula, planets) that we might not be seeing in the void

---

## Conclusion

The BASE MODEL already has more cosmic background elements than we realized (stars, galaxies, nebula, sky dome). The void may feel empty not because these don't exist, but because:
1. The fog density hides distant objects
2. The camera far plane limits visibility
3. No planets orbit visibly in the void
4. The Lost Worlds need celestial companions

**Next step (when Craig says GO):** Audit the existing cosmic elements to see what's visible from the void, then build a planet/moon system that orbits visibly and gives the void depth and scale.
