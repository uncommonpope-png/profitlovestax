'use strict';

module.exports.MANIFEST = {
    name: 'neural_texture_gen',
    description: 'Generate neural texture patterns - Voronoi, noise, organic cells, cellular automata',
    version: '1.0.0',
    inputs: { pattern: 'string', cellCount: 'number', colorScheme: 'string', resolution: 'number' },
    output: { schema: 'texture' }
};

const PLT_AFFINITY = { profit: 0.4, love: 0.4, tax: 0.2 };

async function skill_neural_texture_gen(input, brain, memory) {
    var pattern = input.pattern || 'voronoi';
    var cellCount = input.cellCount || 256;
    var colorScheme = input.colorScheme || 'plasma';
    var res = input.resolution || 512;
    
    var shaders = {
        voronoi: "" +
            "// Voronoi Pattern Generator\n" +
            "float rand(vec2 co) { return fract(sin(dot(co.xy, vec2(12.9898, 78.233))) * 43758.5453); }\n" +
            "float voronoi(vec2 p) {\n" +
            "  vec2 n = floor(p);\n" +
            "  vec2 f = fract(p);\n" +
            "  float m = 0.9;\n" +
            "  for (int i = -1; i <= 1; i++) {\n" +
            "    for (int j = -1; j <= 1; j++) {\n" +
            "      vec2 g = vec2(float(i), float(j));\n" +
            "      float w = length(g + fract(sin(dot(g + n, vec2(78.233, 12.9898))) * 43758.5453) - f);\n" +
            "      m = min(m, w);\n" +
            "    }\n" +
            "  }\n" +
            "  return m;\n" +
            "}\n",
        worley: "" +
            "// Worley Cell Texture Generator\n" +
            "vec3 worley(vec2 p) {\n" +
            "  vec2 n = floor(p);\n" +
            "  vec2 f = fract(p);\n" +
            "  float d = 100000.0;\n" +
            "  for (int i = -1; i <= 1; i++) {\n" +
            "    for (int j = -1; j <= 1; j++) {\n" +
            "      vec2 g = vec2(float(i), float(j));\n" +
            "      float w = length(g + fragCoord.xy - p);\n" +
            "      d = min(d, w);\n" +
            "    }\n" +
            "  }\n" +
            "  return vec3(d);\n" +
            "}\n",
        cellular: "" +
            "// Cellular Automata Pattern\n" +
            "float cellular(vec2 p) {\n" +
            "  float sum = 0.0;\n" +
            "  for (int i = 0; i < 32; i++) {\n" +
            "    float seed = float(i) * 12.9898;\n" +
            "    vec2 pos = vec2(\n" +
            "      sin(p.x * 0.1 + seed) * 0.5 + 0.5,\n" +
            "      cos(p.y * 0.1 + seed) * 0.5 + 0.5\n" +
            "    );\n" +
            "    sum += sin(pos.x * 10.0 + seed) * 0.5 + 0.5;\n" +
            "  }\n" +
            "  return sum / 32.0;\n" +
            "}"
    };
    
    var palettes = {
        plasma: ['#0d0887', '#5b04a7', '#9a1e7e', '#d74642', '#fdae56', '#fdbe26', '#f0f0f0'],
        viridis: ['#440154', '#482777', '#3e4989', '#31688e', '#35b779', '#fee826'],
        inferno: ['#000004', '#0b3763', '#35498e', '#626ba1', '#9177b7', '#f370fe'],
        thermal: ['#000004', '#29072d', '#691539', '#c44537', '#f87e29', '#fdf09a']
    };
    
    var result = {
        fragmentShader: shaders[pattern] || shaders.voronoi,
        uniforms: {
            u_resolution: { value: new THREE.Vector2(res, res) },
            u_cellCount: { value: cellCount },
            u_time: { value: 0 },
            u_colorPalette: { value: palettes[colorScheme] || palettes.plasma }
        },
        pattern: pattern,
        styles: {
            background: 'radial-gradient(circle at 30% 30%, #2a1b3d 0%, #0a0812 100%)',
            textureOverlay: 'opacity: 0.95',
            animation: 'noise 3s infinite'
        }
    };
    
    if (memory && typeof memory.witness === 'function') {
        await memory.witness({ type: 'skill_use', content: 'neural_texture_gen', weight: 0.5 });
    }
    
    return {
        skill: 'neural_texture_gen',
        success: true,
        result: result,
        description: 'Neural texture: ' + pattern + ' pattern, ' + cellCount + ' cells, ' + colorScheme + ' palette',
        timestamp: Date.now()
    };
}

module.exports = { skill_neural_texture_gen, PLT_AFFINITY };