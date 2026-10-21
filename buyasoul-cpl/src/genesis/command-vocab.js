// command-vocab.js — GSK-in-engine command vocabulary (Layer D, agent://gsk)
// CASCADE LAW: the engine validates EVERY op before it is applied. GSK decides;
// the engine (AgentGateway + EntityRegistry) executes + bounds. This shared schema
// lets the gateway's ingress (dispatch) and the CRITIC (apply-time) agree.
(function () {
  const OP = Object.freeze({ SPAWN: 'spawn', MOVE: 'move', DELETE: 'delete', OBSERVE: 'observe', LEARN: 'learn' });
  const MAX_ID = 128;
  const MAX_TEXT = 8192;

  function isNum(v) { return (typeof v === 'number' && isFinite(v)); }
  // Injection guard: only safe id characters, bounded length.
  function safeId(s) {
    if (typeof s !== 'string') return null;
    if (s.length === 0 || s.length > MAX_ID) return null;
    return /^[A-Za-z0-9_:/.\-]+$/.test(s) ? s : null;
  }

  // Validate + NORMALIZE an inbound command. Returns { ok, error?, cmd? }.
  // Used at ingress (dispatch) AND at apply-time (CRITIC) — defense in depth.
  function validate(raw) {
    if (!raw || typeof raw !== 'object') return { ok:false, error:'bad-command' };
    const op = raw.op;
    if (Object.values(OP).indexOf(op) === -1) return { ok:false, error:'unknown-op:' + (op == null ? '?' : String(op)) };

    if (op === OP.SPAWN) {
      const kind = typeof raw.kind === 'string' ? raw.kind.slice(0, 64) : 'agent-entity';
      const pos = raw.pos;
      if (pos && !(isNum(pos.x) && isNum(pos.y) && isNum(pos.z))) return { ok:false, error:'bad-pos' };
      // SOUL-GUN Central Constraint Gate: optional action cost (scarcity), bounded.
      const cost = (typeof raw.cost === 'number' && raw.cost >= 0 && raw.cost <= 1e6) ? Math.floor(raw.cost) : 0;
      return { ok:true, cmd:{ op, kind, owner: raw.owner || 'agent://gsk', tags: Array.isArray(raw.tags) ? raw.tags.slice(0, 16) : ['gsk-controlled'], meta: raw.meta || {}, pos: pos ? { x:pos.x, y:pos.y, z:pos.z } : null, obj: raw.obj || null, cost } };
    }
    if (op === OP.MOVE) {
      const id = safeId(raw.id); if (!id) return { ok:false, error:'bad-id' };
      const pos = raw.pos; if (!pos || !(isNum(pos.x) && isNum(pos.y) && isNum(pos.z))) return { ok:false, error:'bad-pos' };
      const cost = (typeof raw.cost === 'number' && raw.cost >= 0 && raw.cost <= 1e6) ? Math.floor(raw.cost) : 0;
      return { ok:true, cmd:{ op, id, pos:{ x:pos.x, y:pos.y, z:pos.z }, cost } };
    }
    if (op === OP.DELETE) {
      const id = safeId(raw.id); if (!id) return { ok:false, error:'bad-id' };
      const cost = (typeof raw.cost === 'number' && raw.cost >= 0 && raw.cost <= 1e6) ? Math.floor(raw.cost) : 0;
      return { ok:true, cmd:{ op, id, cost } };
    }
    if (op === OP.OBSERVE) {
      const filter = {};
      if (typeof raw.kind === 'string') filter.kind = raw.kind.slice(0, 64);
      if (typeof raw.tag === 'string') filter.tag = raw.tag.slice(0, 64);
      return { ok:true, cmd:{ op, filter } };
    }
    if (op === OP.LEARN) {
      const txt = typeof raw.text === 'string' ? raw.text.slice(0, MAX_TEXT) : '';
      if (!txt && !(raw.source && raw.source.path)) return { ok:false, error:'empty-learn' };
      return { ok:true, cmd:{ op, source: raw.source || null, text: txt, topic: typeof raw.topic === 'string' ? raw.topic.slice(0, 64) : null } };
    }
    return { ok:false, error:'unreachable' };
  }

  const Vocab = { OP, MAX_ID, MAX_TEXT, validate, isNum, safeId };
  if (typeof module !== 'undefined' && module.exports) module.exports = Vocab;
  if (typeof window !== 'undefined') window.GenesisCommandVocab = Vocab;
})();
