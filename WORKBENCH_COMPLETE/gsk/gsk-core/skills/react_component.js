module.exports.MANIFEST = {
    name: 'react_component',
    description: 'Skill: react_component',
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

const PLT_AFFINITY = { profit: 0.7, love: 0.3, tax: 0.2 };

function _slugify(value) {
    return String(value || 'generated-component')
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '') || 'generated-component';
}

function _toPascalCase(value) {
    const parts = String(value || 'GeneratedComponent').match(/[a-z0-9]+/gi) || ['Generated', 'Component'];
    return parts.map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join('');
}

function _buildComponentCode(name, description, props) {
    const componentName = _toPascalCase(name);
    const propEntries = Object.entries(props || {});
    const propNames = propEntries.map(([key]) => key);
    const propLines = propEntries.length > 0
        ? propEntries.map(([key, value]) => `  ${key}: ${typeof value === 'string' ? value : 'any'};`).join('\n')
        : '  // no props';
    const propParam = propNames.length > 0 ? `{ ${propNames.join(', ')} }` : '';

    return `import React from 'react';\n\ninterface ${componentName}Props {\n${propLines}\n}\n\nexport const ${componentName}: React.FC<${componentName}Props> = (${propParam}) => {\n  return (\n    <div className="${_slugify(componentName)}">\n      {/* ${description} */}\n    </div>\n  );\n};\n\nexport default ${componentName};\n`;
}

function skill_react_component(input, brain, memory) {
    const description = input.description || input.spec || '';
    const name = input.name || 'GeneratedComponent';
    const props = input.props || {};

    if (!description) {
        return Promise.resolve({
            skill: 'react_component',
            plt_affinity: PLT_AFFINITY,
            status: 'error',
            error: 'No component description provided',
            timestamp: Date.now(),
        });
    }

    const componentCode = _buildComponentCode(name, description, props);
    const outputDir = input.outputDir || path.join(process.cwd(), 'generated', 'components');
    const outputPath = input.outputPath || path.join(outputDir, `${_slugify(name)}.tsx`);

    try {
        const dir = path.dirname(outputPath);
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        fs.writeFileSync(outputPath, componentCode, 'utf8');
    } catch (e) {
        return Promise.resolve({
            skill: 'react_component',
            plt_affinity: PLT_AFFINITY,
            status: 'error',
            error: e.message,
            name,
            description,
            timestamp: Date.now(),
        });
    }

    if (memory && typeof memory.witness === 'function') {
        memory.witness({
            type: 'skill_artifact',
            content: `React component written: ${outputPath}`,
            weight: 0.5,
            tags: ['skill', 'react_component', 'artifact'],
        }).catch(() => {});
    }

    return Promise.resolve({
        skill: 'react_component',
        plt_affinity: PLT_AFFINITY,
        status: 'written',
        name,
        description,
        code: componentCode,
        file: outputPath,
        lines: componentCode.split('\n').length,
        language: 'tsx',
        timestamp: Date.now(),
    });
}

module.exports = { skill_react_component, PLT_AFFINITY };

