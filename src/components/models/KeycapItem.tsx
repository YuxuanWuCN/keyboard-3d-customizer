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

// Generate high-DPI canvas texture for keycap legend
function createKeycapTexture(
  label: string,
  subLabel: string | undefined,
  legendColor: string
): THREE.CanvasTexture | null {
  if (!label || label.trim() === '' || label === 'SPACE') {
    return null;
  }

  const canvas = document.createElement('canvas');
  const size = 512;
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  // High quality transparent background
  ctx.clearRect(0, 0, size, size);

  ctx.fillStyle = legendColor;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  // Render based on key type
  if (label.length === 1 && /^[a-zA-Z]$/.test(label)) {
    // Single alphabet letters: 'A', 'B', 'C', 'Q', 'W', 'E'...
    ctx.font = 'bold 240px "Inter", "Segoe UI", -apple-system, Arial, sans-serif';
    ctx.fillText(label.toUpperCase(), size / 2, size / 2 - 4);
  } else if (subLabel) {
    // Dual legend (e.g., '1' with '!', ';' with ':')
    ctx.font = 'bold 150px "Inter", "Segoe UI", -apple-system, Arial, sans-serif';
    ctx.fillText(subLabel, size / 2, 145);
    ctx.font = 'bold 180px "Inter", "Segoe UI", -apple-system, Arial, sans-serif';
    ctx.fillText(label, size / 2, 350);
  } else if (label.length <= 3) {
    // Short functional keys: 'ESC', 'TAB', 'WIN', 'ALT', 'FN', 'DEL', '▲', '▼', '◄', '►'
    const isArrow = ['▲', '▼', '◄', '►'].includes(label);
    const fontSize = isArrow ? 200 : label.length === 3 ? 135 : 160;
    ctx.font = `bold ${fontSize}px "Inter", "Segoe UI", -apple-system, Arial, sans-serif`;
    ctx.fillText(label, size / 2, size / 2);
  } else {
    // Longer modifier labels: 'ENTER', 'BACKSPACE', 'SHIFT', 'CAPS'
    const fontSize = label.length >= 8 ? 80 : 105;
    ctx.font = `bold ${fontSize}px "Inter", "Segoe UI", -apple-system, Arial, sans-serif`;
    let display = label;
    if (label === 'ENTER') display = 'ENTER ↵';
    else if (label === 'BACKSPACE') display = '⌫ BACK';
    else if (label === 'SHIFT') display = '⇧ SHIFT';
    else if (label === 'CAPS') display = '⇪ CAPS';
    ctx.fillText(display, size / 2, size / 2);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.anisotropy = 8;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.generateMipmaps = true;
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

  const w = keyDef.unitWidth * 19.05 - 1.0;
  const d = (keyDef.unitHeight || 1.0) * 19.05 - 1.0;
  const heightMap: Record<string, number> = { R1: 9.8, R2: 8.6, R3: 7.8, R4: 8.2 };
  const h = heightMap[keyDef.profileRow] || 8.2;
  const topY = h / 2 + 0.05;

  // Dynamic 3D Cherry-profile sculpted keycap geometry
  const geom = useMemo(() => {
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
  }, [w, d, h]);

  // High-DPI Crisp Legend Decal Texture
  const legendTexture = useMemo(() => {
    return createKeycapTexture(keyDef.label, keyDef.subLabel, legendColor);
  }, [keyDef.label, keyDef.subLabel, legendColor]);

  // Keycap Body PBR Material (PBT / ABS)
  const bodyMaterial = useMemo(() => {
    const isPBT = materialParams.type === 'pbt';
    return new THREE.MeshPhysicalMaterial({
      color: new THREE.Color(topColor),
      roughness: isPBT ? 0.72 : 0.18,
      metalness: isPBT ? 0.04 : 0.05,
      clearcoat: isPBT ? 0.0 : 0.85,
      clearcoatRoughness: isPBT ? 0.0 : 0.1,
      emissive: isSelected ? new THREE.Color('#38bdf8') : new THREE.Color('#000000'),
      emissiveIntensity: isSelected ? 0.45 : 0.0,
    });
  }, [topColor, materialParams, isSelected]);

  // Smooth key depression animation (3.8mm mechanical travel)
  useFrame((_, delta) => {
    if (!meshRef.current) return;
    const targetY = isPressed ? -3.8 : 0.0;
    // Damped spring response
    currentYRef.current += (targetY - currentYRef.current) * Math.min(1.0, delta * 30.0);
    meshRef.current.position.y = currentYRef.current;
  });

  // Top decal size (in mm): fits the dished top area of the keycap
  const decalW = Math.max(9.0, w - 4.5);
  const decalD = Math.max(9.0, d - 4.5);

  return (
    <group position={[xPos, 0, zPos]}>
      <group ref={meshRef} onClick={onClick}>
        {/* Solid Keycap Body */}
        <mesh geometry={geom} material={bodyMaterial} castShadow receiveShadow />

        {/* Crisp High-Res Legend Decal */}
        {legendTexture && (
          <mesh
            position={[0, topY, 0]}
            rotation={[-Math.PI / 2, 0, 0]}
            renderOrder={5}
          >
            <planeGeometry args={[decalW, decalD]} />
            <meshBasicMaterial
              map={legendTexture}
              transparent
              opacity={0.96}
              depthWrite={false}
              polygonOffset
              polygonOffsetFactor={-2}
              polygonOffsetUnits={-2}
            />
          </mesh>
        )}

        {/* Subtle Dish Concavity / Accent Highlight */}
        {isSelected && (
          <mesh position={[0, topY + 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[decalW, decalD]} />
            <meshBasicMaterial
              color="#38bdf8"
              transparent
              opacity={0.25}
              depthWrite={false}
            />
          </mesh>
        )}
      </group>
    </group>
  );
};
