// src/genesis/merchant.js — Act XIV BODY (P136) — Merchant Real Purchase
// Flag-gated by window.__GENESIS_MERCHANT (default OFF).
// Implements core commerce/inventory mechanics: Item schema, Merchant entities,
// buy/sell actions, and inventory management.

(function () {
  function install(Genesis) {
    if (!Genesis) return;
    if (Genesis.Merchant) return; // idempotent

    const FLAG = '__GENESIS_MERCHANT';
    const ITEM_KIND = 'item';
    const MERCHANT_KIND = 'merchant';

    function flagOn() {
      return (typeof window !== 'undefined') && window[FLAG] === true;
    }

    // Item schema for clarity and validation
    const ItemSchema = {
      id: 'string',       // Unique ID for the item instance
      name: 'string',     // Display name
      description: 'string', // Flavor text
      price: 'number',    // Cost in energy/currency
      quantity: 'number', // How many of this item
      ownerId: 'string',  // Entity ID of current owner
      tags: 'array',      // Categorization
      meta: 'object',     // Custom data
    };

    // Internal inventory: ownerId -> Map<itemId, Item>
    const inventories = new Map(); // citizenId/merchantId -> Map<itemId, Item>

    function ensureInventory(ownerId) {
      if (!inventories.has(ownerId)) {
        inventories.set(ownerId, new Map());
      }
      return inventories.get(ownerId);
    }

    // Adds an item to an owner's inventory. Updates existing quantity if item exists.
    function addItem(ownerId, item) {
      if (!ownerId || !item || !item.id) return false;
      const inv = ensureInventory(ownerId);
      const existing = inv.get(item.id);
      if (existing) {
        existing.quantity += item.quantity || 1;
      } else {
        inv.set(item.id, { ...item, ownerId: ownerId, quantity: item.quantity || 1 });
      }
      return true;
    }

    // Removes an item from an owner's inventory. Returns true if successful.
    function removeItem(ownerId, itemId, quantity = 1) {
      if (!ownerId || !itemId) return false;
      const inv = ensureInventory(ownerId);
      const existing = inv.get(itemId);
      if (!existing || existing.quantity < quantity) return false;
      existing.quantity -= quantity;
      if (existing.quantity <= 0) {
        inv.delete(itemId);
      }
      return true;
    }

    // Get an item from an owner's inventory
    function getItem(ownerId, itemId) {
      const inv = inventories.get(ownerId);
      return inv ? inv.get(itemId) : null;
    }

    // Get all items for an owner
    function getInventory(ownerId) {
      const inv = inventories.get(ownerId);
      return inv ? [...inv.values()] : [];
    }

    // Core commerce function: Buyer buys item from Merchant
    function buy(buyerId, itemId, merchantId) {
      if (!flagOn() || !Genesis.ResourcePool || !Genesis.EntityRegistry) return { ok: false, error: 'Merchant system disabled or dependencies missing' };

      const buyerPool = Genesis.ResourcePool.get(buyerId);
      if (!buyerPool) return { ok: false, error: 'Buyer resource pool not found' };

      const merchantItem = getItem(merchantId, itemId);
      if (!merchantItem || merchantItem.quantity <= 0) return { ok: false, error: 'Item not available from merchant' };

      // Cost of item. This is where Trust/Love/Profit could influence price.
      const price = merchantItem.price || 0;
      if (!Genesis.ResourcePool.spend(buyerId, price)) {
        return { ok: false, error: 'Insufficient energy for purchase' };
      }
      
      // Update merchant's profit
      Genesis.ResourcePool.addPLT(merchantId, price, 0, 0); // Merchant gains profit
      Genesis.ResourcePool.addPLT(buyerId, 0, 0, price);    // Buyer incurs tax (from spending)

      if (!removeItem(merchantId, itemId)) {
        // This should not happen if previous checks pass
        return { ok: false, error: 'Failed to remove item from merchant inventory' };
      }

      const purchasedItem = { ...merchantItem, quantity: 1 }; // Buy one at a time for simplicity
      if (!addItem(buyerId, purchasedItem)) {
        // This should not happen either
        return { ok: false, error: 'Failed to add item to buyer inventory' };
      }

      // Record transaction episode
      if (Genesis.CitizenAI && Genesis.CitizenAI.addEpisode) {
        const buyerEntity = Genesis.EntityRegistry.get(buyerId);
        const merchantEntity = Genesis.EntityRegistry.get(merchantId);
        const buyerPos = buyerEntity && buyerEntity.pos;
        Genesis.CitizenAI.addEpisode(buyerId, 'purchase', `Bought ${merchantItem.name} from ${merchantEntity ? merchantEntity.id : 'unknown'} for ${price}`, [itemId, merchantId], buyerPos, 'neutral', ['commerce', 'buy']);
        Genesis.CitizenAI.addEpisode(merchantId, 'sale', `Sold ${merchantItem.name} to ${buyerEntity ? buyerEntity.id : 'unknown'} for ${price}`, [itemId, buyerId], merchantEntity ? merchantEntity.pos : null, 'positive', ['commerce', 'sell']);
      }
      
      return { ok: true, buyerId, merchantId, itemId, price, purchasedItem };
    }

    // Core commerce function: Seller sells item to Merchant
    function sell(sellerId, itemId, merchantId) {
      if (!flagOn() || !Genesis.ResourcePool || !Genesis.EntityRegistry) return { ok: false, error: 'Merchant system disabled or dependencies missing' };

      const sellerItem = getItem(sellerId, itemId);
      if (!sellerItem || sellerItem.quantity <= 0) return { ok: false, error: 'Item not available from seller' };

      const merchantPool = Genesis.ResourcePool.get(merchantId);
      if (!merchantPool) return { ok: false, error: 'Merchant resource pool not found' };

      const payout = sellerItem.price || 0; // Seller gets item's price
      
      // Merchant spends energy (buys item) - needs to be implemented.
      // For now, assume merchant has infinite energy or gets it from elsewhere.
      // For P136, we focus on seller selling, merchant purchasing.
      
      // Seller gains profit (energy) - for now, directly add to resource pool for simplicity.
      // A proper merchant system would involve the merchant having its own energy pool and spending it.
      // This is a simplification for P136.
      Genesis.ResourcePool.addPLT(sellerId, payout, 0, 0); // Seller gains profit
      Genesis.ResourcePool.addPLT(merchantId, 0, 0, payout); // Merchant incurs tax (from spending)

      if (!removeItem(sellerId, itemId)) {
        return { ok: false, error: 'Failed to remove item from seller inventory' };
      }

      const soldItem = { ...sellerItem, quantity: 1 };
      if (!addItem(merchantId, soldItem)) {
        return { ok: false, error: 'Failed to add item to merchant inventory' };
      }

      // Record transaction episode
      if (Genesis.CitizenAI && Genesis.CitizenAI.addEpisode) {
        const sellerEntity = Genesis.EntityRegistry.get(sellerId);
        const merchantEntity = Genesis.EntityRegistry.get(merchantId);
        const sellerPos = sellerEntity && sellerEntity.pos;
        Genesis.CitizenAI.addEpisode(sellerId, 'sale', `Sold ${sellerItem.name} to ${merchantEntity ? merchantEntity.id : 'unknown'} for ${payout}`, [itemId, merchantId], sellerPos, 'positive', ['commerce', 'sell']);
        Genesis.CitizenAI.addEpisode(merchantId, 'purchase', `Bought ${sellerItem.name} from ${sellerEntity ? sellerEntity.id : 'unknown'} for ${payout}`, [itemId, sellerId], merchantEntity ? merchantEntity.pos : null, 'neutral', ['commerce', 'buy']);
      }

      return { ok: true, sellerId, merchantId, itemId, payout, soldItem };
    }


    // Surface B (Step 5 immortality): serialize inventory states
    function snapshot() {
      const out = {};
      for (const [ownerId, invMap] of inventories) {
        out[ownerId] = [...invMap.values()];
      }
      return out;
    }
    function load(state) {
      if (!state || typeof state !== 'object') return false;
      inventories.clear();
      for (const ownerId of Object.keys(state)) {
        const items = state[ownerId];
        if (Array.isArray(items)) {
          const invMap = new Map();
          for (const item of items) {
            if (item && item.id) invMap.set(item.id, item);
          }
          inventories.set(ownerId, invMap);
        }
      }
      return true;
    }


    const Merchant = {
      flag: FLAG,
      isEnabled() { return flagOn(); },
      ItemSchema,
      addItem,
      removeItem,
      getItem,
      getInventory,
      buy,
      sell,
      snapshot,
      load,
      // Helper to register a merchant entity (or any entity with an inventory)
      registerMerchant(id, name, description, pos, initialInventory = []) {
        if (!Genesis.EntityRegistry) return null;
        const merchantId = Genesis.EntityRegistry.register(null, {
          kind: MERCHANT_KIND,
          owner: 'system',
          tags: ['commerce', MERCHANT_KIND],
          meta: { name, description, pos }
        });
        if (pos) {
          const obj = new THREE.Mesh(new THREE.BoxGeometry(2, 4, 2), new THREE.MeshStandardMaterial({ color: 0x884400 })); // Simple visual for merchant
          obj.position.set(pos.x, pos.y, pos.z);
          obj.name = name;
          Genesis.scene.add(obj);
          Genesis.EntityRegistry.resolve(merchantId).obj = obj;
        }

        initialInventory.forEach(item => addItem(merchantId, item));
        return merchantId;
      },
      // Utility to create a basic item for testing
      createItem(id, name, description, price, quantity = 1, tags = [], meta = {}) {
        return { id, name, description, price, quantity, tags, meta };
      },
      summary() {
        return {
          enabled: flagOn(),
          merchantCount: Genesis.EntityRegistry ? Genesis.EntityRegistry.find(MERCHANT_KIND).length : 0,
          inventoryOwners: inventories.size,
          totalItems: [...inventories.values()].reduce((sum, inv) => sum + inv.size, 0)
        };
      }
    };

    Genesis.Merchant = Merchant;

    // Register on Immortality for persistence
    if (Genesis.Immortality && typeof Genesis.Immortality.registerSystem === 'function') {
      Genesis.Immortality.registerSystem('merchant', {
        snapshot: Merchant.snapshot,
        load: Merchant.load,
        summary: Merchant.summary
      });
    }

    if (typeof Genesis.registerModule === 'function') {
      Genesis.registerModule('merchant', { status: 'candidate', path: './src/genesis/merchant.js', gun: 'ECON' });
    }
  }

  // Support both ES-module and inline-script consumption.
  if (typeof module !== 'undefined' && module.exports) module.exports = { install };
  if (typeof window !== 'undefined' && window.Genesis) install(window.Genesis);
})();