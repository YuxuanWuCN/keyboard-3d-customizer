import React, { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { KeyboardModelId } from '../../types/keyboard';
import { KEYBOARD_LAYOUTS } from '../../constants/keyboardLayouts';

interface AviatorCableProps {
  model: KeyboardModelId;
  visible?: boolean;
  style?: 'coiled' | 'straight';
  cableColor?: string;
  ledColor?: string;
  connectorMaterial?: 'chrome' | 'matte_black' | 'brass_gold';
  explodedProgress?: number;
}

export const AviatorCable: React.FC<AviatorCableProps> = ({
  model,
  visible = true,
  style = 'coiled',
  cableColor = '#2563eb',
  ledColor = '#38bdf8',
  connectorMaterial = 'chrome',
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

  // Calculate USB-C port position on the top-right rear wall
  const portX = W / 2 - 38.0;
  const portZ = -D / 2 + 1.2;
  // Follow PCB/top case elevation during exploded view
  const portY = 6.2 + explodedProgress * 20.0;

  // 1. Generate 3D Tube Geometry for Cable (Coiled Spring vs Straight)
  const { cableGeom, aviatorPosition, aviatorRotation } = useMemo(() => {
    const points: THREE.Vector3[] = [];

    // Plug lead exit
    const pStart = new THREE.Vector3(portX, portY, portZ - 18.0);
    points.push(pStart);

    if (style === 'coiled') {
      // Short lead straight back from port
      const pLead = new THREE.Vector3(portX, portY, portZ - 36.0);
      points.push(pLead);

      // Smooth 90° turn toward the center (left along -X)
      const pTurn1 = new THREE.Vector3(portX - 6.0, portY - 6.0, portZ - 44.0);
      const pTurn2 = new THREE.Vector3(portX - 16.0, -14.0, portZ - 48.0);
      points.push(pTurn1, pTurn2);

      // Helical Spring Coil Section (running horizontally along -X behind keyboard)
      const coilStartX = portX - 22.0;
      const coilLength = 125.0; // 125mm horizontal span
      const numTurns = 17; // 17 tight professional coils
      const coilRadius = 8.5; // ~17mm outer coil diameter
      const coilCenterY = -14.0;
      const coilCenterZ = portZ - 48.0;

      const samplesPerTurn = 14;
      const totalSamples = numTurns * samplesPerTurn;

      for (let i = 0; i <= totalSamples; i++) {
        const t = i / totalSamples;
        const angle = t * numTurns * Math.PI * 2;
        const x = coilStartX - t * coilLength;
        const y = coilCenterY + Math.cos(angle) * coilRadius;
        const z = coilCenterZ + Math.sin(angle) * coilRadius;
        points.push(new THREE.Vector3(x, y, z));
      }

      // Exit from coil toward the aviator quick-disconnect lock
      const coilEndX = coilStartX - coilLength;
      const pCoilExit1 = new THREE.Vector3(coilEndX - 10.0, -18.0, portZ - 52.0);
      const pCoilExit2 = new THREE.Vector3(coilEndX - 24.0, -22.0, portZ - 64.0);
      points.push(pCoilExit1, pCoilExit2);

      // Position for the Heavy Metal Aviator Connector right after coil
      const aviatorPos = new THREE.Vector3(coilEndX - 34.0, -22.5, portZ - 76.0);
      const pHost1 = new THREE.Vector3(coilEndX - 44.0, -23.0, portZ - 88.0);
      const pHost2 = new THREE.Vector3(coilEndX - 32.0, -23.5, portZ - 120.0);
      const pHost3 = new THREE.Vector3(coilEndX - 8.0, -23.8, portZ - 160.0);
      points.push(aviatorPos, pHost1, pHost2, pHost3);

      const curve = new THREE.CatmullRomCurve3(points);
      const geom = new THREE.TubeGeometry(curve, 320, 2.1, 16, false);

      return {
        cableGeom: geom,
        aviatorPosition: aviatorPos,
        aviatorRotation: [0, -Math.PI / 4, 0] as [number, number, number],
      };
    } else {
      // Smooth natural drape straight cable
      const p1 = new THREE.Vector3(portX + 2.0, portY + 4.0, portZ - 45.0);
      const p2 = new THREE.Vector3(portX + 28.0, portY - 2.0, portZ - 85.0);
      const p3 = new THREE.Vector3(portX + 55.0, portY - 14.0, portZ - 110.0);
      const p4 = new THREE.Vector3(portX + 68.0, -22.5, portZ - 130.0);
      const p5 = new THREE.Vector3(portX + 42.0, -23.0, portZ - 165.0);
      const p6 = new THREE.Vector3(portX + 8.0, -23.5, portZ - 195.0);

      const curve = new THREE.CatmullRomCurve3([pStart, p1, p2, p3, p4, p5, p6]);
      const geom = new THREE.TubeGeometry(curve, 80, 2.2, 16, false);

      const aviatorT = 0.38;
      const aviatorPos = curve.getPoint(aviatorT);

      return {
        cableGeom: geom,
        aviatorPosition: aviatorPos,
        aviatorRotation: [0, 0, 0] as [number, number, number],
      };
    }
  }, [portX, portY, portZ, style]);

  // Metal material for the plug and aviator lock based on connectorMaterial
  const metalMat = useMemo(() => {
    if (connectorMaterial === 'matte_black') {
      return new THREE.MeshStandardMaterial({
        color: new THREE.Color('#1f2937'),
        metalness: 0.85,
        roughness: 0.35,
      });
    } else if (connectorMaterial === 'brass_gold') {
      return new THREE.MeshStandardMaterial({
        color: new THREE.Color('#d4af37'),
        metalness: 0.96,
        roughness: 0.16,
      });
    }
    // Default: High-luster Chrome Silver
    return new THREE.MeshStandardMaterial({
      color: new THREE.Color('#d4dbe4'),
      metalness: 0.95,
      roughness: 0.18,
    });
  }, [connectorMaterial]);

  // Diamond knurled accent metal material
  const knurledMat = useMemo(() => {
    const baseColor =
      connectorMaterial === 'matte_black'
        ? '#111827'
        : connectorMaterial === 'brass_gold'
        ? '#b45309'
        : '#94a3b8';
    return new THREE.MeshStandardMaterial({
      color: new THREE.Color(baseColor),
      metalness: 0.92,
      roughness: 0.42,
    });
  }, [connectorMaterial]);

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
      {/* 1. TYPE-C METAL PLUG & KNURLED CHROME CONNECTOR          */}
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
          <primitive object={metalMat} attach="material" />
        </mesh>

        {/* Diamond Knurled Grip Ring on Plug */}
        <mesh position={[0, 0, -9.5]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[4.6, 4.6, 3.5, 24]} />
          <primitive object={knurledMat} attach="material" />
        </mesh>

        {/* Threaded Lock Ring Accent */}
        <mesh position={[0, 0, -11.8]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[4.3, 4.3, 1.2, 24]} />
          <primitive object={metalMat} attach="material" />
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
      {/* 3. PARACORD AVIATOR CABLE (3D Coiled Spring / Straight)  */}
      {/* ======================================================== */}
      <mesh geometry={cableGeom} material={cableMat} castShadow receiveShadow />

      {/* ======================================================== */}
      {/* 4. HEAVY METAL AVIATOR QUICK-DISCONNECT CONNECTOR        */}
      {/* ======================================================== */}
      {aviatorPosition && (
        <group position={aviatorPosition} rotation={aviatorRotation}>
          {/* Main Aviator Metal Cylinder Housing */}
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[6.5, 6.5, 18.0, 24]} />
            <primitive object={metalMat} attach="material" />
          </mesh>
          {/* Knurled Quick-Release Spring Collar */}
          <mesh position={[0, 0, 1.5]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[7.2, 7.2, 8.0, 24]} />
            <primitive object={knurledMat} attach="material" />
          </mesh>
          {/* Threaded Lock Ring */}
          <mesh position={[0, 0, -4.5]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[6.8, 6.8, 2.5, 24]} />
            <primitive object={metalMat} attach="material" />
          </mesh>
          {/* Fastening Hex Screws */}
          <mesh position={[5.8, 0, 0]}>
            <cylinderGeometry args={[0.9, 0.9, 2.0, 8]} />
            <meshStandardMaterial color="#64748b" metalness={0.9} roughness={0.3} />
          </mesh>
          <mesh position={[-5.8, 0, 0]}>
            <cylinderGeometry args={[0.9, 0.9, 2.0, 8]} />
            <meshStandardMaterial color="#64748b" metalness={0.9} roughness={0.3} />
          </mesh>
          {/* Rubber Cable Relief Sleeves at both ends */}
          <mesh position={[0, 0, 10.5]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[4.2, 3.2, 4.0, 16]} />
            <meshStandardMaterial color="#1e293b" roughness={0.85} />
          </mesh>
          <mesh position={[0, 0, -10.5]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[3.2, 4.2, 4.0, 16]} />
            <meshStandardMaterial color="#1e293b" roughness={0.85} />
          </mesh>
        </group>
      )}
    </group>
  );
};
