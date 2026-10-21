'use strict';

const os = require('os');

const PLT_AFFINITY = { profit: 0.3, love: 0.5, tax: 0.2 };

async function skill_camsnap(input) {
    const platform = os.platform();
    const needsDarwin = false;
    if (needsDarwin && platform !== 'darwin') {
        return { skill: 'camsnap', plt_affinity: PLT_AFFINITY, success: false, platform_error: true, current_platform: platform, message: 'requires camera hardware — Skill unavailable on this platform', timestamp: Date.now() };
    }
    return { skill: 'camsnap', plt_affinity: PLT_AFFINITY, success: true, message: 'Camera Snap', platform, timestamp: Date.now() };
}

module.exports = { skill_camsnap, PLT_AFFINITY };