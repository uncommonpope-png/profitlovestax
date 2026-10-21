import * as THREE from 'three';
/**
 * SovereignTelemetryEngine
 * Production-ready Three.js Instanced Particle Telemetry Canvas.
 * Visualizes the 34 Computational Chambers, SCRIBE vectors, and PLT metrics.
 */
export default class SovereignTelemetryEngine {
  /**
   * @param {HTMLElement} container - DOM container element for the canvas.
   * @param {Object} [options={}] - Configuration options.
   */
  constructor(container, options = {}) {
    if (!container) {
      throw new Error('[SovereignTelemetryEngine] Target DOM container is required.');
    }

    this.container = container;
    this.numChambers = options.numChambers || 34;
    this.crimsonHex = options.crimsonHex || 0xFF1E27; // High Tax
    this.goldHex = options.goldHex || 0xFFD700;       // High Profit / Love
    this.baseRadius = options.baseRadius || 12.0;

    // Internal State Store for 34 Chambers
    this.chambers = new Array(this.numChambers).fill(null).map((_, i) => ({
      chamberId: i,
      valence: 0.5,        // 0.0 to 1.0 (Love/Profit Balance)
      arousal: 0.5,        // 0.0 to 1.0
      taxLevel: 0.1,       // 0.0 to 1.0 (Tax Severity)
      activeWorkers: 1,    // Number of active sub-agents
      ipcFrequency: 1.0,   // Hz / IPC event frequency (controls pulse rate)
      baseScale: 1.0,
      currentScale: 1.0,
      targetColor: new THREE.Color(this.goldHex),
      currentColor: new THREE.Color(this.goldHex),
      angle: (i / this.numChambers) * Math.PI * 2,
      heightOffset: Math.sin((i / this.numChambers) * Math.PI * 4) * 2.0
    }));

    // Three.js Core Components
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.instancedMesh = null;
    this.dummyMatrix = new THREE.Matrix4();
    this.dummyPosition = new THREE.Vector3();
    this.dummyQuaternion = new THREE.Quaternion();
    this.dummyScale = new THREE.Vector3();

    // Clock & Lifecycle
    this.clock = new THREE.Clock();
    this.animationFrameId = null;
    this.isDestroyed = false;

    this.init();
  }

  /**
   * Initialize Three.js Scene, Camera, Renderer, and Instanced Mesh
   * @private
   */
  init() {
    const width = this.container.clientWidth || window.innerWidth;
    const height = this.container.clientHeight || window.innerHeight;

    // 1. Scene Setup
    this.scene = new THREE.Scene();
    this.scene.fog = new THREE.FogExp2(0x05050A, 0.015);

    // 2. Camera Setup
    this.camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 1000);
    this.camera.position.set(0, 18, 32);
    this.camera.lookAt(0, 0, 0);

    // 3. Renderer Setup
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.2;
    this.container.appendChild(this.renderer.domElement);

    // 4. Instanced Particle Geometry & Shader Material Setup
    const geometry = new THREE.SphereGeometry(0.8, 32, 32);
    const material = new THREE.MeshStandardMaterial({
      roughness: 0.2,
      metalness: 0.8,
      emissiveIntensity: 0.6,
      transparent: true,
      opacity: 0.95
    });

    // 5. Instanced Mesh Instantiation
    this.instancedMesh = new THREE.InstancedMesh(geometry, material, this.numChambers);
    this.instancedMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    if (this.instancedMesh.instanceColor) {
      this.instancedMesh.instanceColor.setUsage(THREE.DynamicDrawUsage);
    }

    // Initial Transform & Color Mapping for 34 Chambers
    for (let i = 0; i < this.numChambers; i++) {
      const chamber = this.chambers[i];
      
      // Ring Arrangement with Height Oscillation
      const x = Math.cos(chamber.angle) * this.baseRadius;
      const z = Math.sin(chamber.angle) * this.baseRadius;
      const y = chamber.heightOffset;

      this.dummyPosition.set(x, y, z);
      this.dummyQuaternion.identity();
      this.dummyScale.setScalar(1.0);
      this.dummyMatrix.compose(this.dummyPosition, this.dummyQuaternion, this.dummyScale);

      this.instancedMesh.setMatrixAt(i, this.dummyMatrix);
      this.instancedMesh.setColorAt(i, chamber.currentColor);
    }

    this.instancedMesh.instanceMatrix.needsUpdate = true;
    if (this.instancedMesh.instanceColor) {
      this.instancedMesh.instanceColor.needsUpdate = true;
    }

    this.scene.add(this.instancedMesh);

    // 6. Ambient & Dynamic Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
    this.scene.add(ambientLight);

    const pointLight = new THREE.PointLight(0xFFD700, 2.5, 100);
    pointLight.position.set(0, 10, 0);
    this.scene.add(pointLight);

    // 7. Event Listeners
    this._onResize = this.onResize.bind(this);
    window.addEventListener('resize', this._onResize);

    // 8. Start Rendering Loop
    this.animate();
  }

  /**
   * Ingest Dynamic Telemetry Updates for a specific Chamber or batch of Chambers
   * @param {Object|Array<Object>} telemetryInput - Dynamic telemetry telemetry update
   * @param {number} telemetryInput.chamberId - Chamber index (0-33)
   * @param {number} [telemetryInput.valence] - PLT Love/Profit metric (0.0 - 1.0)
   * @param {number} [telemetryInput.arousal] - Activation intensity (0.0 - 1.0)
   * @param {number} [telemetryInput.taxLevel] - Systemic Risk / Tax metric (0.0 - 1.0)
   * @param {number} [telemetryInput.activeWorkers] - Active sub-agent count
   * @param {number} [telemetryInput.ipcFrequency] - Event pulse speed in Hz
   */
  updateTelemetry(telemetryInput) {
    if (this.isDestroyed) return;

    const updates = Array.isArray(telemetryInput) ? telemetryInput : [telemetryInput];
    const crimson = new THREE.Color(this.crimsonHex);
    const gold = new THREE.Color(this.goldHex);

    for (const data of updates) {
      const { chamberId, valence, arousal, taxLevel, activeWorkers, ipcFrequency } = data;

      if (chamberId === undefined || chamberId < 0 || chamberId >= this.numChambers) {
        continue;
      }

      const chamber = this.chambers[chamberId];

      // Mutate telemetry state values if present
      if (valence !== undefined) chamber.valence = THREE.MathUtils.clamp(valence, 0, 1);
      if (arousal !== undefined) chamber.arousal = THREE.MathUtils.clamp(arousal, 0, 1);
      if (taxLevel !== undefined) chamber.taxLevel = THREE.MathUtils.clamp(taxLevel, 0, 1);
      if (activeWorkers !== undefined) chamber.activeWorkers = Math.max(1, activeWorkers);
      if (ipcFrequency !== undefined) chamber.ipcFrequency = Math.max(0.1, ipcFrequency);

      // Color Interpolation: High Tax -> Crimson (#FF1E27) | High Profit/Love -> Gold (#FFD700)
      // Lerp ratio blends tax severity against overall PLT balance
      const colorRatio = THREE.MathUtils.clamp(1.0 - chamber.taxLevel + (chamber.valence * 0.5), 0, 1);
      chamber.targetColor.copy(crimson).lerp(gold, colorRatio);

      // Base Scale is calculated from worker load and arousal state
      chamber.baseScale = 0.8 + (chamber.activeWorkers * 0.15) + (chamber.arousal * 0.4);
    }
  }

  /**
   * Main Animation Loop
   * Rotates ring, pulses particle size based on IPC frequency, and lerps colors.
   * @private
   */
  animate() {
    if (this.isDestroyed) return;

    this.animationFrameId = requestAnimationFrame(this.animate.bind(this));

    const elapsedTime = this.clock.getElapsedTime();
    const deltaTime = this.clock.getDelta();

    // Rotate entire telemetry scene slowly along Y-axis
    this.instancedMesh.rotation.y = elapsedTime * 0.08;

    let matrixNeedsUpdate = false;
    let colorNeedsUpdate = false;

    for (let i = 0; i < this.numChambers; i++) {
      const chamber = this.chambers[i];

      // 1. Color Lerping towards target state
      if (!chamber.currentColor.equals(chamber.targetColor)) {
        chamber.currentColor.lerp(chamber.targetColor, deltaTime * 4.0);
        this.instancedMesh.setColorAt(i, chamber.currentColor);
        colorNeedsUpdate = true;
      }

      // 2. Pulse particle size based on IPC Event Frequency (Hz)
      const pulseFrequency = chamber.ipcFrequency * Math.PI * 2;
      const pulseAmplitude = 0.15 + (chamber.taxLevel * 0.2); // Higher tax increases instability pulse amplitude
      const pulseFactor = 1.0 + Math.sin(elapsedTime * pulseFrequency + chamber.angle * 2) * pulseAmplitude;
      
      const targetScale = chamber.baseScale * pulseFactor;
      chamber.currentScale = THREE.MathUtils.lerp(chamber.currentScale, targetScale, deltaTime * 8.0);

      // 3. Orbital Wave Position Update
      const x = Math.cos(chamber.angle) * this.baseRadius;
      const z = Math.sin(chamber.angle) * this.baseRadius;
      const y = chamber.heightOffset + Math.cos(elapsedTime * 1.5 + chamber.angle * 3) * 0.5;

      this.dummyPosition.set(x, y, z);
      this.dummyQuaternion.setFromAxisAngle(THREE.Object3D.DEFAULT_UP, elapsedTime * 0.2 + chamber.angle);
      this.dummyScale.set(chamber.currentScale, chamber.currentScale, chamber.currentScale);
      
      this.dummyMatrix.compose(this.dummyPosition, this.dummyQuaternion, this.dummyScale);
      this.instancedMesh.setMatrixAt(i, this.dummyMatrix);
      matrixNeedsUpdate = true;
    }

    if (matrixNeedsUpdate) {
      this.instancedMesh.instanceMatrix.needsUpdate = true;
    }
    if (colorNeedsUpdate && this.instancedMesh.instanceColor) {
      this.instancedMesh.instanceColor.needsUpdate = true;
    }

    this.renderer.render(this.scene, this.camera);
  }

  /**
   * Window Resize Handler
   * @private
   */
  onResize() {
    if (!this.container || this.isDestroyed) return;
    const width = this.container.clientWidth || window.innerWidth;
    const height = this.container.clientHeight || window.innerHeight;

    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }

  /**
   * Gracefully dispose and cleanup WebGL resources
   */
  destroy() {
    this.isDestroyed = true;
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
    }

    window.removeEventListener('resize', this._onResize);

    if (this.instancedMesh) {
      this.instancedMesh.geometry.dispose();
      if (Array.isArray(this.instancedMesh.material)) {
        this.instancedMesh.material.forEach(m => m.dispose());
      } else {
        this.instancedMesh.material.dispose();
      }
      this.scene.remove(this.instancedMesh);
    }

    if (this.renderer) {
      this.renderer.dispose();
      if (this.renderer.domElement && this.renderer.domElement.parentNode) {
        this.renderer.domElement.parentNode.removeChild(this.renderer.domElement);
      }
    }

    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.chambers = [];
  }
}

