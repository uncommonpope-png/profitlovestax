const express = require('express');
const EntityEconomy = require('./entity-economy');

function createEconomyRouter(storagePath) {
  const router = express.Router();
  const economy = new EntityEconomy(storagePath);

  router.get('/wallet/:entityId', (req, res) => {
    const wallet = economy.getOrCreateWallet(req.params.entityId);
    res.json({ success: true, wallet });
  });

  router.post('/reward', (req, res) => {
    const { entityId, amount, goal } = req.body;
    if (!entityId || !amount) {
      return res.status(400).json({ success: false, error: 'Missing entityId or amount' });
    }
    const result = economy.rewardEntityGoal(entityId, Number(amount), goal || 'Completed Task');
    res.json({ success: true, result });
  });

  router.post('/trade-shard', (req, res) => {
    const { sellerId, buyerId, shardId, price } = req.body;
    try {
      const result = economy.tradeShard(sellerId, buyerId, shardId, Number(price));
      res.json({ success: true, result });
    } catch (err) {
      res.status(400).json({ success: false, error: err.message });
    }
  });

  return router;
}

module.exports = createEconomyRouter;
