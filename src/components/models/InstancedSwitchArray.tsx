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

export const STEM_COLORS: Record<SwitchModelId, string> = {
  cherry_red: '#ef4444',
  gateron_yellow: '#eab308',
  cherry_blue: '#3b82f6',
  holy_panda: '#ea580c',
  kailh_box_jade: '#10b981',
};

export const HOUSING_SPECS: Record<
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
export function safeMerge(geoms: THREE.BufferGeometry[]): THREE.BufferGeometry {
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
export class HelixCurve extends THREE.Curve<THREE.Vector3> {
  constructor(public radius = 1.65, public height = 4.4, public turns = 6.5) {
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

// 1. Realistic Industrial-Grade Upper Housing with Chimney Opening, LED Window & 4 Snap Latches
export function createUpperHousingGeometry(): THREE.BufferGeometry {
  const geoms: THREE.BufferGeometry[] = [];

  // A. Base Collar Plate Rim (15.6 x 15.6 x 0.8mm)
  const collarShape = new THREE.Shape();
  const cW = 15.6, cD = 15.6, cr = 1.0;
  const cx = -cW / 2, cy = -cD / 2;
  collarShape.moveTo(cx + cr, cy);
  collarShape.lineTo(cx + cW - cr, cy);
  collarShape.quadraticCurveTo(cx + cW, cy, cx + cW, cy + cr);
  collarShape.lineTo(cx + cW, cy + cD - cr);
  collarShape.quadraticCurveTo(cx + cW, cy + cD, cx + cW - cr, cy + cD);
  collarShape.lineTo(cx + cr, cy + cD);
  collarShape.quadraticCurveTo(cx, cy + cD, cx, cy + cD - cr);
  collarShape.lineTo(cx, cy + cr);
  collarShape.quadraticCurveTo(cx, cy, cx + cr, cy);

  // Center cutout in collar
  const collarHole = new THREE.Path();
  collarHole.moveTo(-4.5, -4.5);
  collarHole.lineTo(4.5, -4.5);
  collarHole.lineTo(4.5, 4.5);
  collarHole.lineTo(-4.5, 4.5);
  collarHole.closePath();
  collarShape.holes.push(collarHole);

  const collarExtrude = new THREE.ExtrudeGeometry(collarShape, {
    depth: 0.8,
    bevelEnabled: true,
    bevelThickness: 0.15,
    bevelSize: 0.15,
    bevelSegments: 2,
  });
  collarExtrude.rotateX(Math.PI / 2);
  collarExtrude.translate(0, -0.4, 0);
  geoms.push(collarExtrude);

  // B. Slanted Trapezoidal Upper Hood (Tapering from 14.2x14.2 to 12.8x12.8)
  const hoodShape = new THREE.Shape();
  const hW = 14.2, hD = 14.2, hr = 1.4;
  const hx = -hW / 2, hy = -hD / 2;
  hoodShape.moveTo(hx + hr, hy);
  hoodShape.lineTo(hx + hW - hr, hy);
  hoodShape.quadraticCurveTo(hx + hW, hy, hx + hW, hy + hr);
  hoodShape.lineTo(hx + hW, hy + hD - hr);
  hoodShape.quadraticCurveTo(hx + hW, hy + hD, hx + hW - hr, hy + hD);
  hoodShape.lineTo(hx + hr, hy + hD);
  hoodShape.quadraticCurveTo(hx, hy + hD, hx, hy + hD - hr);
  hoodShape.lineTo(hx, hy + hr);
  hoodShape.quadraticCurveTo(hx, hy, hx + hr, hy);

  // Center chimney cutout: 6.8 x 5.4 mm
  const chimneyHole = new THREE.Path();
  const chw = 3.4, chd = 2.7;
  chimneyHole.moveTo(-chw, -chd);
  chimneyHole.lineTo(chw, -chd);
  chimneyHole.lineTo(chw, chd);
  chimneyHole.lineTo(-chw, chd);
  chimneyHole.closePath();
  hoodShape.holes.push(chimneyHole);

  // LED through-slit: 4.4 x 1.6 mm
  const ledHole = new THREE.Path();
  const lw = 2.2, lz = 4.6, lh = 0.8;
  ledHole.moveTo(-lw, lz - lh);
  ledHole.lineTo(lw, lz - lh);
  ledHole.lineTo(lw, lz + lh);
  ledHole.lineTo(-lw, lz + lh);
  ledHole.closePath();
  hoodShape.holes.push(ledHole);

  const hoodExtrude = new THREE.ExtrudeGeometry(hoodShape, {
    depth: 4.2,
    bevelEnabled: true,
    bevelThickness: 0.7,
    bevelSize: 0.7,
    bevelSegments: 3,
  });
  hoodExtrude.rotateX(Math.PI / 2);
  hoodExtrude.translate(0, 1.8, 0);
  geoms.push(hoodExtrude);

  // C. Raised Chimney Collar (导向柱口凸台)
  const collarBox = new THREE.BoxGeometry(7.6, 0.8, 6.2);
  collarBox.translate(0, 4.0, 0);
  geoms.push(collarBox);

  // D. Front LED Diffuser Lens Hood (前置梯形透镜灯罩)
  const ledDome = new THREE.BoxGeometry(5.4, 0.8, 2.6);
  ledDome.translate(0, 3.4, 4.4);
  geoms.push(ledDome);

  // E. Rear Brand Nameplate Bar (后部品牌雕刻框)
  const brandBar = new THREE.BoxGeometry(5.8, 0.45, 1.8);
  brandBar.translate(0, 3.7, -4.2);
  geoms.push(brandBar);

  // F. 4 Snap Latches (两侧扣爪)
  [-7.2, 7.2].forEach((lx) => {
    [-3.0, 3.0].forEach((lz) => {
      const latch = new THREE.BoxGeometry(0.7, 2.6, 1.4);
      latch.translate(lx, 0.6, lz);
      geoms.push(latch);
    });
  });

  return safeMerge(geoms);
}

// 2. Realistic Industrial-Grade Lower Housing with Central Tube, Center Pin & 5-Pin Ledges
export function createLowerHousingGeometry(): THREE.BufferGeometry {
  const geoms: THREE.BufferGeometry[] = [];

  // A. Middle Plate Retaining Flange (15.6 x 15.6 x 0.9mm)
  const flange = new THREE.BoxGeometry(15.6, 0.9, 15.6);
  flange.translate(0, 1.8, 0);
  geoms.push(flange);

  // B. Main Tapered Chassis Tub (14.0 down to 13.2mm, depth 4.2mm)
  const tub = new THREE.BoxGeometry(14.0, 4.2, 14.0);
  tub.translate(0, -0.6, 0);
  geoms.push(tub);

  // C. 4 Side Plate Lock Claws (定位板卡扣)
  [-7.1, 7.1].forEach((px) => {
    const claw = new THREE.BoxGeometry(0.6, 1.6, 3.2);
    claw.translate(px, 1.2, 0);
    geoms.push(claw);
  });

  // D. Center Spring Hollow Cylinder & PCB Mount Post
  const centerTube = new THREE.CylinderGeometry(2.1, 2.1, 3.8, 16);
  centerTube.translate(0, 0.6, 0);
  geoms.push(centerTube);

  const centerPcbPin = new THREE.CylinderGeometry(1.95, 1.95, 3.6, 16);
  centerPcbPin.translate(0, -4.2, 0);
  geoms.push(centerPcbPin);

  // E. 5-Pin Side Fixation Pegs
  const sidePinL = new THREE.CylinderGeometry(0.8, 0.8, 2.6, 10);
  sidePinL.translate(-4.8, -3.8, 0);
  geoms.push(sidePinL);

  const sidePinR = new THREE.CylinderGeometry(0.8, 0.8, 2.6, 10);
  sidePinR.translate(4.8, -3.8, 0);
  geoms.push(sidePinR);

  // F. Internal Rail Channels for Stem Sliders
  const railL = new THREE.BoxGeometry(1.2, 4.2, 1.6);
  railL.translate(-3.6, -0.4, 0);
  geoms.push(railL);

  const railR = new THREE.BoxGeometry(1.2, 4.2, 1.6);
  railR.translate(3.6, -0.4, 0);
  geoms.push(railR);

  return safeMerge(geoms);
}

// 3. Realistic Dual Electrical Contact Pins & Internal Tactile Phosphor Bronze Leaf
export function createPinsGeometry(): THREE.BufferGeometry {
  const geoms: THREE.BufferGeometry[] = [];

  // Static Pin & Contact Pad (静片)
  const pin1 = new THREE.BoxGeometry(0.65, 3.6, 0.3);
  pin1.translate(3.6, -4.2, 2.4);
  geoms.push(pin1);

  const staticPad = new THREE.BoxGeometry(3.6, 2.8, 0.35);
  staticPad.translate(2.8, 0.2, 2.4);
  geoms.push(staticPad);

  // Static gold contact rivet
  const rivet = new THREE.CylinderGeometry(0.4, 0.4, 0.3, 8);
  rivet.rotateX(Math.PI / 2);
  rivet.translate(2.8, 0.4, 2.2);
  geoms.push(rivet);

  // Dynamic Pin & Curved Leaf Arm (动片)
  const pin2 = new THREE.BoxGeometry(0.65, 3.6, 0.3);
  pin2.translate(-2.6, -4.2, 4.0);
  geoms.push(pin2);

  const leafArm1 = new THREE.BoxGeometry(4.2, 3.2, 0.35);
  leafArm1.translate(-0.8, 0.2, 4.0);
  geoms.push(leafArm1);

  // Curved contact nose reaching towards stem actuator leg
  const leafNose = new THREE.BoxGeometry(1.4, 2.2, 0.8);
  leafNose.translate(1.6, 0.4, 3.4);
  geoms.push(leafNose);

  return safeMerge(geoms);
}

// 4. Realistic MX Cruciform Cross Stem (+ mount, sliders, tactile legs & extended pole)
export function createMXCrossStemGeometry(
  isBoxType: boolean,
  switchModel?: SwitchModelId
): THREE.BufferGeometry {
  const geoms: THREE.BufferGeometry[] = [];

  // A. Cruciform Cross Arms (4.0mm Cherry Stem)
  const armH = new THREE.BoxGeometry(4.0, 3.8, 1.25);
  armH.translate(0, 1.9, 0);
  geoms.push(armH);

  const armV = new THREE.BoxGeometry(1.25, 3.8, 4.0);
  armV.translate(0, 1.9, 0);
  geoms.push(armV);

  // Center Dimple (圆形沉孔)
  const dimple = new THREE.CylinderGeometry(0.6, 0.6, 0.5, 12);
  dimple.translate(0, 3.65, 0);
  geoms.push(dimple);

  // B. Slider Base Carrier Block
  const base = new THREE.BoxGeometry(6.4, 2.4, 5.4);
  base.translate(0, -0.6, 0);
  geoms.push(base);

  // C. Twin POM Slider Rails with 45° bevels
  const railL = new THREE.BoxGeometry(0.85, 3.4, 1.8);
  railL.translate(-3.35, -0.3, 0);
  geoms.push(railL);

  const railR = new THREE.BoxGeometry(0.85, 3.4, 1.8);
  railR.translate(3.35, -0.3, 0);
  geoms.push(railR);

  // D. Extended Center Stem Bottom Pole (触底圆柱导柱)
  const poleLen = switchModel === 'holy_panda' ? 4.8 : 4.2;
  const pole = new THREE.CylinderGeometry(0.9, 0.9, poleLen, 12);
  pole.translate(0, -2.2, 0);
  geoms.push(pole);

  // E. Tactile Actuator Bump Legs (触点压杆脚)
  const legL = new THREE.BoxGeometry(0.9, 1.6, 1.1);
  legL.translate(-1.4, -1.0, 2.7);
  geoms.push(legL);

  const legR = new THREE.BoxGeometry(0.9, 1.6, 1.1);
  legR.translate(1.4, -1.0, 2.7);
  geoms.push(legR);

  // F. Box Dustproof Shroud (if Kailh Box switch)
  if (isBoxType) {
    const shroudOuter = 3.6;
    const boxShape = new THREE.Shape();
    boxShape.moveTo(-shroudOuter, -shroudOuter);
    boxShape.lineTo(shroudOuter, -shroudOuter);
    boxShape.lineTo(shroudOuter, shroudOuter);
    boxShape.lineTo(-shroudOuter, shroudOuter);
    boxShape.closePath();

    const boxHole = new THREE.Path();
    const shroudInner = 2.85;
    boxHole.moveTo(-shroudInner, -shroudInner);
    boxHole.lineTo(shroudInner, -shroudInner);
    boxHole.lineTo(shroudInner, shroudInner);
    boxHole.lineTo(-shroudInner, shroudInner);
    boxHole.closePath();
    boxShape.holes.push(boxHole);

    const boxExtrude = new THREE.ExtrudeGeometry(boxShape, { depth: 3.4, bevelEnabled: false });
    boxExtrude.rotateX(Math.PI / 2);
    boxExtrude.center();
    boxExtrude.translate(0, 1.7, 0);
    geoms.push(boxExtrude);
  }

  return safeMerge(geoms);
}

// 5. Progressive Golden Helical Spring Geometry
export function createGoldenSpringGeometry(stretchFactor: number = 0): THREE.BufferGeometry {
  const turns = 6.5;
  const baseH = 4.4 + stretchFactor * 6.0;
  const radius = 1.65;
  const springPath = new HelixCurve(radius, baseH, turns);
  return new THREE.TubeGeometry(springPath, 44, 0.22, 6, false);
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
    const stem = createMXCrossStemGeometry(isBoxType, switchModel);
    const spring = createGoldenSpringGeometry(0);
    const pins = createPinsGeometry();

    return {
      lowerGeom: lower,
      upperGeom: upper,
      stemGeom: stem,
      springGeom: spring,
      pinsGeom: pins,
    };
  }, [isBoxType, switchModel]);

  // Optical-Grade Materials
  const lowerMat = useMemo(() => {
    const spec = HOUSING_SPECS[switchModel] || HOUSING_SPECS.cherry_red;
    return new THREE.MeshStandardMaterial({
      color: new THREE.Color(spec.lowerColor),
      roughness: 0.58,
      metalness: 0.12,
    });
  }, [switchModel]);

  const upperMat = useMemo(() => {
    const spec = HOUSING_SPECS[switchModel] || HOUSING_SPECS.cherry_red;
    return new THREE.MeshPhysicalMaterial({
      color: new THREE.Color(spec.color),
      roughness: spec.roughness,
      metalness: 0.04,
      transparent: spec.transmission > 0,
      opacity: spec.opacity,
      transmission: spec.transmission,
      ior: 1.54,
      thickness: 1.6,
      reflectivity: 0.95,
      clearcoat: 0.6,
      clearcoatRoughness: 0.1,
    });
  }, [switchModel]);

  const stemMat = useMemo(() => {
    const color = STEM_COLORS[switchModel] || '#ef4444';
    return new THREE.MeshStandardMaterial({
      color: new THREE.Color(color),
      roughness: 0.22,
      metalness: 0.05,
    });
  }, [switchModel]);

  const springMat = useMemo(() => {
    return new THREE.MeshStandardMaterial({
      color: new THREE.Color('#f59e0b'), // Gleaming 24K gold PVD
      metalness: 0.98,
      roughness: 0.1,
    });
  }, []);

  const pinsMat = useMemo(() => {
    return new THREE.MeshStandardMaterial({
      color: new THREE.Color('#d97706'), // Conductive phosphor bronze
      metalness: 0.95,
      roughness: 0.18,
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
