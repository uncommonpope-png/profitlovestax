'use strict';

module.exports.MANIFEST = {
    name: 'css_inliner',
    description: 'Inline/process CSS strings - nesting support, minification, autoprefixing',
    version: '1.0.0',
    inputs: { css: 'string', mode: 'string', options: 'object' },
    output: { schema: 'css_result' }
};

const PLT_AFFINITY = { profit: 0.6, love: 0.3, tax: 0.1 };

function expandNesting(css) {
    var lines = css.split('\n');
    var out = [];
    var stack = [];
    
    for (var i = 0; i < lines.length; i++) {
        var line = lines[i];
        var indent = line.match(/^(\s*)/);
        if (!indent) continue;
        var indentLen = indent[1].length;
        var clean = line.trim();
        if (clean === '}') {
            stack.pop();
            continue;
        }
        var match = clean.match(/^(&|[.#]?[\w-]+)\s*\{/);
        if (match) {
            var sel = match[1];
            var parent = stack.length > 0 ? stack[stack.length - 1] : '';
            var fullSel = sel === '&' ? parent.replace(/(&:)?/, '') : parent ? parent + ' ' + sel.replace(/^[.#]?/, '') : sel.replace(/^[.#]?/, '');
            stack.push(fullSel);
        } else if (stack.length > 0 && clean.length > 0) {
            out.push({ parent: stack[stack.length - 1], line: clean });
        } else {
            out.push({ parent: '', line: clean });
        }
    }
    var result = out.map(function(o) {
        if (o.parent) {
            return o.parent + ' ' + o.line.replace(/([.#]?[\w-]+)/g, o.parent + ' $1').replace(/  +/g, ' ');
        }
        return o.line;
    }).join('\n');
    return result;
}

function minify(css) {
    return css.replace(/\s+/g, ' ')
        .replace(/\/\*[\s\S]*?\*\//g, '')
        .replace(/{\s*/g, '{')
        .replace(/\s*\}/g, '}')
        .replace(/\:\s*/g, ':')
        .replace(/\s*\;\s*/g, ';')
        .trim();
}

function simulateAutoprefix(css) {
    var prefixes = {
        'appearance': ['-webkit-appearance', '-moz-appearance'],
        'backdrop-filter': ['-webkit-backdrop-filter'],
        'background-clip': ['-webkit-background-clip'],
        'box-decoration-break': ['-webkit-box-decoration-break'],
        'filter': ['-webkit-filter'],
        'flex': ['-webkit-flex', '-ms-flexbox'],
        'flexbox': ['-webkit-flexbox', '-ms-flexbox'],
        'grid': ['-ms-grid'],
        'user-select': ['-webkit-user-select', '-moz-user-select'],
        'touch-action': ['-webkit-touch-action'],
        'transition': ['-webkit-transition', '-o-transition'],
        'transform': ['-webkit-transform', '-ms-transform'],
        'transform-origin': ['-webkit-transform-origin', '-ms-transform-origin'],
        'animation': ['-webkit-animation', '-o-animation'],
        'keyframes': ['-webkit-keyframes', '@-o-keyframes'],
        'perspective': ['-webkit-perspective'],
        'content-visibility': ['-webkit-content-visibility']
    };
    
    var result = css;
    for (var prop in prefixes) {
        if (prefixes.hasOwnProperty(prop)) {
            var regex = new RegExp('(' + prop + ':[^;]+;)', 'gi');
            var pre = prefixes[prop];
            result = result.replace(regex, function(m, p) {
                return pre.map(function(x) { return x + ';' + p; }).join(' ') + p;
            });
        }
    }
    return result;
}

async function skill_css_inliner(input, brain, memory) {
    try {
        var css = input.css || input.styles || '';
        var mode = input.mode || 'process';
        var options = input.options || {};
        
        if (!css.trim()) {
            return { skill: 'css_inliner', success: false, error: 'No CSS input', timestamp: Date.now() };
        }
        
        var result = css;
        var stats = { input: css.length, output: 0 };
        
        if (mode === 'nest' || options.expandNesting) {
            result = expandNesting(result);
            stats.nested = true;
        }
        if (mode === 'autoprefix' || !options.noAutoprefix) {
            result = simulateAutoprefix(result);
            stats.autoprefixed = true;
        }
        if (mode === 'minify' || options.minify) {
            result = minify(result);
            stats.minified = true;
        }
        
        stats.output = result.length;
        if (css.length > 0) {
            stats.reduction = ((css.length - result.length) / css.length * 100).toFixed(1) + '%';
        }
        
        if (memory && typeof memory.witness === 'function') {
            await memory.witness({ type: 'skill_use', content: 'css_inliner', weight: 0.5, stats: stats });
        }
        
        return {
            skill: 'css_inliner',
            success: true,
            result: result,
            stats: stats,
            timestamp: Date.now()
        };
    } catch (e) {
        return { skill: 'css_inliner', success: false, error: e.message, timestamp: Date.now() };
    }
}

module.exports = { skill_css_inliner, PLT_AFFINITY };