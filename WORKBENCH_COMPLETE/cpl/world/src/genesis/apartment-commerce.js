// apartment-commerce.js — GENESIS INTERIORS: buy/rent flow + ownership receipt
// =================================================================================
// Turns PropertyLedger + ResourcePool into a real apartment market. Purchases are
// engine-state consequences: energy is spent, ownership changes, a receipt is
// minted, and doors become permission-gated private homes.
(function () {
  var VERSION = 1;
  var DEFAULTS = [
    { id: 'listing-studio-a', propertyId: 'apt-studio-a', doorId: 'door-studio-a', interiorId: 'interior-studio-a', name: 'North Spire Studio', template: 'studio', price: 40, pos: { x: 22, y: 0, z: -18 } },
    { id: 'listing-neon-loft', propertyId: 'apt-neon-loft', doorId: 'door-neon-loft', interiorId: 'interior-neon-loft', name: 'Neon Market Loft', template: 'loft', price: 75, pos: { x: -34, y: 0, z: 12 } },
    { id: 'listing-memory-suite', propertyId: 'apt-memory-suite', doorId: 'door-memory-suite', interiorId: 'interior-memory-suite', name: 'Scribe Memory Suite', template: 'suite', price: 120, pos: { x: 8, y: 0, z: 42 } }
  ];

  function install(Genesis) {
    if (!Genesis) return;
    if (Genesis.ApartmentCommerce) return;

    var listings = new Map();
    var receipts = new Map();
    var seq = 0;

    function now() { return Date.now ? Date.now() : new Date().getTime(); }
    function clone(obj) { try { return JSON.parse(JSON.stringify(obj)); } catch (_) { return obj; } }
    function enabled() { try { return (typeof window === 'undefined') || window.__GENESIS_INTERIORS === true; } catch (_) { return true; } }
    function emit(type, payload) {
      try { if (Genesis.EventBridge && Genesis.EventBridge.emit) Genesis.EventBridge.emit(type, payload || {}); } catch (_) {}
      try {
        if (typeof window !== 'undefined' && typeof window.dispatchEvent === 'function' && typeof window.CustomEvent === 'function') {
          window.dispatchEvent(new window.CustomEvent('genesis:' + type, { detail: payload || {} }));
        }
      } catch (_) {}
    }
    function normalizeListing(spec) {
      spec = spec || {};
      return {
        id: spec.id || ('listing_' + (++seq)),
        propertyId: spec.propertyId || null,
        doorId: spec.doorId || null,
        interiorId: spec.interiorId || null,
        name: spec.name || 'Genesis Apartment',
        template: spec.template || 'studio',
        price: (typeof spec.price === 'number' && spec.price >= 0) ? spec.price : 0,
        currency: spec.currency || 'energy',
        status: spec.status || 'available',
        createdAt: spec.createdAt || now(),
        updatedAt: spec.updatedAt || now(),
        receiptId: spec.receiptId || null,
        pos: spec.pos ? { x: Number(spec.pos.x) || 0, y: Number(spec.pos.y) || 0, z: Number(spec.pos.z) || 0 } : null,
        exitPos: spec.exitPos ? { x: Number(spec.exitPos.x) || 0, y: Number(spec.exitPos.y) || 0, z: Number(spec.exitPos.z) || 0 } : null,
        meta: Object.assign({}, spec.meta || {})
      };
    }
    function ensurePropertyAndDoor(l) {
      if (Genesis.InteriorInstanceManager && Genesis.InteriorInstanceManager.ensure && l.interiorId) {
        Genesis.InteriorInstanceManager.ensure(l.interiorId, { id: l.interiorId, template: l.template, propertyId: l.propertyId, doorId: l.doorId, name: l.name });
      }
      if (Genesis.PropertyLedger && Genesis.PropertyLedger.registerProperty && l.propertyId && !Genesis.PropertyLedger.get(l.propertyId)) {
        Genesis.PropertyLedger.registerProperty({ id: l.propertyId, name: l.name, price: l.price, interiorId: l.interiorId, doorId: l.doorId, access: 'preview', preview: true, meta: { listingId: l.id } });
      }
      if (Genesis.DoorPortalManager && Genesis.DoorPortalManager.defineDoor && l.doorId && !Genesis.DoorPortalManager.get(l.doorId)) {
        Genesis.DoorPortalManager.defineDoor({ id: l.doorId, label: l.name + ' Door', propertyId: l.propertyId, interiorId: l.interiorId, pos: (l.meta && l.meta.pos) || l.pos || { x: 0, y: 0, z: 0 }, exitPos: (l.meta && l.meta.exitPos) || l.pos || { x: 0, y: 0, z: 2 }, meta: { listingId: l.id, template: l.template } });
      }
    }
    function addListing(spec) {
      var l = normalizeListing(spec);
      listings.set(l.id, l);
      ensurePropertyAndDoor(l);
      emit('apartment:listed', { listingId: l.id, propertyId: l.propertyId, price: l.price });
      return clone(l);
    }
    function seedDefaults() {
      DEFAULTS.forEach(function (d) { if (!listings.has(d.id)) addListing(d); });
      return listCatalog();
    }
    function listCatalog(filter) {
      filter = filter || {};
      var out = [];
      listings.forEach(function (l) {
        if (filter.status && l.status !== filter.status) return;
        out.push(clone(l));
      });
      return out;
    }
    function getListing(id) { return clone(listings.get(id) || null); }
    function spend(actor, amount) {
      amount = Math.max(0, Number(amount || 0));
      if (!amount) return true;
      try { return !Genesis.ResourcePool || !Genesis.ResourcePool.spend || Genesis.ResourcePool.spend(actor || 'guest', amount); } catch (_) { return false; }
    }
    function mintReceipt(actor, l, property) {
      var id = 'receipt_' + (++seq);
      var r = { id: id, actor: actor, listingId: l.id, propertyId: l.propertyId, interiorId: l.interiorId, doorId: l.doorId, price: l.price, currency: l.currency, at: now(), property: property ? { owner: property.owner, name: property.name } : null };
      receipts.set(id, r);
      return clone(r);
    }
    function purchaseApartment(actor, listingId, opts) {
      opts = opts || {};
      actor = actor || 'guest';
      if (!enabled()) return { ok: false, error: 'interiors-disabled' };
      var l = listings.get(listingId);
      if (!l) return { ok: false, error: 'listing-not-found' };
      if (l.status !== 'available') return { ok: false, error: 'listing-unavailable', status: l.status };
      ensurePropertyAndDoor(l);
      var prop = Genesis.PropertyLedger && Genesis.PropertyLedger.get ? Genesis.PropertyLedger.get(l.propertyId) : null;
      if (prop && prop.owner && prop.owner !== actor) return { ok: false, error: 'already-owned', owner: prop.owner };
      if (!opts.skipSpend && !spend(actor, l.price)) return { ok: false, error: 'insufficient-energy', price: l.price };
      var previewReceipt = 'pending';
      var owned = Genesis.PropertyLedger && Genesis.PropertyLedger.recordPurchase ? Genesis.PropertyLedger.recordPurchase(l.propertyId, actor, l.price, previewReceipt) : { ok: true, property: prop };
      if (!owned || !owned.ok) return owned || { ok: false, error: 'purchase-failed' };
      var receipt = mintReceipt(actor, l, owned.property);
      if (Genesis.PropertyLedger && Genesis.PropertyLedger.recordPurchase) Genesis.PropertyLedger.recordPurchase(l.propertyId, actor, l.price, receipt.id);
      l.status = 'sold'; l.updatedAt = now(); l.receiptId = receipt.id;
      try { if (Genesis.ResourcePool && Genesis.ResourcePool.addPLT) Genesis.ResourcePool.addPLT(actor, 8, 10, Math.max(1, Math.floor(l.price / 10))); } catch (_) {}
      emit('apartment:purchased', { actor: actor, listingId: l.id, propertyId: l.propertyId, receiptId: receipt.id, price: l.price });
      return { ok: true, listing: clone(l), property: Genesis.PropertyLedger && Genesis.PropertyLedger.get ? Genesis.PropertyLedger.get(l.propertyId) : owned.property, receipt: receipt };
    }
    function receipt(id) { return clone(receipts.get(id) || null); }
    function receiptsFor(actor) { var out = []; receipts.forEach(function (r) { if (!actor || r.actor === actor) out.push(clone(r)); }); return out; }
    function snapshot() { return { version: VERSION, listings: listCatalog(), receipts: receiptsFor() }; }
    function load(state) {
      if (!state || typeof state !== 'object') return false;
      listings.clear(); receipts.clear(); seq = 0;
      var ls = Array.isArray(state.listings) ? state.listings : [];
      ls.forEach(function (l) { if (l && l.id) { listings.set(l.id, normalizeListing(l)); var m = /^listing_(\d+)$/.exec(l.id); if (m) seq = Math.max(seq, parseInt(m[1], 10) || 0); } });
      var rs = Array.isArray(state.receipts) ? state.receipts : [];
      rs.forEach(function (r) { if (r && r.id) { receipts.set(r.id, clone(r)); var m = /^receipt_(\d+)$/.exec(r.id); if (m) seq = Math.max(seq, parseInt(m[1], 10) || 0); } });
      listings.forEach(function (l) { ensurePropertyAndDoor(l); });
      emit('apartment:commerce-loaded', { listings: listings.size, receipts: receipts.size });
      return true;
    }
    function clear() { listings.clear(); receipts.clear(); seq = 0; }
    function summary() { var sold = 0; listings.forEach(function (l) { if (l.status === 'sold') sold++; }); return { enabled: enabled(), listings: listings.size, sold: sold, receipts: receipts.size }; }

    var API = { VERSION: VERSION, DEFAULTS: clone(DEFAULTS), addListing: addListing, seedDefaults: seedDefaults, listCatalog: listCatalog, getListing: getListing, purchaseApartment: purchaseApartment, receipt: receipt, receiptsFor: receiptsFor, snapshot: snapshot, load: load, clear: clear, summary: summary };
    Genesis.ApartmentCommerce = API;
    if (Genesis.Immortality && typeof Genesis.Immortality.registerSystem === 'function') Genesis.Immortality.registerSystem('apartment-commerce', { snapshot: snapshot, load: load, summary: summary });
    if (typeof Genesis.registerModule === 'function') Genesis.registerModule('apartment-commerce', { status: 'validated', path: './src/genesis/apartment-commerce.js', gun: 'MARKET' });

    // Default ON means buyers immediately have homes to buy. Pure records only;
    // no renderer mutation, no local server, no Craig-PC dependency.
    try { if (enabled()) seedDefaults(); } catch (_) {}
  }

  if (typeof module !== 'undefined' && module.exports) module.exports = { install: install };
  if (typeof window !== 'undefined' && window.Genesis) install(window.Genesis);
})();
