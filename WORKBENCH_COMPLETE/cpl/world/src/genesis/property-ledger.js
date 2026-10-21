// property-ledger.js — GENESIS INTERIORS: ownership, permissions, receipts spine
// ==========================================================================
// A city becomes a product when users can own a piece of it. The PropertyLedger
// is the authoritative engine-side record for apartments/interiors: owner,
// guests, editors, for-sale status, and exact persistence. It is deliberately
// dependency-light and CASCADE-safe: callers may request ownership changes, but
// the ledger decides whether the mutation is lawful.
(function () {
  var VERSION = 1;

  function install(Genesis) {
    if (!Genesis) return;
    if (Genesis.PropertyLedger) return;

    var properties = new Map();
    var seq = 0;

    function now() { return Date.now ? Date.now() : new Date().getTime(); }
    function clone(obj) { try { return JSON.parse(JSON.stringify(obj)); } catch (_) { return obj; } }
    function asActor(actor) { return (actor == null || actor === '') ? 'guest' : String(actor); }
    function arr(v) { return Array.isArray(v) ? v.slice() : []; }
    function emit(type, payload) {
      try { if (Genesis.EventBridge && Genesis.EventBridge.emit) Genesis.EventBridge.emit(type, payload || {}); } catch (_) {}
      try {
        if (typeof window !== 'undefined' && typeof window.dispatchEvent === 'function' && typeof window.CustomEvent === 'function') {
          window.dispatchEvent(new window.CustomEvent('genesis:' + type, { detail: payload || {} }));
        }
      } catch (_) {}
    }
    function enabled() {
      try { return (typeof window === 'undefined') || window.__GENESIS_INTERIORS === true; } catch (_) { return true; }
    }
    function normalize(spec) {
      spec = spec || {};
      var id = spec.id || ('property_' + (++seq));
      var guests = arr(spec.guests);
      var editors = arr(spec.editors);
      return {
        id: id,
        kind: spec.kind || 'apartment',
        name: spec.name || spec.label || ('Apartment ' + id),
        status: spec.status || (spec.owner ? 'owned' : 'for-sale'),
        owner: spec.owner || null,
        price: (typeof spec.price === 'number' && spec.price >= 0) ? spec.price : 0,
        currency: spec.currency || 'energy',
        interiorId: spec.interiorId || null,
        doorId: spec.doorId || null,
        buildingId: spec.buildingId || null,
        access: spec.access || (spec.preview ? 'preview' : 'private'),
        guests: guests,
        editors: editors,
        createdAt: spec.createdAt || now(),
        purchasedAt: spec.purchasedAt || null,
        updatedAt: spec.updatedAt || now(),
        receiptId: spec.receiptId || null,
        meta: Object.assign({ preview: !!spec.preview }, spec.meta || {})
      };
    }
    function publicRecord(p) { return p ? clone(p) : null; }
    function get(propertyId) { return publicRecord(properties.get(propertyId)); }
    function raw(propertyId) { return properties.get(propertyId) || null; }
    function registerProperty(spec) {
      var p = normalize(spec);
      var existing = properties.get(p.id);
      if (existing) {
        p = Object.assign(existing, p, { updatedAt: now() });
      } else {
        properties.set(p.id, p);
      }
      try {
        if (Genesis.EntityRegistry && Genesis.EntityRegistry.register && !Genesis.EntityRegistry.has(p.id)) {
          Genesis.EntityRegistry.register(null, {
            id: p.id,
            kind: 'property',
            owner: p.owner || 'world',
            tags: ['property', p.kind, p.status],
            meta: { name: p.name, interiorId: p.interiorId, doorId: p.doorId, price: p.price, status: p.status }
          });
        }
      } catch (_) {}
      emit('property:registered', { propertyId: p.id, property: publicRecord(p) });
      return publicRecord(p);
    }
    function setLinks(propertyId, links) {
      var p = raw(propertyId);
      if (!p || !links) return { ok: false, error: 'property-not-found' };
      if (links.interiorId) p.interiorId = links.interiorId;
      if (links.doorId) p.doorId = links.doorId;
      if (links.buildingId) p.buildingId = links.buildingId;
      p.updatedAt = now();
      emit('property:linked', { propertyId: p.id, links: { interiorId: p.interiorId, doorId: p.doorId, buildingId: p.buildingId } });
      return { ok: true, property: publicRecord(p) };
    }
    function isOwner(actor, p) { return !!p && !!p.owner && asActor(actor) === p.owner; }
    function includes(list, actor) { return list.indexOf(asActor(actor)) !== -1; }
    function canEnter(actor, propertyId) {
      var p = raw(propertyId);
      if (!p) return false;
      actor = asActor(actor);
      if (actor === 'system' || actor === 'agent://gsk') return true;
      if (isOwner(actor, p)) return true;
      if (includes(p.guests, actor) || includes(p.editors, actor)) return true;
      if (p.access === 'public' || p.access === 'preview' || (p.meta && p.meta.preview === true)) return true;
      return false;
    }
    function canEdit(actor, propertyId) {
      var p = raw(propertyId);
      if (!p) return false;
      actor = asActor(actor);
      if (actor === 'system' || actor === 'agent://gsk') return true;
      if (isOwner(actor, p)) return true;
      return includes(p.editors, actor);
    }
    function recordPurchase(propertyId, actor, price, receiptId) {
      if (!enabled()) return { ok: false, error: 'interiors-disabled' };
      var p = raw(propertyId);
      if (!p) return { ok: false, error: 'property-not-found' };
      if (p.owner && p.owner !== actor) return { ok: false, error: 'already-owned', owner: p.owner };
      p.owner = asActor(actor);
      p.status = 'owned';
      p.access = 'private';
      p.meta = Object.assign({}, p.meta || {}, { preview: false });
      p.purchasedAt = now();
      p.updatedAt = p.purchasedAt;
      p.receiptId = receiptId || p.receiptId || null;
      if (typeof price === 'number') p.price = price;
      try {
        var rec = Genesis.EntityRegistry && Genesis.EntityRegistry.get ? Genesis.EntityRegistry.get(p.id) : null;
        if (rec) { rec.owner = p.owner; rec.tags = ['property', p.kind, 'owned']; rec.meta = Object.assign({}, rec.meta || {}, { owner: p.owner, status: p.status, receiptId: p.receiptId }); }
      } catch (_) {}
      emit('property:purchased', { propertyId: p.id, actor: p.owner, price: p.price, receiptId: p.receiptId });
      return { ok: true, property: publicRecord(p) };
    }
    function claim(propertyId, actor, opts) {
      opts = opts || {};
      var p = raw(propertyId);
      if (!p) return { ok: false, error: 'property-not-found' };
      if (p.owner && p.owner !== actor && !opts.force) return { ok: false, error: 'already-owned', owner: p.owner };
      return recordPurchase(propertyId, actor, opts.price || p.price || 0, opts.receiptId || null);
    }
    function addGuest(ownerActor, propertyId, guestActor, role) {
      var p = raw(propertyId);
      if (!p) return { ok: false, error: 'property-not-found' };
      ownerActor = asActor(ownerActor);
      guestActor = asActor(guestActor);
      if (!(ownerActor === 'system' || isOwner(ownerActor, p))) return { ok: false, error: 'not-owner' };
      var list = (role === 'editor') ? p.editors : p.guests;
      if (list.indexOf(guestActor) === -1) list.push(guestActor);
      p.updatedAt = now();
      emit('property:guest-added', { propertyId: p.id, actor: guestActor, role: role === 'editor' ? 'editor' : 'guest' });
      return { ok: true, property: publicRecord(p) };
    }
    function revokeGuest(ownerActor, propertyId, guestActor) {
      var p = raw(propertyId);
      if (!p) return { ok: false, error: 'property-not-found' };
      ownerActor = asActor(ownerActor);
      guestActor = asActor(guestActor);
      if (!(ownerActor === 'system' || isOwner(ownerActor, p))) return { ok: false, error: 'not-owner' };
      p.guests = p.guests.filter(function (g) { return g !== guestActor; });
      p.editors = p.editors.filter(function (g) { return g !== guestActor; });
      p.updatedAt = now();
      emit('property:guest-revoked', { propertyId: p.id, actor: guestActor });
      return { ok: true, property: publicRecord(p) };
    }
    function transfer(ownerActor, propertyId, nextOwner) {
      var p = raw(propertyId);
      if (!p) return { ok: false, error: 'property-not-found' };
      ownerActor = asActor(ownerActor);
      nextOwner = asActor(nextOwner);
      if (!(ownerActor === 'system' || isOwner(ownerActor, p))) return { ok: false, error: 'not-owner' };
      var prev = p.owner;
      p.owner = nextOwner;
      p.status = 'owned';
      p.updatedAt = now();
      emit('property:transferred', { propertyId: p.id, from: prev, to: nextOwner });
      return { ok: true, property: publicRecord(p) };
    }
    function ownedBy(actor) {
      actor = asActor(actor);
      var out = [];
      properties.forEach(function (p) { if (p.owner === actor) out.push(publicRecord(p)); });
      return out;
    }
    function propertyForInterior(interiorId) {
      var found = null;
      properties.forEach(function (p) { if (!found && p.interiorId === interiorId) found = p; });
      return publicRecord(found);
    }
    function propertyForDoor(doorId) {
      var found = null;
      properties.forEach(function (p) { if (!found && p.doorId === doorId) found = p; });
      return publicRecord(found);
    }
    function list(filter) {
      filter = filter || {};
      var out = [];
      properties.forEach(function (p) {
        if (filter.status && p.status !== filter.status) return;
        if (filter.kind && p.kind !== filter.kind) return;
        if (filter.owner && p.owner !== filter.owner) return;
        out.push(publicRecord(p));
      });
      return out;
    }
    function snapshot() { return { version: VERSION, properties: list() }; }
    function load(state) {
      if (!state || typeof state !== 'object') return false;
      var items = Array.isArray(state) ? state : state.properties;
      if (!Array.isArray(items)) return false;
      properties.clear();
      seq = 0;
      items.forEach(function (p) {
        if (p && p.id) {
          properties.set(p.id, normalize(p));
          var m = /^property_(\d+)$/.exec(p.id);
          if (m) seq = Math.max(seq, parseInt(m[1], 10) || 0);
        }
      });
      emit('property:loaded', { count: properties.size });
      return true;
    }
    function clear() { properties.clear(); seq = 0; }
    function summary() {
      var owned = 0, sale = 0;
      properties.forEach(function (p) { if (p.owner) owned++; if (p.status === 'for-sale') sale++; });
      return { enabled: enabled(), count: properties.size, owned: owned, forSale: sale };
    }

    var API = {
      VERSION: VERSION,
      registerProperty: registerProperty,
      setLinks: setLinks,
      get: get,
      list: list,
      claim: claim,
      recordPurchase: recordPurchase,
      addGuest: addGuest,
      revokeGuest: revokeGuest,
      transfer: transfer,
      canEnter: canEnter,
      canEdit: canEdit,
      ownedBy: ownedBy,
      propertyForInterior: propertyForInterior,
      propertyForDoor: propertyForDoor,
      snapshot: snapshot,
      load: load,
      clear: clear,
      summary: summary,
      _raw: raw
    };

    Genesis.PropertyLedger = API;
    if (Genesis.Immortality && typeof Genesis.Immortality.registerSystem === 'function') {
      Genesis.Immortality.registerSystem('property-ledger', { snapshot: snapshot, load: load, summary: summary });
    }
    if (typeof Genesis.registerModule === 'function') Genesis.registerModule('property-ledger', { status: 'validated', path: './src/genesis/property-ledger.js', gun: 'HOME' });
  }

  if (typeof module !== 'undefined' && module.exports) module.exports = { install: install };
  if (typeof window !== 'undefined' && window.Genesis) install(window.Genesis);
})();
