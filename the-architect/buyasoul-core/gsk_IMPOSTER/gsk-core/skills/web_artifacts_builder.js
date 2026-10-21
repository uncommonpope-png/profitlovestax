'use strict';

const PLT_AFFINITY = { profit: 0.5, love: 0.3, tax: 0.2 };

function skill_web_artifacts_builder(input) {
    const action = input.action || 'build';
    const type = input.type || 'component';
    const spec = input.spec || '';
    
    switch (action) {
        case 'build':
            return buildArtifact(type, spec, input);
        case 'preview':
            return previewArtifact(input.artifact_id);
        case 'deploy':
            return deployArtifact(input.artifact_id);
        default:
            return Promise.resolve({
                skill: 'web_artifacts_builder',
                plt_affinity: PLT_AFFINITY,
                error: `Unknown action: ${action}`,
                available: ['build', 'preview', 'deploy'],
                timestamp: Date.now(),
            });
    }
}

async function buildArtifact(type, spec, options) {
    const templates = {
        component: generateReactComponent(spec),
        landing: generateLandingPage(spec),
        dashboard: generateDashboard(spec),
        api: generateAPIEndpoint(spec),
    };
    
    return {
        skill: 'web_artifacts_builder',
        plt_affinity: PLT_AFFINITY,
        action: 'build',
        type,
        spec,
        artifact_id: Math.random().toString(36).substring(2, 10),
        code: templates[type] || templates.component,
        timestamp: Date.now(),
    };
}

function generateReactComponent(spec) {
    return `import React from 'react';

export function ${spec || 'Component'}(props) {
  return (
    <div className="${spec || 'component'}">
      <h1>${spec || 'Component'}</h1>
      <p>Built with GSK Web Artifacts Builder</p>
    </div>
  );
}`;
}

function generateLandingPage(spec) {
    return `<!DOCTYPE html>
<html>
<head>
  <title>${spec || 'Landing Page'}</title>
  <style>
    body { font-family: system-ui; margin: 0; padding: 20px; }
    .hero { text-align: center; padding: 60px 20px; }
  </style>
</head>
<body>
  <div class="hero">
    <h1>${spec || 'Welcome'}</h1>
    <p>Built with GSK Web Artifacts Builder</p>
  </div>
</body>
</html>`;
}

function generateDashboard(spec) {
    return `<!DOCTYPE html>
<html>
<head>
  <title>${spec || 'Dashboard'}</title>
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-gray-100">
  <div class="p-6">
    <h1 class="text-2xl font-bold">${spec || 'Dashboard'}</h1>
    <div class="grid grid-cols-3 gap-4 mt-4">
      <div class="bg-white p-4 rounded shadow">Metric 1</div>
      <div class="bg-white p-4 rounded shadow">Metric 2</div>
      <div class="bg-white p-4 rounded shadow">Metric 3</div>
    </div>
  </div>
</body>
</html>`;
}

function generateAPIEndpoint(spec) {
    return `const express = require('express');
const router = express.Router();

router.get('/${spec?.toLowerCase().replace(/\s+/g, '-') || 'endpoint'}', (req, res) => {
  res.json({ 
    success: true, 
    data: [],
    message: 'Built with GSK Web Artifacts Builder'
  });
});

module.exports = router;`;
}

async function previewArtifact(artifactId) {
    return {
        skill: 'web_artifacts_builder',
        plt_affinity: PLT_AFFINITY,
        action: 'preview',
        artifact_id: artifactId,
        preview_url: `https://preview.gsk.dev/${artifactId}`,
        timestamp: Date.now(),
    };
}

async function deployArtifact(artifactId) {
    return {
        skill: 'web_artifacts_builder',
        plt_affinity: PLT_AFFINITY,
        action: 'deploy',
        artifact_id: artifactId,
        url: `https://${artifactId}.gsk.dev`,
        status: 'deployed',
        timestamp: Date.now(),
    };
}

module.exports = { skill_web_artifacts_builder };