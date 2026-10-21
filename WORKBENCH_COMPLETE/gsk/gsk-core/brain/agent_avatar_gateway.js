'use strict';

/**
 * AGENT AVATAR GATEWAY — Import External Agents & Users into CPL with 3D Avatars
 * 
 * Assigns living 3D citizen avatars in CPL (Grand Tower Plaza) whenever external agents
 * (Claude, Qwen, Moloch agents) or human visitors enter the ecosystem.
 */

class AgentAvatarGateway {
    constructor(kernel) {
        this.kernel = kernel;
        this.registeredAvatars = new Map();
    }

    importAgentAvatar(agentId, name, archetype = 'soul', color = '0x00ffff', pos = { x: -104, y: 0, z: 401 }) {
        const avatarRecord = {
            agentId: `agent://${agentId}`,
            name,
            archetype,
            color,
            pos,
            importedAt: Date.now()
        };

        this.registeredAvatars.set(agentId, avatarRecord);

        // Transmit spawn command to CPL 3D world via ThoughtStream!
        if (this.kernel?.fusion?.thoughtStream) {
            this.kernel.fusion.thoughtStream.sendGodCommand('SPAWN_AGENT_AVATAR', avatarRecord);
        }

        console.log(`[AgentAvatarGateway] Assigned 3D Avatar in CPL for ${name} (${agentId})`);
        return avatarRecord;
    }

    getAvatar(agentId) {
        return this.registeredAvatars.get(agentId) || null;
    }

    listAvatars() {
        return Array.from(this.registeredAvatars.values());
    }
}

module.exports = { AgentAvatarGateway };
