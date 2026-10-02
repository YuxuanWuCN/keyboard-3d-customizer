import React, { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { KeyboardModelId } from '../../types/keyboard';
import { KEYBOARD_LAYOUTS } from '../../constants/keyboardLayouts';

interface AviatorCableProps {
  model: KeyboardModelId;
  visible?: boolean;
  ledColor?: string;
  cableColor?: string;
  explodedProgress?: number;
}

export const AviatorCable: React.FC<AviatorCableProps> = ({
  model,
  visible = true,
  ledColor = '#38bdf8',
  cableColor = '#2563eb',
  explodedProgress = 0,
}) => {
  const layout = KEYBOARD_LAYOUTS[model];
  const { width: W, depth: D } = layout.dimensions;

  const haloMatRef = useRef<THREE.MeshStandardMaterial>(null);
  const pointLightRef = useRef<THREE.PointLight>(null);

  // Smooth breathing pulse on the neon LED ring
  useFrame((state) => {
    if (haloMatRef.current) {
      const pulse = 2.8 + Math.sin(state.clock.elapsedTime * 3.5) * 0.8;
      haloMatRef.current.emissiveIntensity = pulse;
      if (pointLightRef.current) {
        pointLightRef.current.intensity = pulse * 0.65;
      }
    }
  });

  // Calculate USB-C port position on the top-right rear corner
  const portX = W / 2 - 38.0;
  const portZ = -D / 2 + 1.2;
  // Follow PCB/top case elevation during exploded view
  const portY = 6.2 + explodedProgress * 20.0;

  // 1. Spline curve for the flexible coiled/paracord aviator cable
  const { cableGeom, aviatorPosition, aviatorTangent } = useMemo(() => {
    // Points along the natural drape of the cable
    const p0 = new THREE.Vector3(portX, portY, portZ - 18.0); // Exit from knurled plug
    const p1 = new THREE.Vector3(portX + 2.0, portY + 4.0, portZ - 45.0); // Swoop up & back
    const p2 = new THREE.Vector3(portX + 28.0, portY - 2.0, portZ - 85.0); // First curve to right
    const p3 = new THREE.Vector3(portX + 55.0, portY - 14.0, portZ - 110.0); // Dropping toward desk
    const p4 = new THREE.Vector3(portX + 68.0, -22.5, portZ - 130.0); // Touching desk
    const p5 = new THREE.Vector3(portX + 42.0, -23.0, portZ - 165.0); // Serpentine curve on desk
    const p6 = new THREE.Vector3(portX + 8.0, -23.5, portZ - 195.0); // Continuing away

    const curve = new THREE.CatmullRomCurve3([p0, p1, p2, p3, p4, p5, p6]);
    const geom = new THREE.TubeGeometry(curve, 72, 2.25, 16, false);

    // Calculate position and tangent for the push-pull aviator quick-disconnect lock
    const aviatorT = 0.36;
    const pos = curve.getPoint(aviatorT);
    const tan = curve.getTangent(aviatorT);

    return {
      cableGeom: geom,
      aviatorPosition: pos,
      aviatorTangent: tan,
    };
  }, [portX, portY, portZ]);

  // Chrome metal material for the knurled plug and aviator lock
  const chromeMat = useMemo(() => {
    return new THREE.MeshStandardMaterial({
      color: new THREE.Color('#d4dbe4'),
      metalness: 0.94,
      roughness: 0.18,
    });
  }, []);

  // Diamond knurled accent metal material
  const knurledMat = useMemo(() => {
    return new THREE.MeshStandardMaterial({
      color: new THREE.Color('#cbd5e1'),
      metalness: 0.92,
      roughness: 0.38,
    });
  }, []);

  // Paracord / silicone outer cable sleeve material
  const cableMat = useMemo(() => {
    return new THREE.MeshStandardMaterial({
      color: new THREE.Color(cableColor),
      roughness: 0.52,
      metalness: 0.08,
    });
  }, [cableColor]);

  // Glowing Neon LED Ring Material
  const ledRingMat = useMemo(() => {
    return new THREE.MeshStandardMaterial({
      color: new THREE.Color(ledColor),
      emissive: new THREE.Color(ledColor),
      emissiveIntensity: 3.2,
      roughness: 0.2,
      metalness: 0.1,
    });
  }, [ledColor]);

  if (!visible) return null;

  return (
    <group>
      {/* ======================================================== */}
      {/* 1. TYPE-C METAL PLUG & KNURLED CHROME AVIATOR CONNECTOR  */}
      {/* ======================================================== */}
      <group position={[portX, portY, portZ]}>
        {/* Inner Type-C gold/nickel contacts entering the case slot */}
        <mesh position={[0, 0, 3.0]}>
          <boxGeometry args={[8.4, 3.2, 7.0]} />
          <meshStandardMaterial color="#94a3b8" metalness={0.9} roughness={0.2} />
        </mesh>

        {/* CNC Metal Plug Barrel Housing */}
        <mesh position={[0, 0, -4.5]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[4.2, 4.2, 9.0, 24]} />
          <primitive object={chromeMat} attach="material" />
        </mesh>

        {/* Diamond Knurled Grip Ring on Plug */}
        <mesh position={[0, 0, -9.5]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[4.6, 4.6, 3.5, 24]} />
          <primitive object={knurledMat} attach="material" />
        </mesh>

        {/* Threaded Lock Ring Accent */}
        <mesh position={[0, 0, -11.8]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[4.3, 4.3, 1.2, 24]} />
          <primitive object={chromeMat} attach="material" />
        </mesh>

        {/* ======================================================== */}
        {/* 2. ILLUMINATED NEON LED HALO RING (As seen in photo!)    */}
        {/* ======================================================== */}
        <mesh position={[0, 0, -13.5]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[4.4, 4.4, 2.2, 24]} />
          <primitive object={ledRingMat} attach="material" ref={haloMatRef} />
        </mesh>

        {/* Local point light casting soft neon halo glow */}
        <pointLight
          ref={pointLightRef}
          position={[0, 0, -13.5]}
          color={ledColor}
          intensity={2.0}
          distance={45}
          decay={2}
        />

        {/* Rubber strain relief boot */}
        <mesh position={[0, 0, -16.0]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[3.2, 2.4, 3.0, 16]} />
          <meshStandardMaterial color="#1e293b" roughness={0.8} />
        </mesh>
      </group>

      {/* ======================================================== */}
      {/* 3. PARACORD / SILICONE AVIATOR CABLE (3D Spline Curve)   */}
      {/* ======================================================== */}
      <mesh geometry={cableGeom} material={cableMat} castShadow receiveShadow />

      {/* ======================================================== */}
      {/* 4. MIDWAY PUSH-PULL METAL AVIATOR QUICK-DISCONNECT LOCK  */}
      {/* ======================================================== */}
      {aviatorPosition && (
        <group position={aviatorPosition}>
          {/* Main Aviator Metal Cylinder */}
          <mesh>
            <cylinderGeometry args={[6.5, 6.5, 14.0, 24]} />
            <primitive object={chromeMat} attach="material" />
          </mesh>
          {/* Knurled Quick-Release Spring Collar */}
          <mesh position={[0, 1.5, 0]}>
            <cylinderGeometry args={[7.2, 7.2, 6.0, 24]} />
            <primitive object={knurledMat} attach="material" />
          </mesh>
          {/* Locking Hex Screws */}
          <mesh position={[6.0, 0, 0]}>
            <cylinderGeometry args={[0.9, 0.9, 2.0, 8]} />
            <meshStandardMaterial color="#64748b" metalness={0.9} roughness={0.3} />
          </mesh>
          <mesh position={[-6.0, 0, 0]}>
            <cylinderGeometry args={[0.9, 0.9, 2.0, 8]} />
            <meshStandardMaterial color="#64748b" metalness={0.9} roughness={0.3} />
          </mesh>
        </group>
      )}
    </group>
  );
};
