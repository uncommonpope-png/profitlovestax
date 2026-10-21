'use strict';

module.exports.MANIFEST = {
    name: 'threejs_shader_particle',
    description: 'Generate particle shader code for PointsMaterial and custom shaders - rain, stars, effects',
    version: '1.0.0',
    inputs: { type: 'string', count: 'number', color: 'string', speed: 'number', gravity: 'number' },
    output: { schema: 'particle_shader' }
};

const PLT_AFFINITY = { profit: 0.5, love: 0.3, tax: 0.2 };

async function skill_threejs_shader_particle(input, brain, memory) {
    var type = input.type || 'rain';
    var count = input.count || 1000;
    var color = input.color || '#88ccff';
    var speed = input.speed || 0.5;
    var gravity = input.gravity || 0.1;
    
    if (type === 'rain') {
        var vertexShader = "" +
            "attribute float aHeight;\n" +
            "attribute float aSpeed;\n" +
            "varying float vHeight;\n" +
            "\n" +
            "void main () {\n" +
            "    vHeight = aHeight;\n" +
            "    vec3 pos = position;\n" +
            "    pos.y -= aSpeed * uTime * 1000.0 * " + speed.toFixed(4) + ";\n" +
            "    if (pos.y < -50.0) pos.y = 55.0;\n" +
            "    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);\n" +
            "}\n";
        
        var fragmentShader = "" +
            "uniform vec3 uColor;\n" +
            "varying float vHeight;\n" +
            "\n" +
            "void main () {\n" +
            "    float alpha = 0.6 - (1.0 - (vHeight + 50.0) / 100.0) * 0.4;\n" +
            "    gl_FragColor = vec4(uColor, alpha);\n" +
            "}\n";
        
        var attrs = [];
        for (var i = 0; i < count; i++) {
            attrs.push({
                aHeight: (Math.random() - 0.5) * 100,
                aSpeed: speed * (0.5 + Math.random())
            });
        }
        
        var result = {
            skill: 'threejs_shader_particle',
            type: 'rain',
            count: count,
            vertexShader: vertexShader,
            fragmentShader: fragmentShader,
            attributes: attrs,
            uniforms: {
                uTime: { value: 0 },
                uColor: { value: new THREE.Color(color) }
            },
            timestamp: Date.now()
        };
        
        if (memory && typeof memory.witness === 'function') {
            await memory.witness({ type: 'skill_use', content: 'threejs_shader_particle_rain', weight: 0.5 });
        }
        
        return result;
    }
    
    if (type === 'stars') {
        var vertShader = "" +
            "void main () {\n" +
            "    gl_PointDistance = 0.3;\n" +
            "    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);\n" +
            "}\n";
        
        var fragShader = "" +
            "uniform vec3 uColor;\n" +
            "\n" +
            "void main () {\n" +
            "    float d = length(gl_PointCoord - vec2(0.5));\n" +
            "    float alpha = smoothstep(0.5, 0.0, d);\n" +
            "    gl_FragColor = vec4(uColor, alpha);\n" +
            "}\n";
        
        var result = {
            skill: 'threejs_shader_particle',
            type: 'stars',
            count: count,
            vertexShader: vertShader,
            fragmentShader: fragShader,
            uniforms: {
                uColor: { value: new THREE.Color(color) }
            },
            timestamp: Date.now()
        };
        
        if (memory && typeof memory.witness === 'function') {
            await memory.witness({ type: 'skill_use', content: 'threejs_shader_particle_stars', weight: 0.5 });
        }
        
        return result;
    }
    
    return { skill: 'threejs_shader_particle', success: false, error: 'Unknown particle type: ' + type, timestamp: Date.now() };
}

module.exports = { skill_threejs_shader_particle, PLT_AFFINITY };