module.exports.MANIFEST = {
    name: 'api_server',
    description: 'Skill: api_server',
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

const PLT_AFFINITY = { profit: 0.8, love: 0.2, tax: 0.3 };

function _slugify(value) {
    return String(value || 'api-server')
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '') || 'api-server';
}

function skill_api_server(input, brain, memory) {
    const spec = input.spec || input.description || '';
    const framework = input.framework || 'express';
    const name = input.name || 'api-server';
    const endpoints = input.endpoints || [];

    if (!spec && endpoints.length === 0) {
        return Promise.resolve({
            skill: 'api_server',
            plt_affinity: PLT_AFFINITY,
            status: 'error',
            error: 'No API spec or description provided',
            timestamp: Date.now(),
        });
    }

    const endpointCode = endpoints.map((ep, i) => {
        const method = (ep.method || 'GET').toLowerCase();
        const routePath = ep.path || `/${ep.name || 'resource'}`;
        const handler = ep.handler || `// TODO: implement ${ep.name || 'handler_' + i}`;
        return `// ${ep.method || 'GET'} ${routePath}\napp.${method}('${routePath}', async (req, res) => {\n  ${handler}\n});`;
    }).join('\n\n');

    const scaffold = `const express = require('express');\nconst app = express();\napp.use(express.json());\n\n${endpointCode || "app.get('/health', (_req, res) => res.json({ ok: true }));"}\n\nconst port = process.env.PORT || 3000;\napp.listen(port, () => console.log('${name} listening on ' + port));`;

    const outputDir = input.outputDir || path.join(process.cwd(), 'generated', 'api', _slugify(name));
    const serverPath = input.outputPath || path.join(outputDir, 'server.js');
    const packageJsonPath = path.join(outputDir, 'package.json');

    try {
        if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });
        fs.writeFileSync(serverPath, scaffold, 'utf8');
        fs.writeFileSync(packageJsonPath, JSON.stringify({
            name: _slugify(name),
            version: '1.0.0',
            private: true,
            main: 'server.js',
            scripts: { start: 'node server.js' },
            dependencies: { express: '^4.21.2' },
        }, null, 2), 'utf8');
    } catch (e) {
        return Promise.resolve({
            skill: 'api_server',
            plt_affinity: PLT_AFFINITY,
            status: 'error',
            error: e.message,
            timestamp: Date.now(),
        });
    }

    if (memory && typeof memory.witness === 'function') {
        memory.witness({
            type: 'skill_artifact',
            content: `API server scaffold written: ${serverPath}`,
            weight: 0.5,
            tags: ['skill', 'api_server', 'artifact'],
        }).catch(() => {});
    }

    return Promise.resolve({
        skill: 'api_server',
        plt_affinity: PLT_AFFINITY,
        status: 'written',
        name,
        framework,
        endpoints: endpoints.length > 0 ? endpoints.map(e => `${e.method || 'GET'} ${e.path || '/'}`) : ['GET /'],
        scaffold,
        files: [serverPath, packageJsonPath],
        next_step: 'Run npm install and start the generated server',
        timestamp: Date.now(),
    });
}

module.exports = { skill_api_server, PLT_AFFINITY };

