'use strict';

module.exports.MANIFEST = {
    name: 'threejs_postprocess_stack',
    description: 'Generate SixDOF postprocessing stack for Three.js - bloom, SSAO, outlines, tone mapping',
    version: '1.0.0',
    inputs: { effects: 'array', resolution: 'number', intensity: 'number', toneMapper: 'string' },
    output: { schema: 'postprocess' }
};

const PLT_AFFINITY = { profit: 0.5, love: 0.3, tax: 0.2 };

async function skill_threejs_postprocess_stack(input, brain, memory) {
    var effects = input.effects || ['bloom', 'ssao', 'outline'];
    var resolution = input.resolution || 1080;
    var intensity = input.intensity || 1.0;
    var toneMapper = input.toneMapper || 'ACESFilmicToneMapping';
    
    var stack = {
        renderPass: 'new RenderPass(scene, camera)',
        bloomPass: 'new UnrealBloomPass(new Vector2(width, height), ' + intensity + ', 0.4, 0.85)',
        ssaoPass: 'new SSAOShaderPass(scene, camera, width, height)',
        outlinePass: 'new OutlinePass(new Vector2(width, height), scene, camera)',
        fxaaPass: 'new FXAAShaderPass( resolution )',
        finalPass: 'new ShaderPass( YourColorAdjShader )'
    };
    
    var code = '' +
        '// --- POSTPROCESS STACK ---\n' +
        'const composer = new EffectComposer(renderer);\n' +
        'composer.setSize(window.innerWidth, window.innerHeight);\n\n' +
        'const renderPass = new RenderPass(scene, camera);\n' +
        'composer.addPass(renderPass);\n\n';
    
    if (effects.includes('bloom')) {
        code += '// Bloom\n' +
            'const bloomPass = new UnrealBloomPass(\n' +
            '    new THREE.Vector2(window.innerWidth, window.innerHeight),\n' +
            '    ' + (0.8 * intensity) + ', 0.4, 0.85\n' +
            ');\n' +
            'composer.addPass(bloomPass);\n\n';
    }
    
    if (effects.includes('ssao')) {
        code += '// SSAO\n' +
            'const ssaoPass = new SSAOShaderPass(\n' +
            '    renderer.getSize().clone(),\n' +
            '    camera,\n' +
            '    256\n' +
            ');\n' +
            'ssaoPass.material.defines.USE_HEALTHY = true;\n' +
            'composer.addPass(ssaoPass);\n\n';
    }
    
    if (effects.includes('outline')) {
        code += '// Outline\n' +
            'const outlinePass = new OutlinePass(\n' +
            '    new THREE.Vector2(window.innerWidth, window.innerHeight),\n' +
            '    scene, camera\n' +
            ');\n' +
            'outlinePass.edgeStrength = ' + (2.0 * intensity) + ';\n' +
            'outlinePass.edgeGlow = 0.5;\n' +
            'outlinePass.usePattern = false;\n' +
            'composer.addPass(outlinePass);\n\n';
    }
    
    code += '// Tone mapping\n' +
        'renderer.toneMapping = THREE.' + toneMapper + ';\n' +
        'renderer.toneMappingExposure = ' + (1.2 * intensity) + ';\n\n' +
        '// Render\n' +
        'composer.render();';
    
    if (memory && typeof memory.witness === 'function') {
        await memory.witness({ type: 'skill_use', content: 'threejs_postprocess_stack', weight: 0.7 });
    }
    
    return {
        skill: 'threejs_postprocess_stack',
        success: true,
        effects: effects,
        code: code,
        timestamp: Date.now()
    };
}

module.exports = { skill_threejs_postprocess_stack, PLT_AFFINITY };