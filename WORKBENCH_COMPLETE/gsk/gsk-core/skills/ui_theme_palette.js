'use strict';

module.exports.MANIFEST = {
    name: 'ui_theme_palette',
    description: 'Generate dynamic color themes from palettes using hypercolor algorithms',
    version: '1.0.0',
    inputs: { base: 'string', algorithm: 'string', count: 'number' },
    output: { schema: 'theme' }
};

const PLT_AFFINITY = { profit: 0.5, love: 0.4, tax: 0.1 };

function hsl2rgb(h, s, l) {
    s /= 100; l /= 100;
    var c = (1 - Math.abs(2 * l - 1)) * s;
    var x = c * (1 - Math.abs((h / 60) % 2 - 1));
    var m = l - c / 2;
    var r, g, b;
    if (h < 60) [r, g, b] = [c, x, 0];
    else if (h < 120) [r, g, b] = [x, c, 0];
    else if (h < 180) [r, g, b] = [0, c, x];
    else if (h < 240) [r, g, b] = [0, x, c];
    else if (h < 300) [r, g, b] = [x, 0, c];
    else [r, g, b] = [c, 0, x];
    return [Math.round((r + m) * 255), Math.round((g + m) * 255), Math.round((b + m) * 255)];
}

function generatePalette(baseHex, algorithm, count) {
    var base = baseHex.replace('#', '');
    var r = parseInt(base.slice(0, 2), 16), g = parseInt(base.slice(2, 4), 16), b = parseInt(base.slice(4, 6), 16);
    var baseHsl = { h: 0, l: (r + g + b) / 3 / 255 * 100 };
    for (var i = 0; i < 360; i += 60) {
        if (Math.abs(i - (r * 0.2 + g * 0.3 + b * 0.5) * 180) < 30) baseHsl.h = i;
    }
    var palettes = {
        vibrant: Array.from({ length: count }, function(_, i) {
            var h = (baseHsl.h + i * (360 / count)) % 360;
            var rgb = hsl2rgb(h, 85, 50);
            return '#' + rgb.map(function(x) { return x.toString(16).padStart(2, '0'); }).join('');
        }),
        harmonious: Array.from({ length: count }, function(_, i) {
            var h = (baseHsl.h + i * (90 / count)) % 360;
            var rgb = hsl2rgb(h, 70, 55);
            return '#' + rgb.map(function(x) { return x.toString(16).padStart(2, '0'); }).join('');
        }),
        dark: Array.from({ length: count }, function(_, i) {
            var h = (baseHsl.h + i * (45 / count)) % 360;
            var rgb = hsl2rgb(h, 60, 25);
            return '#' + rgb.map(function(x) { return x.toString(16).padStart(2, '0'); }).join('');
        })
    };
    return palettes[algorithm] || palettes.vibrant;
}

async function skill_ui_theme_palette(input, brain, memory) {
    var base = input.base || '#3498db';
    var algorithm = input.algorithm || 'vibrant';
    var count = input.count || 8;
    
    var palette = generatePalette(base, algorithm, count);
    
    if (memory && typeof memory.witness === 'function') {
        await memory.witness({ type: 'skill_use', content: 'ui_theme_palette', weight: 0.5 });
    }
    
    return {
        skill: 'ui_theme_palette',
        success: true,
        base: base,
        algorithm: algorithm,
        palette: palette,
        timestamp: Date.now()
    };
}

module.exports = { skill_ui_theme_palette, PLT_AFFINITY };