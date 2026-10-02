import React, { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { KeyDefinition, KeycapMaterialParams } from '../../types/keyboard';

interface KeycapItemProps {
  keyDef: KeyDefinition;
  xPos: number;
  zPos: number;
  topColor: string;
  legendColor?: string;
  materialParams: KeycapMaterialParams;
  isSelected: boolean;
  isPressed: boolean;
  onClick: (e: any) => void;
}

// Generate canvas texture for keycap legend
function createKeycapTexture(label: string, subLabel: string | undefined, topColor: string, legendColor: string): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  // Background matching topColor
  ctx.fillStyle = topColor;
  ctx.fillRect(0, 0, 256, 256);

  // Border micro-highlight
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
  ctx.lineWidth = 4;
  ctx.strokeRect(4, 4, 248, 248);

  // Legend text
  ctx.fillStyle = legendColor;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  if (label.length <= 2) {
    ctx.font = 'bold 88px "Inter", "Arial", sans-serif';
    ctx.fillText(label, 128, subLabel ? 148 : 128);

    if (subLabel) {
      ctx.font = 'bold 52px "Inter", "Arial", sans-serif';
      ctx.fillText(subLabel, 128, 64);
    }
  } else {
    // Modifier or long labels like ENTER, BACKSPACE, SHIFT
    const fontSize = label.length > 6 ? 34 : 44;
    ctx.font = `bold ${fontSize}px "Inter", "Arial", sans-serif`;
    ctx.fillText(label, 128, 128);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.anisotropy = 4;
  texture.needsUpdate = true;
  return texture;
}

export const KeycapItem: React.FC<KeycapItemProps> = ({
  keyDef,
  xPos,
  zPos,
  topColor,
  legendColor = '#ffffff',
  materialParams,
  isSelected,
  isPressed,
  onClick,
}) => {
  const meshRef = useRef<THREE.Group>(null);
  const currentYRef = useRef(0);

  // Dynamic geometry for keycap
  const geom = useMemo(() => {
    const w = keyDef.unitWidth * 19.05 - 1.0;
    const d = (keyDef.unitHeight || 1.0) * 19.05 - 1.0;
    const heightMap: Record<string, number> = { R1: 9.8, R2: 8.6, R3: 7.8, R4: 8.2 };
    const h = heightMap[keyDef.profileRow] || 8.2;

    const shape = new THREE.Shape();
    const x = -w / 2;
    const y = -d / 2;
    const r = 1.2;
    shape.moveTo(x + r, y);
    shape.lineTo(x + w - r, y);
    shape.quadraticCurveTo(x + w, y, x + w, y + r);
    shape.lineTo(x + w, y + d - r);
    shape.quadraticCurveTo(x + w, y + d, x + w - r, y + d);
    shape.lineTo(x + r, y + d);
    shape.quadraticCurveTo(x, y + d, x, y + d - r);
    shape.lineTo(x, y + r);
    shape.quadraticCurveTo(x, y, x + r, y);

    const extrudeSettings: THREE.ExtrudeGeometryOptions = {
      depth: h - 1.0,
      bevelEnabled: true,
      bevelThickness: 0.5,
      bevelSize: 0.5,
      bevelSegments: 2,
    };

    const g = new THREE.ExtrudeGeometry(shape, extrudeSettings);
    g.rotateX(Math.PI / 2);
    g.center();
    return g;
  }, [keyDef]);

  // Texture
  const texture = useMemo(() => {
    return createKeycapTexture(keyDef.label, keyDef.subLabel, topColor, legendColor);
  }, [keyDef.label, keyDef.subLabel, topColor, legendColor]);

  // Material
  const material = useMemo(() => {
    const isPBT = materialParams.type === 'pbt';
    return new THREE.MeshPhysicalMaterial({
      map: texture,
      color: new THREE.Color(topColor),
      roughness: isPBT ? 0.72 : 0.18,
      metalness: isPBT ? 0.04 : 0.05,
      clearcoat: isPBT ? 0.0 : 0.85,
      clearcoatRoughness: isPBT ? 0.0 : 0.1,
      emissive: isSelected ? new THREE.Color('#38bdf8') : new THREE.Color('#000000'),
      emissiveIntensity: isSelected ? 0.45 : 0.0,
    });
  }, [texture, topColor, materialParams, isSelected]);

  // Smooth key depression animation (3.8mm mechanical travel)
  useFrame((_, delta) => {
    if (!meshRef.current) return;
    const targetY = isPressed ? -3.8 : 0.0;
    // Damped spring response
    currentYRef.current += (targetY - currentYRef.current) * Math.min(1.0, delta * 30.0);
    meshRef.current.position.y = currentYRef.current;
  });

  return (
    <group position={[xPos, 0, zPos]}>
      <group ref={meshRef} onClick={onClick}>
        <mesh geometry={geom} material={material} castShadow receiveShadow />
        {/* Subtle Dish Concavity / Accent Highlight */}
        <mesh position={[0, 4.4, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[Math.max(4, keyDef.unitWidth * 19.05 - 8), 10.0]} />
          <meshBasicMaterial
            color={isSelected ? '#38bdf8' : '#ffffff'}
            transparent
            opacity={isSelected ? 0.25 : 0.04}
          />
        </mesh>
      </group>
    </group>
  );
};
