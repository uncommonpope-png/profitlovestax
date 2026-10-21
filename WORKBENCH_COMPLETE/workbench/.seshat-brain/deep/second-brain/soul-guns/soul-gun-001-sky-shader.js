/**
 * SOUL-GUN-001: Physically-Based Sky Shader
 * Implements a basic Nishita-style sky shader for Three.js.
 */
import * as THREE from 'three';

const SkyShader = {
    uniforms: {
        'luminance': { value: 1 },
        'turbidity': { value: 2 },
        'rayleigh': { value: 1 },
        'mieCoefficient': { value: 0.005 },
        'mieDirectionalG': { value: 0.8 },
        'sunPosition': { value: new THREE.Vector3() },
        'up': { value: new THREE.Vector3(0, 1, 0) }
    },
    vertexShader: `
        varying vec3 vWorldPosition;
        void main() {
            vec4 worldPosition = modelMatrix * vec4(position, 1.0);
            vWorldPosition = worldPosition.xyz;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
    `,
    fragmentShader: `
        uniform vec3 sunPosition;
        uniform float rayleigh;
        uniform float turbidity;
        uniform float mieCoefficient;
        uniform float mieDirectionalG;
        uniform float luminance;
        uniform vec3 up;
        varying vec3 vWorldPosition;

        // Pre-calculated constants for Rayleigh and Mie scattering
        const float rayleighCoefficient = 0.0025;
        const float mieCoefficientConstant = 0.0010;

        void main() {
            vec3 dir = normalize(vWorldPosition - cameraPosition);

            // Optical depth (distance through atmosphere)
            float airmass = 1.0 / (dot(dir, up) + 0.15 * pow(93.885 - acos(dot(dir, up)) * 180.0 / 3.14159265, -1.253));

            // Rayleigh scattering
            vec3 rayleighScattering = rayleighCoefficient * vec3(0.22, 0.47, 0.68) * turbidity;
            vec3 extinction = exp(-rayleighScattering * airmass);

            // Sun direction
            float sunfade = 1.0 - clamp(1.0 - exp((sunPosition.y/1000.0)),0.0,1.0);
            rayleighScattering *= sunfade;

            // Final color
            gl_FragColor = vec4(extinction * rayleighScattering, 1.0);
        }
    `
};

export default SkyShader;
