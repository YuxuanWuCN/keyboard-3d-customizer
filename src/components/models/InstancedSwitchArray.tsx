import React, { useMemo, useEffect, useRef } from 'react';
import * as THREE from 'three';
import * as BufferGeometryUtils from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { SwitchModelId, SwitchType } from '../../types/keyboard';

interface SwitchArrayProps {
  keyPositions: { id: string; x: number; z: number }[];
  switchType: SwitchType;
  switchModel: SwitchModelId;
  upperY: number;
  lowerY: number;
  visible: boolean;
}

const STEM_COLORS: Record<SwitchModelId, string> = {
  cherry_red: '#dc2626',
  gateron_yellow: '#eab308',
  cherry_blue: '#2563eb',
  holy_panda: '#ea580c',
  kailh_box_jade: '#059669',
};

const HOUSING_SPECS: Record<
  SwitchModelId,
  {
    color: string;
    opacity: number;
    transmission: number;
    roughness: number;
    lowerColor: string;
  }
> = {
  cherry_red: {
    color: '#f8fafc',
    opacity: 0.92,
    transmission: 0.88,
    roughness: 0.12,
    lowerColor: '#18181b', // Classic Cherry black nylon bottom
  },
  gateron_yellow: {
    color: '#fef9c3',
    opacity: 0.94,
    transmission: 0.45,
    roughness: 0.28,
    lowerColor: '#fef08a', // Gateron milky translucent yellow base
  },
  cherry_blue: {
    color: '#eff6ff',
    opacity: 0.88,
    transmission: 0.92,
    roughness: 0.08,
    lowerColor: '#18181b',
  },
  holy_panda: {
    color: '#faf5ef',
    opacity: 1.0,
    transmission: 0.0, // Classic Holy Panda opaque cream Invyr nylon
    roughness: 0.42,
    lowerColor: '#f5eee6',
  },
  kailh_box_jade: {
    color: '#ecfdf5',
    opacity: 0.88,
    transmission: 0.85,
    roughness: 0.14,
    lowerColor: '#f8fafc', // Kailh Box pure white base
  },
};

// Helper: Safely merge multiple Three.js buffer geometries
function safeMerge(geoms: THREE.BufferGeometry[]): THREE.BufferGeometry {
  const prepared = geoms.map((g) => {
    const nonIndexed = g.index ? g.toNonIndexed() : g.clone();
    if (!nonIndexed.attributes.uv) {
      nonIndexed.setAttribute(
        'uv',
        new THREE.BufferAttribute(new Float32Array(nonIndexed.attributes.position.count * 2), 2)
      );
    }
    return nonIndexed;
  });
  return BufferGeometryUtils.mergeGeometries(prepared);
}

// Parametric 3D Helical Curve for Coiled Golden Spring
class HelixCurve extends THREE.Curve<THREE.Vector3> {
  constructor(public radius = 1.65, public height = 4.4, public turns = 5.5) {
    super();
  }
  getPoint(t: number): THREE.Vector3 {
    const angle = t * Math.PI * 2 * this.turns;
    const x = this.radius * Math.cos(angle);
    const y = (t - 0.5) * this.height;
    const z = this.radius * Math.sin(angle);
    return new THREE.Vector3(x, y, z);
  }
}

// 1. Realistic MX Cruciform Cross Stem (+ mount & slider base)
function createMXCrossStemGeometry(isBoxType: boolean): THREE.BufferGeometry {
  const L = 2.0;
  const W = 0.60;
  const crossShape = new THREE.Shape();
  crossShape.moveTo(W, W);
  crossShape.lineTo(L, W);
  crossShape.lineTo(L, -W);
  crossShape.lineTo(W, -W);
  crossShape.lineTo(W, -L);
  crossShape.lineTo(-W, -L);
  crossShape.lineTo(-W, -W);
  crossShape.lineTo(-L, -W);
  crossShape.lineTo(-L, W);
  crossShape.lineTo(-W, W);
  crossShape.lineTo(-W, L);
  crossShape.lineTo(W, L);
  crossShape.closePath();

  const crossExtrude = new THREE.ExtrudeGeometry(crossShape, {
    depth: 3.6,
    bevelEnabled: true,
    bevelThickness: 0.2,
    bevelSize: 0.2,
    bevelSegments: 2,
  });
  crossExtrude.rotateX(Math.PI / 2);
  crossExtrude.center();

  // Stem slider base block (with tactile side rails)
  const base = new THREE.BoxGeometry(6.4, 2.0, 5.6);
  base.translate(0, -1.6, 0);

  const railL = new THREE.BoxGeometry(0.8, 3.0, 1.4);
  railL.translate(-3.3, -1.0, 0);

  const railR = new THREE.BoxGeometry(0.8, 3.0, 1.4);
  railR.translate(3.3, -1.0, 0);

  if (isBoxType) {
    // Kailh Box perimeter dustproof shroud
    const shroudOuter = 3.6;
    const boxShape = new THREE.Shape();
    boxShape.moveTo(-shroudOuter, -shroudOuter);
    boxShape.lineTo(shroudOuter, -shroudOuter);
    boxShape.lineTo(shroudOuter, shroudOuter);
    boxShape.lineTo(-shroudOuter, shroudOuter);
    boxShape.closePath();

    const boxHole = new THREE.Path();
    const shroudInner = 3.0;
    boxHole.moveTo(-shroudInner, -shroudInner);
    boxHole.lineTo(shroudInner, -shroudInner);
    boxHole.lineTo(shroudInner, shroudInner);
    boxHole.lineTo(-shroudInner, shroudInner);
    boxHole.closePath();
    boxShape.holes.push(boxHole);

    const boxExtrude = new THREE.ExtrudeGeometry(boxShape, { depth: 3.2, bevelEnabled: false });
    boxExtrude.rotateX(Math.PI / 2);
    boxExtrude.center();
    boxExtrude.translate(0, 0.2, 0);

    return safeMerge([crossExtrude, boxExtrude, base, railL, railR]);
  }

  return safeMerge([crossExtrude, base, railL, railR]);
}

// 2. Realistic Upper Housing with Chimney Opening, LED Window & 4 Snap Latches
function createUpperHousingGeometry(): THREE.BufferGeometry {
  const shape = new THREE.Shape();
  const W = 14.0, D = 14.0, r = 1.0;
  const x = -W / 2, y = -D / 2;
  shape.moveTo(x + r, y);
  shape.lineTo(x + W - r, y);
  shape.quadraticCurveTo(x + W, y, x + W, y + r);
  shape.lineTo(x + W, y + D - r);
  shape.quadraticCurveTo(x + W, y + D, x + W - r, y + D);
  shape.lineTo(x + r, y + D);
  shape.quadraticCurveTo(x, y + D, x, y + D - r);
  shape.lineTo(x, y + r);
  shape.quadraticCurveTo(x, y, x + r, y);

  // Center stem chimney cutout: 7.2 x 5.6 mm
  const chimney = new THREE.Path();
  const cw = 3.6, cd = 2.8;
  chimney.moveTo(-cw, -cd);
  chimney.lineTo(cw, -cd);
  chimney.lineTo(cw, cd);
  chimney.lineTo(-cw, cd);
  chimney.closePath();
  shape.holes.push(chimney);

  // LED light slot in front: 4.8 x 2.0 mm
  const led = new THREE.Path();
  const lw = 2.4, lz = 4.8, lh = 1.0;
  led.moveTo(-lw, lz - lh);
  led.lineTo(lw, lz - lh);
  led.lineTo(lw, lz + lh);
  led.lineTo(-lw, lz + lh);
  led.closePath();
  shape.holes.push(led);

  const extrude = new THREE.ExtrudeGeometry(shape, {
    depth: 4.6,
    bevelEnabled: true,
    bevelThickness: 0.8,
    bevelSize: 0.8,
    bevelSegments: 2,
  });
  extrude.rotateX(Math.PI / 2);
  extrude.center();

  // 4 Snap latches on left and right sides
  const latchGeoms: THREE.BufferGeometry[] = [];
  [-6.8, 6.8].forEach((lx) => {
    [-3.0, 3.0].forEach((lz) => {
      const latch = new THREE.BoxGeometry(0.8, 2.2, 1.4);
      latch.translate(lx, -1.0, lz);
      latchGeoms.push(latch);
    });
  });

  // Top logo badge ridge
  const logoRidge = new THREE.BoxGeometry(5.2, 0.4, 1.8);
  logoRidge.translate(0, 2.2, -4.6);

  return safeMerge([extrude, ...latchGeoms, logoRidge]);
}

// 3. Realistic Lower Housing with Central Tube, Center Pin & 5-Pin Ledges
function createLowerHousingGeometry(): THREE.BufferGeometry {
  const outer = new THREE.BoxGeometry(14.0, 4.6, 14.0);

  // Center spring post inside
  const springWell = new THREE.CylinderGeometry(2.1, 2.1, 2.6, 12);
  springWell.translate(0, 1.0, 0);

  // Bottom Center PCB Mount Pin
  const centerPin = new THREE.CylinderGeometry(1.9, 1.9, 3.2, 12);
  centerPin.translate(0, -3.8, 0);

  // Side 5-Pin stabilization pegs
  const sidePinL = new THREE.CylinderGeometry(0.8, 0.8, 2.4, 8);
  sidePinL.translate(-4.8, -3.4, 0);
  const sidePinR = new THREE.CylinderGeometry(0.8, 0.8, 2.4, 8);
  sidePinR.translate(4.8, -3.4, 0);

  return safeMerge([outer, springWell, centerPin, sidePinL, sidePinR]);
}

// 4. Dual Electrical Contact Pins & Internal Copper Leaf
function createPinsGeometry(): THREE.BufferGeometry {
  const pin1 = new THREE.BoxGeometry(0.6, 3.4, 0.3);
  pin1.translate(-2.6, -3.8, 4.0);
  const pin2 = new THREE.BoxGeometry(0.6, 3.4, 0.3);
  pin2.translate(3.8, -3.8, 2.2);

  // Internal tactile copper contact leaf
  const leaf = new THREE.BoxGeometry(4.2, 3.2, 0.4);
  leaf.translate(0, 0.4, 4.2);

  return safeMerge([pin1, pin2, leaf]);
}

export const InstancedSwitchArray: React.FC<SwitchArrayProps> = ({
  keyPositions,
  switchModel,
  upperY,
  lowerY,
  visible,
}) => {
  const count = keyPositions.length;

  const lowerHousingRef = useRef<THREE.InstancedMesh>(null);
  const upperHousingRef = useRef<THREE.InstancedMesh>(null);
  const stemRef = useRef<THREE.InstancedMesh>(null);
  const springRef = useRef<THREE.InstancedMesh>(null);
  const pinsRef = useRef<THREE.InstancedMesh>(null);

  const isBoxType = switchModel === 'kailh_box_jade';

  // High-Fidelity Geometries
  const { lowerGeom, upperGeom, stemGeom, springGeom, pinsGeom } = useMemo(() => {
    const lower = createLowerHousingGeometry();
    const upper = createUpperHousingGeometry();
    const stem = createMXCrossStemGeometry(isBoxType);
    const springPath = new HelixCurve(1.65, 4.2, 5.5);
    const spring = new THREE.TubeGeometry(springPath, 36, 0.22, 6, false);
    const pins = createPinsGeometry();

    return {
      lowerGeom: lower,
      upperGeom: upper,
      stemGeom: stem,
      springGeom: spring,
      pinsGeom: pins,
    };
  }, [isBoxType]);

  // Optical-Grade Materials
  const lowerMat = useMemo(() => {
    const spec = HOUSING_SPECS[switchModel] || HOUSING_SPECS.cherry_red;
    return new THREE.MeshStandardMaterial({
      color: new THREE.Color(spec.lowerColor),
      roughness: 0.65,
      metalness: 0.08,
    });
  }, [switchModel]);

  const upperMat = useMemo(() => {
    const spec = HOUSING_SPECS[switchModel] || HOUSING_SPECS.cherry_red;
    return new THREE.MeshPhysicalMaterial({
      color: new THREE.Color(spec.color),
      roughness: spec.roughness,
      metalness: 0.02,
      transparent: spec.transmission > 0,
      opacity: spec.opacity,
      transmission: spec.transmission,
      ior: 1.52,
      thickness: 1.2,
      reflectivity: 0.9,
    });
  }, [switchModel]);

  const stemMat = useMemo(() => {
    const color = STEM_COLORS[switchModel] || '#dc2626';
    return new THREE.MeshStandardMaterial({
      color: new THREE.Color(color),
      roughness: 0.28,
      metalness: 0.04,
    });
  }, [switchModel]);

  const springMat = useMemo(() => {
    return new THREE.MeshStandardMaterial({
      color: new THREE.Color('#f59e0b'), // Gleaming gold
      metalness: 0.98,
      roughness: 0.12,
    });
  }, []);

  const pinsMat = useMemo(() => {
    return new THREE.MeshStandardMaterial({
      color: new THREE.Color('#d97706'), // Conductive phosphor bronze / gold
      metalness: 0.94,
      roughness: 0.2,
    });
  }, []);

  // Update instance matrices whenever key positions or model changes
  useEffect(() => {
    if (
      !lowerHousingRef.current ||
      !upperHousingRef.current ||
      !stemRef.current ||
      !springRef.current ||
      !pinsRef.current
    ) {
      return;
    }

    const dummy = new THREE.Object3D();

    // 1. Lower Housings & Pins
    keyPositions.forEach((pos, i) => {
      dummy.position.set(pos.x, 0, pos.z);
      dummy.scale.set(1, 1, 1);
      dummy.updateMatrix();
      lowerHousingRef.current!.setMatrixAt(i, dummy.matrix);
      pinsRef.current!.setMatrixAt(i, dummy.matrix);
    });
    lowerHousingRef.current.instanceMatrix.needsUpdate = true;
    pinsRef.current.instanceMatrix.needsUpdate = true;

    // 2. Upper Housings
    keyPositions.forEach((pos, i) => {
      dummy.position.set(pos.x, 0, pos.z);
      dummy.scale.set(1, 1, 1);
      dummy.updateMatrix();
      upperHousingRef.current!.setMatrixAt(i, dummy.matrix);
    });
    upperHousingRef.current.instanceMatrix.needsUpdate = true;

    // 3. Cruciform Cross Stems (seated inside upper housing chimney)
    keyPositions.forEach((pos, i) => {
      dummy.position.set(pos.x, 0.4, pos.z);
      dummy.scale.set(1, 1, 1);
      dummy.updateMatrix();
      stemRef.current!.setMatrixAt(i, dummy.matrix);
    });
    stemRef.current.instanceMatrix.needsUpdate = true;

    // 4. Helical Gold Springs (seated inside lower housing center well)
    keyPositions.forEach((pos, i) => {
      dummy.position.set(pos.x, 0.6, pos.z);
      dummy.scale.set(1, 1, 1);
      dummy.updateMatrix();
      springRef.current!.setMatrixAt(i, dummy.matrix);
    });
    springRef.current.instanceMatrix.needsUpdate = true;
  }, [keyPositions, switchModel]);

  if (!visible) return null;

  return (
    <group>
      {/* Switch Lower Housings, Springs & Metal Pins */}
      <group position={[0, lowerY, 0]}>
        <instancedMesh
          ref={lowerHousingRef}
          args={[lowerGeom, lowerMat, count]}
          castShadow
          receiveShadow
        />
        <instancedMesh
          ref={springRef}
          args={[springGeom, springMat, count]}
          castShadow
        />
        <instancedMesh
          ref={pinsRef}
          args={[pinsGeom, pinsMat, count]}
          castShadow
        />
      </group>

      {/* Switch Upper Housings & MX Cross Stems */}
      <group position={[0, upperY, 0]}>
        <instancedMesh
          ref={upperHousingRef}
          args={[upperGeom, upperMat, count]}
          castShadow
          receiveShadow
        />
        <instancedMesh
          ref={stemRef}
          args={[stemGeom, stemMat, count]}
          castShadow
          receiveShadow
        />
      </group>
    </group>
  );
};
