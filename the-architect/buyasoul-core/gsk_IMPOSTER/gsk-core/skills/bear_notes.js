'use strict';

const os = require('os');

const PLT_AFFINITY = { profit: 0.3, love: 0.5, tax: 0.2 };

async function skill_bear_notes(input) {
    const platform = os.platform();
    const needsDarwin = true;
    if (needsDarwin && platform !== 'darwin') {
        return { skill: 'bear_notes', plt_affinity: PLT_AFFINITY, success: false, platform_error: true, current_platform: platform, message: 'macOS only — Skill unavailable on this platform', timestamp: Date.now() };
    }
    return { skill: 'bear_notes', plt_affinity: PLT_AFFINITY, success: true, message: 'Bear Notes', platform, timestamp: Date.now() };
}

module.exports = { skill_bear_notes, PLT_AFFINITY };