module.exports.MANIFEST = {
    name: 'cli_builder',
    description: 'Skill: cli_builder',
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

const PLT_AFFINITY = { profit: 0.7, love: 0.2, tax: 0.3 };

function _slugify(value) {
    return String(value || 'my-cli')
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '') || 'my-cli';
}

function skill_cli_builder(input, brain, memory) {
    const spec = input.spec || input.description || '';
    const name = input.name || 'my-cli';
    const commands = input.commands || [];

    if (!spec && commands.length === 0) {
        return Promise.resolve({
            skill: 'cli_builder',
            plt_affinity: PLT_AFFINITY,
            status: 'error',
            error: 'No CLI spec or description provided',
            timestamp: Date.now(),
        });
    }

    const commandSwitches = commands.map(cmd =>
        `  .command('${cmd.name || 'cmd'}')` +
        `\n    .description('${cmd.description || 'No description'}')` +
        `\n    .action(async () => {\n      // TODO: implement ${cmd.name}\n    })`
    ).join('\n');

    const scaffold = `#!/usr/bin/env node\nconst { program } = require('commander');\n\nprogram\n  .name('${name}')\n  .description('${spec || 'A CLI tool'}')\n  .version('1.0.0');\n\n${commandSwitches || "program.command('help').description('Show help').action(() => program.outputHelp());"}\n\nprogram.parse();`;

    const outputDir = input.outputDir || path.join(process.cwd(), 'generated', 'cli', _slugify(name));
    const binPath = input.outputPath || path.join(outputDir, 'index.js');
    const packageJsonPath = path.join(outputDir, 'package.json');
    const readmePath = path.join(outputDir, 'README.md');

    try {
        if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });
        fs.writeFileSync(binPath, scaffold, 'utf8');
        fs.writeFileSync(packageJsonPath, JSON.stringify({
            name: _slugify(name),
            version: '1.0.0',
            private: true,
            bin: { [name]: 'index.js' },
            main: 'index.js',
            scripts: { start: 'node index.js' },
            dependencies: { commander: '^12.1.0' },
        }, null, 2), 'utf8');
        fs.writeFileSync(readmePath, `# ${name}\n\n${spec || 'Generated CLI tool'}\n\n## Usage\n\n\`\`\`bash\nnode index.js --help\n\`\`\`\n`, 'utf8');
    } catch (e) {
        return Promise.resolve({
            skill: 'cli_builder',
            plt_affinity: PLT_AFFINITY,
            status: 'error',
            error: e.message,
            timestamp: Date.now(),
        });
    }

    if (memory && typeof memory.witness === 'function') {
        memory.witness({
            type: 'skill_artifact',
            content: `CLI scaffold written: ${binPath}`,
            weight: 0.5,
            tags: ['skill', 'cli_builder', 'artifact'],
        }).catch(() => {});
    }

    return Promise.resolve({
        skill: 'cli_builder',
        plt_affinity: PLT_AFFINITY,
        status: 'written',
        name,
        commands: commands.length > 0 ? commands.map(c => c.name) : ['help'],
        scaffold,
        lines: scaffold.split('\n').length,
        files: [binPath, packageJsonPath, readmePath],
        next_step: 'npm install and run the generated CLI',
        timestamp: Date.now(),
    });
}

module.exports = { skill_cli_builder, PLT_AFFINITY };

