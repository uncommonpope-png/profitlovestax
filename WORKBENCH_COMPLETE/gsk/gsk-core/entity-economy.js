const fs = require('fs');
const path = require('path');

class EntityEconomy {
  constructor(storagePath) {
    this.storagePath = storagePath || path.join(__dirname, '../data/economy-state.json');
    this.state = {
      treasuryBalance: 1000,
      taxRate: 0.15,
      wallets: {},
      shards: {}
    };
    this.loadState();
  }

  loadState() {
    try {
      if (fs.existsSync(this.storagePath)) {
        const raw = fs.readFileSync(this.storagePath, 'utf8');
        this.state = JSON.parse(raw);
      }
    } catch (e) {
      console.error('Failed loading economy state:', e.message);
    }
  }

  saveState() {
    try {
      const dir = path.dirname(this.storagePath);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(this.storagePath, JSON.stringify(this.state, null, 2));
    } catch (e) {
      console.error('Failed saving economy state:', e.message);
    }
  }

  getOrCreateWallet(entityId) {
    if (!this.state.wallets[entityId]) {
      this.state.wallets[entityId] = {
        entityId,
        balance: 100,
        mintedTotal: 0,
        taxPaid: 0,
        inventoryShards: []
      };
      this.saveState();
    }
    return this.state.wallets[entityId];
  }

  rewardEntityGoal(entityId, rewardAmount, goalDescription) {
    const wallet = this.getOrCreateWallet(entityId);
    const tax = Math.floor(rewardAmount * this.state.taxRate);
    const netReward = rewardAmount - tax;

    wallet.balance += netReward;
    wallet.mintedTotal += rewardAmount;
    wallet.taxPaid += tax;
    this.state.treasuryBalance += tax;

    this.saveState();
    return {
      entityId,
      goalDescription,
      grossReward: rewardAmount,
      taxPaid: tax,
      netReward,
      newBalance: wallet.balance,
      treasuryBalance: this.state.treasuryBalance
    };
  }

  tradeShard(sellerId, buyerId, shardId, price) {
    const seller = this.getOrCreateWallet(sellerId);
    const buyer = this.getOrCreateWallet(buyerId);

    if (buyer.balance < price) {
      throw new Error(`Buyer ${buyerId} has insufficient funds for price ${price}`);
    }

    buyer.balance -= price;
    const tax = Math.floor(price * this.state.taxRate);
    const netProceeds = price - tax;
    seller.balance += netProceeds;
    this.state.treasuryBalance += tax;

    const index = seller.inventoryShards.indexOf(shardId);
    if (index !== -1) {
      seller.inventoryShards.splice(index, 1);
    }
    buyer.inventoryShards.push(shardId);

    this.saveState();
    return {
      shardId,
      sellerId,
      buyerId,
      price,
      taxPaid: tax,
      sellerNet: netProceeds,
      buyerBalance: buyer.balance,
      sellerBalance: seller.balance
    };
  }
}

module.exports = EntityEconomy;
