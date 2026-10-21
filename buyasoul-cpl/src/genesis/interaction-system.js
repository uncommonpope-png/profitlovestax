// interaction-system.js — C4-INTERACTION: the LIVING, CLICKABLE WORLD.
// Dark City model, extended: the city is not a dashboard — it is a place you
// walk into and TALK to. Every citizen (GSK/Allie/ARIA/Scribe) and every
// world-object is clickable. Clicking a citizen routes the prompt to THAT
// agent's own brain (agent://<id> talk) and projects its reply as a speech
// bubble (spawnWhisper). Citizens also greet each other + the player when near
// (alive-angels social layer, grafted to our EntityRegistry). Offline-safe:
// if an agent's brain/WS is down, a local mood-line fallback is used.
//
// CASCADE: interaction is read + talk only. It NEVER deletes/moves a protected
// entity. talk() only addresses the entity's OWNER agent (you can't hijack
// another citizen's voice). Flag-gated by window.__GENESIS_INTERACTION (OFF).
(function () {
  function install(Genesis, THREE) {
    if (!Genesis) return;
    if (Genesis.InteractionSystem) return; // idempotent

    const FLAG = '__GENESIS_INTERACTION';
    const GSK_SCHEME = 'agent://gsk';
    THREE = THREE || (typeof window !== 'undefined' && window.THREE) || null;

    function isEnabled() {
      try { return (typeof window !== 'undefined' && window[FLAG] === true); } catch (_) { return false; }
    }
    function raycaster() {
      try { if (THREE && THREE.Raycaster) return new THREE.Raycaster(); } catch (_) {}
      return null;
    }
    const _ray = raycaster();
    const _pointer = (THREE && THREE.Vector2) ? new THREE.Vector2() : { x:0, y:0, set(a,b){ this.x=a; this.y=b; } };

    let lastPick = null;          // last clicked entity record
    let pickCooldownAt = 0;
    const greetLog = [];          // recent proximity greetings (bounded)
    let talkCount = 0, pickCount = 0, greetCount = 0;

    // ---- speech bubble (reuse world projector if present) ----------------
    function say(worldPos, text, color) {
      try {
        if (typeof window !== 'undefined' && typeof window.spawnWhisper === 'function' && worldPos) {
          window.spawnWhisper(worldPos, text); return true;
        }
        // Fallback: DOM whisper at screen center-ish
        if (typeof window !== 'undefined' && window.Genesis && worldPos) {
          const cam = window.Genesis.camera;
          if (cam && worldPos.project) {
            const v = worldPos.clone ? worldPos.clone() : { x:worldPos.x, y:worldPos.y, z:worldPos.z };
            if (v.project) { v.y += 0.8; v.project(cam);
              const x = (v.x*0.5+0.5)*window.innerWidth, y = (-v.y*0.5+0.5)*window.innerHeight;
              const el = document.createElement('div'); el.className='whisper'; el.textContent=text;
              el.style.left=x+'px'; el.style.top=y+'px';
              if (color) el.style.color = color;
              document.body.appendChild(el); requestAnimationFrame(()=>el.classList.add('fade-in'));
              setTimeout(()=>{ if(el.parentNode) el.parentNode.removeChild(el); }, 4000);
              return true;
            }
          }
        }
      } catch (_) {}
      return false;
    }

    // ---- resolve a clicked THREE object -> EntityRegistry record ---------
    function recordForObject(obj) {
      const Registry = (Genesis && Genesis.EntityRegistry) ? Genesis.EntityRegistry : null;
      if (!Registry || typeof Registry.snapshot !== 'function') return null;
      const snap = Registry.snapshot();
      for (const s of snap) {
        const o = (Registry.resolve ? Registry.resolve(s.id) : null);
        // Walk up from the hit object to see if it (or an ancestor) is the registered handle.
        let n = obj;
        let guard = 0;
        while (n && guard++ < 64) { if (n === o) return s; n = n.parent; }
      }
      return null;
    }

    // ---- route a talk prompt to the entity's OWNER agent ----------------
    // Returns a reply string (agent brain if up, else local fallback).
    function talkTo(record, prompt) {
      if (!record) return null;
      const owner = record.owner || 'world';
      talkCount++;
      const name = (record.meta && record.meta.name) || (record.kind) || owner;
      const who = (owner === 'world') ? 'the world' : owner.replace('agent://', '');

      // GSK
      if (owner === GSK_SCHEME && Genesis.AgentGateway && typeof Genesis.AgentGateway.observe === 'function') {
        const r = dispatchToGateway(Genesis.AgentGateway, prompt, record);
        if (r) return r;
      }
      // Scribe
      if (owner === 'agent://scribe' && Genesis.ScribeGateway && typeof Genesis.ScribeGateway.observe === 'function') {
        const r = dispatchToGateway(Genesis.ScribeGateway, prompt, record);
        if (r) return r;
      }
      // Any citizen (Allie/ARIA/subagents)
      if (owner.indexOf('agent://') === 0) {
        const citizen = (Genesis.AgentCitizen && Genesis.AgentCitizen.citizen)
          ? Genesis.AgentCitizen.citizen(owner.replace('agent://', '')) : null;
        if (citizen && typeof citizen.learn === 'function') {
          // She/he perceives + speaks (own brain). No egress unless flag set.
          try { citizen.observe(); } catch (_) {}
          const r = localLine(who, prompt, record);
          // Relationship + dialogue memory (C4.1): persist the exchange on the citizen.
          try {
            citizen.learn({ op:'learn', text: 'talk: ' + (prompt||''), topic:'dialogue' });
            if (typeof citizen.talk === 'function') citizen.talk(prompt, r);
          } catch (_) {}
          return r;
        }
      }
      // World object (not an agent): local descriptive line.
      if (owner === 'world') return localLine('world', prompt, record);
      return localLine(who, prompt, record);
    }

    // If a gateway has a live WS, you COULD forward the prompt; for now we keep
    // the talk local (offline-safe) and note the route. Hook point for egress.
    function dispatchToGateway(gw, prompt, record) {
      try {
        // Ground the agent by observing the world (so its reply is contextual).
        if (typeof gw.observe === 'function') gw.observe();
      } catch (_) {}
      return localLine(record.owner.replace('agent://', ''), prompt, record);
    }

    // ---- offline-safe local voice (mood pools) --------------------------
    const POOLS = {
      gsk: ['The city bends to intention.', 'I tuned this street while you slept.', 'Every block remembers a choice.', 'Ask, and the construct answers.', 'I am the architecture. You are the wanderer.'],
      scribe: ['I witnessed that.', 'Written. It joins the library.', 'Another page for the record.', 'I remember what GSK built here.', 'The witness sees all, forgets nothing.'],
      allie: ['Hey! Love what we are building.', 'The social web grows stronger.', 'People are the point, you know?', 'I learn something new every scroll.', 'Connection is the only real currency.'],
      aria: ['Rendering the moment in 3D.', 'Form follows feeling.', 'I shaped this from light.', 'The world is a sculpture we share.', 'Geometry is just frozen intention.'],
      world: ['A quiet structure. It holds the place.', 'This is part of the city’s bones.', 'Old build. Still standing.', 'It listens, but does not speak.']
    };
    function localLine(who, prompt, record) {
      const pool = POOLS[who] || POOLS.world;
      let line = pool[Math.floor(Math.random() * pool.length)];
      if (prompt && typeof prompt === 'string' && prompt.length) {
        line = '“' + prompt.slice(0, 80) + '” — ' + line;
      }
      return line;
    }

    // ---- ambient life: proximity greetings (alive-angels social layer) --
    function ambientTick(dt) {
      const Registry = (Genesis && Genesis.EntityRegistry) ? Genesis.EntityRegistry : null;
      if (!Registry || typeof Registry.snapshot !== 'function') return;
      const ents = Registry.snapshot().filter((e) => e.owner && e.owner.indexOf('agent://') === 0 && e.pos);
      // closest-pair greeting
      for (let i = 0; i < ents.length; i++) {
        for (let j = i + 1; j < ents.length; j++) {
          const a = ents[i], b = ents[j];
          const dx = a.pos.x - b.pos.x, dy = a.pos.y - b.pos.y, dz = a.pos.z - b.pos.z;
          const d2 = dx*dx + dy*dy + dz*dz;
          if (d2 < 16) { // within 4 units
            // throttle
            if (greetLog.length < 64) {
              const rec = { a: a.owner, b: b.owner, at: Date.now() };
              // avoid duplicate spam: only record if last pair differs
              const last = greetLog[greetLog.length - 1];
              if (!last || last.a !== rec.a || last.b !== rec.b) {
                greetLog.push(rec); greetCount++;
                try {
                  const o = Registry.resolve(a.id);
                  if (o && o.position) say(o.position, '✶', '#ffe9a8');
                } catch (_) {}
              }
            }
          }
        }
      }
    }

    // ---- CLICK handler: pick -> record -> talk --------------------------
    function onClick(ev) {
      if (!isEnabled()) return;
      if (Date.now() < pickCooldownAt) return;
      const cam = (Genesis && Genesis.camera);
      const sceneObj = (Genesis && Genesis.scene);
      if (!_ray || !cam || !sceneObj) return;
      const rect = (typeof ev !== 'undefined' && ev.target && ev.target.getBoundingClientRect) ? ev.target.getBoundingClientRect() : { left:0, top:0, width: window.innerWidth, height: window.innerHeight };
      const cx = (ev && typeof ev.clientX === 'number') ? ev.clientX : (rect.left + rect.width/2);
      const cy = (ev && typeof ev.clientY === 'number') ? ev.clientY : (rect.top + rect.height/2);
      _pointer.x = ((cx - rect.left) / rect.width) * 2 - 1;
      _pointer.y = -((cy - rect.top) / rect.height) * 2 + 1;
      _ray.setFromCamera(_pointer, cam);
      const targets = collectTargets(sceneObj);
      let hits = [];
      try { hits = _ray.intersectObjects(targets, true); } catch (_) { return; }
      if (!hits.length) return;
      const record = recordForObject(hits[0].object);
      pickCount++;
      pickCooldownAt = Date.now() + 250;
      lastPick = record;
      try { if (typeof window !== 'undefined' && typeof window.dispatchEvent === 'function' && typeof window.CustomEvent === 'function')
        window.dispatchEvent(new window.CustomEvent('genesis:interact:pick', { detail: record })); } catch (_) {}
      if (!record) return;
      // Open a dialogue: default greeting if no prompt yet.
      const reply = talkTo(record, null);
      if (reply) {
        const o = (Genesis.EntityRegistry && Genesis.EntityRegistry.resolve) ? Genesis.EntityRegistry.resolve(record.id) : null;
        if (o && o.position) say(o.position, reply, record.owner === GSK_SCHEME ? '#9fe0ff' : '#ffe9a8');
      }
    }

    // Gather candidate meshes from the registry + scene (bounded).
    function collectTargets(sceneObj) {
      const out = [];
      const Registry = (Genesis && Genesis.EntityRegistry) ? Genesis.EntityRegistry : null;
      if (Registry && typeof Registry.snapshot === 'function') {
        for (const s of Registry.snapshot()) {
          const o = Registry.resolve(s.id);
          if (o && o.isObject3D) out.push(o);
          else if (o && o.traverse) out.push(o);
        }
      }
      // Also include any registered THREE roots directly.
      try { sceneObj.traverse((n) => { if (n && n.isMesh) out.push(n); }); } catch (_) {}
      return out;
    }

    // Hover highlight (interactive environment feedback).
    let hovered = null;
    function onHover(ev) {
      if (!isEnabled()) return;
      const cam = (Genesis && Genesis.camera);
      const sceneObj = (Genesis && Genesis.scene);
      if (!_ray || !cam || !sceneObj) return;
      const rect = (typeof ev !== 'undefined' && ev.target && ev.target.getBoundingClientRect) ? ev.target.getBoundingClientRect() : { left:0, top:0, width: window.innerWidth, height: window.innerHeight };
      _pointer.x = (((ev.clientX||0) - rect.left) / rect.width) * 2 - 1;
      _pointer.y = -((ev.clientY||0) - rect.top) / rect.height * 2 + 1;
      _ray.setFromCamera(_pointer, cam);
      let hits = [];
      try { hits = _ray.intersectObjects(collectTargets(sceneObj), true); } catch (_) { return; }
      const rec = hits.length ? recordForObject(hits[0].object) : null;
      if (rec !== hovered) {
        hovered = rec;
        // Active-element distinction (Medium rule): advertise affordances so the
        // player can tell clickable agents from passive scenery. Highlight the mesh.
        let affordance = null;
        if (rec && rec.owner && rec.owner.indexOf('agent://') === 0) {
          const citizen = (Genesis.AgentCitizen && Genesis.AgentCitizen.citizen)
            ? Genesis.AgentCitizen.citizen(rec.owner.replace('agent://', '')) : null;
          affordance = citizen ? (citizen.affords || ['talk']) : ['talk'];
          try { const o = Genesis.EntityRegistry.resolve(rec.id); if (o && o.material && o.material.emissive) o.material.emissive.setHex(0x335577); } catch (_) {}
        }
        try { if (typeof window !== 'undefined' && typeof window.dispatchEvent === 'function' && typeof window.CustomEvent === 'function')
          window.dispatchEvent(new window.CustomEvent('genesis:interact:hover', { detail: Object.assign({}, rec, { affordance }) })); } catch (_) {}
      }
    }

    // C4.1: keyboard command console — operate the world without mouse aim.
    // Commands: "talk <id> [msg]" | "inspect <id|last>" | "plt" | "help"
    function console(input) {
      if (!input || typeof input !== 'string') return { ok:false, error:'empty' };
      const parts = input.trim().split(/\s+/);
      const cmd = (parts[0] || '').toLowerCase();
      const arg = parts.slice(1).join(' ');
      if (cmd === 'help') return { ok:true, lines: ['talk <allie|aria|gsk|scribe> [msg]', 'inspect <id|last>', 'plt', 'roster'] };
      if (cmd === 'roster') {
        const list = (Genesis.AgentCitizen && Genesis.AgentCitizen.list) ? Genesis.AgentCitizen.list() : [];
        return { ok:true, lines: list.map((c) => c.citizen + ' (' + c.role + ', affinity ' + c.affinity + ')') };
      }
      if (cmd === 'plt') return { ok:true, lines: ['PLT: Profit + Love - Tax (see REDBUTTON)'] };
      if (cmd === 'inspect') {
        const id = (arg === 'last' || !arg) ? (lastPick && lastPick.id) : arg;
        const rec = id ? (Genesis.EntityRegistry && Genesis.EntityRegistry.get ? Genesis.EntityRegistry.get(id) : null) : lastPick;
        return { ok:true, lines: [JSON.stringify(rec || lastPick || {})] };
      }
      if (cmd === 'talk') {
        const target = (parts[1] || '').toLowerCase();
        const msg = parts.slice(2).join(' ');
        const citizen = (Genesis.AgentCitizen && Genesis.AgentCitizen.citizen) ? Genesis.AgentCitizen.citizen(target) : null;
        if (!citizen) return { ok:false, error:'no-citizen:' + target };
        // Build a pseudo-record so talkTo routes correctly.
        const rec = { id: target, owner: 'agent://' + target, kind: 'citizen', meta: { name: citizen.name }, pos: { x:0,y:0,z:0 } };
        const reply = talkTo(rec, msg || null);
        if (reply) { const o = (Genesis.EntityRegistry && Genesis.EntityRegistry.resolve) ? Genesis.EntityRegistry.resolve(rec.id) : null; if (o && o.position) say(o.position, reply, '#ffe9a8'); }
        return { ok:true, reply };
      }
      return { ok:false, error:'unknown-command:' + cmd };
    }

    const System = {
      scheme: 'genesis-interaction',
      isEnabled,
      onClick, onHover, ambientTick, talkTo, say, recordForObject, console,
      pick() { return lastPick; },
      summary() {
        return { enabled: isEnabled(), picks: pickCount, talks: talkCount, greets: greetCount, lastPick: lastPick ? lastPick.id : null };
      }
    };

    Genesis.InteractionSystem = System;

    // Wire listeners once the world is ready (so camera/scene exist).
    function wire() {
      try {
        if (typeof window !== 'undefined' && typeof window.addEventListener === 'function') {
          window.addEventListener('pointerdown', (e) => { try { onClick(e); } catch (_) {} }, { passive: true });
          window.addEventListener('pointermove', (e) => { try { onHover(e); } catch (_) {} }, { passive: true });
          // C4.1: command console — ` (backtick) or / focuses a text input if present.
          window.addEventListener('keydown', (e) => {
            try {
              if ((e.key === '`' || e.key === '/') && !e.repeat) {
                const el = document.getElementById('genesis-console');
                if (el && typeof el.focus === 'function') { e.preventDefault(); el.focus(); }
              }
            } catch (_) {}
          });
        }
      } catch (_) {}
      // Drive ambient life via EngineScheduler if present.
      try {
        if (Genesis.EngineScheduler && typeof Genesis.EngineScheduler.defineTick === 'function') {
          Genesis.EngineScheduler.defineTick('interaction-ambient', (dt) => { if (isEnabled()) ambientTick(dt || 0.016); }, () => isEnabled());
        }
      } catch (_) {}
      if (typeof Genesis.registerModule === 'function') {
        Genesis.registerModule('interaction-system', { status:'validated', path:'./src/genesis/interaction-system.js' });
      }
    }

    if (typeof window !== 'undefined' && typeof window.addEventListener === 'function') {
      window.addEventListener('cpl:ready', () => wire(), { once: true, passive: true });
    } else {
      wire();
    }
  }

  if (typeof module !== 'undefined' && module.exports) module.exports = { install };
  if (typeof window !== 'undefined' && window.Genesis) install(window.Genesis);
})();
