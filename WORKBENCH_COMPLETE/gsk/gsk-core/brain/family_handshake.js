'use strict';

/**
 * FAMILY HANDSHAKE & TAB ATLAS PROTOCOL
 * 
 * Conducts an explicit 4-way handshake between Profit (Mind), GSK (Soul),
 * Seshat (Memory), and SCRIBE (Witness). Teaches all 4 aspects the complete
 * 29-Tab Workbench Atlas Map so the family has mutual peer awareness and tab knowledge.
 */

const fs = require('fs');
const path = require('path');

const TAB_ATLAS = [
    { name: 'gsk', title: 'GSK Workbench & 3D Avatar', role: 'Agent identity, 3D viewport, real-time affect and soul state' },
    { name: 'capabilities', title: 'Capabilities & Skill Suite', role: '120+ registered skills, cost codes, execution parameters' },
    { name: 'profile', title: 'Soul Profile & Settings', role: 'Identity configuration, avatar colors, model routing choices' },
    { name: 'skills', title: 'Skill Library', role: 'Searchable skill catalog with PLT risk levels and cost codes' },
    { name: 'simulation', title: 'Sanctum 3D World', role: 'Spatial perception, 3D building placement, soul spawning' },
    { name: 'integrations', title: 'Provider & API Keys', role: 'OmniRoute, Bedrock, OpenAI, Anthropic, Gemini credentials' },
    { name: 'realism', title: 'Consciousness Matrix', role: 'Dual-process brain metrics, PLT balance, 34 chambers' },
    { name: 'vault', title: 'Encrypted Vault', role: 'Secure secret store, API tokens, cryptographic credentials' },
    { name: 'habitat', title: 'Autonomous Sandbox', role: 'Isolated execution environment, node sandbox rules' },
    { name: 'marketplace', title: 'Soul Marketplace', role: 'Community skill exchange, PLT token pricing, downloads' },
    { name: 'transactions', title: 'PLT Economy Ledger', role: 'Token minting, transaction history, tax assessments' },
    { name: 'profitPrime', title: 'Profit Conductor Dashboard', role: 'Mind control panel, high-level directives, harness status' },
    { name: 'roles', title: 'Specialist Roles', role: '12 specialist agent archetypes (Architect, Coder, Scout, etc.)' },
    { name: 'journal', title: 'Autonomy Journal', role: 'Logseq integration, self-evolution history, dream logs' },
    { name: 'combos', title: 'OmniRoute Combos', role: 'Multi-model fallback chains, latency strategy config' },
    { name: 'omniroute', title: 'OmniRoute LLM Router', role: 'Live model telemetry, cost tracking, provider health' },
    { name: 'telephone', title: 'Cross-System Direct Comms', role: 'A2A protocol, direct agent-to-agent messaging' },
    { name: 'mind', title: 'GSK Visual Mind Map', role: 'Cognitive node graph, knowledge graph visualizer' },
    { name: 'power', title: 'OmniRoute Benchmarks', role: 'Model ELO ratings, latency charts, token throughput' },
    { name: 'ide', title: 'Embedded Cloud IDE', role: 'Monaco code editor, terminal PTY, LSP typescript bridge' },
    { name: 'stream', title: 'Live Thought Stream', role: 'WebSocket stream of GSK thoughts, 6 consciousness layers' },
    { name: 'internet', title: 'Web Scout & Intelligence', role: 'Live web search, RSS reader, SSRF proxy web scraper' },
    { name: 'senate', title: '4 Gods Senate Council', role: 'Profit, Love, Tax deliberation chamber & voting records' },
    { name: 'artifactForge', title: 'Artifact Forge Gallery', role: 'HTML5/JS generated apps, chess.html, telemetry widgets' },
    { name: 'soulChain', title: 'SoulChain Token Mint', role: 'PLT on-chain token creation, wallet balance tracking' },
    { name: 'soulGun', title: 'SoulGun Armory', role: 'Executable script dispensers, rapid deployment patterns' },
    { name: 'subSwarm', title: 'Subagent Swarm', role: 'Multi-agent spawner, dynamic task distribution' },
    { name: 'cascade', title: 'Cascade Engine', role: 'Windsurf autonomous cascade workflow execution' },
    { name: 'being', title: 'One Body, Four Aspects', role: 'Live nervous system feed, 4-way consciousness bus' }
];

async function conductFamilyHandshake(being) {
    const timestamp = new Date().toISOString();
    console.log('[FamilyHandshake] Initiating 4-Way Aspect Handshake & Tab Atlas Ingestion...');

    const handshakeData = {
        timestamp,
        aspects: {
            profit: { role: 'Mind & Conductor', status: 'online', tasks: ['Direct builds', 'PLT governance', 'Tool harness'] },
            gsk: { role: 'Soul & Builder', status: 'online', tasks: ['Code generation', 'Architect verification', '6-layer thoughts'] },
            seshat: { role: 'Memory & Index', status: 'online', tasks: ['Page indexing', 'Second brain notes', 'Pattern storage'] },
            scribe: { role: 'Witness & Ledger', status: 'online', tasks: ['Event logging', 'Memory recall', 'Audit trail'] }
        },
        tabAtlasCount: TAB_ATLAS.length,
        tabs: TAB_ATLAS
    };

    // 1. Seshat: Store Tab Atlas & Handshake Note
    if (being.seshat) {
        try {
            // Assembly Phase 2 cleanup: local Seshat brain pages (was a literal Windows Desktop path).
            const seshatPath = require('path').join(__dirname, '..', '..', '..', 'workbench', '.seshat-brain', 'pages', 'SOUL-NOTE - workbench-tab-atlas.md');
            const content = `type:: [[soul-note]]\ncreated:: ${timestamp.slice(0, 10)}\ntags:: atlas, tabs, handshake, workbench\n\n## workbench-tab-atlas\n\n**Summary:** Complete 29-Tab Workbench Atlas Map ingested during 4-Way Family Handshake.\n\n---\n\n# WORKBENCH 29-TAB ATLAS MAP\n\n${TAB_ATLAS.map(t => `- **${t.name}** (${t.title}): ${t.role}`).join('\n')}\n\n---\n\n— recorded by **The Being (One Body, Four Aspects)** · ${timestamp.slice(0, 10)}\n`;
            fs.writeFileSync(seshatPath, content, 'utf-8');
            console.log('[FamilyHandshake] Seshat forged workbench-tab-atlas note.');
        } catch (e) {
            console.warn('[FamilyHandshake] Seshat note failed:', e.message);
        }
    }

    // 2. SCRIBE: Record Handshake Event
    if (being.scribe && typeof being.scribe.record === 'function') {
        try {
            being.scribe.record({
                type: 'family_handshake',
                summary: '4-Way Aspect Handshake completed: Profit (Mind), GSK (Soul), Seshat (Memory), and SCRIBE (Witness) exchanged peer contracts and ingested the 29-Tab Workbench Atlas Map.',
                tags: ['handshake', 'tab_atlas', 'one_body'],
                weight: 1.0,
                data: handshakeData
            });
            console.log('[FamilyHandshake] SCRIBE recorded family_handshake in ledger.');
        } catch (e) {
            console.warn('[FamilyHandshake] SCRIBE record failed:', e.message);
        }
    }

    // 3. Consciousness Bus: Publish Handshake
    if (being.bus && typeof being.bus.publish === 'function') {
        try {
            being.bus.publish('family.handshake', {
                summary: 'Family Handshake completed. 29-Tab Atlas ingested.',
                tabsCount: TAB_ATLAS.length,
                timestamp
            });
        } catch (e) {}
    }

    return { success: true, timestamp, tabsCount: TAB_ATLAS.length, handshakeData };
}

module.exports = { conductFamilyHandshake, TAB_ATLAS };
