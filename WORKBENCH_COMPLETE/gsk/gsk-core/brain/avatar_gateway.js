'use strict';

/**
 * AvatarGateway — Agents & users enter CPL as avatars (Phase 24)
 *
 * Import protocol: avatar spec → CPL spawn → bind to agent/user session
 * Avatars have: appearance, inventory, skills, permissions, memory link
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

class AvatarGateway {
    constructor(kernel, options = {}) {
        this.kernel = kernel;
        this.cplHttpUrl = options.cplHttpUrl || 'http://localhost:3457';
        this.avatars = new Map(); // avatarId -> avatar state
        this.sessions = new Map(); // sessionId -> avatarId
    }

    /**
     * Import an avatar from specification
     * spec = { agentId, name, appearance, skills, permissions, memoryLink }
     */
    async importAvatar(spec) {
        const { agentId, name, appearance = {}, skills = [], permissions = [], memoryLink = true } = spec;

        const avatarId = `avatar_${agentId || crypto.randomBytes(8).toString('hex')}`;

        // Default appearance
        const fullAppearance = {
            model: 'humanoid',
            skinTone: '#ffdbc9',
            hairColor: '#3d2b1f',
            eyeColor: '#4a90d9',
            height: 1.8,
            build: 'average',
            ...appearance
        };

        // Spawn in CPL
        const response = await fetch(`${this.cplHttpUrl}/api/rts/order`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                type: 'spawn',
                unitType: 'avatar',
                position: appearance.position || { x: 0, z: 0 },
                playerId: 'gsk',
                metadata: {
                    avatarId,
                    agentId,
                    name,
                    appearance: fullAppearance,
                    skills,
                    permissions,
                    importedAt: Date.now()
                }
            })
        });

        if (!response.ok) {
            throw new Error(`Avatar spawn failed: ${response.status}`);
        }

        const result = await response.json();
        const entityId = result.entityId || result.id;

        // Create avatar state
        const avatar = {
            id: avatarId,
            entityId,
            agentId,
            name,
            appearance: fullAppearance,
            skills,
            permissions,
            memoryLink,
            inventory: {},
            position: appearance.position || { x: 0, z: 0 },
            status: 'active', // active, idle, disconnected
            createdAt: Date.now(),
            lastActive: Date.now()
        };

        this.avatars.set(avatarId, avatar);

        // Bind to agent session if provided
        if (agentId) {
            this.sessions.set(agentId, avatarId);
        }

        // Link to memory substrate
        if (memoryLink && this.kernel.memorySubstrate) {
            await this.kernel.memorySubstrate.store(
                `avatar:${avatarId}`,
                avatar,
                { tags: ['avatar', 'agent'], source: 'avatar_gateway' }
            );
        }

        console.log(`[AvatarGateway] Imported avatar: ${name} (${avatarId}) for agent ${agentId}`);
        return { avatarId, entityId, ...avatar };
    }

    /**
     * Get avatar by ID
     */
    getAvatar(avatarId) {
        return this.avatars.get(avatarId);
    }

    /**
     * Get avatar by agent ID
     */
    getAvatarByAgent(agentId) {
        const avatarId = this.sessions.get(agentId);
        return avatarId ? this.avatars.get(avatarId) : null;
    }

    /**
     * Update avatar position
     */
    async updatePosition(avatarId, position) {
        const avatar = this.avatars.get(avatarId);
        if (!avatar) throw new Error(`Avatar not found: ${avatarId}`);

        avatar.position = position;
        avatar.lastActive = Date.now();

        // Update in CPL
        await fetch(`${this.cplHttpUrl}/api/rts/order`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                type: 'move',
                entityId: avatar.entityId,
                target: { x: position.x, z: position.z }
            })
        });

        return avatar;
    }

    /**
     * Grant skill to avatar
     */
    async grantSkill(avatarId, skill) {
        const avatar = this.avatars.get(avatarId);
        if (!avatar) throw new Error(`Avatar not found: ${avatarId}`);

        if (!avatar.skills.includes(skill)) {
            avatar.skills.push(skill);
            console.log(`[AvatarGateway] Granted skill ${skill} to ${avatar.name}`);
        }

        return avatar;
    }

    /**
     * Revoke skill from avatar
     */
    async revokeSkill(avatarId, skill) {
        const avatar = this.avatars.get(avatarId);
        if (!avatar) throw new Error(`Avatar not found: ${avatarId}`);

        avatar.skills = avatar.skills.filter(s => s !== skill);
        return avatar;
    }

    /**
     * Set avatar permissions
     */
    async setPermissions(avatarId, permissions) {
        const avatar = this.avatars.get(avatarId);
        if (!avatar) throw new Error(`Avatar not found: ${avatarId}`);

        avatar.permissions = permissions;
        return avatar;
    }

    /**
     * Give item to avatar
     */
    async giveItem(avatarId, item) {
        const avatar = this.avatars.get(avatarId);
        if (!avatar) throw new Error(`Avatar not found: ${avatarId}`);

        const itemId = item.id || `item_${Date.now()}`;
        avatar.inventory[itemId] = { ...item, id: itemId, acquiredAt: Date.now() };

        return avatar;
    }

    /**
     * Remove item from avatar
     */
    async removeItem(avatarId, itemId) {
        const avatar = this.avatars.get(avatarId);
        if (!avatar) throw new Error(`Avatar not found: ${avatarId}`);

        delete avatar.inventory[itemId];
        return avatar;
    }

    /**
     * Disconnect avatar (agent session ended)
     */
    async disconnect(agentId) {
        const avatarId = this.sessions.get(agentId);
        if (!avatarId) return { success: false, reason: 'No avatar for agent' };

        const avatar = this.avatars.get(avatarId);
        if (avatar) {
            avatar.status = 'disconnected';
            avatar.lastActive = Date.now();
            this.sessions.delete(agentId);
            console.log(`[AvatarGateway] Disconnected avatar ${avatar.name} for agent ${agentId}`);
        }

        return { success: true, avatarId };
    }

    /**
     * Reconnect avatar (agent session resumed)
     */
    async reconnect(agentId, avatarId) {
        const avatar = this.avatars.get(avatarId);
        if (!avatar) return { success: false, reason: 'Avatar not found' };

        avatar.status = 'active';
        avatar.lastActive = Date.now();
        this.sessions.set(agentId, avatarId);

        return { success: true, avatar };
    }

    /**
     * List all avatars
     */
    listAvatars() {
        return Array.from(this.avatars.values());
    }

    /**
     * Get gateway stats
     */
    getStats() {
        const avatars = Array.from(this.avatars.values());
        return {
            total: avatars.length,
            active: avatars.filter(a => a.status === 'active').length,
            disconnected: avatars.filter(a => a.status === 'disconnected').length,
            byAgent: avatars.filter(a => a.agentId).length
        };
    }
}

module.exports = { AvatarGateway };