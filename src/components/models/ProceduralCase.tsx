import React, { useMemo } from 'react';
import * as THREE from 'three';
import { KeyboardModelId, GasketLayerId } from '../../types/keyboard';
import { KEYBOARD_LAYOUTS } from '../../constants/keyboardLayouts';

interface ProceduralCaseProps {
  model: KeyboardModelId;
  caseColor: string;
  caseFinish: 'anodized' | 'e_white' | 'raw_alu';
  weightMaterial: 'brass_pvd' | 'mirror_chroma' | 'matte_black' | 'anodized_gold';
  explodedProgress: number;
  layerVisibility: Record<GasketLayerId, boolean>;
  isolatedLayer: GasketLayerId | null;
}

// Cubic easing for exploded displacement: 3t^2 - 2t^3
function cubicEase(t: number): number {
  return t * t * (3 - 2 * t);
}

// Rounded rectangle 2D shape in XY plane
function createRoundedRectShape(w: number, d: number, radius: number): THREE.Shape {
  const shape = new THREE.Shape();
  const x = -w / 2;
  const y = -d / 2;
  const r = Math.min(radius, w / 2, d / 2);
  shape.moveTo(x + r, y);
  shape.lineTo(x + w - r, y);
  shape.quadraticCurveTo(x + w, y, x + w, y + r);
  shape.lineTo(x + w, y + d - r);
  shape.quadraticCurveTo(x + w, y + d, x + w - r, y + d);
  shape.lineTo(x + r, y + d);
  shape.quadraticCurveTo(x, y + d, x, y + d - r);
  shape.lineTo(x, y + r);
  shape.quadraticCurveTo(x, y, x + r, y);
  return shape;
}

export const ProceduralCase: React.FC<ProceduralCaseProps> = ({
  model,
  caseColor,
  caseFinish,
  weightMaterial,
  explodedProgress,
  layerVisibility,
  isolatedLayer,
}) => {
  const layout = KEYBOARD_LAYOUTS[model];
  const { width: W, depth: D } = layout.dimensions;

  const t = cubicEase(explodedProgress);
  // Exploded offsets (in mm) calibrated for solid CNC case wrapping and clear explosion
  const topCaseY = 10.0 + 60.0 * t;
  const bottomCaseY = -7.50 - 42.0 * t;
  const weightY = -14.20 - 72.0 * t;

  // Visibility logic
  const showBottom =
    (!isolatedLayer || isolatedLayer === 'bottom_case_weight') &&
    layerVisibility.bottom_case_weight;
  const showTop = !isolatedLayer || isolatedLayer === 'plate' || isolatedLayer === 'bottom_case_weight';

  // Materials
  const caseMat = useMemo(() => {
    // Realistic anodized aluminum: dielectric oxide layer over metal base
    let roughness = 0.35;
    let metalness = 0.42;

    // Resolve visual color: map default dark codes to stunning, crisp bright custom keyboard finishes
    let resolvedHex = caseColor;
    if (caseColor === '#1e2330') {
      // EveningStar 75: Flagship Bright Arctic Ice Silver
      resolvedHex = '#D4DAE4';
    } else if (caseColor === '#2b2d38') {
      // Mr. Suit 80: Flagship Pristine Pure E-White
      resolvedHex = '#F5F6F8';
    } else if (caseColor === '#383b42') {
      // Tofu 60: Flagship Bright Anodized Silver
      resolvedHex = '#E2E6EA';
    }

    let color = new THREE.Color(resolvedHex);

    if (caseFinish === 'e_white') {
      roughness = 0.28;
      metalness = 0.05;
      color = new THREE.Color(
        caseColor && caseColor !== '#1e2330' && caseColor !== '#2b2d38' && caseColor !== '#383b42'
          ? caseColor
          : '#F8F9FA'
      );
    } else if (caseFinish === 'raw_alu') {
      roughness = 0.22;
      metalness = 0.85;
      color = new THREE.Color('#D8DCE3');
    }

    return new THREE.MeshStandardMaterial({
      color,
      roughness,
      metalness,
      envMapIntensity: 1.8,
    });
  }, [caseColor, caseFinish]);

  const weightMat = useMemo(() => {
    switch (weightMaterial) {
      case 'mirror_chroma':
        return new THREE.MeshPhysicalMaterial({
          color: new THREE.Color('#e2e8f0'),
          metalness: 0.99,
          roughness: 0.02,
          clearcoat: 1.0,
          clearcoatRoughness: 0.01,
          reflectivity: 1.0,
          envMapIntensity: 3.0,
        });
      case 'matte_black':
        return new THREE.MeshStandardMaterial({
          color: new THREE.Color('#18181b'),
          metalness: 0.5,
          roughness: 0.65,
        });
      case 'anodized_gold':
        return new THREE.MeshStandardMaterial({
          color: new THREE.Color('#fbbf24'),
          metalness: 0.92,
          roughness: 0.25,
        });
      case 'brass_pvd':
      default:
        return new THREE.MeshPhysicalMaterial({
          color: new THREE.Color('#d4af37'),
          metalness: 0.98,
          roughness: 0.04,
          clearcoat: 1.0,
          clearcoatRoughness: 0.02,
          reflectivity: 1.0,
          envMapIntensity: 2.8,
        });
    }
  }, [weightMaterial]);

  // Top Case Bezel Geometry with inner cavity hole
  const topBezelGeom = useMemo(() => {
    let innerW = W - 14.0;
    let innerD = D - 14.0;
    if (model === 'tofu60') {
      innerW = 290.0;
      innerD = 98.0;
    } else if (model === 'eveningstar75') {
      innerW = 313.5;
      innerD = 118.5;
    } else if (model === 'mrsuit80') {
      innerW = 356.5;
      innerD = 124.0;
    }

    const cornerR = model === 'mrsuit80' ? 4.5 : model === 'eveningstar75' ? 1.5 : 0.4;
    const outerShape = createRoundedRectShape(W, D, cornerR);

    // Inner cavity cutout for plate and key switches
    const cavityHole = new THREE.Path();
    const x = -innerW / 2;
    const y = -innerD / 2;
    cavityHole.moveTo(x, y);
    cavityHole.lineTo(x + innerW, y);
    cavityHole.lineTo(x + innerW, y + innerD);
    cavityHole.lineTo(x, y + innerD);
    cavityHole.closePath();

    outerShape.holes.push(cavityHole);

    const extrudeSettings: THREE.ExtrudeGeometryOptions = {
      depth: 16.0,
      bevelEnabled: true,
      bevelThickness: model === 'tofu60' ? 0.6 : 1.0,
      bevelSize: model === 'tofu60' ? 0.6 : 1.0,
      bevelSegments: model === 'mrsuit80' ? 4 : 2,
    };

    const geom = new THREE.ExtrudeGeometry(outerShape, extrudeSettings);
    // Rotate so extrusion goes upward along Y and sits in XZ plane
    geom.rotateX(Math.PI / 2);
    geom.center();
    return geom;
  }, [W, D, model]);

  // Bottom Chassis Geometry
  const bottomCaseGeom = useMemo(() => {
    let innerW = W - 8.0;
    let innerD = D - 8.0;
    if (model === 'tofu60') {
      innerW = 294.0;
      innerD = 102.0;
    } else if (model === 'eveningstar75') {
      innerW = 316.0;
      innerD = 122.0;
    } else if (model === 'mrsuit80') {
      innerW = 358.5;
      innerD = 126.0;
    }

    const cornerR = model === 'mrsuit80' ? 4.5 : model === 'eveningstar75' ? 1.5 : 0.4;
    const outerShape = createRoundedRectShape(W - 0.5, D - 0.5, cornerR);

    // Inner recessed chamber
    const innerCavity = new THREE.Path();
    innerCavity.moveTo(-innerW / 2, -innerD / 2);
    innerCavity.lineTo(innerW / 2, -innerD / 2);
    innerCavity.lineTo(innerW / 2, innerD / 2);
    innerCavity.lineTo(-innerW / 2, innerD / 2);
    innerCavity.closePath();
    outerShape.holes.push(innerCavity);

    const extrudeSettings: THREE.ExtrudeGeometryOptions = {
      depth: 8.0,
      bevelEnabled: true,
      bevelThickness: 0.6,
      bevelSize: 0.6,
      bevelSegments: 2,
    };
    const geom = new THREE.ExtrudeGeometry(outerShape, extrudeSettings);
    geom.rotateX(Math.PI / 2);
    geom.center();
    return geom;
  }, [W, D, model]);

  // Bottom Base Plate (solid base supporting foam & weight)
  const bottomBasePlateGeom = useMemo(() => {
    const cornerR = model === 'mrsuit80' ? 4.0 : model === 'eveningstar75' ? 1.2 : 0.2;
    const shape = createRoundedRectShape(W - 1.2, D - 1.2, cornerR);
    const geom = new THREE.ExtrudeGeometry(shape, { depth: 2.2, bevelEnabled: false });
    geom.rotateX(Math.PI / 2);
    geom.center();
    return geom;
  }, [W, D, model]);

  // Weight Geometry specific to model
  const weightGeom = useMemo(() => {
    if (model === 'eveningstar75') {
      // EveningStar 75: Massive asymmetric mirror PVD brass plate with chamfered polygon corners
      const weightW = 240.0;
      const weightD = 78.0;
      const shape = new THREE.Shape();
      const x = -weightW / 2;
      const y = -weightD / 2;
      const chamfer = 8.0;
      shape.moveTo(x + chamfer, y);
      shape.lineTo(x + weightW - chamfer, y);
      shape.lineTo(x + weightW, y + chamfer);
      shape.lineTo(x + weightW, y + weightD - chamfer);
      shape.lineTo(x + weightW - chamfer, y + weightD);
      shape.lineTo(x + chamfer, y + weightD);
      shape.lineTo(x, y + weightD - chamfer);
      shape.lineTo(x, y + chamfer);
      shape.closePath();

      const geom = new THREE.ExtrudeGeometry(shape, {
        depth: 3.5,
        bevelEnabled: true,
        bevelThickness: 0.5,
        bevelSize: 0.5,
        bevelSegments: 2,
      });
      geom.rotateX(Math.PI / 2);
      geom.center();
      return geom;
    } else if (model === 'mrsuit80') {
      // Mr. Suit 80: Signature full-width rear mirror PVD weight with beveled perimeter
      const weightW = 290.0;
      const weightD = 62.0;
      const shape = createRoundedRectShape(weightW, weightD, 3.0);
      const geom = new THREE.ExtrudeGeometry(shape, {
        depth: 3.8,
        bevelEnabled: true,
        bevelThickness: 0.6,
        bevelSize: 0.6,
        bevelSegments: 3,
      });
      geom.rotateX(Math.PI / 2);
      geom.center();
      return geom;
    } else {
      // Tofu 60: Minimalist rectangular solid sandblasted brass bar
      const weightW = 180.0;
      const weightD = 44.0;
      const shape = new THREE.Shape();
      shape.moveTo(-weightW / 2, -weightD / 2);
      shape.lineTo(weightW / 2, -weightD / 2);
      shape.lineTo(weightW / 2, weightD / 2);
      shape.lineTo(-weightW / 2, weightD / 2);
      shape.closePath();

      const geom = new THREE.ExtrudeGeometry(shape, {
        depth: 4.5,
        bevelEnabled: true,
        bevelThickness: 0.4,
        bevelSize: 0.4,
        bevelSegments: 1,
      });
      geom.rotateX(Math.PI / 2);
      geom.center();
      return geom;
    }
  }, [model]);

  return (
    <group>
      {/* 1. Top Bezel Case */}
      {showTop && (
        <group position={[0, topCaseY, 0]}>
          <mesh geometry={topBezelGeom} material={caseMat} castShadow receiveShadow />

          {/* EveningStar 75 Signature Side Waistline Cutouts & Front Badge */}
          {model === 'eveningstar75' && (
            <>
              {/* Left Waistline Accent Groove */}
              <mesh position={[-W / 2 + 0.8, 0, 0]}>
                <boxGeometry args={[1.6, 6.0, D - 16]} />
                <meshStandardMaterial color="#64748b" roughness={0.4} metalness={0.8} />
              </mesh>
              {/* Right Waistline Accent Groove */}
              <mesh position={[W / 2 - 0.8, 0, 0]}>
                <boxGeometry args={[1.6, 6.0, D - 16]} />
                <meshStandardMaterial color="#64748b" roughness={0.4} metalness={0.8} />
              </mesh>

              {/* Front Badge Plate (PVD Brass) */}
              <mesh position={[84.0, 8.2, D / 2 - 3.2]}>
                <boxGeometry args={[26.0, 1.2, 5.0]} />
                <meshPhysicalMaterial
                  color="#d4af37"
                  metalness={0.98}
                  roughness={0.06}
                  clearcoat={1.0}
                />
              </mesh>
              {/* LED Diffuser Bar (Frosted Cyan Lightguide) */}
              <mesh position={[84.0, 8.4, D / 2 - 0.4]}>
                <boxGeometry args={[20.0, 0.8, 1.2]} />
                <meshStandardMaterial
                  color="#67e8f9"
                  emissive="#38bdf8"
                  emissiveIntensity={1.8}
                  transparent
                  opacity={0.92}
                />
              </mesh>
            </>
          )}

          {/* Mr. Suit 80 Signature Seamless WK Chin (blockers removed to prevent keycap collision) */}
        </group>
      )}

      {/* 2. CNC Bottom Chassis & Base Plate */}
      {showBottom && (
        <group position={[0, bottomCaseY, 0]}>
          <mesh geometry={bottomCaseGeom} material={caseMat} castShadow receiveShadow />
          <mesh position={[0, -2.9, 0]} geometry={bottomBasePlateGeom} material={caseMat} receiveShadow />

          {/* Rubber non-slip feet */}
          <mesh position={[-W / 2 + 25.0, -5.3, -D / 2 + 15.0]}>
            <boxGeometry args={[24.0, 1.6, 6.0]} />
            <meshStandardMaterial color="#1f2937" roughness={0.95} />
          </mesh>
          <mesh position={[W / 2 - 25.0, -5.3, -D / 2 + 15.0]}>
            <boxGeometry args={[24.0, 1.6, 6.0]} />
            <meshStandardMaterial color="#1f2937" roughness={0.95} />
          </mesh>
          <mesh position={[-W / 2 + 25.0, -5.3, D / 2 - 15.0]}>
            <boxGeometry args={[24.0, 1.6, 6.0]} />
            <meshStandardMaterial color="#1f2937" roughness={0.95} />
          </mesh>
          <mesh position={[W / 2 - 25.0, -5.3, D / 2 - 15.0]}>
            <boxGeometry args={[24.0, 1.6, 6.0]} />
            <meshStandardMaterial color="#1f2937" roughness={0.95} />
          </mesh>
        </group>
      )}

      {/* 3. Underside Signature Weight */}
      {showBottom && (
        <group position={[0, weightY, 0]}>
          <mesh geometry={weightGeom} material={weightMat} castShadow receiveShadow />

          {/* EveningStar 75 Celestial Star Emblem on Weight */}
          {model === 'eveningstar75' && (
            <mesh position={[0, -2.0, 0]} rotation={[-Math.PI / 2, 0, 0]}>
              <ringGeometry args={[8.0, 9.5, 32]} />
              <meshStandardMaterial color="#fef08a" metalness={0.9} roughness={0.1} />
            </mesh>
          )}

          {/* Torx Screws on Weight Corners */}
          {[-W / 3, W / 3].map((sx, i) =>
            [-18, 18].map((sz, j) => (
              <mesh key={`screw-${i}-${j}`} position={[sx, -1.8, sz]}>
                <cylinderGeometry args={[1.5, 1.5, 0.6, 12]} />
                <meshStandardMaterial color="#94a3b8" metalness={0.95} roughness={0.2} />
              </mesh>
            ))
          )}
        </group>
      )}
    </group>
  );
};
