module.exports.MANIFEST = {
    name: 'unified_project_builder',
    description: 'Skill: unified_project_builder',
    version: '1.0.0',
    inputs: {},
    output: { schema: 'ok/error' }
};

module.exports.run = async (params) => {
    // Standardized implementation
};
'use strict';

const fs = require('fs');
const path = require('path');

/**
 * UNIFIED PROJECT BUILDER — Package Simulated World for Export
 *
 * Sage Skill: SKILL - Unified Project Builder
 * Source: GDevelop
 *
 * Defines a capability to package the current simulated world, including entities,
 * rules, and world states, into a standalone, exportable asset or application.
 * It abstracts the complexities of platform-specific deployment.
 *
 * This maps to a future `gsk_deployer` module, a bridge between
 * `brain/world_model_simulation.js` and external target environments.
 */

class UnifiedProjectBuilder {
    constructor(fusion) {
        this.fusion = fusion;
    }

    /**
     * Gathers all relevant world state and exports it as a unified project package.
     * @param {string} projectName - The name of the project to build.
     * @param {string} format - The export format (e.g., 'json', 'gltf', 'zip').
     * @returns {object} A result object with status and path to the exported project.
     */
    async build(projectName = 'SoulverseProject', format = 'json') {
        if (!this.fusion) {
            return { ok: false, error: 'Fusion kernel not available for building.' };
        }

        const projectData = {
            metadata: {
                projectName: projectName,
                buildTime: new Date().toISOString(),
                gskVersion: this.fusion.systems?.identityKernel?.getStatus?.().version || 'unknown',
                description: `Unified project package built by GSK: ${projectName}`
            },
            worldState: {},
            sceneGraph: {},
            entityBehaviors: {}
        };

        // 1. Gather current world state from SanctumClient
        const sanctumClient = this.fusion.sanctumClient;
        if (sanctumClient) {
            projectData.worldState = {
                ...sanctumClient.getWorldState(),
                souls: sanctumClient.souls,
                buildings: sanctumClient.buildings,
                resources: sanctumClient.resources
            };
        } else {
            console.warn('[UnifiedProjectBuilder] SanctumClient not available, worldState will be empty.');
        }

        // 2. Gather scene graph data from SceneGraphManager
        const sceneGraphManager = this.fusion.sceneGraphManager;
        if (sceneGraphManager) {
            projectData.sceneGraph = sceneGraphManager.getSceneGraphTree('world_root');
        } else {
            console.warn('[UnifiedProjectBuilder] SceneGraphManager not available, sceneGraph will be empty.');
        }

        // 3. Gather relevant behaviors from BehaviorAttacher
        const behaviorAttacher = this.fusion.behaviorAttacher;
        if (behaviorAttacher) {
            // We can't export behavior classes directly, but we can export configurations
            // and attached behavior instances for each entity.
            const entityBehaviors = {};
            for (const [entityId, behaviorsMap] of behaviorAttacher.entityBehaviors) {
                entityBehaviors[entityId] = {};
                for (const [behaviorName, instance] of behaviorsMap) {
                    // Assuming behavior instances have a getConfig() method or their properties are serializable
                    entityBehaviors[entityId][behaviorName] = {
                        config: instance.config || { speed: instance.speed }, // Example for MovableBehavior
                        state: instance.position // Example for MovableBehavior
                    };
                }
            }
            projectData.entityBehaviors = entityBehaviors;
        } else {
            console.warn('[UnifiedProjectBuilder] BehaviorAttacher not available, entityBehaviors will be empty.');
        }

        // 4. Package this into a suitable format for export
        const exportDir = path.join(this.fusion.dataDir, 'gsk', 'builds');
        if (!fs.existsSync(exportDir)) {
            fs.mkdirSync(exportDir, { recursive: true });
        }

        let exportFilePath;
        switch (format.toLowerCase()) {
            case 'json':
                exportFilePath = path.join(exportDir, `${projectName}.json`);
                fs.writeFileSync(exportFilePath, JSON.stringify(projectData, null, 2), 'utf-8');
                break;
            case 'zip':
                // This would require a zipping library (e.g., archiver)
                // For now, we'll just export JSON and note that ZIP needs implementation
                exportFilePath = path.join(exportDir, `${projectName}.json`);
                fs.writeFileSync(exportFilePath, JSON.stringify(projectData, null, 2), 'utf-8');
                console.warn('[UnifiedProjectBuilder] ZIP format requested but not implemented. Exported as JSON.');
                break;
            default:
                return { ok: false, error: `Unsupported export format: ${format}. Supported: 'json', 'zip'.` };
        }

        return { ok: true, path: exportFilePath, format, projectName };
    }
}

module.exports = { UnifiedProjectBuilder };

