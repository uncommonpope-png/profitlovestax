# AGE OF EMPIRES — Complete Mechanics Reference
## Everything AoE II does, mapped against Buyasoul CPL

---

## 1. GAME FLOW & MATCH STRUCTURE

### Game States
- Main Menu → Lobby → Loading → Playing → Post-Game
- Single Player: Campaign, Random Map, Death Match, King of the Hill, Wonder Race
- Multiplayer: Ranked, Unranked, Custom, Spectator

### Match Phases
- Dark Age (start) → Feudal Age → Castle Age → Imperial Age → Post-Imperial
- Each age unlocks new buildings, units, technologies, and upgrades
- Age-up requires specific buildings + resource cost + build time

### Victory Conditions
- **Standard**: Build a Wonder and defend it for N minutes
- **Conquest**: Destroy all enemy landmarks/buildings
- **Time**: Highest score when timer expires
- **King of the Hill**: Hold monument for N minutes
- **Regicide**: Kill the enemy King

---

## 2. RESOURCES (4 Types)

| Resource | Gathered From | Used For |
|----------|--------------|----------|
| **Food** | Farms, berries, hunting (deer, boar, sheep, turkeys), fishing, forage bushes, farming | Units, age-up, tech |
| **Wood** | Trees (chopping) | Buildings, siege weapons, ships, farms |
| **Gold** | Gold mines, trade carts, relics (in monasteries) | Units, techs, gold-heavy units |
| **Stone** | Stone mines | Castles, walls, towers, unique buildings |

### Resource Mechanics
- **Carry capacity**: Villagers carry limited amounts before returning to drop-off
- **Drop-off points**: Town Center, Lumber Camp, Mining Camp, Mill, Dock
- **Gather rates**: Different per resource type and upgrade level
- **Depletion**: Mines and trees deplete; farms must be reseeded
- **Trade**: Trade carts/cogs between allied markets/docks generate gold
- **Relics**: Monks collect relics from map, generate gold passively in monasteries

---

## 3. BUILDINGS (Complete List)

### Economic Buildings
| Building | Cost | Purpose |
|----------|------|---------|
| **Town Center** | Free (starting) | Villager production, resource drop-off, age-up, garrison |
| **Farm** | 60 Wood | Food production (finite, must reseed) |
| **Lumber Camp** | 100 Wood | Wood drop-off + lumber upgrades |
| **Mining Camp** | 100 Wood | Gold/stone drop-off + mining upgrades |
| **Mill** | 100 Wood | Food drop-off (berries, farms) + farming upgrades |
| **Market** | 175 Wood | Trade carts, resource selling/buying, economic techs |
| **Dock** | 150 Wood | Fishing ships, transport, trade cogs, war ships |

### Military Buildings
| Building | Cost | Purpose |
|----------|------|---------|
| **Barracks** | 175 Wood | Infantry units (required for all military) |
| **Archery Range** | 175 Wood | Ranged units (requires Barracks) |
| **Stable** | 175 Wood | Cavalry units (requires Barracks) |
| **Siege Workshop** | 175 Wood | Siege weapons (requires Archery Range or Stable) |
| **Castle** | 650 Stone | Unique units, trebuchets, research, garrison, map control |
| **Tower** (Watch/Guard/Keep) | 25/25/125 stone | Defensive, garrison, line of sight |
| **Bombard Tower** | 125 stone | Imperial Age tower that fires cannonballs |

### Religious/Support Buildings
| Building | Cost | Purpose |
|----------|------|---------|
| **Monastery** | 175 Wood | Monk production, relic collection, healing, conversion |
| **University** | 200 Wood | Shared tech upgrades (ballistics, masonry, etc.) |

### Walls & Gates
| Building | Cost | Purpose |
|----------|------|---------|
| **Palisade Wall** | 2 Wood per segment | Early game barrier |
| **Stone Wall** | 100 Stone per 5 segments | Strong barrier |
| **Gate** | Variable | Passage through walls (open/close toggle) |

### Special
| Building | Cost | Purpose |
|----------|------|---------|
| **Wonder** | 1000F 1000W 1000G 1000S | Victory timer (Standard mode) |
| **Feudal/Castle/Imperial Age Buildings** | Varies | Unlock at each age |

---

## 4. UNITS (Complete List by Category)

### Villagers
- Cost: 50 Food
- Activities: Build, Repair, Gather (all 4 resources), Hunt, Fish, Trade (with carts)
- Combat: Weak melee (can fight in desperation)
- Garrison: Up to 15 in Town Center (fire arrows)

### Infantry (Barracks)
| Unit | Age | Cost | HP | Attack | Armor | Speed | Notes |
|------|-----|------|----|--------|-------|-------|-------|
| **Militia** | Dark | 60F 20G | 25 | 4 | 0/0 | 0.9 | Cheapest military |
| **Man-at-Arms** | Feudal | 60F 20G (upgrade) | 40 | 6 | 1/0 | 0.9 | Militia upgrade |
| **Long Swordsman** | Castle | 60F 20G (upgrade) | 60 | 9 | 1/0 | 0.9 | MAA upgrade |
| **Two-Handed Swordsman** | Imperial | 60F 20G (upgrade) | 75 | 12 | 1/0 | 0.9 | LS upgrade |
| **Champion** | Imperial | 60F 20G (upgrade) | 85 | 17 | 1/0 | 0.9 | Final upgrade |
| **Spearman** | Feudal | 35F 25W | 30 | 3 | 0/0 | 0.9 | Anti-cavalry |
| **Pikeman** | Castle | 35F 25W (upgrade) | 45 | 4 | 0/0 | 0.9 | Spearman upgrade |
| **Halberdier** | Imperial | 35F 25W (upgrade) | 60 | 6 | 0/0 | 0.9 | Pikeman upgrade |

### Ranged (Archery Range)
| Unit | Age | Cost | HP | Attack | Range | Armor | Notes |
|------|-----|------|----|--------|-------|-------|-------|
| **Archer** | Feudal | 25F 45W | 30 | 4 | 5 | 0/0 | Fast fire rate |
| **Crossbowman** | Castle | 25F 45W (upgrade) | 35 | 5 | 5 | 0/0 | Archer upgrade |
| **Arbalest** | Imperial | 25F 45W (upgrade) | 40 | 7 | 5 | 0/0 | Crossbow upgrade |
| **Skirmisher** | Feudal | 25F 35W | 30 | 2 | 5 | 0/3 | Anti-archer (bonus) |
| **Elite Skirmisher** | Castle | 25F 35W (upgrade) | 35 | 3 | 5 | 0/4 | Skirm upgrade |
| **Hand Cannoneer** | Imperial | 45F 50G | 35 | 17 | 5 | 1/0 | Anti-infantry gunpowder |
| **Cavalry Archer** | Castle | 80F 70W | 60 | 6 | 4 | 0/0 | Mobile ranged |
| **Heavy Cavalry Archer** | Imperial | 80F 70W (upgrade) | 80 | 7 | 4 | 1/0 | HC Archer upgrade |

### Cavalry (Stable)
| Unit | Age | Cost | HP | Attack | Armor | Speed | Notes |
|------|-----|------|----|--------|-------|-------|-------|
| **Scout Cavalry** | Dark/Feudal | 80F | 45 | 3 | 0/2 | 1.6 | Fast, exploration, light combat |
| **Light Cavalry** | Feudal | 80F (upgrade) | 60 | 6 | 0/2 | 1.6 | Scout upgrade |
| **Hussar** | Imperial | 80F (upgrade) | 75 | 7 | 0/2 | 1.6 | Light Cav upgrade |
| **Knight** | Castle | 60F 75G | 100 | 10 | 2/2 | 1.35 | Strong melee |
| **Cavalier** | Imperial | 60F 75G (upgrade) | 120 | 12 | 2/2 | 1.35 | Knight upgrade |
| **Paladin** | Imperial | 60F 75G (upgrade) | 160 | 14 | 2/3 | 1.35 | Final cavalry |
| **Camel Rider** | Castle | 55F 60G | 100 | 6 | 0/0 | 1.3 | Anti-cavalry |
| **Heavy Camel** | Imperial | 55F 60G (upgrade) | 120 | 7 | 0/0 | 1.3 | Camel upgrade |
| **Battle Elephant** | Castle | 200F 75G | 250 | 14 | 1/1 | 0.9 | Heavy, trample damage |
| **Elite Battle Elephant** | Imperial | 200F 75G (upgrade) | 300 | 18 | 1/1 | 0.9 | Upgrade |

### Siege (Siege Workshop)
| Unit | Age | Cost | HP | Attack | Range | Armor | Notes |
|------|-----|------|----|--------|-------|-------|-------|
| **Battering Ram** | Castle | 160W 75G | 170 | 2 (+150 vs buildings) | Melee | 0/7 | Building destroyer |
| **Capped Ram** | Imperial | 160W 75G (upgrade) | 200 | 3 (+180 vs buildings) | Melee | 0/10 | Ram upgrade |
| **Siege Ram** | Imperial | 160W 75G (upgrade) | 270 | 4 (+210 vs buildings) | Melee | 0/13 | Final ram |
| **Mangonel** | Castle | 160W 75G | 100 | 50 (area) | 7 | 0/0 | Area damage, squishy |
| **Onager** | Imperial | 160W 75G (upgrade) | 120 | 55 (area) | 7 | 0/0 | Mangonel upgrade |
| **Siege Onager** | Imperial | 160W 75G (upgrade) | 150 | 75 (area) | 7 | 0/0 | Final onager |
| **Scorpion** | Castle | 120W 75G | 50 | 12 (+4 bonus) | 7 | 0/0 | Anti-unit, pierces |
| **Heavy Scorpion** | Imperial | 120W 75G (upgrade) | 60 | 16 (+4 bonus) | 7 | 0/0 | Scorpion upgrade |
| **Trebuchet** | Imperial (Castle) | 200W 200G | 150 | 200 (+1000 vs buildings) | 16 | 0/1 | Building destroyer, unpacks |
| **Bombard Cannon** | Imperial | 225F 225G | 80 | 200 (+200 vs buildings) | 12 | 2/5 | Mobile cannon |

### Monk/Monastery Units
| Unit | Age | Cost | HP | Notes |
|------|-----|------|----|-------|
| **Monk** | Castle | 100G | 25 | Converts enemies (faith-based), heals, collects relics |
| **Missionary** | Castle (unique) | Varies | Varies | Mounted monk (some civs only) |
| **Relic** | Map object | Free | N/A | Generates gold when in monastery |

### Monk Technologies
- **Redemption**: Convert siege weapons
- **Atonement**: Convert enemy monks
- **Herbal Medicine**: Heal faster
- **Heresy**: Converted units die instead of switching
- **Sanctity**: Monks +30 HP
- **Fervor**: Monks +15% movement speed
- **Faith**: Resistance to conversion
- **Theocracy**: 1 monk converts, all benefit

### Unique Units (Civilization-specific)
| Unit | Civilization | Type | Notes |
|------|-------------|------|-------|
| **Longbowman** | Britons | Ranged | Extra range archer |
| **Cataphract** | Byzantines | Cavalry | Anti-infantry cavalry |
| **Chu Ko Nu** | Chinese | Ranged | Multi-shot crossbow |
| **Cannon Galleon** | Various | Naval | Bombard ship |
| **Huskarl** | Goths | Infantry | High pierce armor |
| **Mameluke** | Saracens | Cavalry | Ranged melee (throws scimitar) |
| **Tarkan** | Huns | Cavalry | Anti-building cavalry |
| **Woad Raider** | Celts | Infantry | Very fast infantry |
| **Jaguar Warrior** | Aztecs | Infantry | Anti-infantry |
| **Plumed Archer** | Mayans | Ranged | Fast, high HP archer |
| **Konnik** | Bulgarians | Cavalry | Dismounts to infantry |
| **Keshik** | Tatars | Cavalry | Generates gold on attack |
| **Leitis** | Lithuanians | Cavalry | Ignores armor |
| **Kamayuk** | Incas | Infantry | Extra range spearman |
| **Slinger** | Incas | Ranged | Anti-infantry archer |
| **Ballista Elephant** | Khmer | Siege/Cav | Mounted scorpion |
| **Rattan Archer** | Vietnamese | Ranged | High pierce armor archer |
| **Arambai** | Burmese | Cavalry | High attack, low accuracy |
| **Genitour** | Berbers | Ranged | Mounted skirmisher |
| **Gbeto** | Malians | Infantry | Ranged melee knife thrower |
| **Shotel Warrior** | Ethiopians | Infantry | Very high attack, low HP |
| **Throwing Axeman** | Franks | Infantry | Ranged infantry melee |
| **Boyar** | Slavs | Cavalry | High armor melee cav |
| **Magyar Huszar** | Magyars | Cavalry | Light cav, anti-siege |
| **Samurai** | Japanese | Infantry | Bonus vs unique units |
| **Janissary** | Turks | Ranged | Gunpowder crossbow |
| **Elite Eagle Scout** | Meso | Infantry | Fast, anti-monk |
| **Teutonic Knight** | Teutons | Infantry | Very high armor |
| **Camel Archer** | Berbers | Cavalry | Anti-cav ranged |
| **Elephant Archer** | Indians | Ranged | Mounted elephant archer |
| **Genoese Crossbow** | Italians | Ranged | Anti-cavalry crossbow |
| **Sipahi** | Turks | Cavalry | Cavalry archer with extra attack |

### Unique Siege (Civ-specific)
| Unit | Civilization | Notes |
|------|-------------|-------|
| **Turtle Ship** | Koreans | Armored war ship |
| **Longboat** | Vikings | Fast multi-arrow ship |
| **Caravel** | Portuguese | Piercing naval unit |

### Naval Units (Dock)
| Unit | Age | Cost | HP | Attack | Notes |
|------|-----|------|----|--------|-------|
| **Fishing Ship** | Dark | 75W | 60 | 0 | Gathers food from fish traps/shore fish |
| **Transport Ship** | Feudal | 125W | 50 | 0 | Carries land units across water |
| **Trade Cog** | Feudal (Market) | 100W | 100 | 0 | Generates gold from trade |
| **Galley** | Feudal | 90W 30G | 120 | 6 | Basic war ship |
| **War Galley** | Castle | 90W 30G (upgrade) | 160 | 7 | Galley upgrade |
| **Galleon** | Imperial | 90W 30G (upgrade) | 200 | 8 | Final war ship |
| **Fire Galley** | Feudal | 75W 30G | 120 | 2x2 fire | Short range |
| **Fire Ship** | Castle | 75W 30G (upgrade) | 140 | 2x3 fire | Fire Galley upgrade |
| **Fast Fire Ship** | Imperial | 75W 30G (upgrade) | 160 | 2x4 fire | Final fire ship |
| **Demolition Raft** | Feudal | 70W 50G | 100 | 100 (area, suicide) | Explodes on contact |
| **Demolition Ship** | Castle | 70W 50G (upgrade) | 140 | 140 (area, suicide) | Raft upgrade |
| **Heavy Demo Ship** | Imperial | 70W 50G (upgrade) | 200 | 200 (area, suicide) | Final demo |
| **Cannon Galleon** | Imperial | 200W 150G | 170 | 50 (+200 vs buildings) | Bombard ship |
| **Elite Cannon Galleon** | Imperial | 200W 150G (upgrade) | 200 | 60 (+275 vs buildings) | Upgrade |

### Trade Units
| Unit | Cost | Notes |
|------|------|-------|
| **Trade Cart** | 100W 50G | Moves between markets, generates gold |
| **Trade Cog** | 100W 50G | Same but naval (dock-to-dock) |
| Gold increases with distance between trade posts |

---

## 5. TECHNOLOGIES (Complete by Building)

### Town Center
| Tech | Age | Cost | Effect |
|------|-----|------|--------|
| Loom | Dark | 50G | Villagers +15 HP, +1/2 armor |
| Horse Collar | Feudal | 60F 50G | Farms +75 food |
| Heavy Plow | Castle | 60F 60G | Farms +75 food, farmers carry more |
| Crop Rotation | Imperial | 60F 75G | Farms +125 food |
| Wheelbarrow | Feudal | 175F 50G | Villagers +10 carry, +10% speed |
| Hand Cart | Castle | 300F 200G | Villagers +10 carry, +10% speed |

### Lumber Camp
| Tech | Age | Cost | Effect |
|------|-----|------|--------|
| Double-Bit Axe | Feudal | 100F 50W | +20% wood gather rate |
| Bow Saw | Castle | 150F 100W | +20% wood gather rate |
| Two-Man Saw | Imperial | 300F 200W | +20% wood gather rate |

### Mining Camp
| Tech | Age | Cost | Effect |
|------|-----|------|--------|
| Gold Mining | Feudal | 100F 50G | +15% gold gather rate |
| Gold Shaft Mining | Castle | 150F 100G | +15% gold gather rate |
| Stone Mining | Feudal | 100F 50W | +15% stone gather rate |
| Stone Shaft Mining | Castle | 150F 100W | +15% stone gather rate |

### Mill
| Tech | Age | Cost | Effect |
|------|-----|------|--------|
| Horse Collar | Feudal | 60F 50G | Farms hold more food |
| Town Watch | Feudal | 100F | Buildings +4 LOS |
| Town Patrol | Castle | 200F | Buildings +3 LOS |
| Garland Wars | Imperial | 250F 250G | Infantry +4 attack |

### Barracks
| Tech | Age | Cost | Effect |
|------|-----|------|--------|
| Supplies | Feudal | 15F 10G | Militia line -15% food cost |
| Squires | Castle | 120F 100G | Infantry +10% speed |
| Arson | Castle | 25F 25G | Infantry +2 attack vs buildings |
| Two-Handed Sword (upgrade) | Castle | Varies | Militia → Long Swordsman |
| Champion (upgrade) | Imperial | Varies | 2H Swordsman → Champion |
| Pikeman (upgrade) | Castle | Varies | Spearman → Pikeman |
| Halberdier (upgrade) | Imperial | Varies | Pikeman → Halberdier |

### Archery Range
| Tech | Age | Cost | Effect |
|------|-----|------|--------|
| Thumb Ring | Castle | 100W 100G | Archers +10% fire rate (some civs) |
| Parthian Tactics | Imperial | 200F 250G | Cav archers +2 pierce armor |
| Crossbowman (upgrade) | Castle | Varies | Archer → Crossbowman |
| Arbalest (upgrade) | Imperial | Varies | Crossbow → Arbalest |
| Elite Skirmisher (upgrade) | Castle | Varies | Skirm → Elite Skirm |
| Heavy Cav Archer (upgrade) | Imperial | Varies | Cav Archer → Heavy |

### Stable
| Tech | Age | Cost | Effect |
|------|-----|------|--------|
| Bloodlines | Feudal | 150F 100G | Cavalry +20 HP |
| Husbandry | Castle | 150F 150G | Cavalry +10% speed |
| Cavalier (upgrade) | Imperial | Varies | Knight → Cavalier |
| Paladin (upgrade) | Imperial | Varies | Cavalier → Paladin |
| Heavy Camel (upgrade) | Imperial | Varies | Camel → Heavy Camel |
| Light Cavalry (upgrade) | Feudal | Varies | Scout → Light Cav |
| Hussar (upgrade) | Imperial | Varies | Light Cav → Hussar |

### Siege Workshop
| Tech | Age | Cost | Effect |
|------|-----|------|--------|
| Capped Ram (upgrade) | Imperial | Varies | Battering Ram → Capped Ram |
| Siege Ram (upgrade) | Imperial | Varies | Capped Ram → Siege Ram |
| Onager (upgrade) | Imperial | Varies | Mangonel → Onager |
| Siege Onager (upgrade) | Imperial | Varies | Onager → Siege Onager |
| Heavy Scorpion (upgrade) | Imperial | Varies | Scorpion → Heavy Scorpion |
| Siege Engineers | Imperial | 500F 600G | Siege +20% range, +20% attack vs buildings |

### Monastery
| Tech | Age | Cost | Effect |
|------|-----|------|--------|
| Redemption | Castle | 475G | Monks convert siege weapons |
| Atonement | Castle | 200G | Monks convert enemy monks |
| Herbal Medicine | Castle | 700G | Monks heal 3x faster |
| Heresy | Castle | 1000G | Converted units die |
| Sanctity | Castle | 120G | Monks +30 HP |
| Fervor | Castle | 120G | Monks +15% speed |
| Faith | Imperial | 750F 1000G | Units resistant to conversion |
| Theocracy | Imperial | 500F 200G | 1 monk converts, all monks share |

### University
| Tech | Age | Cost | Effect |
|------|-----|------|--------|
| Ballistics | Castle | 200W 175G | Projectiles predict movement |
| Chemistry | Imperial | 300F 200G | +1 attack all units, enables gunpowder |
| Masonry | Castle | 150F 175G | Buildings +10% HP, +1/1 armor |
| Architecture | Imperial | 300F 200G | Buildings +10% HP, +1/1 armor |
| Heated Shot | Castle | 350G | Towers +100% attack vs ships |
| Murder Holes | Castle | 200F 100G | Towers fire at adjacent units |
| Treadmill Crane | Castle | 180F 150G | Villagers build +20% faster |
| Keep | Imperial | 750F 450G | Tower → Keep (+10 HP, +2 attack) |
| Bombard Tower | Imperial | 500W 450G | Enables bombard tower |

### Castle (Research)
| Tech | Age | Cost | Effect |
|------|-----|------|--------|
| Unique Unit Upgrade | Imperial | Varies | Elite version of unique unit |
| Unique Tech 1 | Castle | Varies | Civilization-specific |
| Unique Tech 2 | Imperial | Varies | Civilization-specific |
| Hoardings | Imperial | 200F 150G | Castles +1000 HP |
| Conscription | Imperial | 150F 150G | Castles/Town Centers +33% production speed |
| Spies/Treason | Imperial | 200G per enemy villager | Reveals enemy line of sight |

### Blacksmith (Armor/Attack Upgrades)
| Tech | Age | Cost | Effect |
|------|-----|------|--------|
| **Melee Attack** | | | |
| Forging | Feudal | 150F | Infantry/Cav +1 attack |
| Iron Casting | Castle | 250F 100G | +1 attack |
| Blast Furnace | Imperial | 350F 200G | +1 attack |
| **Ranged Attack** | | | |
| Fletching | Feudal | 100F 50G | Archers/siege/towers +1 attack, +1 range |
| Bodkin Arrow | Castle | 200F 100G | +1 attack, +1 range |
| Bracer | Imperial | 300F 200G | +1 attack, +1 range |
| **Infantry Armor** | | | |
| Padded Archer Armor | Feudal | 100F | Archers +1 pierce armor |
| Leather Archer Armor | Castle | 150F 100G | +1 pierce armor |
| Ring Archer Armor | Imperial | 200F 200G | +1 pierce armor |
| **Cavalry/Infantry Armor** | | | |
| Scale Barding Armor | Feudal | 150F | Cavalry +1/1 armor |
| Chain Barding Armor | Castle | 250F 150G | +1/1 armor |
| Plate Barding Armor | Imperial | 350F 200G | +1/2 armor |
| **Infantry Armor** | | | |
| Scale Mail Armor | Feudal | 100F 50G | Infantry +1/1 armor |
| Chain Mail Armor | Castle | 200F 100G | +1/1 armor |
| Plate Mail Armor | Imperial | 300F 200G | +1/2 armor |

---

## 6. MAP & TERRAIN

### Terrain Types
- Grass, Desert, Snow, Dirt, Water (shallow/deep), Forest, Cliff, Beach, Road
- Each terrain affects movement speed and unit behavior
- Farms must be placed on land
- Fishing ships operate on water

### Map Objects
- **Trees** (wood source) — many varieties per biome
- **Gold Mines** — deplete when mined out
- **Stone Mines** — deplete when mined out
- **Berry Bushes** — food source, forage
- **Deer** — food, must be hunted (runs away)
- **Boar** — food, attacks villager, high food
- **Sheep/Turkeys** — food, docile
- **Fish** (shore fish + deep sea fish) — food for fishing ships
- **Relics** — generate gold in monasteries
- **Berry bushes / Forage** — stationary food source

### Map Size
- Tiny (2 player) → Small → Medium → Large → Huge (8 player)
- Grid-based, coordinates for all objects

### Line of Sight (LOS)
- Every unit/building has a sight radius
- Unexplored areas hidden (black)
- Explored but not visible = fog (dimmed)
- Active visibility = clear

---

## 7. COMBAT MECHANICS

### Damage Calculation
```
Damage = Base Attack + Bonus Damage - Armor
Minimum damage = 1 (always do at least 1)
```

### Armor Types
- **Melee Armor** (P1): reduces melee damage
- **Pierce Armor** (P2): reduces ranged projectile damage
- Buildings have both types

### Bonus Damage
- Anti-cavalry (Spearmen vs cav): +15-30 bonus
- Anti-building (Siege vs buildings): +150-1000 bonus
- Anti-archer (Skirmishers vs archers): +3-6 bonus
- Anti-monk: certain units get bonuses vs monks

### Attack Types
- **Melee**: must be adjacent, instant
- **Ranged**: projectile travel time, affected by Ballistics tech
- **Area of Effect (AoE)**: Mangonels, onagers, demo ships
- **Pierce**: passes through multiple targets (Scorpion)
- **Trample**: damage to adjacent units (Battle Elephant)

### Projectile Mechanics
- Projectiles have travel time (affected by Ballistics)
- Ballistics = predict target movement, lead the shot
- Without Ballistics = aim at current position (easily dodged)
- Projectile speed varies by unit type

### Hit & Run (Micro)
- Attack, move during cooldown, attack again
- Critical for ranged units vs melee
- "Kiting" = maintaining distance while attacking

---

## 8. MOVEMENT & PATHFINDING

### Unit Movement
- Every unit has a speed stat (0.9 to 1.6)
- Terrain affects movement: roads faster, forests slower, water impassable (without transport)
- Formation movement: units maintain relative positions
- Pathfinding around obstacles, other units, buildings

### Collision
- Units collide with buildings, walls, other units
- Push-apart for overlapping units
- Buildings block movement (except gates when open)

### Transport
- Transport Ship: carries up to 10 land units across water
- Air units (in some mods): no pathfinding needed

---

## 9. AI BEHAVIOR

### Player AI (Computer Opponents)
- **Economy management**: builds villagers constantly, gathers resources
- **Military production**: builds army based on strategy
- **Attack scheduling**: attacks at set intervals with increasing strength
- **Difficulty scaling**: Easy (slower, smaller army) → Hard (faster, bigger, cheats)
- **Strategy selection**: rush, boom, turtle
- **Unit composition**: counters player's unit types

### Unit AI (Auto-behavior)
- **Auto-attack**: idle military units attack nearby enemies
- **Auto-gather**: villagers auto-continue gathering task
- **Auto-repair**: villagers auto-repair damaged buildings
- **Guard mode**: follow and protect a target unit
- **Patrol**: walk a route and attack along the way
- **Stand ground**: don't move to engage, only attack in range
- **Stop**: immediately stop all actions

---

## 10. CIVILIZATIONS (42 Total in DE)

### Civ Categories
- **Western European**: Britons, Celts, Franks, Goths, Spanish
- **Eastern European**: Magyars, Slavs, Teutons, Vikings (sort of)
- **Mediterranean**: Byzantines, Italians, Portuguese, Saracens
- **Eastern**: Chinese, Indians, Japanese, Koreans, Mongols, Persians, Turks, Vietnamese
- **Mesoamerican**: Aztecs, Incas, Mayans
- **African**: Berbers, Ethiopians, Malians, Ethiopians
- **Central Asian**: Cumans, Tatars, Bulgarians, Cumans, Lithuanians, Gurjaras, Hindustanis

### Unique bonuses per civ include:
- Cheaper/faster building construction
- Extra resource gathering
- Stronger/weaker specific unit types
- Unique unit availability
- Unique technology bonuses
- Team bonuses

---

## 11. MULTIPLAYER & SOCIAL

### Game Hosting
- Create lobby → set settings → invite players
- Host controls: map, speed, resources, population limit
- spectator mode

### Communication
- In-game chat (all, team, specific player)
- Pings on minimap
- Quick commands (attack here, need help, etc.)

### Ranked System
- Elo-based matchmaking
- Seasons with rankings
- Win/loss tracking

---

## 12. CAMPAIGN & STORY

### Campaign Structure
- Historical campaigns per civilization (10+ missions each)
- Cutscenes, narrative, unique objectives
- Difficulty selection per mission

### Historical Battles
- Standalone scenarios based on real battles
- Historical accuracy focus

---

## 13. MODDING & CUSTOMIZATION

### Scenario Editor
- Place any unit/building/terrain
- Trigger system (events → actions)
- Custom AI scripts
- Custom maps

### Mod Support
- Custom textures/models
- New civilizations
- Balance changes
- AI personality scripts

---

## 14. AUDIO & VISUAL

### Audio
- Per-unit voice lines (selection, command, death, ambient)
- Music per civilization
- Environmental sounds (birds, wind, water)
- Combat sounds (swords, arrows, cannons)

### Visual
- Unit animations (walk, attack, die, gather, build)
- Building construction animation
- Destruction animation
- Weather effects (rain, snow, fog)
- Day/night cycle (some maps)

---

## 15. BUYASOUL CPL GAP MAP (AoE Feature → Buyasoul Status)

| AoE Feature | Buyasoul Status | Priority |
|------------|----------------|----------|
| 4 resource types | ✅ PLT (Profit/Love/Tax + Aether) | Done |
| Villager gather loop | ✅ Harvesters mine crystal → return → deposit | Done |
| Drop-off buildings | ✅ Town Hall as deposit point | Done |
| Military buildings | ✅ Barracks, towers, markets in void cities | Done |
| Unit training queue | ✅ Production system with progress bar | Done |
| Resource cost for units | ✅ spendResource before enqueue | Done |
| Box selection | ✅ Box select via RTSOrderGenerator | Done |
| Right-click move/attack | ✅ OrderGenerator handleRightClick | Done |
| Attack cooldowns | ✅ currentCooldown in engine-core | Done |
| Pathfinding | ✅ A* with binary heap + octile heuristic | Done |
| Projectile system | ✅ Pooled projectile meshes | Done |
| Economy HUD | ✅ Throttled HUD updates | Done |
| Minimap | ✅ 4-layer canvas minimap | Done |
| Auto-aggro (idle units) | ✅ Nearest enemy scan for idle units | Done |
| Garrison | ✅ VoidRTSBuildings garrison system | Done |
| Building selection panel | ✅ Click building → stats/garrison/production | Done |
| Tech upgrades | ✅ Masonry, Ballistics, Feudal Age, Conscription | Done |
| Hotkeys (S/H/A/P) | ✅ Stop, Hold, Attack-move, Patrol | Done |
| Procedural building textures | ✅ VoidBuildingTextures factory | Done |
| Multiple cities | ✅ 24 void worlds + expansion cities | Done |
| 4 resource types | ⚠️ Only PLT — no Food/Wood/Gold/Stone split | Low |
| Age-up progression | ❌ No Dark→Feudal→Castle→Imperial | High |
| Build time (construction) | ❌ Buildings placed instantly | High |
| Wall system | ❌ No walls/gates | Medium |
| Farm system | ❌ No reseedable farms | Medium |
| Trade carts | ❌ No trade between markets | Medium |
| Monk/Relic system | ❌ No conversion/relics | Low |
| Counter system (cav > arch > inf > cav) | ❌ No counter damage bonuses | High |
| Formation movement | ⚠️ Hex ring slots exist but no smoothing | Medium |
| Ctrl+number groups | ❌ No control groups | High |
| Shift-queue orders | ⚠️ Orders exist but no shift-visual | Medium |
| Hold position mode | ✅ Hold order type exists | Done |
| Patrol mode | ✅ Patrol order type exists | Done |
| Stop command | ✅ Stop clears orders | Done |
| Attack-move | ✅ Auto-aggro for idle units | Done |
| Repair mechanic | ❌ No building repair | Medium |
| Unique units per civ | ❌ No civ system yet | Low |
| Campaign/story mode | ❌ No campaigns | Low |
| Multiplayer | ❌ Not implemented | Long-term |
| Fog of war (line of sight) | ⚠️ Module exists (rts-fog-of-war.js) but untracked | High |
| Hierarchical pathfinding | ❌ Single resolution only | High |
| Flow fields for groups | ❌ Individual A* only | Medium |
| Projectile pooling | ✅ Added this session | Done |
| Spatial indexing | ✅ Loose-grid spatial index | Done |
