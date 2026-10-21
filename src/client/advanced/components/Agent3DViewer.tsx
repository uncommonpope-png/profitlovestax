// @ts-nocheck
import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { AgentProfile } from "../types";
import { 
  RotateCcw, Sparkles, Video, ShieldAlert, Laptop, Eye, HelpCircle, 
  RotateCw, Swords, Shield, SwatchBook, Wand2, RefreshCw
} from "lucide-react";

interface Agent3DViewerProps {
  profile: AgentProfile;
  onChange: (profile: AgentProfile) => void;
  accentColor: string;
}

export const Agent3DViewer: React.FC<Agent3DViewerProps> = ({ profile, onChange, accentColor }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  // Local interaction state
  const [rotationSpeed, setRotationSpeed] = useState<number>(0.005);
  const [neonThemePreset, setNeonThemePreset] = useState<"cyber_blue" | "toxic_green" | "psycho_pink" | "gold_rush">("psycho_pink");
  const [customWeaponHeld, setCustomWeaponHeld] = useState<boolean>(true);
  const [glowIntensity, setGlowIntensity] = useState<number>(1.5);
  const [droneOrbitSpeed, setDroneOrbitSpeed] = useState<number>(1.2);
  const [modelPitch, setModelPitch] = useState<number>(0);
  const [viewAngle, setViewAngle] = useState<"front" | "back" | "action">("front");

  // Track mouse states for drag to rotate
  const isDragging = useRef<boolean>(false);
  const previousMousePosition = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const modelRotation = useRef<{ y: number; x: number }>({ y: 0.5, x: 0 });

  // Refs to Three.js elements for updating values on slide
  const sceneRef = useRef<THREE.Scene | null>(null);
  const characterGroupRef = useRef<THREE.Group | null>(null);
  const droneRef = useRef<THREE.Mesh | null>(null);
  const platformGridRef = useRef<THREE.GridHelper | null>(null);

  // Materials refs to update colors live on key change
  const headMaterialRef = useRef<THREE.MeshStandardMaterial | null>(null);
  const torsoMaterialRef = useRef<THREE.MeshStandardMaterial | null>(null);
  const hairMaterialRef = useRef<THREE.MeshStandardMaterial | null>(null);
  const visorMaterialRef = useRef<THREE.MeshStandardMaterial | null>(null);
  const weaponMaterialRef = useRef<THREE.MeshStandardMaterial | null>(null);
  const droneMaterialRef = useRef<THREE.MeshStandardMaterial | null>(null);

  // Apply default colors if not defined
  const cColor = profile.clothingColor || "#10b981";
  const hColor = profile.hairColor || "#3b82f6";
  const wColor = profile.weaponColor || "#f43f5e";

  // Re-build or update the 3D meshes depending on the properties changed
  useEffect(() => {
    if (!canvasRef.current) return;

    // SCENESETUP
    const scene = new THREE.Scene();
    sceneRef.current = scene;
    scene.background = new THREE.Color(0x06060c);
    scene.fog = new THREE.FogExp2(0x06060c, 0.08);

    // CAMERA
    const width = containerRef.current?.clientWidth || 400;
    const height = 360;
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(0, 1.8, 5.5);
    camera.lookAt(0, 0.9, 0);

    // RENDERER
    const renderer = new THREE.WebGLRenderer({
      canvas: canvasRef.current,
      antialias: true,
      alpha: false,
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;

    // CHARACTER MASTER GROUP
    const characterGroup = new THREE.Group();
    characterGroup.position.set(0, 0, 0);
    characterGroup.rotation.y = modelRotation.current.y;
    characterGroup.rotation.x = modelRotation.current.x;
    scene.add(characterGroup);
    characterGroupRef.current = characterGroup;

    // 1. NEON HOLOGRAPHIC DOJO FIELD BASE
    const baseGeo = new THREE.CylinderGeometry(1.6, 1.8, 0.15, 32);
    const baseMat = new THREE.MeshStandardMaterial({
      color: 0x0a0a16,
      roughness: 0.1,
      metalness: 0.9,
    });
    const baseMesh = new THREE.Mesh(baseGeo, baseMat);
    baseMesh.position.y = -0.075;
    scene.add(baseMesh);

    // Glow boundary rings
    const ringGeo1 = new THREE.TorusGeometry(1.65, 0.03, 8, 48);
    const ringMat1 = new THREE.MeshStandardMaterial({
      color: new THREE.Color(accentColor),
      emissive: new THREE.Color(accentColor),
      emissiveIntensity: glowIntensity,
    });
    const ring1 = new THREE.Mesh(ringGeo1, ringMat1);
    ring1.rotation.x = Math.PI / 2;
    ring1.position.y = 0.01;
    scene.add(ring1);

    const ringGeo2 = new THREE.TorusGeometry(1.4, 0.015, 8, 48);
    const ringMat2 = new THREE.MeshStandardMaterial({
      color: new THREE.Color(0x06b6d4),
      emissive: new THREE.Color(0x06b6d4),
      emissiveIntensity: 0.6,
    });
    const ring2 = new THREE.Mesh(ringGeo2, ringMat2);
    ring2.rotation.x = Math.PI / 2;
    ring2.position.y = 0.01;
    scene.add(ring2);

    // Horizontal cyber-grid
    const gridHelper = new THREE.GridHelper(6, 16, 0xec4899, 0x1e1e38);
    gridHelper.position.y = 0.01;
    scene.add(gridHelper);
    platformGridRef.current = gridHelper;

    // Set grid color matching core color
    const gridColors = gridHelper.geometry.attributes.color;
    if (gridColors) {
      gridHelper.material.color.setHex(0x1e1e38);
    }

    // 2. AGENT MATERIALS (Declared to be reused across styles)
    const customTeal = new THREE.Color(accentColor);
    const darkMat = new THREE.MeshStandardMaterial({
      color: 0x121220,
      roughness: 0.6,
      metalness: 0.7,
    });

    const bodyMetal = new THREE.MeshStandardMaterial({
      color: 0x1a1a2e,
      roughness: 0.25,
      metalness: 0.9,
    });

    const clothColorHex = new THREE.Color(cColor);
    const clothMaterial = new THREE.MeshStandardMaterial({
      color: clothColorHex,
      roughness: 0.5,
      metalness: 0.45,
    });
    torsoMaterialRef.current = clothMaterial;

    const hairColorHex = new THREE.Color(hColor);
    const hairMaterial = new THREE.MeshStandardMaterial({
      color: hairColorHex,
      emissive: hairColorHex,
      emissiveIntensity: glowIntensity * 0.8,
      roughness: 0.1,
    });
    hairMaterialRef.current = hairMaterial;

    const visorColorHex = new THREE.Color(accentColor);
    const visorMaterial = new THREE.MeshStandardMaterial({
      color: visorColorHex,
      emissive: visorColorHex,
      emissiveIntensity: glowIntensity * 1.5,
      roughness: 0.02,
      metalness: 0.95,
    });
    visorMaterialRef.current = visorMaterial;

    const weaponColorHex = new THREE.Color(wColor);
    const weaponMaterial = new THREE.MeshStandardMaterial({
      color: weaponColorHex,
      emissive: weaponColorHex,
      emissiveIntensity: glowIntensity * 1.8,
      roughness: 0.05,
    });
    weaponMaterialRef.current = weaponMaterial;

    // Head Material base - metal gloss cyborg face
    const headMaterial = new THREE.MeshStandardMaterial({
      color: 0x222238,
      roughness: 0.35,
      metalness: 0.8,
    });
    headMaterialRef.current = headMaterial;

    // 3. COMPILE CHARACTER BODY PARTS
    // Neck
    const neckGeo = new THREE.CylinderGeometry(0.12, 0.15, 0.25, 12);
    const neck = new THREE.Mesh(neckGeo, darkMat);
    neck.position.y = 1.35;
    characterGroup.add(neck);

    // Head Unit
    const headGeo = new THREE.SphereGeometry(0.3, 24, 24);
    const head = new THREE.Mesh(headGeo, headMaterial);
    head.position.y = 1.62;
    characterGroup.add(head);

    // Interactive Neon Visor / Scanner
    const visorGeo = new THREE.BoxGeometry(0.48, 0.11, 0.32);
    const visor = new THREE.Mesh(visorGeo, visorMaterial);
    visor.position.set(0, 1.67, 0.15);
    characterGroup.add(visor);

    // Cybernetic head ports (back of head details)
    const portGeo = new THREE.CylinderGeometry(0.04, 0.04, 0.02, 8);
    portGeo.rotateX(Math.PI / 2);
    const port1 = new THREE.Mesh(portGeo, darkMat);
    port1.position.set(0.08, 1.55, -0.25);
    characterGroup.add(port1);
    
    const port2 = new THREE.Mesh(portGeo, hairMaterial);
    port2.position.set(-0.08, 1.55, -0.25);
    characterGroup.add(port2);

    // 4. CLOTHING STYLES COMPILATION
    let torsoMeshGroup = new THREE.Group();
    
    if (profile.clothingStyle === "tactical_suit") {
      // Sleek military tactical plating
      const torsoPlateGeo = new THREE.CylinderGeometry(0.24, 0.16, 0.75, 8);
      const mainTorso = new THREE.Mesh(torsoPlateGeo, bodyMetal);
      torsoMeshGroup.add(mainTorso);

      // Colored chest plate inserts
      const plateGeo = new THREE.BoxGeometry(0.32, 0.44, 0.23);
      const chestPlate = new THREE.Mesh(plateGeo, clothMaterial);
      chestPlate.position.set(0, 0.1, 0.11);
      torsoMeshGroup.add(chestPlate);

      // Neon Arc-reactor core
      const reactorGeo = new THREE.TetrahedronGeometry(0.08);
      const reactor = new THREE.Mesh(reactorGeo, visorMaterial);
      reactor.position.set(0, 0.14, 0.22);
      reactor.rotation.set(0.2, 0.4, 0.5);
      torsoMeshGroup.add(reactor);

      // Shoulder pauldrons
      const shoulderGeo = new THREE.SphereGeometry(0.12, 12, 12);
      const lShoulder = new THREE.Mesh(shoulderGeo, clothMaterial);
      lShoulder.position.set(-0.38, 0.25, 0);
      const rShoulder = new THREE.Mesh(shoulderGeo, clothMaterial);
      rShoulder.position.set(0.38, 0.25, 0);
      torsoMeshGroup.add(lShoulder);
      torsoMeshGroup.add(rShoulder);

    } else if (profile.clothingStyle === "neo_duster") {
      // Long flowing trenchcoat matrix-style
      const innerTorsoGeo = new THREE.CylinderGeometry(0.22, 0.18, 0.75, 8);
      const innerTorso = new THREE.Mesh(innerTorsoGeo, darkMat);
      torsoMeshGroup.add(innerTorso);

      // Duster Collar (tall cones wrapping back)
      const collarGeo = new THREE.CylinderGeometry(0.32, 0.26, 0.2, 16, 2, true);
      const dusterCollar = new THREE.Mesh(collarGeo, clothMaterial);
      dusterCollar.position.set(0, 0.38, 0);
      dusterCollar.scale.set(1.1, 1, 1.2);
      torsoMeshGroup.add(dusterCollar);

      // Duster panels hanging down past back/sides
      const panelGeo = new THREE.BoxGeometry(0.12, 0.9, 0.3);
      const lPanel = new THREE.Mesh(panelGeo, clothMaterial);
      lPanel.position.set(-0.28, -0.3, -0.05);
      lPanel.rotation.z = 0.08;
      const rPanel = new THREE.Mesh(panelGeo, clothMaterial);
      rPanel.position.set(0.28, -0.3, -0.05);
      rPanel.rotation.z = -0.08;
      torsoMeshGroup.add(lPanel);
      torsoMeshGroup.add(rPanel);

      // Glowing trim stripes in accent / clothing color
      const trimGeo = new THREE.BoxGeometry(0.02, 0.7, 0.02);
      const lTrim = new THREE.Mesh(trimGeo, visorMaterial);
      lTrim.position.set(-0.35, -0.2, 0.1);
      const rTrim = new THREE.Mesh(trimGeo, visorMaterial);
      rTrim.position.set(0.35, -0.2, 0.1);
      torsoMeshGroup.add(lTrim);
      torsoMeshGroup.add(rTrim);

    } else if (profile.clothingStyle === "cyberpunk_harness") {
      // Harness configuration
      const bodyGeo = new THREE.CylinderGeometry(0.25, 0.18, 0.75, 12);
      const baseBody = new THREE.Mesh(bodyGeo, darkMat);
      torsoMeshGroup.add(baseBody);

      // Strap horizontal bands in clothing color
      const beltGeo1 = new THREE.CylinderGeometry(0.26, 0.26, 0.06, 16);
      const belt1 = new THREE.Mesh(beltGeo1, clothMaterial);
      belt1.position.y = 0.12;
      torsoMeshGroup.add(belt1);

      const beltGeo2 = new THREE.CylinderGeometry(0.22, 0.22, 0.06, 16);
      const belt2 = new THREE.Mesh(beltGeo2, clothMaterial);
      belt2.position.y = -0.15;
      torsoMeshGroup.add(belt2);

      // Crossing shoulder harness straps
      const strapGeo = new THREE.BoxGeometry(0.05, 0.8, 0.23);
      const strapL = new THREE.Mesh(strapGeo, clothMaterial);
      strapL.position.set(-0.12, 0.05, 0.11);
      strapL.rotation.z = 0.24;
      const strapR = new THREE.Mesh(strapGeo, clothMaterial);
      strapR.position.set(0.12, 0.05, 0.11);
      strapR.rotation.z = -0.24;
      torsoMeshGroup.add(strapL);
      torsoMeshGroup.add(strapR);

      // Glowing power cells
      const batteryGeo = new THREE.CylinderGeometry(0.03, 0.03, 0.1, 8);
      const batteryL = new THREE.Mesh(batteryGeo, visorMaterial);
      batteryL.position.set(-0.2, 0.15, 0.16);
      batteryL.rotation.z = Math.PI / 2;
      const batteryR = new THREE.Mesh(batteryGeo, visorMaterial);
      batteryR.position.set(0.2, 0.15, 0.16);
      batteryR.rotation.z = Math.PI / 2;
      torsoMeshGroup.add(batteryL);
      torsoMeshGroup.add(batteryR);

    } else { // hoodie
      // Bulky urban fabric hoodie
      const hoodieGeo = new THREE.CylinderGeometry(0.28, 0.22, 0.72, 12);
      const bodyHood = new THREE.Mesh(hoodieGeo, clothMaterial);
      torsoMeshGroup.add(bodyHood);

      // Big round envelope hood around the head
      const hoodWrapGeo = new THREE.TorusGeometry(0.3, 0.15, 12, 24);
      const hoodWrap = new THREE.Mesh(hoodWrapGeo, clothMaterial);
      hoodWrap.position.set(0, 0.42, -0.05);
      hoodWrap.rotation.x = Math.PI / 2.2;
      torsoMeshGroup.add(hoodWrap);

      // Neon drawstring cords
      const cordGeo = new THREE.CylinderGeometry(0.015, 0.015, 0.25, 6);
      const lCord = new THREE.Mesh(cordGeo, visorMaterial);
      lCord.position.set(-0.1, 0.18, 0.26);
      lCord.rotation.z = 0.04;
      const rCord = new THREE.Mesh(cordGeo, visorMaterial);
      rCord.position.set(0.1, 0.18, 0.26);
      rCord.rotation.z = -0.04;
      torsoMeshGroup.add(lCord);
      torsoMeshGroup.add(rCord);
    }

    // Place arms onto the torso
    const armGeo = new THREE.CylinderGeometry(0.08, 0.07, 0.62, 8);
    const lArm = new THREE.Mesh(armGeo, darkMat);
    lArm.position.set(-0.35, 0.05, 0);
    lArm.rotation.z = 0.15;
    const rArm = new THREE.Mesh(armGeo, darkMat);
    rArm.position.set(0.35, 0.05, 0);
    rArm.rotation.z = -0.15;
    torsoMeshGroup.add(lArm);
    torsoMeshGroup.add(rArm);

    // Glowing forearm wrist cybercom units
    const sleeveGeo = new THREE.CylinderGeometry(0.09, 0.08, 0.25, 8);
    const lSleeveUnit = new THREE.Mesh(sleeveGeo, visorMaterial);
    lSleeveUnit.position.set(-0.4, -0.12, 0.02);
    lSleeveUnit.rotation.z = 0.15;
    torsoMeshGroup.add(lSleeveUnit);

    const rSleeveUnit = new THREE.Mesh(sleeveGeo, visorMaterial);
    rSleeveUnit.position.set(0.4, -0.12, 0.02);
    rSleeveUnit.rotation.z = -0.15;
    torsoMeshGroup.add(rSleeveUnit);

    // Position Torso group
    torsoMeshGroup.position.y = 0.95;
    characterGroup.add(torsoMeshGroup);


    // 5. HAIR STYLE RIGS
    const hairGroup = new THREE.Group();
    hairGroup.position.set(0, 1.62, 0); // Align directly on top of head center

    if (profile.hairStyle === "cyber_spike") {
      // Curved Mohawk style spikes sticking out
      const spikeGeo = new THREE.ConeGeometry(0.07, 0.28, 6);
      spikeGeo.rotateX(Math.PI / 1.8);
      
      const offsets = [
        { y: 0.26, z: 0.10, rotX: -0.2 },
        { y: 0.32, z: -0.02, rotX: 0 },
        { y: 0.28, z: -0.14, rotX: 0.25 },
        { y: 0.18, z: -0.26, rotX: 0.5 },
        { y: 0.06, z: -0.32, rotX: 0.8 },
      ];

      offsets.forEach((off, idx) => {
        const spike = new THREE.Mesh(spikeGeo, hairMaterial);
        spike.position.set(0, off.y, off.z);
        spike.rotation.x = off.rotX;
        spike.scale.set(1.1 - idx * 0.08, 1.1 - idx * 0.06, 1.1 - idx * 0.08);
        hairGroup.add(spike);
      });

    } else if (profile.hairStyle === "neon_mohawk") {
      // Tech crystallised neon comb
      const crystalGeo = new THREE.BoxGeometry(0.05, 0.18, 0.15);
      const steps = 7;
      for (let i = 0; i < steps; i++) {
        const ratio = i / (steps - 1);
        const crystal = new THREE.Mesh(crystalGeo, hairMaterial);
        
        // Arrange in a beautiful arch front to back
        const angle = -Math.PI / 6 + ratio * (Math.PI / 1.2);
        crystal.position.z = Math.cos(angle) * 0.32;
        crystal.position.y = Math.sin(angle) * 0.32 + 0.05;
        crystal.rotation.x = -angle + Math.PI / 2;
        
        // Random scale variation for rugged cyber design
        crystal.scale.y = 1.0 + Math.sin(ratio * Math.PI) * 0.4;
        hairGroup.add(crystal);
      }

    } else if (profile.hairStyle === "sleek_bob") {
      // Bob panels surrounding sides of head
      const bobGeo = new THREE.BoxGeometry(0.06, 0.44, 0.18);
      const lBob = new THREE.Mesh(bobGeo, hairMaterial);
      lBob.position.set(-0.28, 0.05, 0.05);
      lBob.rotation.z = -0.12;
      
      const rBob = new THREE.Mesh(bobGeo, hairMaterial);
      rBob.position.set(0.28, 0.05, 0.05);
      rBob.rotation.z = 0.12;
      hairGroup.add(lBob);
      hairGroup.add(rBob);

      // Crown cover cap
      const capGeo = new THREE.SphereGeometry(0.32, 16, 16, 0, Math.PI * 2, 0, Math.PI / 2);
      const cap = new THREE.Mesh(capGeo, hairMaterial);
      cap.position.y = 0.06;
      hairGroup.add(cap);

    } else if (profile.hairStyle === "synth_waves") {
      // Floating wave discs
      const waveGeo = new THREE.TorusGeometry(0.24, 0.04, 8, 24);
      waveGeo.rotateX(Math.PI / 2);
      
      const capGeo = new THREE.SphereGeometry(0.31, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2.2);
      const synthCap = new THREE.Mesh(capGeo, darkMat);
      synthCap.position.y = 0.04;
      hairGroup.add(synthCap);

      const w1 = new THREE.Mesh(waveGeo, hairMaterial);
      w1.position.y = 0.16;
      w1.scale.set(1.1, 0.6, 1.1);
      
      const w2 = new THREE.Mesh(waveGeo, hairMaterial);
      w2.position.set(0, 0.26, -0.05);
      w2.scale.set(0.9, 0.5, 0.9);

      const w3 = new THREE.Mesh(waveGeo, hairMaterial);
      w3.position.set(0, 0.06, -0.1);
      w3.scale.set(1.15, 0.7, 1.15);

      hairGroup.add(w1);
      hairGroup.add(w2);
      hairGroup.add(w3);

    } else { // bald
      // Cyborg skull plates
      const implantGeo = new THREE.BoxGeometry(0.12, 0.03, 0.2);
      const implant = new THREE.Mesh(implantGeo, hairMaterial);
      implant.position.set(0, 0.28, -0.06);
      hairGroup.add(implant);

      const skullCapGeo = new THREE.SphereGeometry(0.301, 16, 16);
      const skullCap = new THREE.Mesh(skullCapGeo, headMaterial);
      hairGroup.add(skullCap);

      // Embedded pulsing dots
      const dotGeo = new THREE.SphereGeometry(0.03, 8, 8);
      const d1 = new THREE.Mesh(dotGeo, visorMaterial);
      d1.position.set(0.12, 0.25, -0.15);
      const d2 = new THREE.Mesh(dotGeo, visorMaterial);
      d2.position.set(-0.12, 0.25, -0.15);
      hairGroup.add(d1);
      hairGroup.add(d2);
    }

    characterGroup.add(hairGroup);


    // 6. WEAPONS RIGS (Attached or crossed on back)
    if (customWeaponHeld && profile.equippedWeapon !== "none") {
      const weaponGroup = new THREE.Group();

      if (profile.equippedWeapon === "glowing_katanas") {
        // Crossed dual neon energy katanas on the back
        // Sword 1
        const swordGroup1 = new THREE.Group();
        const bladeGeo1 = new THREE.BoxGeometry(0.04, 1.1, 0.015);
        const blade1 = new THREE.Mesh(bladeGeo1, weaponMaterial);
        blade1.position.y = 0.5;
        swordGroup1.add(blade1);

        const hiltGeo1 = new THREE.CylinderGeometry(0.02, 0.02, 0.24, 8);
        const hilt1 = new THREE.Mesh(hiltGeo1, darkMat);
        hilt1.position.y = -0.08;
        swordGroup1.add(hilt1);

        const guardGeo = new THREE.TorusGeometry(0.04, 0.015, 6, 12);
        guardGeo.rotateX(Math.PI / 2);
        const guard1 = new THREE.Mesh(guardGeo, hairMaterial);
        swordGroup1.add(guard1);

        swordGroup1.rotation.set(0.1, 0.2, Math.PI / 3.8);
        swordGroup1.position.set(-0.18, 0.92, -0.32);
        weaponGroup.add(swordGroup1);

        // Sword 2
        const swordGroup2 = swordGroup1.clone();
        swordGroup2.rotation.z = -Math.PI / 3.8;
        swordGroup2.position.x = 0.18;
        weaponGroup.add(swordGroup2);

      } else if (profile.equippedWeapon === "plasma_rifle") {
        // High-tech shoulder-mounted kinetic plasma rifle
        const rifleGroup = new THREE.Group();
        
        // Main receiver
        const bodyGeo = new THREE.BoxGeometry(0.14, 0.16, 0.85);
        const rBody = new THREE.Mesh(bodyGeo, darkMat);
        rifleGroup.add(rBody);

        // Core charging coils
        const barrelGeo = new THREE.CylinderGeometry(0.035, 0.04, 0.95, 8);
        barrelGeo.rotateX(Math.PI / 2);
        const rBarrel = new THREE.Mesh(barrelGeo, bodyMetal);
        rBarrel.position.set(0, 0.03, 0.2);
        rifleGroup.add(rBarrel);

        // Emissive power glass chamber
        const chamberGeo = new THREE.CylinderGeometry(0.06, 0.06, 0.28, 8);
        chamberGeo.rotateX(Math.PI / 2);
        const rChamber = new THREE.Mesh(chamberGeo, weaponMaterial);
        rChamber.position.set(0.02, -0.01, -0.1);
        rifleGroup.add(rChamber);

        const scopeGeo = new THREE.BoxGeometry(0.05, 0.05, 0.25);
        const rScope = new THREE.Mesh(scopeGeo, hairMaterial);
        rScope.position.set(0.05, 0.11, -0.05);
        rifleGroup.add(rScope);

        // Set orientation as shoulder slung over right back
        rifleGroup.rotation.set(-1.25, 0.45, -0.2);
        rifleGroup.position.set(0.38, 1.25, -0.2);
        weaponGroup.add(rifleGroup);

      } else if (profile.equippedWeapon === "cyber_deck") {
        // High-fidelity computational Deck attached on the left forearm
        const deckGroup = new THREE.Group();
        const baseBoxGeo = new THREE.BoxGeometry(0.34, 0.1, 0.52);
        const deckBase = new THREE.Mesh(baseBoxGeo, darkMat);
        deckGroup.add(deckBase);

        // Keyboard grid / glowing matrix panel
        const panelGeo = new THREE.BoxGeometry(0.28, 0.02, 0.42);
        const dPanel = new THREE.Mesh(panelGeo, weaponMaterial);
        dPanel.position.y = 0.052;
        deckGroup.add(dPanel);

        // Floating fiber-optic cable loops
        const wireGeo = new THREE.TorusGeometry(0.14, 0.012, 6, 16, Math.PI * 1.5);
        wireGeo.rotateZ(Math.PI / 2);
        const wireL = new THREE.Mesh(wireGeo, hairMaterial);
        wireL.position.set(-0.16, -0.04, 0);
        deckGroup.add(wireL);

        // Position mounted on the forearm
        deckGroup.rotation.set(0.3, -0.2, 0.65);
        deckGroup.position.set(-0.64, 0.88, 0.22);
        weaponGroup.add(deckGroup);
      }

      characterGroup.add(weaponGroup);
    }


    // 7. FLOATING INTEL MICRO-DRONE (Companion Bot)
    const droneMasterGroup = new THREE.Group();
    droneMasterGroup.position.y = 1.35; // Center around agent chest level
    scene.add(droneMasterGroup);

    // Mini flying satellite orb
    const droneCoreGeo = new THREE.OctahedronGeometry(0.11);
    const droneCore = new THREE.Mesh(droneCoreGeo, bodyMetal);
    droneMasterGroup.add(droneCore);
    droneRef.current = droneCore;

    // Glowing signal eye inside drone
    const droneEyeGeo = new THREE.SphereGeometry(0.04, 8, 8);
    const droneEye = new THREE.Mesh(droneEyeGeo, weaponMaterial);
    droneEye.position.set(0, 0, 0.09);
    droneCore.add(droneEye);

    // Glowing coordinate ring around companion bot
    const droneRingGeo = new THREE.TorusGeometry(0.22, 0.01, 4, 16);
    const droneRing = new THREE.Mesh(droneRingGeo, hairMaterial);
    droneRing.rotation.x = Math.PI / 2;
    droneCore.add(droneRing);


    // 8. LIGHTS IN SCENE
    const ambientLight = new THREE.AmbientLight(0x0c0c1b, 1.8);
    scene.add(ambientLight);

    // Primary Neon Pink Spotlight
    const spotPink = new THREE.SpotLight(0xec4899, 12, 12, Math.PI / 6, 0.5, 1);
    spotPink.position.set(3, 4, 3);
    spotPink.lookAt(0, 1.0, 0);
    scene.add(spotPink);

    // Opposite Cyber Blue Spotlight
    const spotBlue = new THREE.SpotLight(0x06b6d4, 10, 12, Math.PI / 6, 0.5, 1);
    spotBlue.position.set(-3, 4, 3);
    spotBlue.lookAt(0, 1.0, 0);
    scene.add(spotBlue);

    // Under-Platform uplight for matrix glow
    const pointUplight = new THREE.PointLight(new THREE.Color(accentColor), 5, 5);
    pointUplight.position.set(0, 0.1, 0);
    scene.add(pointUplight);

    // Rear rim backlight for high-fidelity contour halo
    const rimLight = new THREE.DirectionalLight(new THREE.Color(accentColor), 3);
    rimLight.position.set(0, 2, -4);
    scene.add(rimLight);


    // 9. ANIMATION LOOP
    let animationFrameId: number;
    let clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const elapsedTime = clock.getElapsedTime();

      // Slow dynamic spin if not being dragged
      if (!isDragging.current && rotationSpeed > 0) {
        modelRotation.current.y += rotationSpeed;
        characterGroup.rotation.y = modelRotation.current.y;
      }

      // Smooth bobbing for character idle
      characterGroup.position.y = Math.sin(elapsedTime * 1.5) * 0.02 + 0.08;
      
      // Floating drone companion orbit coordinates
      if (droneCore) {
        const angle = elapsedTime * droneOrbitSpeed;
        const radius = 1.0 + Math.sin(elapsedTime * 0.8) * 0.15;
        droneCore.position.x = Math.cos(angle) * radius;
        droneCore.position.z = Math.sin(angle) * radius;
        droneCore.position.y = Math.sin(elapsedTime * 2.8) * 0.15 + 0.25;
        
        // Spin drone on its core
        droneCore.rotation.y = elapsedTime * 2.5; 
        droneCore.rotation.z = elapsedTime * 1.25;
      }

      // Slightly shift spotlights
      spotPink.position.x = 3 + Math.sin(elapsedTime * 0.5) * 1.5;
      spotBlue.position.x = -3 - Math.cos(elapsedTime * 0.5) * 1.5;

      // Pulse emitter lights
      pointUplight.intensity = 4 + Math.sin(elapsedTime * 4) * 1.2;

      renderer.render(scene, camera);
    };

    animate();

    // Resize event listener
    const handleResize = () => {
      if (!containerRef.current || !canvasRef.current) return;
      const w = containerRef.current.clientWidth;
      camera.aspect = w / height;
      camera.updateProjectionMatrix();
      renderer.setSize(w, height);
    };

    window.addEventListener("resize", handleResize);

    // CLEANUP
    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("resize", handleResize);
      renderer.dispose();
      
      // Dispose materials & geometries
      baseGeo.dispose();
      baseMat.dispose();
      ringGeo1.dispose();
      ringMat1.dispose();
      ringGeo2.dispose();
      ringMat2.dispose();
      neckGeo.dispose();
      headGeo.dispose();
      visorGeo.dispose();
      portGeo.dispose();
      gridHelper.dispose();
      
      darkMat.dispose();
      bodyMetal.dispose();
      clothMaterial.dispose();
      hairMaterial.dispose();
      visorMaterial.dispose();
      weaponMaterial.dispose();
      headMaterial.dispose();
    };
  }, [
    profile.clothingStyle, 
    profile.clothingColor, 
    profile.hairStyle, 
    profile.hairColor, 
    profile.equippedWeapon, 
    profile.weaponColor, 
    profile.avatarColor,
    accentColor,
    customWeaponHeld,
    glowIntensity,
    droneOrbitSpeed,
    viewAngle
  ]);

  // Adjust viewpoint instantly
  useEffect(() => {
    if (!characterGroupRef.current) return;
    if (viewAngle === "front") {
      modelRotation.current.y = 0.5;
      modelRotation.current.x = 0;
    } else if (viewAngle === "back") {
      modelRotation.current.y = Math.PI + 0.5;
      modelRotation.current.x = 0.1;
    } else if (viewAngle === "action") {
      modelRotation.current.y = -0.6;
      modelRotation.current.x = 0.15;
    }
    characterGroupRef.current.rotation.y = modelRotation.current.y;
    characterGroupRef.current.rotation.x = modelRotation.current.x;
  }, [viewAngle]);

  // Handle manual coordinate drag rotation
  const handleMouseDown = (e: React.MouseEvent) => {
    isDragging.current = true;
    previousMousePosition.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging.current || !characterGroupRef.current) return;
    
    // Disable standard spin since user is overriding
    setRotationSpeed(0);

    const deltaX = e.clientX - previousMousePosition.current.x;
    const deltaY = e.clientY - previousMousePosition.current.y;

    modelRotation.current.y += deltaX * 0.01;
    modelRotation.current.x += deltaY * 0.01;

    // Contrain vertical pitch to prevent flipping upsidedown
    modelRotation.current.x = Math.max(-0.4, Math.min(0.6, modelRotation.current.x));

    characterGroupRef.current.rotation.y = modelRotation.current.y;
    characterGroupRef.current.rotation.x = modelRotation.current.x;

    previousMousePosition.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseUpOrLeave = () => {
    isDragging.current = false;
  };

  return (
    <div className="flex flex-col h-full bg-slate-950 rounded-2xl border border-slate-800/80 overflow-hidden" id="interactive-3d-character-workbench">
      
      {/* 3D Header HUD */}
      <div className="bg-slate-900/50 px-4 py-3 border-b border-slate-800/80 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="font-mono text-[11px] text-emerald-400 font-bold uppercase tracking-widest">S.O.U.L Core 3D Sandbox</span>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => {
              // Toggle rotation speed back to standard or zero
              setRotationSpeed(prev => prev === 0 ? 0.005 : 0);
            }}
            className="p-1 hover:bg-slate-800 rounded border border-slate-800/50 text-slate-400 hover:text-white transition-all cursor-pointer"
            title="Toggle rotation motor"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${rotationSpeed > 0 ? "animate-spin" : ""}`} style={{ animationDuration: "8s" }} />
          </button>
          
          <span className="font-mono text-[10px] bg-slate-950 border border-slate-800 px-2 py-0.5 rounded text-slate-400">
            Active: {profile.name || "UNNAMED"}
          </span>
        </div>
      </div>

      {/* Render Stage Container */}
      <div 
        ref={containerRef} 
        className="relative bg-slate-950 flex-1 min-h-[360px] flex items-center justify-center cursor-grab active:cursor-grabbing group select-none overflow-hidden"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUpOrLeave}
        onMouseLeave={handleMouseUpOrLeave}
      >
        <canvas ref={canvasRef} className="w-full h-full block" />

        {/* 3D Space View Angle Presets Panel */}
        <div className="absolute top-3 left-3 z-10 flex flex-col gap-1.5 bg-slate-950/85 backdrop-blur-md border border-slate-800 p-2 rounded-xl">
          <span className="font-mono text-[8px] text-slate-500 font-bold uppercase tracking-widest text-center border-b border-slate-900 pb-1 mb-1">CAMERA ANGLE</span>
          <button
            onClick={() => setViewAngle("front")}
            className={`flex items-center gap-1.5 px-2 py-1 rounded text-[10px] font-mono transition-all text-left ${viewAngle === "front" ? "bg-slate-900 text-white border border-slate-800" : "text-slate-400 hover:text-white"}`}
          >
            <Video className="w-2.5 h-2.5" style={{ color: accentColor }} />
            <span>FRONT SCAN</span>
          </button>
          <button
            onClick={() => setViewAngle("back")}
            className={`flex items-center gap-1.5 px-2 py-1 rounded text-[10px] font-mono transition-all text-left ${viewAngle === "back" ? "bg-slate-900 text-white border border-slate-800" : "text-slate-400 hover:text-white"}`}
          >
            <Video className="w-2.5 h-2.5" style={{ color: hColor }} />
            <span>BACK CORE</span>
          </button>
          <button
            onClick={() => setViewAngle("action")}
            className={`flex items-center gap-1.5 px-2 py-1 rounded text-[10px] font-mono transition-all text-left ${viewAngle === "action" ? "bg-slate-900 text-white border border-slate-800" : "text-slate-400 hover:text-white"}`}
          >
            <Swords className="w-2.5 h-2.5" style={{ color: wColor }} />
            <span>ACTION SLING</span>
          </button>
        </div>

        {/* Floating Holographic Compass indicators */}
        <div className="absolute bottom-3 left-3 z-10 pointer-events-none">
          <div className="font-mono text-[9px] text-slate-600 uppercase flex flex-col gap-0.5 bg-slate-950/40 p-1.5 rounded-lg border border-slate-900">
            <div>θ: {modelRotation.current.y.toFixed(2)} rad</div>
            <div>φ: {modelRotation.current.x.toFixed(2)} pitch</div>
            <div>STATUS: ONLINE</div>
          </div>
        </div>

        {/* Drag rotation helper banner */}
        <div className="absolute bottom-3 right-3 z-10 pointer-events-none opacity-0 group-hover:opacity-100 transition-all duration-300">
          <span className="font-mono text-[9px] bg-slate-900/80 border border-slate-800 px-2 py-1 rounded-md text-emerald-400 flex items-center gap-1">
            <RotateCcw className="w-3 h-3 animate-pulse" />
            Drag Canvas to Rotate 3D Core
          </span>
        </div>
      </div>

      {/* Editor Controls Section */}
      <div className="bg-slate-950 border-t border-slate-800/80 p-5 select-none flex flex-col gap-4">
        
        {/* HAIR DESIGN CONTROLLER */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-slate-900/30 p-3.5 rounded-xl border border-slate-800/40 flex flex-col gap-2.5">
            <div className="flex items-center gap-2 border-b border-slate-900 pb-1.5">
              <SwatchBook className="w-4 h-4" style={{ color: hColor }} />
              <span className="font-mono text-xs font-bold text-slate-200">CYBER HAIR CONFIG</span>
            </div>

            <div className="flex flex-col gap-1">
              <label className="font-mono text-[10px] text-slate-400">Hair Matrix Rig</label>
              <select
                value={profile.hairStyle || "cyber_spike"}
                onChange={(e) => {
                  onChange({
                    ...profile,
                    hairStyle: e.target.value as any
                  });
                }}
                className="bg-slate-950 border border-slate-800 text-slate-300 font-mono text-xs p-2 rounded-lg focus:outline-none focus:border-slate-700 cursor-pointer"
              >
                <option value="cyber_spike">Cyberpunk Mohawk Spikes</option>
                <option value="neon_mohawk">Glow Crest Mohawk</option>
                <option value="sleek_bob">Sleek Cyber Bobcut</option>
                <option value="synth_waves">Disc-Emitter Synth-Waves</option>
                <option value="bald">Naked Scalp (Neural Port Base)</option>
              </select>
            </div>

            <div className="flex flex-col gap-1">
              <div className="flex justify-between items-center">
                <label className="font-mono text-[10px] text-slate-400">Glow Rig Color</label>
                <span className="font-mono text-[10px] text-slate-500 uppercase">{hColor}</span>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={hColor}
                  onChange={(e) => {
                    onChange({
                      ...profile,
                      hairColor: e.target.value
                    });
                  }}
                  className="w-8 h-8 rounded border border-slate-800 bg-slate-950 cursor-pointer p-0.5"
                />
                {/* Hair Quick Colors */}
                <div className="flex gap-1">
                  {["#3b82f6", "#ec4899", "#ef4444", "#10b981", "#eab308"].map((col) => (
                    <button
                      key={col}
                      onClick={() => onChange({ ...profile, hairColor: col })}
                      className="w-4 h-4 rounded-full border border-slate-950 cursor-pointer hover:scale-110 active:scale-95 transition-all"
                      style={{ backgroundColor: col }}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* CLOTHES & WEAPONS DESIGN CONTROLLER */}
          <div className="bg-slate-900/30 p-3.5 rounded-xl border border-slate-800/40 flex flex-col gap-2.5">
            <div className="flex items-center gap-2 border-b border-slate-900 pb-1.5">
              <Shield className="w-4 h-4" style={{ color: cColor }} />
              <span className="font-mono text-xs font-bold text-slate-200">TACTICAL HARNESS ARMOR</span>
            </div>

            <div className="flex flex-col gap-1">
              <label className="font-mono text-[10px] text-slate-400">Clothing / Apparel Rig</label>
              <select
                value={profile.clothingStyle || "tactical_suit"}
                onChange={(e) => {
                  onChange({
                    ...profile,
                    clothingStyle: e.target.value as any
                  });
                }}
                className="bg-slate-950 border border-slate-800 text-slate-300 font-mono text-xs p-2 rounded-lg focus:outline-none focus:border-slate-700 cursor-pointer"
              >
                <option value="tactical_suit">Cyborg Soldier Plated Suit</option>
                <option value="neo_duster">Flowing Hacker Trench-Duster</option>
                <option value="cyberpunk_harness">LED Cyberware Crossing Harness</option>
                <option value="hoodie">Urban Oversized Fabric Hoodie</option>
              </select>
            </div>

            <div className="flex flex-col gap-1">
              <div className="flex justify-between items-center">
                <label className="font-mono text-[10px] text-slate-400">Apparel Primary Tone</label>
                <span className="font-mono text-[10px] text-slate-500 uppercase">{cColor}</span>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={cColor}
                  onChange={(e) => {
                    onChange({
                      ...profile,
                      clothingColor: e.target.value
                    });
                  }}
                  className="w-8 h-8 rounded border border-slate-800 bg-slate-950 cursor-pointer p-0.5"
                />
                {/* Cloth Quick Colors */}
                <div className="flex gap-1">
                  {["#10b981", "#14b8a6", "#3b82f6", "#6366f1", "#475569"].map((col) => (
                    <button
                      key={col}
                      onClick={() => onChange({ ...profile, clothingColor: col })}
                      className="w-4 h-4 rounded-full border border-slate-950 cursor-pointer hover:scale-110 active:scale-95 transition-all"
                      style={{ backgroundColor: col }}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* WEAPONS DESIGN SECTION */}
        <div className="bg-slate-900/30 p-3.5 rounded-xl border border-slate-800/40 flex flex-col gap-3">
          <div className="flex items-center justify-between border-b border-slate-900 pb-1.5">
            <div className="flex items-center gap-2">
              <Swords className="w-4 h-4" style={{ color: wColor }} />
              <span className="font-mono text-xs font-bold text-slate-200">TACTICAL DEFENSIVE ARMAMENT</span>
            </div>
            
            <div className="flex items-center gap-1.5">
              <span className="font-mono text-[9px] text-slate-400">EQUIP</span>
              <button
                onClick={() => setCustomWeaponHeld(prev => !prev)}
                className={`w-8 h-4 rounded-full p-0.5 transition-all cursor-pointer ${customWeaponHeld ? "bg-emerald-500" : "bg-slate-800"}`}
              >
                <div className={`w-3 h-3 bg-white rounded-full transition-all transform ${customWeaponHeld ? "translate-x-4" : "translate-x-0"}`} />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1">
              <label className="font-mono text-[10px] text-slate-400">Melee / Ballistic Gear</label>
              <select
                disabled={!customWeaponHeld}
                value={profile.equippedWeapon || "glowing_katanas"}
                onChange={(e) => {
                  onChange({
                    ...profile,
                    equippedWeapon: e.target.value as any
                  });
                }}
                className="bg-slate-950 border border-slate-800 text-slate-300 font-mono text-xs p-2 rounded-lg focus:outline-none focus:border-slate-700 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <option value="glowing_katanas">Dual Back-Slung Plasma Katanas</option>
                <option value="plasma_rifle">Caldwell Tactical Plasma Rifle</option>
                <option value="cyber_deck">Sony CyberDeck Terminal Module</option>
                <option value="none">Zero Weapon Assembly</option>
              </select>
            </div>

            <div className="flex flex-col gap-1">
              <div className="flex justify-between items-center">
                <label className="font-mono text-[10px] text-slate-400">Armament Plasma Color</label>
                <span className="font-mono text-[10px] text-slate-500 uppercase">{wColor}</span>
              </div>
              <div className="flex items-center gap-2">
                <input
                  disabled={!customWeaponHeld}
                  type="color"
                  value={wColor}
                  onChange={(e) => {
                    onChange({
                      ...profile,
                      weaponColor: e.target.value
                    });
                  }}
                  className="w-8 h-8 rounded border border-slate-800 bg-slate-950 cursor-pointer p-0.5 disabled:opacity-40"
                />
                {/* Weapon Quick Colors */}
                <div className="flex gap-1">
                  {["#f43f5e", "#ef4444", "#fb923c", "#10b981", "#c084fc"].map((col) => (
                    <button
                      key={col}
                      onClick={() => customWeaponHeld && onChange({ ...profile, weaponColor: col })}
                      className="w-4 h-4 rounded-full border border-slate-950 cursor-pointer hover:scale-110 active:scale-95 transition-all disabled:opacity-30"
                      style={{ backgroundColor: col }}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Sandbox Physics controls */}
          <div className="border-t border-slate-900 pt-3 grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="flex flex-col gap-1">
              <div className="flex justify-between text-[10px] font-mono text-slate-400">
                <span>Neon Ambient Glow</span>
                <span>{glowIntensity.toFixed(1)}x</span>
              </div>
              <input
                type="range"
                min="0.2"
                max="3.0"
                step="0.1"
                value={glowIntensity}
                onChange={(e) => setGlowIntensity(parseFloat(e.target.value))}
                className="w-full accent-pink-500 bg-slate-950 border border-slate-800 rounded-lg cursor-pointer h-2"
              />
            </div>

            <div className="flex flex-col gap-1">
              <div className="flex justify-between text-[10px] font-mono text-slate-400">
                <span>Companion Orbit Freq</span>
                <span>{droneOrbitSpeed.toFixed(1)}Hz</span>
              </div>
              <input
                type="range"
                min="0.2"
                max="2.5"
                step="0.1"
                value={droneOrbitSpeed}
                onChange={(e) => setDroneOrbitSpeed(parseFloat(e.target.value))}
                className="w-full accent-cyan-500 bg-slate-950 border border-slate-800 rounded-lg cursor-pointer h-2"
              />
            </div>

            <div className="flex flex-col gap-1 justify-center">
              <button
                onClick={() => {
                  onChange({
                    ...profile,
                    clothingStyle: ["tactical_suit", "neo_duster", "cyberpunk_harness", "hoodie"][Math.floor(Math.random() * 4)] as any,
                    clothingColor: "#" + Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0'),
                    hairStyle: ["cyber_spike", "neon_mohawk", "sleek_bob", "synth_waves", "bald"][Math.floor(Math.random() * 5)] as any,
                    hairColor: "#" + Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0'),
                    equippedWeapon: ["glowing_katanas", "plasma_rifle", "cyber_deck", "none"][Math.floor(Math.random() * 4)] as any,
                    weaponColor: "#" + Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0'),
                  });
                }}
                className="flex items-center justify-center gap-1.5 py-2 border border-slate-800 hover:border-slate-700 bg-slate-900/60 hover:bg-slate-900 rounded-xl font-mono text-[10px] text-pink-400 hover:text-white uppercase tracking-wider transition-all cursor-pointer"
              >
                <Wand2 className="w-3.5 h-3.5" style={{ color: accentColor }} />
                <span>Randomize 3D Cosmetics</span>
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
