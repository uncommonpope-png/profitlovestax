// src/genesis/void-city-generator.js
// Extended city generator with AoE-style buildings (barracks, market, university, towers)
// Generates more varied void cities with distinct building types.
// NOTE: Uses window.THREE at call time (not parse time) because this is a regular
// <script> tag loaded before the ES module that sets window.THREE.

(function () {
  'use strict';

  // Lazy THREE lookup — THREE not available at parse time
  function T3() { return window.THREE; }

  function rng(seed) {
    let s = seed || 1337;
    return function () { s = (s * 1103515245 + 12345) & 0x7fffffff; return s / 0x7fffffff; };
  }

  // Building type definitions with color and size ranges
  const BUILDING_TYPES = {
    townHall: { hRange: [28, 40], wRange: [12, 18], color: 0xffcc44, emissive: 0xaa8822, productionMax: 5, garrisonMax: 10 },
    barracks: { hRange: [14, 22], wRange: [10, 14], color: 0xff4444, emissive: 0xaa2222, productionMax: 3, garrisonMax: 4 },
    market: { hRange: [10, 16], wRange: [14, 20], color: 0x44ff44, emissive: 0x22aa22, productionMax: 0, garrisonMax: 2 },
    university: { hRange: [18, 28], wRange: [8, 12], color: 0x4488ff, emissive: 0x2244aa, productionMax: 0, garrisonMax: 0 },
    tower: { hRange: [25, 45], wRange: [4, 7], color: 0xff88ff, emissive: 0xaa44aa, productionMax: 0, garrisonMax: 6 },
    house: { hRange: [6, 12], wRange: [4, 7], color: 0x666688, emissive: 0x333344, productionMax: 0, garrisonMax: 2 },
  };

  function generateCity(config) {
    config = config || {};
    var T = T3();
    if (!T) { console.warn('[VoidCityGenerator] THREE not available'); return null; }

    var pos = config.pos || new T.Vector3();
    var type = config.type || 'general';
    var seedVal = config.seed || 12345;
    var radius = config.radius || 180;
    var buildingCount = config.buildingCount || 80;
    var faction = config.faction || 'voidCovenant';

    var group = new T.Group();
    group.position.copy(pos);
    group.name = 'void-city-' + type;

    var r = rng(seedVal);

    // Ground
    var groundMat = new T.MeshStandardMaterial({ color: 0x080818, roughness: 0.9, metalness: 0.1 });
    var ground = new T.Mesh(new T.PlaneGeometry(radius * 2, radius * 2), groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = 0.5;
    ground.receiveShadow = true;
    group.add(ground);

    // Roads — 4-axis grid
    var roadMat = new T.MeshStandardMaterial({ color: 0x111122, roughness: 0.85, metalness: 0.1 });
    for (var i = -radius; i <= radius; i += 20) {
      var r1 = new T.Mesh(new T.BoxGeometry(radius * 2, 0.06, 2.5), roadMat);
      r1.position.set(0, 0.6, i); group.add(r1);
      var r2 = new T.Mesh(new T.BoxGeometry(2.5, 0.06, radius * 2), roadMat);
      r2.position.set(i, 0.6, 0); group.add(r2);
    }

    // Town Hall — center of the city
    var th = BUILDING_TYPES.townHall;
    var thH = th.hRange[0] + r() * (th.hRange[1] - th.hRange[0]);
    var thW = th.wRange[0] + r() * (th.wRange[1] - th.wRange[0]);
    var townHall = createBuilding(0, 0, thW, thW, thH, th.color, th.emissive, 'townHall', r);
    townHall.userData.buildingType = 'TownCenter';
    townHall.userData.isTowerBuilding = true;
    group.add(townHall);

    // Spawn specific AoE buildings at cardinal positions
    var offsets = [
      { angle: 0, type: 'barracks', dist: 50 },
      { angle: Math.PI / 2, type: 'market', dist: 50 },
      { angle: Math.PI, type: 'university', dist: 50 },
      { angle: Math.PI * 1.5, type: 'tower', dist: 50 },
    ];
    for (var oi = 0; oi < offsets.length; oi++) {
      var off = offsets[oi];
      var bt = BUILDING_TYPES[off.type];
      var h = bt.hRange[0] + r() * (bt.hRange[1] - bt.hRange[0]);
      var w = bt.wRange[0] + r() * (bt.wRange[1] - bt.wRange[0]);
      var bx = Math.cos(off.angle) * off.dist + (r() - 0.5) * 10;
      var bz = Math.sin(off.angle) * off.dist + (r() - 0.5) * 10;
      var mesh = createBuilding(bx, bz, w, w, h, bt.color, bt.emissive, off.type, r);
      mesh.userData.buildingType = off.type.charAt(0).toUpperCase() + off.type.slice(1);
      mesh.userData.isTowerBuilding = true;
      group.add(mesh);
    }

    // Fill with houses and towers
    for (var j = 0; j < buildingCount; j++) {
      var angle = r() * Math.PI * 2;
      var dist = 30 + r() * (radius - 30);
      var cx = Math.cos(angle) * dist;
      var cz = Math.sin(angle) * dist;
      var isTower = r() > 0.82;
      var btype = isTower ? BUILDING_TYPES.tower : BUILDING_TYPES.house;
      var bh = btype.hRange[0] + r() * (btype.hRange[1] - btype.hRange[0]);
      var bw = btype.wRange[0] + r() * (btype.wRange[1] - btype.wRange[0]);
      var bmesh = createBuilding(cx, cz, bw, bw, bh, btype.color, btype.emissive, isTower ? 'tower' : 'house', r);
      bmesh.userData.buildingType = isTower ? 'Tower' : 'House';
      bmesh.userData.isTowerBuilding = true;
      group.add(bmesh);
    }

    return group;
  }

  function createBuilding(x, z, w, d, h, color, emissive, type, r) {
    var T = T3();
    var group = new T.Group();
    group.position.set(x, 0, z);

    // Textured material if available
    var mat;
    if (window.VoidBuildingTextures && window.VoidBuildingTextures.materialFor) {
      mat = window.VoidBuildingTextures.materialFor('void-' + type, color, {
        emissive: '#' + emissive.toString(16).padStart(6, '0'),
        emissiveIntensity: type === 'tower' ? 0.4 : 0.15,
        roughness: 0.45,
        metalness: 0.25,
        windows: true,
        neonBand: '#' + color.toString(16).padStart(6, '0'),
      });
    } else {
      mat = new T.MeshStandardMaterial({ color: color, emissive: emissive, emissiveIntensity: 0.15, roughness: 0.5, metalness: 0.3 });
    }

    // Main body
    var body = new T.Mesh(new T.BoxGeometry(w, h, d), mat);
    body.position.y = h / 2;
    body.castShadow = true;
    body.receiveShadow = true;
    group.add(body);

    // Rooftop accent
    if (h > 10) {
      var accentMat = new T.MeshBasicMaterial({ color: color, transparent: true, opacity: 0.6 });
      var roof = new T.Mesh(new T.BoxGeometry(w + 0.5, 0.4, d + 0.5), accentMat);
      roof.position.y = h + 0.2;
      group.add(roof);
    }

    // Spire on tall towers
    if (type === 'tower' && h > 20) {
      var spireH = 4 + r() * 8;
      var spireMat = new T.MeshBasicMaterial({ color: color, transparent: true, opacity: 0.5 });
      var spire = new T.Mesh(new T.CylinderGeometry(0.15, 0.4, spireH, 4), spireMat);
      spire.position.y = h + spireH / 2;
      group.add(spire);
      // Glow light
      var light = new T.PointLight(color, 0.6, 30);
      light.position.y = h + spireH + 2;
      group.add(light);
    }

    return group;
  }

  window.VoidCityGenerator = { generateCity: generateCity, BUILDING_TYPES: BUILDING_TYPES };
})();
