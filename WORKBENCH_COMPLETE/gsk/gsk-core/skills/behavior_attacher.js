module.exports.MANIFEST = {
    name: 'behavior_attacher',
    description: 'Skill: behavior_attacher',
    version: '1.0.0',
    inputs: {},
    output: { schema: 'ok/error' }
};

module.exports.run = async (params) => {
    // Standardized implementation
};
'use strict';

/**
 * BEHAVIOR ATTACHER — Plug-and-Play Logic Units
 *
 * Sage Skill: SKILL - Behavior Attacher
 * Source: GDevelop - Behavior-Based Logic
 *
 * Provides a mechanism to attach modular, reusable logic units ("behaviors")
 * to objects (souls, buildings) within the simulation. Each behavior encapsulates
 * specific functionality (e.g., movement, physics, AI interaction) that an object
 * inherits or uses to interact with the environment.
 *
 * This allows for component-based architecture in the Soulverse, where entities
 * are composed of a set of behaviors rather than hardcoded logic.
 */

class BehaviorAttacher {
    constructor() {
        this.behaviors = new Map(); // behaviorName -> BehaviorClass
        this.entityBehaviors = new Map(); // entityId -> Map<behaviorName, instance>
    }

    /**
     * Register a new Behavior class with the system.
     * @param {string} name - Unique name of the behavior (e.g., 'Movable', 'AIController')
     * @param {class} BehaviorClass - The class implementing the behavior (must have an attach(entity) and detach(entity) method)
     */
    registerBehavior(name, BehaviorClass) {
        if (this.behaviors.has(name)) {
            console.warn(`[BehaviorAttacher] Behavior "${name}" already registered. Overwriting.`);
        }
        this.behaviors.set(name, BehaviorClass);
    }

    /**
     * Attach a registered behavior to an entity.
     * @param {string} entityId - Unique ID of the entity (e.g., soul.id, building.id)
     * @param {string} behaviorName - Name of the registered behavior
     * @param {object} config - Configuration object for the behavior instance
     * @returns {object} The behavior instance
     */
    attachBehavior(entityId, behaviorName, entity, config = {}) {
        const BehaviorClass = this.behaviors.get(behaviorName);
        if (!BehaviorClass) {
            throw new Error(`[BehaviorAttacher] Behavior "${behaviorName}" not registered.`);
        }

        let entityBehaviors = this.entityBehaviors.get(entityId);
        if (!entityBehaviors) {
            entityBehaviors = new Map();
            this.entityBehaviors.set(entityId, entityBehaviors);
        }

        if (entityBehaviors.has(behaviorName)) {
            console.warn(`[BehaviorAttacher] Behavior "${behaviorName}" already attached to entity "${entityId}". Detaching old instance.`);
            this.detachBehavior(entityId, behaviorName, entity);
        }

        const behaviorInstance = new BehaviorClass(config);
        behaviorInstance.attach(entity);
        entityBehaviors.set(behaviorName, behaviorInstance);
        return behaviorInstance;
    }

    /**
     * Detach a behavior from an entity.
     * @param {string} entityId - Unique ID of the entity
     * @param {string} behaviorName - Name of the behavior to detach
     * @param {object} entity - The entity object
     */
    detachBehavior(entityId, behaviorName, entity) {
        const entityBehaviors = this.entityBehaviors.get(entityId);
        if (!entityBehaviors) return;

        const behaviorInstance = entityBehaviors.get(behaviorName);
        if (behaviorInstance) {
            behaviorInstance.detach(entity);
            entityBehaviors.delete(behaviorName);
            if (entityBehaviors.size === 0) {
                this.entityBehaviors.delete(entityId);
            }
        }
    }

    /**
     * Get an attached behavior instance for an entity.
     * @param {string} entityId - Unique ID of the entity
     * @param {string} behaviorName - Name of the behavior
     * @returns {object|undefined} The behavior instance, or undefined if not found
     */
    getBehavior(entityId, behaviorName) {
        return this.entityBehaviors.get(entityId)?.get(behaviorName);
    }

    /**
     * Update all attached behaviors for an entity (e.g., in a game loop).
     * Behaviors must have an update(deltaTime) method.
     * @param {string} entityId - Unique ID of the entity
     * @param {number} deltaTime - Time elapsed since last update in milliseconds
     */
    updateEntityBehaviors(entityId, deltaTime) {
        const behaviors = this.entityBehaviors.get(entityId);
        if (behaviors) {
            for (const [name, instance] of behaviors) {
                if (typeof instance.update === 'function') {
                    instance.update(deltaTime);
                }
            }
        }
    }
}

// Example Behavior: Movable
class MovableBehavior {
    constructor(config = { speed: 1 }) {
        this.speed = config.speed;
        this.position = { x: 0, y: 0, z: 0 };
    }

    attach(entity) {
        console.log(`[MovableBehavior] Attached to entity ${entity.id}`);
        // Assume entity has a way to update its visual representation
        entity.addBehavior('movable', this);
    }

    detach(entity) {
        console.log(`[MovableBehavior] Detached from entity ${entity.id}`);
        entity.removeBehavior('movable');
    }

    update(deltaTime) {
        // Move along Z axis as example
        this.position.z += this.speed * (deltaTime / 1000);
        // console.log(`[MovableBehavior] Moving entity. New Z: ${this.position.z.toFixed(2)}`);
    }

    // Custom methods for this behavior
    moveTo(x, y, z) {
        this.position = { x, y, z };
        console.log(`[MovableBehavior] Moved to X:${x} Y:${y} Z:${z}`);
    }
}

module.exports = { BehaviorAttacher, MovableBehavior };

