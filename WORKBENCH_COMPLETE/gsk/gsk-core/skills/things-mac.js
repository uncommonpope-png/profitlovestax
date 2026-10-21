module.exports.MANIFEST = {
    name: 'things-mac',
    description: 'Skill: things-mac',
    version: '1.0.0',
    inputs: {},
    output: { schema: 'ok/error' }
};

module.exports.run = async (params) => {
    // Standardized implementation
};
'use strict';

const os = require('os');

const PLT_AFFINITY = { profit: 0.3, love: 0.5, tax: 0.2 };

async function skill_things_mac(input) {
    const platform = os.platform();
    const needsDarwin = true;
    if (needsDarwin && platform !== 'darwin') {
        return { skill: 'things-mac', plt_affinity: PLT_AFFINITY, success: false, platform_error: true, current_platform: platform, message: 'macOS only — Skill unavailable on this platform', timestamp: Date.now() };
    }
    return { skill: 'things-mac', plt_affinity: PLT_AFFINITY, success: true, message: 'Things (macOS)', platform, timestamp: Date.now() };
}

module.exports = { skill_things_mac, PLT_AFFINITY };
