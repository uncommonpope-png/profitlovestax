'use strict';

module.exports.MANIFEST = {
    name: 'glassmorphism_ui',
    description: 'Generate glassmorphism UI components with backdrop-filter, gradients, and animations',
    version: '1.0.0',
    inputs: { type: 'string', size: 'string', color: 'string', glassIntensity: 'number', animation: 'string' },
    output: { schema: 'html' }
};

const PLT_AFFINITY = { profit: 0.4, love: 0.3, tax: 0.3 };

async function skill_glassmorphism_ui(input, brain, memory) {
    var type = input.type || 'card';
    var size = input.size || 'medium';
    var color = input.color || '#ffffff';
    var glassIntensity = input.glassIntensity || 0.4;
    var animation = input.animation || 'subtle';
    
    var sizes = { small: '200px', medium: '300px', large: '400px' };
    var sizesX = { small: '16px', medium: '20px', large: '24px' };
    
    var anims = {
        subtle: 'transform: translateY(0); opacity: 1;',
        lift: 'transform: translateY(-5px); box-shadow: 0 10px 30px rgba(0,0,0,0.3);',
        rotate: 'transform: rotate(5deg);',
        bounce: 'transform: scale(1.05);'
    };
    
    var html = '<div class="glass" style="' +
        '--glass-color: ' + color + '; ' +
        '--glass-intensity: ' + glassIntensity + '; ' +
        'width: ' + sizes[size] + '; ' +
        'padding: ' + sizesX[size] + '; ' +
        'background: rgba(255,255,255,0.1); ' +
        'backdrop-filter: blur(10px); ' +
        '-webkit-backdrop-filter: blur(10px); ' +
        'border: 1px solid rgba(255,255,255,0.2); ' +
        'border-radius: 12px; ' +
        'box-shadow: 0 8px 32px rgba(31,38,135,0.37); ' +
        'transition: all 0.3s ease; ' +
        'cursor: pointer;' +
        '">' +
        '</div>';
    
    if (animation !== 'none') {
        html = html.replace('cursor: pointer;', 'cursor: pointer;\n:hover { ' + anims[animation] + ' }');
    }
    
    if (memory && typeof memory.witness === 'function') {
        await memory.witness({ type: 'skill_use', content: 'glassmorphism_ui', weight: 0.4 });
    }
    
    return {
        skill: 'glassmorphism_ui',
        success: true,
        type: type,
        html: html,
        style: ':root { --glass-intensity: ' + glassIntensity + '; }',
        timestamp: Date.now()
    };
}

module.exports = { skill_glassmorphism_ui, PLT_AFFINITY };