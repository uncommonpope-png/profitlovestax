// trust-dialogue.js — P-C Trust-Gated Dialogue (band-driven NPC responses)
// ===========================================================================
// Genie Engine graft: "villager dialogue reacts to reputation." NPCs speak
// differently based on their Trust Ledger band (HOSTILE / NEUTRAL / FRIEND)
// and their PersonalityDrift tone. A befriended citizen is warm and helpful;
// a neutral one is cautious; a hostile one is cold or silent.
//
// DESIGN: pure response-pool module. It does NOT emit events directly —
// behaviors (P-D) call getDialogue() when building their intent. The
// dialogue is gated by the trust band at call time, so it reacts in
// real-time as trust changes.
//
// Flag __GENESIS_TRUST_DIALOGUE (default ON, but requires TrustLedger to
// be enabled). Law: flags default ON.
// ===========================================================================
(function () {
  function install(Genesis) {
    if (!Genesis) return;
    if (Genesis.TrustDialogue) return; // idempotent

    var FLAG = '__GENESIS_TRUST_DIALOGUE';

    function flagOn() {
      return (typeof window === 'undefined') || window[FLAG] !== false;
    }

    // ── Response pools ──────────────────────────────────────────────────
    // Each band has multiple pools: greeting, idle, farewell, trade, help.
    // Each pool entry can be a string or a function(band, tone, context)
    // that returns a string (for dynamic responses).

    var POOLS = {
      // ── FRIEND band: warm, forthcoming, helpful ──
      FRIEND: {
        greeting: [
          'Good to see you, friend!',
          'Welcome back! I was hoping you would visit.',
          'Ah, my friend returns. The city feels brighter.',
          'There you are! I have news for you.',
          'You honor us with your presence.'
        ],
        idle: [
          'I have been gathering supplies for the city.',
          'The market is thriving today.',
          'Have you seen the new buildings going up?',
          'I enjoy the quiet moments between trade.',
          'Every day the city grows stronger.'
        ],
        farewell: [
          'Until next time, friend.',
          'Take care. The city will be here when you return.',
          'Safe travels. May the PLT be in your favor.',
          'Return soon — there is always work to be done.',
          'I will keep things running while you are away.'
        ],
        trade: [
          'Always happy to trade with a friend.',
          'I have fine goods today. Take a look.',
          'For you, a fair price. Always.',
          'Your business here is always welcome.',
          'I saved something special, knowing you would come.'
        ],
        help: [
          'How can I help you today?',
          'Ask me anything. I am here for you.',
          'If you need resources, I know where to find them.',
          'I can guide you through the city.',
          'Your wish is my command — almost.'
        ],
        curious: [
          'I wonder what lies beyond the city walls.',
          'Have you explored the outer districts lately?',
          'What do you think the stars are made of?',
          'I have been thinking about the old stories...',
          'Tell me about the world beyond.'
        ]
      },

      // ── NEUTRAL band: cautious, measured, polite ──
      NEUTRAL: {
        greeting: [
          'Greetings.',
          'Hello.',
          'What brings you here?',
          'I see you.',
          'Good day.'
        ],
        idle: [
          'Keeping busy.',
          'The city hums along.',
          'Another day, another task.',
          'Nothing unusual to report.',
          'Business is steady.'
        ],
        farewell: [
          'Goodbye.',
          'Stay safe out there.',
          'Until we meet again.',
          'Take care.',
          'Farewell.'
        ],
        trade: [
          'Looking to trade?',
          'I have goods. You have coin?',
          'Fair exchange builds the city.',
          'Take a look at my wares.',
          'Everything has a price.'
        ],
        help: [
          'What do you need?',
          'I can help, within reason.',
          'State your business.',
          'I am listening.',
          'Tell me what you need and I will see what I can do.'
        ]
      },

      // ── HOSTILE band: cold, curt, threatening ──
      HOSTILE: {
        greeting: [
          '...',
          'You are not welcome here.',
          'Stay back.',
          'I have nothing to say to you.',
          '*cold silence*'
        ],
        idle: [
          null, // silence
          null,
          'Do not act like we are friends.',
          'I remember what you did.',
          'You have a lot of nerve showing up here.'
        ],
        farewell: [
          'Good riddance.',
          'Do not come back.',
          'Leave before I make you leave.',
          'We are done here.',
          '*walks away*'
        ],
        trade: [
          'I would not trade with you if you were the last soul.',
          'Keep your coin. I do not want it.',
          'Nothing for you here.',
          'Trade? After everything? No.',
          'Get out of my sight.'
        ],
        help: [
          'Help you? You must be joking.',
          'I would sooner help a stone.',
          'The only thing I will help you with is leaving.',
          'Do not waste my time.',
          'You chose this. Live with it.'
        ],
        threaten: [
          'Take one more step and see what happens.',
          'I am warning you.',
          'You do not want to test me.',
          'This is your last chance.',
          'You have been warned.'
        ]
      }
    };

    // ── Personality tone adjustments ─────────────────────────────────────
    // If PersonalityDrift is installed, we check the citizen's tone and
    // prefer responses from a matching pool. Otherwise use default pools.

    function pick(list) {
      if (!list || !list.length) return null;
      return list[Math.floor(Math.random() * list.length)];
    }

    function getTone(citizenId) {
      if (Genesis.PersonalityDrift && typeof Genesis.PersonalityDrift.tone === 'function') {
        try { return Genesis.PersonalityDrift.tone(citizenId); } catch (e) { /* ignore */ }
      }
      return 'steady';
    }

    // ── Main dialogue getter ────────────────────────────────────────────
    // Returns a response string appropriate for the citizen's trust band
    // and personality tone. context = 'greeting' | 'idle' | 'farewell' |
    // 'trade' | 'help' | 'curious' | 'threaten'

    function getDialogue(citizenId, context, overrides) {
      if (!flagOn()) return null;
      if (!citizenId) return null;
      context = context || 'greeting';

      var TL = Genesis.TrustLedger;
      if (!TL || typeof TL.getBand !== 'function') return null;

      var band = overrides && overrides.band ? overrides.band : TL.getBand(citizenId, 'player');
      var pools = POOLS[band] || POOLS.NEUTRAL;
      var tone = overrides && overrides.tone ? overrides.tone : getTone(citizenId);

      // Try tone-specific pool first (e.g., FRIEND.curious for curious tone)
      var text = null;
      if (tone === 'curious' && pools.curious && context !== 'threaten') {
        text = pick(pools.curious);
      }
      // Fall back to context pool
      if (!text) {
        text = pick(pools[context] || pools.greeting);
      }
      // HOSTILE sometimes stays silent (50% chance for greeting/idle)
      if (band === 'HOSTILE' && (context === 'greeting' || context === 'idle') && text !== null && Math.random() < 0.45) {
        return null; // silent treatment
      }
      return text;
    }

    // ── Direct helper for behavior authors ──────────────────────────────
    // Returns { say: "..." } or null (silent) — fits directly into intent.
    function say(citizenId, context, overrides) {
      var text = getDialogue(citizenId, context, overrides);
      return text ? { say: text } : null;
    }

    // ── EventBridge hooks ───────────────────────────────────────────────
    // Listen for band transitions and emit a contextual dialogue event
    // so the world can react (e.g., a betrayed citizen shouts).

    function onTrustChange(ev) {
      if (!ev || !ev.agentId) return;
      // If band changed to HOSTILE, emit a betrayal line
      if (ev.toBand === 'HOSTILE' && ev.fromBand !== 'HOSTILE') {
        var text = pick(POOLS.HOSTILE.threaten);
        if (text && Genesis.EventBridge && Genesis.EventBridge.emit) {
          Genesis.EventBridge.emit('agent:say', {
            id: ev.agentId,
            name: ev.agentId,
            text: text,
            band: 'HOSTILE',
            context: 'betrayal'
          });
        }
      }
      // If band changed to FRIEND, emit a welcome line
      if (ev.toBand === 'FRIEND' && ev.fromBand !== 'FRIEND') {
        var text = pick(POOLS.FRIEND.greeting);
        if (text && Genesis.EventBridge && Genesis.EventBridge.emit) {
          Genesis.EventBridge.emit('agent:say', {
            id: ev.agentId,
            name: ev.agentId,
            text: text,
            band: 'FRIEND',
            context: 'befriended'
          });
        }
      }
    }

    // Wire EventBridge listener
    if (Genesis.EventBridge && typeof Genesis.EventBridge.on === 'function') {
      try { Genesis.EventBridge.on('trust:change', function (ev) { onTrustChange(ev && ev.payload ? ev.payload : ev); }); } catch (_) {}
    }
    // Also listen on window event
    if (typeof window !== 'undefined') {
      try {
        window.addEventListener('genesis:trust:delta', function (ev) {
          if (ev && ev.detail) onTrustChange(ev.detail);
        });
      } catch (_) {}
    }

    var TrustDialogue = {
      flag: FLAG,
      isEnabled: function () { return flagOn(); },
      getDialogue: getDialogue,
      say: say,
      getTone: getTone,
      POOLS: POOLS,
      summary: function () {
        var total = 0;
        for (var b in POOLS) if (POOLS.hasOwnProperty(b)) for (var c in POOLS[b]) if (POOLS[b].hasOwnProperty(c)) total += POOLS[b][c].length;
        return { enabled: flagOn(), bands: Object.keys(POOLS).length, totalResponses: total };
      }
    };

    Genesis.TrustDialogue = TrustDialogue;

    if (typeof Genesis.registerModule === 'function') {
      Genesis.registerModule('trust-dialogue', { status: 'validated', path: './src/genesis/trust-dialogue.js', gun: 'DIALOGUE' });
    }
    if (Genesis.EventBridge && typeof Genesis.EventBridge.emit === 'function') {
      Genesis.EventBridge.emit('trust-dialogue:ready', { at: Date.now() });
    }
  }

  if (typeof module !== 'undefined' && module.exports) module.exports = { install };
  if (typeof window !== 'undefined' && window.Genesis) install(window.Genesis);
})();
