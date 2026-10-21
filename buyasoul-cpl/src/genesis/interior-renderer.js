// interior-renderer.js — P-APT-2: visible/walkable apartments + door markers
// =================================================================================
// P-APT-1 made interiors true as state. P-APT-2 makes them visible: street doors
// become glowing diegetic markers, door entry materializes a procedural apartment
// room, customizer records become furniture/theme/lighting, and exit returns the
// player to the exact street position captured by DoorPortalManager.
//
// Additive law:
// - No external assets, no shaders, no post-processing, no renderer rewrite.
// - Works with browser THREE r160 and fake THREE in pure Node probes.
// - Preserves legacy window.Genesis fallbacks and all P-APT-1 state modules.
(function () {
  var VERSION = 1;
  var FLAG = '__GENESIS_INTERIOR_RENDERER';
  var DEFAULT_ACTOR = 'user://guest';
  var INTERIOR_ORIGIN = { x: 880, y: 0, z: 880 };

  function install(Genesis, THREE) {
    if (!Genesis) return;
    if (Genesis.InteriorRenderer) return;

    THREE = THREE || ((typeof window !== 'undefined') ? window.THREE : null);
    var scene = null;
    var camera = null;
    var domElement = null;
    var root = null;
    var markerGroup = null;
    var activeGroup = null;
    var activeInteriorId = null;
    var activeActor = DEFAULT_ACTOR;
    var attached = false;
    var doorMarkers = new Map();
    var lastExitReturn = null;
    var markerSeq = 0;
    var pointerBound = false;
    var keyBound = false;
    var ray = null;
    var pointer = null;

    function flagOn() {
      try {
        if (typeof window === 'undefined') return true;
        return window[FLAG] !== false && window.__GENESIS_INTERIORS !== false;
      } catch (_) { return true; }
    }
    function T() { return THREE || ((typeof window !== 'undefined') ? window.THREE : null); }
    function clone(obj) { try { return JSON.parse(JSON.stringify(obj)); } catch (_) { return obj; } }
    function now() { return Date.now ? Date.now() : new Date().getTime(); }
    function vec(v, fallback) {
      fallback = fallback || { x: 0, y: 0, z: 0 };
      if (!v) return clone(fallback);
      if (Array.isArray(v)) return { x: Number(v[0] || 0), y: Number(v[1] || 0), z: Number(v[2] || 0) };
      return { x: Number(v.x || 0), y: Number(v.y || 0), z: Number(v.z || 0) };
    }
    function colorValue(c, fallback) {
      fallback = fallback == null ? 0x66ccff : fallback;
      if (typeof c === 'number') return c;
      if (typeof c === 'string') {
        if (c.charAt(0) === '#') return parseInt(c.slice(1), 16) || fallback;
        return parseInt(c, 16) || fallback;
      }
      return fallback;
    }
    function emit(type, payload) {
      payload = payload || {};
      try { if (Genesis.EventBridge && Genesis.EventBridge.emit) Genesis.EventBridge.emit(type, payload); } catch (_) {}
      try {
        if (typeof window !== 'undefined' && typeof window.dispatchEvent === 'function' && typeof window.CustomEvent === 'function') {
          window.dispatchEvent(new window.CustomEvent('genesis:' + type, { detail: payload }));
        }
      } catch (_) {}
    }
    function registerModule(status) {
      try {
        if (Genesis.registerModule) Genesis.registerModule('interior-renderer', { status: status || 'validated', path: './src/genesis/interior-renderer.js', gun: 'ROOM-VISIBLE', version: VERSION });
      } catch (_) {}
    }
    function makeGroup(name) {
      var TT = T();
      if (!TT || !TT.Group) return null;
      var g = new TT.Group();
      g.name = name || 'group';
      return g;
    }
    function add(parent, child) { try { if (parent && child && parent.add) parent.add(child); } catch (_) {} return child; }
    function remove(parent, child) { try { if (parent && child && parent.remove) parent.remove(child); } catch (_) {} }
    function setPos(obj, p) { try { if (obj && obj.position && obj.position.set) obj.position.set(p.x || 0, p.y || 0, p.z || 0); else if (obj) obj.position = vec(p); } catch (_) {} }
    function mesh(name, kind, dims, color, opts) {
      var TT = T();
      if (!TT || !TT.Mesh) return null;
      opts = opts || {};
      var geo = null;
      try {
        if (kind === 'sphere' && TT.SphereGeometry) geo = new TT.SphereGeometry(dims.r || dims.x || 1, 16, 12);
        else if (kind === 'cylinder' && TT.CylinderGeometry) geo = new TT.CylinderGeometry(dims.rTop || dims.r || 0.5, dims.rBottom || dims.r || 0.5, dims.h || dims.y || 1, 16);
        else if (kind === 'plane' && TT.PlaneGeometry) geo = new TT.PlaneGeometry(dims.x || 1, dims.z || dims.y || 1);
        else if (TT.BoxGeometry) geo = new TT.BoxGeometry(dims.x || 1, dims.y || 1, dims.z || 1);
      } catch (_) {}
      if (!geo && TT.BoxGeometry) geo = new TT.BoxGeometry(1, 1, 1);
      var mat = null;
      try {
        var matOpts = {
          color: colorValue(color, 0x66ccff),
          roughness: opts.roughness == null ? 0.8 : opts.roughness,
          metalness: opts.metalness == null ? 0.08 : opts.metalness
        };
        if (opts.emissive != null) { matOpts.emissive = colorValue(opts.emissive, matOpts.color); matOpts.emissiveIntensity = opts.emissiveIntensity == null ? 0.25 : opts.emissiveIntensity; }
        if (opts.transparent) { matOpts.transparent = true; matOpts.opacity = opts.opacity == null ? 0.75 : opts.opacity; }
        mat = TT.MeshStandardMaterial ? new TT.MeshStandardMaterial(matOpts) : (TT.MeshBasicMaterial ? new TT.MeshBasicMaterial(matOpts) : matOpts);
      } catch (_) { mat = {}; }
      var m = new TT.Mesh(geo, mat);
      m.name = name || 'mesh';
      m.userData = Object.assign({}, m.userData || {}, opts.userData || {});
      if (opts.pos) setPos(m, opts.pos);
      if (opts.rot && m.rotation) {
        try { m.rotation.x = opts.rot.x || 0; m.rotation.y = opts.rot.y || 0; m.rotation.z = opts.rot.z || 0; } catch (_) {}
      }
      if (opts.scale && m.scale) {
        try {
          if (typeof opts.scale === 'number' && m.scale.setScalar) m.scale.setScalar(opts.scale);
          else if (m.scale.set) m.scale.set(opts.scale.x || 1, opts.scale.y || 1, opts.scale.z || 1);
        } catch (_) {}
      }
      return m;
    }
    function light(name, color, intensity, pos) {
      var TT = T();
      var l = null;
      try {
        if (TT && TT.PointLight) l = new TT.PointLight(colorValue(color, 0xffffff), intensity == null ? 1 : intensity, 32);
        else if (TT && TT.Object3D) l = new TT.Object3D();
      } catch (_) {}
      if (!l) return null;
      l.name = name || 'light';
      setPos(l, pos || { x: 0, y: 3, z: 0 });
      return l;
    }
    function ensureRoot() {
      if (!flagOn()) return null;
      if (!scene) scene = Genesis.scene || null;
      if (!scene) return null;
      if (!root) {
        root = makeGroup('Genesis Interior Renderer Root');
        markerGroup = makeGroup('Genesis Apartment Door Markers');
        if (root && markerGroup) root.add(markerGroup);
        add(scene, root);
      }
      return root;
    }
    function clearGroup(g) {
      if (!g || !g.children) return;
      var items = g.children.slice ? g.children.slice() : Array.prototype.slice.call(g.children);
      for (var i = 0; i < items.length; i++) remove(g, items[i]);
    }
    function nearestDoorTo(pos, maxDistance) {
      pos = vec(pos);
      maxDistance = maxDistance || 5;
      var best = null, bestD = Infinity;
      doorMarkers.forEach(function (rec) {
        if (!rec || !rec.door || !rec.group) return;
        var p = rec.door.pos || (rec.group.position || { x: 0, y: 0, z: 0 });
        var dx = (p.x || 0) - pos.x, dy = (p.y || 0) - pos.y, dz = (p.z || 0) - pos.z;
        var d = Math.sqrt(dx * dx + dy * dy + dz * dz);
        if (d < bestD) { bestD = d; best = rec; }
      });
      return (best && bestD <= maxDistance) ? best : null;
    }
    function currentPlayerPosition() {
      try {
        if (Genesis.PlayerCam && Genesis.PlayerCam.getPlayerPosition) return Genesis.PlayerCam.getPlayerPosition();
      } catch (_) {}
      try {
        if (camera && camera.position) return { x: camera.position.x || 0, y: camera.position.y || 0, z: camera.position.z || 0 };
      } catch (_) {}
      return { x: 0, y: 0, z: 0 };
    }
    function setPlayerPosition(p, lookAt) {
      p = vec(p, { x: 0, y: 1.2, z: 0 });
      try {
        if (Genesis.PlayerCam && Genesis.PlayerCam.setPlayerPosition) return Genesis.PlayerCam.setPlayerPosition(p, { scene: scene, lookAt: lookAt });
      } catch (_) {}
      try {
        if (camera && camera.position && camera.position.set) {
          camera.position.set(p.x + 6, p.y + 6, p.z + 9);
          if (camera.lookAt) camera.lookAt(lookAt || { x: p.x, y: p.y + 1.4, z: p.z });
          return true;
        }
      } catch (_) {}
      return false;
    }
    function buildDoorMarker(door) {
      if (!door || !door.id) return null;
      var group = makeGroup('Apartment Door Marker — ' + (door.label || door.id));
      if (!group) return null;
      group.userData = Object.assign({}, group.userData || {}, { genesisDoorId: door.id, propertyId: door.propertyId, interiorId: door.interiorId, kind: 'apartment-door-marker' });
      setPos(group, door.pos || { x: 0, y: 0, z: 0 });
      var frame = mesh('door-frame-' + door.id, 'box', { x: 1.5, y: 3, z: 0.18 }, 0x101827, { pos: { x: 0, y: 1.5, z: 0 }, emissive: 0x143355, emissiveIntensity: 0.3, userData: { genesisDoorId: door.id } });
      var panel = mesh('door-panel-' + door.id, 'box', { x: 1.08, y: 2.35, z: 0.22 }, door.locked ? 0x442222 : 0x12334a, { pos: { x: 0, y: 1.25, z: -0.02 }, emissive: door.locked ? 0x331111 : 0x1a8cff, emissiveIntensity: 0.45, userData: { genesisDoorId: door.id } });
      var crown = mesh('door-crown-' + door.id, 'box', { x: 1.8, y: 0.14, z: 0.28 }, 0x7dd3fc, { pos: { x: 0, y: 3.08, z: 0 }, emissive: 0x7dd3fc, emissiveIntensity: 0.85, userData: { genesisDoorId: door.id } });
      var pad = mesh('door-keypad-' + door.id, 'box', { x: 0.18, y: 0.35, z: 0.08 }, 0xfacc15, { pos: { x: 0.72, y: 1.35, z: -0.12 }, emissive: 0xfacc15, emissiveIntensity: 0.8, userData: { genesisDoorId: door.id } });
      add(group, frame); add(group, panel); add(group, crown); add(group, pad);
      try {
        if (Genesis.EntityRegistry && Genesis.EntityRegistry.register) {
          Genesis.EntityRegistry.register(group, { id: door.id, kind: 'door', owner: 'world', tags: door.tags || ['door', 'portal', 'apartment'], meta: Object.assign({}, door.meta || {}, { label: door.label, propertyId: door.propertyId, interiorId: door.interiorId, visibleMarker: true }) });
        }
      } catch (_) {}
      return group;
    }
    function buildDoorMarkers() {
      if (!ensureRoot() || !markerGroup) return { ok: false, error: 'not-attached' };
      clearGroup(markerGroup);
      doorMarkers.clear();
      var doors = [];
      try { doors = (Genesis.DoorPortalManager && Genesis.DoorPortalManager.list) ? Genesis.DoorPortalManager.list() : []; } catch (_) { doors = []; }
      for (var i = 0; i < doors.length; i++) {
        var d = doors[i];
        var g = buildDoorMarker(d);
        if (!g) continue;
        markerGroup.add(g);
        doorMarkers.set(d.id, { door: d, group: g, index: markerSeq++ });
      }
      emit('interior-renderer:markers', { count: doorMarkers.size });
      return { ok: true, count: doorMarkers.size };
    }
    function mergeTheme(interior) {
      var t = Object.assign({}, (interior && interior.theme) || {});
      try {
        if (Genesis.InteriorCustomizer && Genesis.InteriorCustomizer.getTheme && interior && interior.id) {
          t = Object.assign(t, Genesis.InteriorCustomizer.getTheme(interior.id) || {});
        }
      } catch (_) {}
      return Object.assign({ wall: '#111827', floor: '#1f2937', accent: '#7dd3fc', light: '#fef3c7' }, t);
    }
    function getDecor(interior) {
      var items = [];
      try { if (interior && interior.state && Array.isArray(interior.state.decor)) items = interior.state.decor.slice(); } catch (_) {}
      try {
        if (Genesis.InteriorCustomizer && Genesis.InteriorCustomizer.listDecor && interior && interior.id) {
          var live = Genesis.InteriorCustomizer.listDecor(interior.id);
          if (Array.isArray(live) && live.length) items = live;
        }
      } catch (_) {}
      return items;
    }
    function roomSize(interior) {
      var r = interior && Array.isArray(interior.rooms) && interior.rooms[0] ? interior.rooms[0] : null;
      return Object.assign({ x: 12, y: 4, z: 10 }, (r && r.size) || {});
    }
    function addRoomShell(group, size, theme) {
      var sx = Number(size.x || 12), sy = Number(size.y || 4), sz = Number(size.z || 10);
      var floor = mesh('interior-floor', 'box', { x: sx, y: 0.12, z: sz }, theme.floor, { pos: { x: 0, y: 0, z: 0 }, userData: { interiorPart: 'floor', walkable: true } });
      var ceiling = mesh('interior-ceiling', 'box', { x: sx, y: 0.08, z: sz }, theme.wall, { pos: { x: 0, y: sy, z: 0 }, transparent: true, opacity: 0.35, userData: { interiorPart: 'ceiling' } });
      var back = mesh('interior-back-wall', 'box', { x: sx, y: sy, z: 0.18 }, theme.wall, { pos: { x: 0, y: sy / 2, z: -sz / 2 }, emissive: theme.accent, emissiveIntensity: 0.06, userData: { interiorPart: 'wall' } });
      var frontL = mesh('interior-front-wall-left', 'box', { x: (sx - 2.2) / 2, y: sy, z: 0.18 }, theme.wall, { pos: { x: -(sx + 2.2) / 4, y: sy / 2, z: sz / 2 }, userData: { interiorPart: 'wall' } });
      var frontR = mesh('interior-front-wall-right', 'box', { x: (sx - 2.2) / 2, y: sy, z: 0.18 }, theme.wall, { pos: { x: (sx + 2.2) / 4, y: sy / 2, z: sz / 2 }, userData: { interiorPart: 'wall' } });
      var left = mesh('interior-left-wall', 'box', { x: 0.18, y: sy, z: sz }, theme.wall, { pos: { x: -sx / 2, y: sy / 2, z: 0 }, userData: { interiorPart: 'wall' } });
      var right = mesh('interior-right-wall', 'box', { x: 0.18, y: sy, z: sz }, theme.wall, { pos: { x: sx / 2, y: sy / 2, z: 0 }, userData: { interiorPart: 'wall' } });
      [floor, ceiling, back, frontL, frontR, left, right].forEach(function (m) { add(group, m); });
      add(group, light('interior-soft-light', theme.light, 1.1, { x: 0, y: sy - 0.5, z: 0 }));
      var exit = mesh('interior-exit-door', 'box', { x: 1.4, y: 2.5, z: 0.22 }, 0x0f172a, { pos: { x: 0, y: 1.25, z: sz / 2 - 0.06 }, emissive: theme.accent, emissiveIntensity: 0.55, userData: { interiorExit: true } });
      add(group, exit);
      var exitGlow = mesh('interior-exit-glow', 'box', { x: 1.8, y: 0.12, z: 0.28 }, theme.accent, { pos: { x: 0, y: 2.65, z: sz / 2 - 0.1 }, emissive: theme.accent, emissiveIntensity: 1.0, userData: { interiorExit: true } });
      add(group, exitGlow);
      group.userData.roomSize = { x: sx, y: sy, z: sz };
      return group;
    }
    function decorPos(item, fallback) {
      var p = vec((item && item.pos) || fallback || { x: 0, y: 0, z: 0 });
      return { x: p.x || 0, y: p.y || 0, z: p.z || 0 };
    }
    function applyRot(obj, item) {
      try {
        var r = vec(item && item.rot);
        if (obj && obj.rotation) { obj.rotation.x = r.x || 0; obj.rotation.y = r.y || 0; obj.rotation.z = r.z || 0; }
      } catch (_) {}
    }
    function addDecor(group, item, theme, source) {
      item = item || {};
      var type = item.type || 'custom';
      var p = decorPos(item);
      var color = item.color || theme.accent;
      var holder = makeGroup('decor-' + (item.id || type));
      if (!holder) return null;
      holder.userData = Object.assign({}, item, { decorType: type, source: source || 'customizer' });
      setPos(holder, { x: p.x, y: p.y, z: p.z });
      function part(n, k, dims, c, pos, extra) { return add(holder, mesh(n, k, dims, c, Object.assign({ pos: pos || { x: 0, y: 0, z: 0 }, userData: { decorId: item.id, decorType: type } }, extra || {}))); }
      if (type === 'bed') {
        part('bed-base', 'box', { x: 2.8, y: 0.45, z: 1.8 }, color, { x: 0, y: 0.35, z: 0 });
        part('bed-pillow', 'box', { x: 0.8, y: 0.22, z: 1.5 }, 0xf8fafc, { x: -0.9, y: 0.72, z: 0 });
      } else if (type === 'desk') {
        part('desk-top', 'box', { x: 2.2, y: 0.18, z: 1 }, color, { x: 0, y: 0.95, z: 0 });
        part('desk-leg-a', 'box', { x: 0.16, y: 0.9, z: 0.16 }, theme.floor, { x: -0.85, y: 0.45, z: -0.35 });
        part('desk-leg-b', 'box', { x: 0.16, y: 0.9, z: 0.16 }, theme.floor, { x: 0.85, y: 0.45, z: 0.35 });
      } else if (type === 'sofa') {
        part('sofa-seat', 'box', { x: 2.7, y: 0.5, z: 1.1 }, color, { x: 0, y: 0.4, z: 0 });
        part('sofa-back', 'box', { x: 2.7, y: 1.1, z: 0.25 }, color, { x: 0, y: 0.9, z: 0.55 });
      } else if (type === 'table') {
        part('table-top', 'cylinder', { r: 0.9, h: 0.16 }, color, { x: 0, y: 0.85, z: 0 });
        part('table-leg', 'cylinder', { r: 0.12, h: 0.75 }, theme.floor, { x: 0, y: 0.4, z: 0 });
      } else if (type === 'plant') {
        part('plant-pot', 'cylinder', { r: 0.35, h: 0.55 }, 0x6b4423, { x: 0, y: 0.28, z: 0 });
        part('plant-leaf', 'sphere', { r: 0.55 }, 0x22c55e, { x: 0, y: 0.95, z: 0 }, { emissive: 0x0b3b20, emissiveIntensity: 0.2 });
      } else if (type === 'poster' || type === 'wall-decor') {
        part('poster-panel', 'box', { x: 1.6, y: 1.1, z: 0.08 }, color, { x: 0, y: 1.8, z: 0 }, { emissive: color, emissiveIntensity: 0.35 });
      } else if (type === 'light') {
        part('neon-light', 'box', { x: 1.8, y: 0.18, z: 0.16 }, color, { x: 0, y: 1.8, z: 0 }, { emissive: color, emissiveIntensity: 1.2 });
        add(holder, light('decor-point-light', color, 0.7, { x: 0, y: 1.8, z: 0 }));
      } else if (type === 'shrine') {
        part('shrine-base', 'box', { x: 1.4, y: 0.5, z: 1 }, theme.floor, { x: 0, y: 0.25, z: 0 });
        part('shrine-core', 'sphere', { r: 0.45 }, color, { x: 0, y: 1.05, z: 0 }, { emissive: color, emissiveIntensity: 0.9 });
      } else {
        part('custom-block', 'box', { x: 1, y: 1, z: 1 }, color, { x: 0, y: 0.5, z: 0 });
      }
      applyRot(holder, item);
      if (item.scale && holder.scale) {
        try { if (holder.scale.setScalar) holder.scale.setScalar(Number(item.scale) || 1); } catch (_) {}
      }
      add(group, holder);
      return holder;
    }
    function addTemplateSlots(group, interior, theme) {
      var slots = (interior && Array.isArray(interior.slots)) ? interior.slots : [];
      for (var i = 0; i < slots.length; i++) {
        var s = slots[i];
        var type = s.type === 'wall-decor' ? 'poster' : s.type;
        addDecor(group, { id: 'slot-' + (s.id || i), type: type, pos: s.pos || { x: 0, y: 0, z: 0 }, color: theme.accent, scale: 0.9, slotId: s.id }, theme, 'template-slot');
      }
    }
    function addAvatarSpot(group, actor, theme, size) {
      actor = actor || activeActor || DEFAULT_ACTOR;
      var profile = null;
      try { profile = Genesis.AvatarCustomizer && Genesis.AvatarCustomizer.getProfile ? Genesis.AvatarCustomizer.getProfile(actor) : null; } catch (_) { profile = null; }
      profile = profile || { palette: { skin: '#c08457', primary: '#38bdf8', accent: '#f472b6' }, outfit: {}, title: 'Genesis Citizen' };
      var spot = makeGroup('avatar-dressing-room-spot');
      if (!spot) return null;
      var sx = Number((size && size.x) || 12), sz = Number((size && size.z) || 10);
      setPos(spot, { x: sx / 2 - 2.1, y: 0, z: sz / 2 - 2.2 });
      spot.userData = { kind: 'avatar-dressing-spot', actor: actor, profile: clone(profile) };
      add(spot, mesh('dressing-platform', 'cylinder', { r: 1.2, h: 0.18 }, profile.palette && profile.palette.primary || theme.accent, { pos: { x: 0, y: 0.09, z: 0 }, emissive: theme.accent, emissiveIntensity: 0.35, userData: { avatarSpot: true } }));
      add(spot, mesh('dressing-mirror', 'box', { x: 1.2, y: 2.2, z: 0.08 }, 0x93c5fd, { pos: { x: 0, y: 1.4, z: -0.95 }, transparent: true, opacity: 0.55, emissive: 0x38bdf8, emissiveIntensity: 0.4, userData: { avatarSpot: true } }));
      add(spot, mesh('avatar-body', 'box', { x: 0.55, y: 1.05, z: 0.35 }, profile.palette && profile.palette.primary || '#38bdf8', { pos: { x: 0, y: 1.0, z: 0.05 }, userData: { avatarSpot: true, avatarPart: 'body' } }));
      add(spot, mesh('avatar-head', 'sphere', { r: 0.32 }, profile.palette && profile.palette.skin || '#c08457', { pos: { x: 0, y: 1.72, z: 0.05 }, userData: { avatarSpot: true, avatarPart: 'head' } }));
      add(spot, mesh('avatar-aura', 'sphere', { r: 0.95 }, profile.palette && profile.palette.accent || theme.accent, { pos: { x: 0, y: 1.0, z: 0.05 }, transparent: true, opacity: 0.18, emissive: profile.palette && profile.palette.accent || theme.accent, emissiveIntensity: 0.7, userData: { avatarSpot: true, avatarPart: 'aura' } }));
      add(group, spot);
      try {
        if (Genesis.EntityRegistry && Genesis.EntityRegistry.register) Genesis.EntityRegistry.register(spot, { id: 'avatar-dressing-spot:' + actor, kind: 'avatar-dressing-spot', owner: actor, tags: ['avatar', 'dressing-room', 'interior'], meta: { actor: actor, title: profile.title || 'Genesis Citizen' } });
      } catch (_) {}
      return spot;
    }
    function buildInterior(interior, opts) {
      opts = opts || {};
      if (!ensureRoot()) return { ok: false, error: 'not-attached' };
      if (!interior || !interior.id) return { ok: false, error: 'missing-interior' };
      if (activeGroup) { remove(root, activeGroup); activeGroup = null; }
      var theme = mergeTheme(interior);
      var size = roomSize(interior);
      activeGroup = makeGroup('Genesis Interior — ' + (interior.name || interior.id));
      activeGroup.userData = { interiorId: interior.id, propertyId: interior.propertyId, kind: 'apartment-interior-scene', builtAt: now(), roomSize: size, theme: theme };
      setPos(activeGroup, opts.origin || INTERIOR_ORIGIN);
      addRoomShell(activeGroup, size, theme);
      addTemplateSlots(activeGroup, interior, theme);
      var decor = getDecor(interior);
      for (var i = 0; i < decor.length; i++) addDecor(activeGroup, decor[i], theme, 'customizer');
      addAvatarSpot(activeGroup, opts.actor || activeActor, theme, size);
      add(root, activeGroup);
      activeInteriorId = interior.id;
      try { if (markerGroup) markerGroup.visible = false; } catch (_) {}
      emit('interior-renderer:built', { interiorId: interior.id, decor: decor.length, room: size });
      return { ok: true, group: activeGroup, interiorId: interior.id, decorCount: decor.length, roomSize: size };
    }
    function interiorSpawnFor(interior) {
      var size = roomSize(interior);
      return { x: INTERIOR_ORIGIN.x, y: INTERIOR_ORIGIN.y + 1.2, z: INTERIOR_ORIGIN.z + (Number(size.z || 10) / 2 - 2.2) };
    }
    function enterDoor(doorId, opts) {
      opts = opts || {};
      if (!flagOn()) return { ok: false, error: 'renderer-disabled' };
      if (!Genesis.DoorPortalManager || !Genesis.DoorPortalManager.enter) return { ok: false, error: 'door-manager-missing' };
      var actor = opts.actor || activeActor || DEFAULT_ACTOR;
      var from = vec(opts.from || opts.returnTo || currentPlayerPosition(), { x: 0, y: 1.2, z: 0 });
      var entered = Genesis.DoorPortalManager.enter(actor, doorId, { from: from });
      if (!entered || !entered.ok) return entered || { ok: false, error: 'enter-failed' };
      var interior = entered.interior || (Genesis.InteriorInstanceManager && Genesis.InteriorInstanceManager.get ? Genesis.InteriorInstanceManager.get(entered.interiorId) : null);
      if (!interior) return { ok: false, error: 'interior-not-found', enter: entered };
      activeActor = actor;
      var built = buildInterior(interior, { actor: actor });
      var spawn = interiorSpawnFor(interior);
      setPlayerPosition(spawn, { x: INTERIOR_ORIGIN.x, y: INTERIOR_ORIGIN.y + 1.4, z: INTERIOR_ORIGIN.z });
      emit('interior-renderer:entered', { actor: actor, doorId: doorId, interiorId: interior.id, returnTo: entered.returnTo, spawn: spawn });
      return Object.assign({}, entered, { ok: true, renderer: built, spawn: spawn });
    }
    function exitInterior(opts) {
      opts = opts || {};
      if (!Genesis.DoorPortalManager || !Genesis.DoorPortalManager.exit) return { ok: false, error: 'door-manager-missing' };
      var actor = opts.actor || activeActor || DEFAULT_ACTOR;
      var out = Genesis.DoorPortalManager.exit(actor, opts.interiorId || activeInteriorId);
      if (!out || !out.ok) return out || { ok: false, error: 'exit-failed' };
      lastExitReturn = vec(out.returnTo, { x: 0, y: 1.2, z: 0 });
      if (activeGroup) { remove(root, activeGroup); activeGroup = null; }
      activeInteriorId = null;
      try { if (markerGroup) markerGroup.visible = true; } catch (_) {}
      setPlayerPosition(lastExitReturn, { x: lastExitReturn.x, y: (lastExitReturn.y || 0) + 1.4, z: lastExitReturn.z });
      emit('interior-renderer:exited', { actor: actor, interiorId: out.interiorId, returnTo: lastExitReturn });
      return Object.assign({}, out, { returnTo: lastExitReturn });
    }
    function refreshActive() {
      if (!activeInteriorId || !Genesis.InteriorInstanceManager || !Genesis.InteriorInstanceManager.get) return { ok: false, error: 'no-active-interior' };
      var interior = Genesis.InteriorInstanceManager.get(activeInteriorId);
      if (!interior) return { ok: false, error: 'interior-not-found' };
      return buildInterior(interior, { actor: activeActor });
    }
    function findDoorIdFromObject(obj) {
      var guard = 0;
      while (obj && guard++ < 64) {
        if (obj.userData && obj.userData.genesisDoorId) return obj.userData.genesisDoorId;
        obj = obj.parent;
      }
      return null;
    }
    function isExitObject(obj) {
      var guard = 0;
      while (obj && guard++ < 64) {
        if (obj.userData && obj.userData.interiorExit) return true;
        obj = obj.parent;
      }
      return false;
    }
    function ensureRay() {
      var TT = T();
      if (!TT || !TT.Raycaster || !TT.Vector2 || !camera) return false;
      if (!ray) ray = new TT.Raycaster();
      if (!pointer) pointer = new TT.Vector2();
      return true;
    }
    function collectMeshes(g, out) {
      out = out || [];
      try {
        if (!g) return out;
        if (g.isMesh) out.push(g);
        if (g.traverse) g.traverse(function (n) { if (n && n.isMesh) out.push(n); });
      } catch (_) {}
      return out;
    }
    function onPointer(ev) {
      if (!flagOn() || !attached || !ensureRay()) return;
      var target = ev && ev.target;
      var rect = (target && target.getBoundingClientRect) ? target.getBoundingClientRect() : { left: 0, top: 0, width: (typeof window !== 'undefined' ? window.innerWidth : 1) || 1, height: (typeof window !== 'undefined' ? window.innerHeight : 1) || 1 };
      var cx = (ev && typeof ev.clientX === 'number') ? ev.clientX : (rect.left + rect.width / 2);
      var cy = (ev && typeof ev.clientY === 'number') ? ev.clientY : (rect.top + rect.height / 2);
      try {
        pointer.x = ((cx - rect.left) / rect.width) * 2 - 1;
        pointer.y = -((cy - rect.top) / rect.height) * 2 + 1;
        ray.setFromCamera(pointer, camera);
        var targets = [];
        if (activeGroup) collectMeshes(activeGroup, targets);
        else if (markerGroup) collectMeshes(markerGroup, targets);
        var hits = ray.intersectObjects ? ray.intersectObjects(targets, true) : [];
        if (!hits || !hits.length) return;
        if (activeGroup && isExitObject(hits[0].object)) { exitInterior({ actor: activeActor }); return; }
        var doorId = findDoorIdFromObject(hits[0].object);
        if (doorId) enterDoor(doorId, { actor: activeActor });
      } catch (_) {}
    }
    function onKey(ev) {
      if (!flagOn() || !attached) return;
      var code = (ev && (ev.code || ev.key)) || '';
      if (code !== 'KeyE' && code !== 'Enter') return;
      try { if (ev && ev.target && /input|textarea|select/i.test(ev.target.tagName || '')) return; } catch (_) {}
      if (activeInteriorId) { exitInterior({ actor: activeActor }); return; }
      var near = nearestDoorTo(currentPlayerPosition(), 6);
      if (near && near.door && near.door.id) enterDoor(near.door.id, { actor: activeActor });
    }
    function bindInput() {
      if (typeof window === 'undefined' || !window.addEventListener) return;
      if (!pointerBound) {
        var target = domElement || window;
        try { target.addEventListener('pointerdown', onPointer, { passive: true }); pointerBound = true; } catch (_) {}
      }
      if (!keyBound) {
        try { window.addEventListener('keydown', onKey, { passive: true }); keyBound = true; } catch (_) {}
      }
    }
    function bindEvents() {
      if (typeof window === 'undefined' || !window.addEventListener) return;
      try { window.addEventListener('genesis:door:defined', function () { buildDoorMarkers(); }, { passive: true }); } catch (_) {}
      try { window.addEventListener('genesis:apartment:listed', function () { buildDoorMarkers(); }, { passive: true }); } catch (_) {}
      try { window.addEventListener('genesis:interior:customized', function (ev) { var d = ev && ev.detail; if (d && d.interiorId === activeInteriorId) refreshActive(); }, { passive: true }); } catch (_) {}
      try { window.addEventListener('genesis:interior:theme', function (ev) { var d = ev && ev.detail; if (d && d.interiorId === activeInteriorId) refreshActive(); }, { passive: true }); } catch (_) {}
      try { window.addEventListener('genesis:interior:decor', function (ev) { var d = ev && ev.detail; if (d && d.interiorId === activeInteriorId) refreshActive(); }, { passive: true }); } catch (_) {}
      try { window.addEventListener('genesis:avatar:updated', function () { if (activeInteriorId) refreshActive(); }, { passive: true }); } catch (_) {}
    }
    function attach(opts) {
      opts = opts || {};
      THREE = opts.THREE || THREE || ((typeof window !== 'undefined') ? window.THREE : null);
      scene = opts.scene || Genesis.scene || scene;
      camera = opts.camera || Genesis.camera || camera;
      domElement = opts.domElement || (opts.renderer && opts.renderer.domElement) || (Genesis.renderer && Genesis.renderer.domElement) || domElement;
      activeActor = opts.actor || activeActor || DEFAULT_ACTOR;
      if (!flagOn()) return { ok: false, error: 'flag-off' };
      if (!T()) return { ok: false, error: 'no-THREE' };
      if (!ensureRoot()) return { ok: false, error: 'no-scene' };
      attached = true;
      bindInput();
      bindEvents();
      var markers = buildDoorMarkers();
      registerModule('validated');
      emit('interior-renderer:attached', { markers: markers.count || 0 });
      return { ok: true, markers: markers.count || 0 };
    }
    function detach() {
      try { if (root && root.parent) root.parent.remove(root); } catch (_) {}
      root = null; markerGroup = null; activeGroup = null; activeInteriorId = null; doorMarkers.clear(); attached = false;
      return true;
    }
    function summary() {
      return { enabled: flagOn(), attached: attached, markers: doorMarkers.size, activeInteriorId: activeInteriorId, hasActiveGroup: !!activeGroup, lastExitReturn: clone(lastExitReturn) };
    }

    Genesis.InteriorRenderer = {
      VERSION: VERSION,
      flag: FLAG,
      attach: attach,
      detach: detach,
      buildDoorMarkers: buildDoorMarkers,
      enterDoor: enterDoor,
      exitInterior: exitInterior,
      buildInterior: buildInterior,
      refreshActive: refreshActive,
      nearestDoorTo: nearestDoorTo,
      currentPlayerPosition: currentPlayerPosition,
      markerCount: function () { return doorMarkers.size; },
      activeGroup: function () { return activeGroup; },
      markerGroup: function () { return markerGroup; },
      root: function () { return root; },
      summary: summary,
      _doors: function () { return Array.from(doorMarkers.keys()); }
    };

    registerModule('loaded');
  }

  if (typeof module !== 'undefined' && module.exports) module.exports = { install: install };
  if (typeof window !== 'undefined' && window.Genesis) install(window.Genesis, window.THREE);
})();
