import React, { useMemo } from 'react';
import * as THREE from 'three';
import { useKeyboardStore } from '../../store/useKeyboardStore';

interface CompanionNumpadProps {
  visible: boolean;
  position?: [number, number, number];
}

interface NumpadKeyDef {
  id: string;
  code: string;
  label: string;
  color: string;
  legend: string;
  x: number; // in mm
  z: number; // in mm
  w: number; // width in mm
  d: number; // depth in mm
}

export const CompanionNumpad: React.FC<CompanionNumpadProps> = ({
  visible,
  position = [238.0, 0, 0],
}) => {
  const handleKeyDown = useKeyboardStore((s) => s.handleKeyDown);
  const handleKeyUp = useKeyboardStore((s) => s.handleKeyUp);
  const activePressedKeys = useKeyboardStore((s) => s.activePressedKeys);

  // Materials
  const caseMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: new THREE.Color('#f5d0fe'), // Soft lilac / pastel pink
        roughness: 0.32,
        metalness: 0.22,
      }),
    []
  );

  const bezelChromeMat = useMemo(
    () =>
      new THREE.MeshPhysicalMaterial({
        color: new THREE.Color('#ffffff'),
        roughness: 0.05,
        metalness: 0.95,
        clearcoat: 1.0,
      }),
    []
  );

  const badgePlateMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: new THREE.Color('#e0e7ff'),
        roughness: 0.4,
        metalness: 0.3,
      }),
    []
  );

  const starMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: new THREE.Color('#facc15'),
        roughness: 0.2,
        metalness: 0.8,
      }),
    []
  );

  // 17-Key Layout definition matching Photo 4
  const numpadKeys: NumpadKeyDef[] = useMemo(() => {
    const keyPitch = 19.05;
    const originX = -32.0;
    const originZ = -44.0;

    return [
      // Row 0 (Top)
      { id: 'NumLock', code: 'NumLock', label: 'Num', color: '#FDE047', legend: '#0F172A', x: originX, z: originZ, w: 18, d: 18 },
      { id: 'NumpadDivide', code: 'NumpadDivide', label: '÷', color: '#F472B6', legend: '#FFFFFF', x: originX + keyPitch, z: originZ, w: 18, d: 18 },
      { id: 'NumpadMultiply', code: 'NumpadMultiply', label: '×', color: '#5EEAD4', legend: '#0F172A', x: originX + keyPitch * 2, z: originZ, w: 18, d: 18 },
      { id: 'NumpadSubtract', code: 'NumpadSubtract', label: '−', color: '#F472B6', legend: '#FFFFFF', x: originX + keyPitch * 3, z: originZ, w: 18, d: 18 },

      // Row 1
      { id: 'Numpad7', code: 'Numpad7', label: '7', color: '#FBF9F5', legend: '#4C1D95', x: originX, z: originZ + keyPitch, w: 18, d: 18 },
      { id: 'Numpad8', code: 'Numpad8', label: '8', color: '#FBF9F5', legend: '#4C1D95', x: originX + keyPitch, z: originZ + keyPitch, w: 18, d: 18 },
      { id: 'Numpad9', code: 'Numpad9', label: '9', color: '#FBF9F5', legend: '#4C1D95', x: originX + keyPitch * 2, z: originZ + keyPitch, w: 18, d: 18 },
      // 2U vertical Plus
      { id: 'NumpadAdd', code: 'NumpadAdd', label: '+', color: '#A594F9', legend: '#FFFFFF', x: originX + keyPitch * 3, z: originZ + keyPitch * 1.5, w: 18, d: 37 },

      // Row 2
      { id: 'Numpad4', code: 'Numpad4', label: '4', color: '#FBF9F5', legend: '#4C1D95', x: originX, z: originZ + keyPitch * 2, w: 18, d: 18 },
      { id: 'Numpad5', code: 'Numpad5', label: '5', color: '#FBF9F5', legend: '#4C1D95', x: originX + keyPitch, z: originZ + keyPitch * 2, w: 18, d: 18 },
      { id: 'Numpad6', code: 'Numpad6', label: '6', color: '#FBF9F5', legend: '#4C1D95', x: originX + keyPitch * 2, z: originZ + keyPitch * 2, w: 18, d: 18 },

      // Row 3
      { id: 'Numpad1', code: 'Numpad1', label: '1', color: '#FBF9F5', legend: '#4C1D95', x: originX, z: originZ + keyPitch * 3, w: 18, d: 18 },
      { id: 'Numpad2', code: 'Numpad2', label: '2', color: '#FBF9F5', legend: '#4C1D95', x: originX + keyPitch, z: originZ + keyPitch * 3, w: 18, d: 18 },
      { id: 'Numpad3', code: 'Numpad3', label: '3', color: '#FBF9F5', legend: '#4C1D95', x: originX + keyPitch * 2, z: originZ + keyPitch * 3, w: 18, d: 18 },
      // 2U vertical Enter
      { id: 'NumpadEnter', code: 'NumpadEnter', label: '↵', color: '#FDE047', legend: '#0F172A', x: originX + keyPitch * 3, z: originZ + keyPitch * 3.5, w: 18, d: 37 },

      // Row 4 (Bottom)
      // 2U horizontal 0
      { id: 'Numpad0', code: 'Numpad0', label: '0', color: '#FBF9F5', legend: '#4C1D95', x: originX + keyPitch * 0.5, z: originZ + keyPitch * 4, w: 37, d: 18 },
      { id: 'NumpadDecimal', code: 'NumpadDecimal', label: '.', color: '#FBF9F5', legend: '#4C1D95', x: originX + keyPitch * 2, z: originZ + keyPitch * 4, w: 18, d: 18 },
    ];
  }, []);

  if (!visible) return null;

  const handleClick = (key: NumpadKeyDef, e: any) => {
    e.stopPropagation();
    handleKeyDown(key.code);
    setTimeout(() => {
      handleKeyUp(key.code);
    }, 150);
  };

  return (
    <group position={position}>
      {/* 1. CNC Chassis for Companion Numpad */}
      <mesh position={[0, -2.0, 0]} castShadow receiveShadow>
        <boxGeometry args={[96.0, 14.0, 128.0]} />
        <primitive object={caseMat} attach="material" />
      </mesh>

      {/* 2. Top Chrome Chamfer Bevel Ring */}
      <mesh position={[0, 4.6, 0]}>
        <boxGeometry args={[92.0, 0.8, 124.0]} />
        <primitive object={bezelChromeMat} attach="material" />
      </mesh>

      {/* Inner Chamber Plate */}
      <mesh position={[0, 4.2, 0]}>
        <boxGeometry args={[86.0, 0.5, 118.0]} />
        <meshStandardMaterial color="#1e1b4b" roughness={0.6} />
      </mesh>

      {/* 3. Right Flank Retro Gamepad Badge & Interactive Slider */}
      <group position={[38.0, 5.2, -18.0]}>
        {/* Recessed Badge Slot */}
        <mesh position={[0, 0, 0]}>
          <boxGeometry args={[8.0, 1.2, 70.0]} />
          <primitive object={badgePlateMat} attach="material" />
        </mesh>

        {/* 3D Star Button Badge */}
        <mesh position={[0, 0.9, -24.0]} rotation={[-Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[2.8, 2.8, 0.8, 5]} />
          <primitive object={starMat} attach="material" />
        </mesh>

        {/* 3D Heart / Gamepad Button Badge */}
        <mesh position={[0, 0.9, -12.0]} rotation={[-Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[2.5, 2.5, 0.8, 6]} />
          <meshStandardMaterial color="#f472b6" roughness={0.3} metalness={0.7} />
        </mesh>

        {/* Vertical Frosted RGB LED Diffuser Window */}
        <mesh position={[0, 0.8, 14.0]}>
          <boxGeometry args={[3.2, 0.6, 30.0]} />
          <meshStandardMaterial
            color="#a78bfa"
            emissive="#c084fc"
            emissiveIntensity={1.8}
            transparent
            opacity={0.9}
          />
        </mesh>
      </group>

      {/* 4. 17 Keycaps */}
      {numpadKeys.map((k) => {
        const isPressed = activePressedKeys.includes(k.code);
        const yPos = isPressed ? 4.8 : 7.2;

        return (
          <group
            key={k.id}
            position={[k.x, yPos, k.z]}
            onClick={(e) => handleClick(k, e)}
          >
            {/* Keycap Shell */}
            <mesh castShadow receiveShadow>
              <boxGeometry args={[k.w, 5.5, k.d]} />
              <meshStandardMaterial
                color={k.color}
                roughness={0.7}
                metalness={0.04}
              />
            </mesh>

            {/* Keycap Bevel Step */}
            <mesh position={[0, 2.8, 0]}>
              <boxGeometry args={[k.w - 2.5, 0.4, k.d - 2.5]} />
              <meshStandardMaterial
                color={k.color}
                roughness={0.65}
                metalness={0.04}
              />
            </mesh>
          </group>
        );
      })}

      {/* 4 Rubber Non-slip Feet */}
      {[-38.0, 38.0].map((fx, i) =>
        [-52.0, 52.0].map((fz, j) => (
          <mesh key={`numpad-foot-${i}-${j}`} position={[fx, -9.2, fz]}>
            <cylinderGeometry args={[4.0, 4.0, 1.2, 16]} />
            <meshStandardMaterial color="#0f172a" roughness={0.95} />
          </mesh>
        ))
      )}
    </group>
  );
};
