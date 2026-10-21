const { DigitalEntity } = require('./digital_entity_framework');

const ENTITIES = {
  Profit: new DigitalEntity('ProfitPrime', 'Profit', { pltScore: { profit: 0.9, love: 0.05, tax: 0.05 } }),
  GSK: new DigitalEntity('GSKCore', 'GSK', { pltScore: { profit: 0.4, love: 0.3, tax: 0.3 } }),
  Seshat: new DigitalEntity('SeshatKeeper', 'Seshat', { pltScore: { profit: 0.1, love: 0.85, tax: 0.05 } }),
  SCRIBE: new DigitalEntity('ScribeWitness', 'SCRIBE', { pltScore: { profit: 0.05, love: 0.05, tax: 0.9 } })
};

console.log('Digital Entities Initialized:', Object.keys(ENTITIES).map(k => ({
  name: ENTITIES[k].name,
  id: ENTITIES[k].id,
  plt: ENTITIES[k].pltScore
})));
