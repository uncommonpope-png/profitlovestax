const express = require('express');
const router = express.Router();

const treaties = new Map();
const amendments = [];

router.post('/api/entity/govern', (req, res) => {
  const { action, entityId, payload, signature } = req.body || {};
  if (!action || !entityId) {
    return res.status(400).json({ error: 'Missing required parameters: action and entityId' });
  }
  if (action === 'constitutional_amendment') {
    const amendment = { id: `amend_${Date.now()}`, entityId, amendment: payload, timestamp: new Date().toISOString() };
    amendments.push(amendment);
    return res.status(201).json({ success: true, type: 'amendment', amendment });
  } else if (action === 'inter_entity_treaty') {
    const treatyId = `treaty_${Date.now()}`;
    const treaty = { id: treatyId, entityId, targetEntity: payload ? payload.targetEntity : null, terms: payload ? payload.terms : null, timestamp: new Date().toISOString() };
    treaties.set(treatyId, treaty);
    return res.status(201).json({ success: true, type: 'treaty', treaty });
  }
  return res.status(400).json({ error: 'Unsupported governance action' });
});

module.exports = router;
