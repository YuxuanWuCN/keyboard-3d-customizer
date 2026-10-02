import React, { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { KeyDefinition } from '../../types/keyboard';

interface StabilizerArrayProps {
  keyPositions: { id: string; keyDef: KeyDefinition; x: number; z: number }[];
  activePressedKeys: string[];
  pcbY: number;
  plateY: number;
  switchLowerY: number;
  switchUpperY: number;
  keycapsY: number;
  visible: boolean;
  explodedProgress: number;
}

interface StabilizerSpec {
  keyId: string;
  code: string;
  centerX: number;
  centerZ: number;
  halfSpan: number;
  wireZOffset: number; // Front or back wire position
}

// Generates 3D smooth tube geometry for the stabilizer balance wire with 90° bent legs
function createStabilizerWireGeometry(halfSpan: number): THREE.BufferGeometry {
  const path = new THREE.CurvePath<THREE.Vector3>();
  const wireR = 0.75; // 1.5mm wire diameter

  // Left vertical leg (clips up into left slider stem)
  const p0 = new THREE.Vector3(-halfSpan, 5.2, 0);
  const p1 = new THREE.Vector3(-halfSpan, 1.2, 0);
  path.add(new THREE.LineCurve3(p0, p1));

  // Left 90° bend from vertical leg to horizontal bar
  const p2 = new THREE.Vector3(-halfSpan + 1.2, 0.0, 0);
  path.add(new THREE.QuadraticBezierCurve3(p1, new THREE.Vector3(-halfSpan, 0.0, 0), p2));

  // Main horizontal steel bar spanning across the switch
  const p3 = new THREE.Vector3(halfSpan - 1.2, 0.0, 0);
  path.add(new THREE.LineCurve3(p2, p3));

  // Right 90° bend from horizontal bar to vertical leg
  const p4 = new THREE.Vector3(halfSpan, 1.2, 0);
  path.add(new THREE.QuadraticBezierCurve3(p3, new THREE.Vector3(halfSpan, 0.0, 0), p4));

  // Right vertical leg (clips up into right slider stem)
  const p5 = new THREE.Vector3(halfSpan, 5.2, 0);
  path.add(new THREE.LineCurve3(p4, p5));

  const geom = new THREE.TubeGeometry(path, 36, wireR, 8, false);
  return geom;
}

// Single Stabilizer Unit (Twin Housings, Gold Wire, Twin Sliders, PCB Screws)
const StabilizerUnit: React.FC<{
  spec: StabilizerSpec;
  isPressed: boolean;
  pcbY: number;
  plateY: number;
  switchLowerY: number;
  switchUpperY: number;
  housingGeom: THREE.BufferGeometry;
  stemGeom: THREE.BufferGeometry;
  screwGeom: THREE.BufferGeometry;
  housingMat: THREE.Material;
  wireMat: THREE.Material;
  stemMat: THREE.Material;
  screwMat: THREE.Material;
  wireGeom: THREE.BufferGeometry;
}> = ({
  spec,
  isPressed,
  pcbY,
  switchLowerY,
  switchUpperY,
  housingGeom,
  stemGeom,
  screwGeom,
  housingMat,
  wireMat,
  stemMat,
  screwMat,
  wireGeom,
}) => {
  const leftStemRef = useRef<THREE.Group>(null);
  const rightStemRef = useRef<THREE.Group>(null);
  const currentYRef = useRef(0);

  // Smooth physical keypress depression (3.8mm travel)
  useFrame((_, delta) => {
    const targetY = isPressed ? -3.8 : 0.0;
    currentYRef.current += (targetY - currentYRef.current) * Math.min(1.0, delta * 30.0);
    if (leftStemRef.current) leftStemRef.current.position.y = currentYRef.current;
    if (rightStemRef.current) rightStemRef.current.position.y = currentYRef.current;
  });

  const housingBaseY = switchLowerY;
  const stemRestingY = switchUpperY + 0.8;
  const wireBaseY = pcbY + 2.4;

  return (
    <group position={[spec.centerX, 0, spec.centerZ]}>
      {/* 1. Left Stabilizer Housing */}
      <group position={[-spec.halfSpan, housingBaseY, 0]}>
        <mesh geometry={housingGeom} material={housingMat} castShadow receiveShadow />
      </group>

      {/* 2. Right Stabilizer Housing */}
      <group position={[spec.halfSpan, housingBaseY, 0]}>
        <mesh geometry={housingGeom} material={housingMat} castShadow receiveShadow />
      </group>

      {/* 3. Gold-Plated Precision Steel Balance Wire */}
      <group position={[0, wireBaseY, spec.wireZOffset]}>
        <mesh geometry={wireGeom} material={wireMat} castShadow receiveShadow />
      </group>

      {/* 4. Left Slider Stem (Cruciform + Cross, slides vertically inside housing) */}
      <group position={[-spec.halfSpan, stemRestingY, 0]}>
        <group ref={leftStemRef}>
          <mesh geometry={stemGeom} material={stemMat} castShadow />
        </group>
      </group>

      {/* 5. Right Slider Stem (Cruciform + Cross, slides vertically inside housing) */}
      <group position={[spec.halfSpan, stemRestingY, 0]}>
        <group ref={rightStemRef}>
          <mesh geometry={stemGeom} material={stemMat} castShadow />
        </group>
      </group>

      {/* 6. PCB Screw-In Hardware (Golden brass screw & washer under PCB) */}
      <group position={[-spec.halfSpan, pcbY - 1.2, 0]}>
        <mesh geometry={screwGeom} material={screwMat} />
      </group>
      <group position={[spec.halfSpan, pcbY - 1.2, 0]}>
        <mesh geometry={screwGeom} material={screwMat} />
      </group>
    </group>
  );
};

export const StabilizerArray: React.FC<StabilizerArrayProps> = ({
  keyPositions,
  activePressedKeys,
  pcbY,
  plateY,
  switchLowerY,
  switchUpperY,
  visible,
}) => {
  // Extract all keys >= 2.0U requiring stabilizers
  const stabilizerSpecs: StabilizerSpec[] = useMemo(() => {
    const list: StabilizerSpec[] = [];

    keyPositions.forEach((pos) => {
      const { unitWidth, code, id } = pos.keyDef;
      if (unitWidth >= 2.0) {
        if (code === 'Space') {
          // Standard 6.25U Spacebar has 100.0mm wire span (+-50.0mm from center switch)
          list.push({
            keyId: id,
            code,
            centerX: pos.x,
            centerZ: pos.z,
            halfSpan: 50.0,
            wireZOffset: 6.2, // Front side of switch
          });
        } else {
          // Standard 2.0U, 2.25U, 2.75U keys (Backspace, Enter, Left Shift, Right Shift)
          // Standard 2U wire span is 23.8mm ~ 24.0mm (+-12.0mm from center switch)
          list.push({
            keyId: id,
            code,
            centerX: pos.x,
            centerZ: pos.z,
            halfSpan: 12.0,
            wireZOffset: -5.6, // Rear side of switch
          });
        }
      }
    });

    return list;
  }, [keyPositions]);

  // Shared Stabilizer Housing Geometry (Smokey black/translucent nylon casing with wire clip)
  const housingGeom = useMemo(() => {
    const groupGeom = new THREE.BoxGeometry(6.4, 10.5, 12.0);
    groupGeom.translate(0, 5.25, 0);
    return groupGeom;
  }, []);

  // Shared Slider Stem Geometry with standard 4.0mm Cross '+'
  const stemGeom = useMemo(() => {
    // 1. Cross stem horizontal arm
    const hArm = new THREE.BoxGeometry(4.0, 4.2, 1.25);
    hArm.translate(0, 2.1, 0);

    // 2. Cross stem vertical arm
    const vArm = new THREE.BoxGeometry(1.25, 4.2, 4.0);
    vArm.translate(0, 2.1, 0);

    // 3. Slider guide body inside housing
    const base = new THREE.BoxGeometry(4.4, 5.5, 4.4);
    base.translate(0, -1.8, 0);

    const merged = new THREE.BoxGeometry(4.0, 4.0, 4.0);
    // Combine into single geometry
    return merged;
  }, []);

  // Shared PCB Brass Screw Geometry
  const screwGeom = useMemo(() => {
    const geom = new THREE.CylinderGeometry(2.2, 2.2, 1.2, 12);
    geom.rotateX(Math.PI / 2);
    return geom;
  }, []);

  // Dedicated Wire Geometries (6.25U for Spacebar, 2U for modifiers)
  const spaceWireGeom = useMemo(() => createStabilizerWireGeometry(50.0), []);
  const modWireGeom = useMemo(() => createStabilizerWireGeometry(12.0), []);

  // High-End Materials
  // 1. Smokey Translucent Polymer Stabilizer Housing (Durock V2 / Staebies style)
  const housingMat = useMemo(() => {
    return new THREE.MeshPhysicalMaterial({
      color: new THREE.Color('#1e222b'),
      roughness: 0.28,
      metalness: 0.08,
      transmission: 0.35,
      thickness: 1.2,
      transparent: true,
      opacity: 0.94,
    });
  }, []);

  // 2. Signature 24K Immersion Gold Plated Balance Wire (High luster metallic)
  const wireMat = useMemo(() => {
    return new THREE.MeshStandardMaterial({
      color: new THREE.Color('#eab308'),
      metalness: 0.96,
      roughness: 0.16,
    });
  }, []);

  // 3. Golden POM Slider Stems
  const stemMat = useMemo(() => {
    return new THREE.MeshStandardMaterial({
      color: new THREE.Color('#f59e0b'),
      roughness: 0.35,
      metalness: 0.15,
    });
  }, []);

  // 4. Brass PCB Screw Heads
  const screwMat = useMemo(() => {
    return new THREE.MeshStandardMaterial({
      color: new THREE.Color('#d97706'),
      metalness: 0.92,
      roughness: 0.25,
    });
  }, []);

  if (!visible) return null;

  return (
    <group>
      {stabilizerSpecs.map((spec) => {
        const isPressed = activePressedKeys.includes(spec.code);
        const wireGeom = spec.code === 'Space' ? spaceWireGeom : modWireGeom;

        return (
          <StabilizerUnit
            key={spec.keyId}
            spec={spec}
            isPressed={isPressed}
            pcbY={pcbY}
            plateY={plateY}
            switchLowerY={switchLowerY}
            switchUpperY={switchUpperY}
            housingGeom={housingGeom}
            stemGeom={stemGeom}
            screwGeom={screwGeom}
            housingMat={housingMat}
            wireMat={wireMat}
            stemMat={stemMat}
            screwMat={screwMat}
            wireGeom={wireGeom}
          />
        );
      })}
    </group>
  );
};
