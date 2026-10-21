'use strict';

module.exports.MANIFEST = {
    name: 'threejs_orbital_shader',
    description: 'Generate orbital motion shader code for Three.js objects - rings, paths, particle trails',
    version: '1.0.0',
    inputs: { objectName: 'string', radius: 'number', segments: 'number', speed: 'number', phase: 'number', color: 'string' },
    output: { schema: 'shader' }
};

const PLT_AFFINITY = { profit: 0.7, love: 0.2, tax: 0.1 };

async function skill_threejs_orbital_shader(input, brain, memory) {
    var objectName = input.objectName || 'orbiter';
    var radius = input.radius || 5;
    var segments = input.segments || 64;
    var speed = input.speed || 1;
    var phase = input.phase || 0;
    var color = input.color || '#ffdd00';
    
    var vertexShader = "" +
        "uniform float uTime;\n" +
        "uniform float uRadius;\n" +
        "uniform float uSpeed;\n" +
        "uniform float uPhase;\n" +
        "\n" +
        "void main () {\n" +
        "    float angle = uTime * uSpeed + uPhase;\n" +
        "    float x = sin(angle) * uRadius;\n" +
        "    float z = cos(angle) * uRadius;\n" +
        "    vec3 pos = position + vec3(x, 0.0, z);\n" +
        "    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);\n" +
        "}\n";
    
    var fragmentShader = "" +
        "uniform float uTime;\n" +
        "uniform vec3 uColor;\n" +
        "\n" +
        "void main () {\n" +
        "    float pulse = sin(uTime * " + (speed * 2).toFixed(4) + ".0) * 0.5 + 0.5;\n" +
        "    gl_FragColor = vec4(uColor, 1.0) * pulse;\n" +
        "}\n";
    
    var result = {
        skill: 'threejs_orbital_shader',
        success: true,
        objectName: objectName,
        radius: radius,
        segments: segments,
        vertexShader: vertexShader,
        fragmentShader: fragmentShader,
        uniforms: {
            uTime: { value: null },
            uRadius: { value: radius },
            uSpeed: { value: speed },
            uPhase: { value: phase },
            uColor: { value: new THREE.Color(color) }
        },
        timestamp: Date.now()
    };
    
    if (memory && typeof memory.witness === 'function') {
        await memory.witness({ type: 'skill_use', content: 'threejs_orbital_shader', weight: 0.6 });
    }
    
    return result;
}

module.exports = { skill_threejs_orbital_shader, PLT_AFFINITY };