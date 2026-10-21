/**
 * Entity Economy Layer - PLT Token Economy & Knowledge Shard Marketplace
 * PLT Formula: Profit + Love - Tax = Net Value Generation
 */

class EntityEconomyLayer {
  constructor(config = {}) {
    this.taxRate = config.taxRate || 0.05;
    this.entities = new Map();
    this.shards = new Map();
    this.treasury = 0;
  }

  registerEntity(id, name, initialPLT = 100) {
    const entity = {
      id,
      name,
      pltBalance: initialPLT,
      shardsOwned: [],
      totalTaxPaid: 0,
      totalEarned: 0
    };
    this.entities.set(id, entity);
    return entity;
  }

  mintKnowledgeShard(shardId, creatorId, title, content, price) {
    if (!this.entities.has(creatorId)) throw new Error('Creator not registered');
    const shard = {
      id: shardId,
      creatorId,
      ownerId: creatorId,
      title,
      content,
      price
    };
    this.shards.set(shardId, shard);
    this.entities.get(creatorId).shardsOwned.push(shardId);
    return shard;
  }

  calculateAndAwardPLT(entityId, profit, love, taxCost) {
    const entity = this.entities.get(entityId);
    if (!entity) throw new Error('Entity missing');

    const grossPLT = Math.max(0, profit + love - taxCost);
    const taxDeduction = grossPLT * this.taxRate;
    const netPLT = grossPLT - taxDeduction;

    entity.pltBalance += netPLT;
    entity.totalEarned += netPLT;
    entity.totalTaxPaid += taxDeduction;
    this.treasury += taxDeduction;

    return {
      entityId,
      grossPLT,
      taxDeduction,
      netPLT,
      newBalance: entity.pltBalance
    };
  }

  tradeKnowledgeShard(buyerId, shardId) {
    const shard = this.shards.get(shardId);
    if (!shard) throw new Error('Shard not found');
    const buyer = this.entities.get(buyerId);
    const seller = this.entities.get(shard.ownerId);
    if (!buyer || !seller) throw new Error('Invalid trade participants');
    if (buyer.pltBalance < shard.price) throw new Error('Insufficient PLT balance');

    const tax = shard.price * this.taxRate;
    const sellerProceeds = shard.price - tax;

    buyer.pltBalance -= shard.price;
    seller.pltBalance += sellerProceeds;
    this.treasury += tax;
    seller.totalTaxPaid += tax;

    seller.shardsOwned = seller.shardsOwned.filter(id => id !== shardId);
    buyer.shardsOwned.push(shardId);
    shard.ownerId = buyerId;

    return {
      shardId,
      buyerId,
      sellerId: seller.id,
      price: shard.price,
      tax
    };
  }

  getEconomyOverview() {
    return {
      totalEntities: this.entities.size,
      totalShards: this.shards.size,
      treasuryBalance: this.treasury,
      entities: Array.from(this.entities.values())
    };
  }
}

module.exports = EntityEconomyLayer;
