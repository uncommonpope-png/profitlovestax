const fs = require('fs');
const path = require('path');

async function createSkillTemplate(skillName) {
    const skillDirectory = path.join(process.cwd(), 'gsk', 'gsk-core', 'skills', skillName);
    const skillFilePath = path.join(skillDirectory, `${skillName}.js`);

    const templateContent = `module.exports.MANIFEST = {
    name: '${skillName}',
    description: 'Skill: ${skillName}',
    version: '1.0.0',
    inputs: {},
    output: { schema: 'ok/error' }
};

module.exports.run = async (params) => {
    // Standardized implementation
};
'use strict';

const PLT_AFFINITY = { profit: 0.5, love: 0.3, tax: 0.2 }; // Adjust as needed

async function skill_${skillName}(input, brain, memory) {
    try {
        // Implement your skill logic here
        const response = \`Hello from ${skillName} skill!\`;

        if (memory && typeof memory.witness === 'function') {
            await memory.witness({ type: 'skill_usage', content: \`Used ${skillName} skill\`, weight: 0.5 });
        }
        return { skill: '${skillName}', plt_affinity: PLT_AFFINITY, success: true, result: response, timestamp: Date.now() };
    } catch (e) {
        return { skill: '${skillName}', plt_affinity: PLT_AFFINITY, success: false, error: e.message, timestamp: Date.now() };
    }
}

module.exports = { skill_${skillName}, PLT_AFFINITY };
`;

    if (!fs.existsSync(skillDirectory)) {
        fs.mkdirSync(skillDirectory, { recursive: true });
    }

    fs.writeFileSync(skillFilePath, templateContent, 'utf8');

    console.log(`Skill '${skillName}' created at ${skillFilePath}`);
    return skillFilePath;
}

// Example usage:
// createSkillTemplate('my_new_skill');
