const { PLTEntityEconomy } = require('./plt_entity_economy.js');
const economy = new PLTEntityEconomy();
economy.createWallet('entity_alpha', 500);
economy.createWallet('entity_beta', 200);
const reward = economy.mintReward('entity_alpha', 'goal_001', 100);
console.log('Reward Minted:', reward);
const trade = economy.tradeKnowledgeShard('entity_alpha', 'entity_beta', 'shard_99', 50);
console.log('Shard Trade Result:', trade);
