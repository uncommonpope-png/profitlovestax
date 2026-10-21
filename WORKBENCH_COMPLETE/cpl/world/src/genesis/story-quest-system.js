/**
 * story-quest-system.js
 * BUYASOUL CPL / GODFORGE — Deep Story Quests & NPC Dialogue Tree Engine
 * 
 * Provides:
 *   1. Cyberpunk Glassmorphism Typewriter Dialogue Modal UI.
 *   2. Branching NPC Dialogue Trees with choice responses.
 *   3. Multi-Stage Story Quests & Event Objectives.
 *   4. Faction Reputation System (Imperium Red vs Void Covenant Blue).
 */

(function() {
  'use strict';

  // ─── FACTION REPUTATION STATE ───────────────────────────────────────

  const REPUTATION = {
    imperium: 50, // 0 to 100
    voidCovenant: 50
  };

  const ACTIVE_QUESTS = [];
  const COMPLETED_QUESTS = new Set();

  // ─── QUEST DEFINITIONS ──────────────────────────────────────────────

  const QUEST_DATABASE = {
    'q_first_catalyst': {
      id: 'q_first_catalyst',
      title: 'The First Catalyst',
      npc: 'Commander Valerius',
      faction: 'imperium',
      description: 'Protect our CPU Harvesters at Shattered Front as they extract raw PLT energy.',
      objective: 'Mine 200 PLT Energy',
      requiredAmount: 200,
      currentAmount: 0,
      reward: { profit: 300, repImperium: 15 }
    },
    'q_tear_veil': {
      id: 'q_tear_veil',
      title: 'Tear in the Veil',
      npc: 'Archon Vex',
      faction: 'voidCovenant',
      description: 'Assault the Imperium Red fortification at Vortex Siege and eliminate enemy mechs.',
      objective: 'Destroy 3 Enemy Squad Units',
      requiredAmount: 3,
      currentAmount: 0,
      reward: { love: 150, repVoid: 20 }
    }
  };

  // ─── DIALOGUE OVERLAY UI RENDERER ───────────────────────────────────

  let dialogueModal = null;
  let textContainer = null;
  let choicesContainer = null;
  let npcNameEl = null;

  function createDialogueModalUI() {
    dialogueModal = document.createElement('div');
    dialogueModal.id = 'godforge-dialogue-modal';
    Object.assign(dialogueModal.style, {
      position: 'fixed',
      bottom: '30px',
      left: '50%',
      transform: 'translateX(-50%)',
      width: '680px',
      maxWidth: '90vw',
      background: 'rgba(6, 10, 20, 0.92)',
      border: '1px solid #00ffcc',
      boxShadow: '0 8px 32px rgba(0, 255, 204, 0.25)',
      borderRadius: '12px',
      padding: '24px',
      color: '#ffffff',
      fontFamily: "'Outfit', sans-serif",
      zIndex: '10000',
      display: 'none',
      backdropFilter: 'blur(16px)',
      webkitBackdropFilter: 'blur(16px)'
    });

    dialogueModal.innerHTML = `
      <div style="display: flex; align-items: center; margin-bottom: 12px;">
        <div id="gf-npc-avatar" style="width: 44px; height: 44px; border-radius: 50%; background: #00ffcc; margin-right: 14px; display: flex; align-items: center; justify-content: center; font-weight: bold; color: #000;">NPC</div>
        <div>
          <h3 id="gf-npc-name" style="margin: 0; color: #00ffcc; font-size: 18px; letter-spacing: 1px;">NPC NAME</h3>
          <span style="font-size: 11px; color: #88aacc; text-transform: uppercase;">SOVEREIGN DIALOGUE SYSTEM</span>
        </div>
      </div>
      <div id="gf-dialogue-text" style="font-size: 14px; line-height: 1.6; color: #e0eeff; min-height: 50px; margin-bottom: 18px;">...</div>
      <div id="gf-dialogue-choices" style="display: flex; flex-direction: column; gap: 8px;"></div>
    `;

    document.body.appendChild(dialogueModal);

    textContainer = dialogueModal.querySelector('#gf-dialogue-text');
    choicesContainer = dialogueModal.querySelector('#gf-dialogue-choices');
    npcNameEl = dialogueModal.querySelector('#gf-npc-name');
  }

  function openDialogue(npcName, text, choices) {
    if (!dialogueModal) createDialogueModalUI();

    npcNameEl.innerText = npcName;
    textContainer.innerText = '';
    choicesContainer.innerHTML = '';
    dialogueModal.style.display = 'block';

    // Typewriter effect
    let idx = 0;
    const interval = setInterval(() => {
      if (idx < text.length) {
        textContainer.innerText += text[idx];
        idx++;
      } else {
        clearInterval(interval);
        renderChoices(choices);
      }
    }, 20);
  }

  function renderChoices(choices) {
    choicesContainer.innerHTML = '';
    choices.forEach((choice, i) => {
      const btn = document.createElement('button');
      btn.innerText = `[${i + 1}] ${choice.label}`;
      Object.assign(btn.style, {
        background: 'rgba(0, 255, 204, 0.12)',
        border: '1px solid rgba(0, 255, 204, 0.4)',
        color: '#00ffcc',
        padding: '10px 16px',
        borderRadius: '6px',
        textAlign: 'left',
        cursor: 'pointer',
        fontSize: '13px',
        fontWeight: '600',
        transition: 'all 0.2s ease'
      });

      btn.onmouseenter = () => { btn.style.background = 'rgba(0, 255, 204, 0.25)'; btn.style.borderColor = '#00ffcc'; };
      btn.onmouseleave = () => { btn.style.background = 'rgba(0, 255, 204, 0.12)'; btn.style.borderColor = 'rgba(0, 255, 204, 0.4)'; };
      btn.onclick = () => { choice.action(); };

      choicesContainer.appendChild(btn);
    });
  }

  function closeDialogue() {
    if (dialogueModal) dialogueModal.style.display = 'none';
  }

  // ─── SAMPLE NPC CONVERSATIONS ───────────────────────────────────────

  function speakToCommanderValerius() {
    openDialogue(
      'Commander Valerius [Imperium Red]',
      'Greetings, Sovereign. The battle for the void realms escalates by the hour. We need your tactical intervention.',
      [
        {
          label: 'Accept Quest: "The First Catalyst" (Protect Harvesters)',
          action: () => {
            acceptQuest('q_first_catalyst');
            closeDialogue();
          }
        },
        {
          label: 'Inquire about Faction Reputation',
          action: () => {
            openDialogue(
              'Commander Valerius',
              `Your current Imperium Red Standing is [${REPUTATION.imperium}/100]. Higher standing unlocks Dreadnought blueprints in the Marketplace.`,
              [{ label: 'Close', action: closeDialogue }]
            );
          }
        },
        { label: 'Leave Conversation', action: closeDialogue }
      ]
    );
  }

  function acceptQuest(questId) {
    const q = QUEST_DATABASE[questId];
    if (q && !ACTIVE_QUESTS.includes(q)) {
      ACTIVE_QUESTS.push(q);
      console.log('[StoryQuestSystem] Quest Accepted:', q.title);
    }
  }

  // ─── INITIALIZER ─────────────────────────────────────────────────────

  function install() {
    createDialogueModalUI();

    // Attach shortcut to open Valerius dialogue via window hook
    window.talkToValerius = speakToCommanderValerius;

    console.log('[StoryQuestSystem] Story Quest & NPC Dialogue Engine active.');
  }

  window.StoryQuestSystem = {
    install,
    openDialogue,
    closeDialogue,
    speakToCommanderValerius,
    REPUTATION,
    ACTIVE_QUESTS
  };
})();
