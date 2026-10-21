# SKILL — L-System City Growth

slug:: l_system_city_growth
phase:: build
status:: grafted
source:: No Man's Sky (Hello Games) — Aristid Lindenmayer L-Systems
PLT:: Profit 0.6, Love 0.6, Tax 0.2

## Summary
Grow cities recursively from simple grammatical rules instead of hand-placing every building. An L-system rule like `road → road + building + park + road` recursively expands into an organic, living city.

## How It Works
1. Define L-system rules for each district type (work, home, social, etc.)
2. Starting axiom: `center_monument`
3. Recursive expansion (4-6 iterations): `center_monument → road + building + road + park + road`
4. Each expansion branches: buildings get sub-buildings, roads fork
5. Terminal symbols resolve to actual 3D meshes (office, house, shop, tree, lamp)
6. The result is an organic city that grows differently each time but follows the same grammar

## L-System Rules for Dark City
```
WORK:   center → road office road office road
        office → office_tower | tech_hub | data_center
HOME:   center → road house road park road
        house → apartment | cottage | villa
SOCIAL: center → road shop road shop road
        shop → club | restaurant | market
```

## Implementation
- Add l-system grammar to Soulverse HTML as a config object
- Replace hardcoded `getSimCityBuildings()` switch with recursive L-system expander
- Store expansion depth as district level — deeper = more buildings
