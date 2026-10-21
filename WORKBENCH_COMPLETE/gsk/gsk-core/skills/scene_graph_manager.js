module.exports.MANIFEST = {
    name: 'scene_graph_manager',
    description: 'Skill: scene_graph_manager',
    version: '1.0.0',
    inputs: {},
    output: { schema: 'ok/error' }
};

module.exports.run = async (params) => {
    // Standardized implementation
};
'use strict';

/**
 * SCENE GRAPH MANAGER — Hierarchical Tree Structure for 3D Objects
 *
 * Sage Skill: SKILL - Three.js Scene Graph Manager
 * Source: Three.js Fundamentals
 *
 * Manages a hierarchical tree structure of 3D objects (souls, buildings, assets)
 * within the Soulverse. It allows for the creation, deletion, and manipulation
 * of objects, including their relative positioning and orientation within a scene.
 *
 * This is the core functionality that sanctum_client.js requires to manage the
 * Soulverse world state. It provides a formal, object-oriented way to track
 * souls, buildings, and other assets as hierarchical nodes.
 */

class SceneGraphManager {
    constructor() {
        this.nodes = new Map(); // id -> node { id, type, parentId, childrenIds, properties }
        this.rootNode = { id: 'world_root', type: 'Root', parentId: null, childrenIds: [], properties: {} };
        this.nodes.set(this.rootNode.id, this.rootNode);
    }

    /**
     * Add a node to the scene graph.
     * @param {string} id - Unique ID for the node.
     * @param {string} type - Type of the node (e.g., 'soul', 'building', 'asset').
     * @param {string} parentId - ID of the parent node. Defaults to 'world_root'.
     * @param {object} properties - Custom properties for the node (e.g., position, rotation).
     * @returns {object} The created node.
     */
    addNode(id, type, parentId = 'world_root', properties = {}) {
        if (this.nodes.has(id)) {
            throw new Error(`[SceneGraphManager] Node with ID "${id}" already exists.`);
        }
        if (!this.nodes.has(parentId)) {
            throw new Error(`[SceneGraphManager] Parent node with ID "${parentId}" not found.`);
        }

        const newNode = { id, type, parentId, childrenIds: [], properties: { ...properties } };
        this.nodes.set(id, newNode);
        this.nodes.get(parentId).childrenIds.push(id);
        return newNode;
    }

    /**
     * Remove a node and all its children from the scene graph.
     * @param {string} id - ID of the node to remove.
     */
    removeNode(id) {
        const nodeToRemove = this.nodes.get(id);
        if (!nodeToRemove) return;

        // Recursively remove children
        for (const childId of [...nodeToRemove.childrenIds]) { // Use spread to avoid modifying array during iteration
            this.removeNode(childId);
        }

        // Remove from parent's children list
        const parent = this.nodes.get(nodeToRemove.parentId);
        if (parent) {
            parent.childrenIds = parent.childrenIds.filter(childId => childId !== id);
        }

        this.nodes.delete(id);
    }

    /**
     * Get a node by its ID.
     * @param {string} id - ID of the node.
     * @returns {object|undefined} The node object, or undefined if not found.
     */
    getNode(id) {
        return this.nodes.get(id);
    }

    /**
     * Update properties of a node.
     * @param {string} id - ID of the node.
     * @param {object} newProperties - New properties to merge.
     */
    updateNodeProperties(id, newProperties) {
        const node = this.nodes.get(id);
        if (node) {
            node.properties = { ...node.properties, ...newProperties };
        }
    }

    /**
     * Get the full scene graph as a tree structure (for serialization or rendering).
     * @param {string} startNodeId - The ID of the node to start the tree from. Defaults to 'world_root'.
     * @returns {object|null} The tree structure, or null if startNodeId not found.
     */
    getSceneGraphTree(startNodeId = 'world_root') {
        const buildTree = (nodeId) => {
            const node = this.nodes.get(nodeId);
            if (!node) return null;

            const children = node.childrenIds
                .map(childId => buildTree(childId))
                .filter(Boolean); // Filter out nulls if any child not found

            return {
                id: node.id,
                type: node.type,
                properties: node.properties,
                children: children.length > 0 ? children : undefined // Omit empty children array
            };
        };

        return buildTree(startNodeId);
    }

    /**
     * Get a flat list of all nodes.
     * @returns {Array<object>} A list of all nodes.
     */
    getAllNodes() {
        return Array.from(this.nodes.values());
    }
}

module.exports = { SceneGraphManager };

