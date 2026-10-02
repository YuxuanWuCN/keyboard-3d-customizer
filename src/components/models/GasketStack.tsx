import React, { useMemo } from 'react';
import * as THREE from 'three';
import {
  KeyboardModelId,
  GasketLayerId,
  KeycapMaterialParams,
  SwitchType,
  SwitchModelId,
} from '../../types/keyboard';
import { KEYBOARD_LAYOUTS } from '../../constants/keyboardLayouts';
import { KeycapItem } from './KeycapItem';
import { InstancedSwitchArray } from './InstancedSwitchArray';

interface GasketStackProps {
  model: KeyboardModelId;
  explodedProgress: number;
  layerVisibility: Record<GasketLayerId, boolean>;
  isolatedLayer: GasketLayerId | null;
  selectedKeyIds: string[];
  activePressedKeys: string[];
  keycapColorOverrides: Record<string, string>;
  activePresetTheme: string | null;
  keycapMaterial: KeycapMaterialParams;
  switchType: SwitchType;
  switchModel: SwitchModelId;
  onKeyClick: (keyId: string, e: any) => void;
}

function cubicEase(t: number): number {
  return t * t * (3 - 2 * t);
}

// Procedural Canvas Texture for PCB Immersion Gold Traces
function createPcbGoldTexture(width: number, depth: number): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  // Matte dark solder mask
  ctx.fillStyle = '#0a101d';
  ctx.fillRect(0, 0, 1024, 512);

  // PCB Grid silkscreen lines
  ctx.strokeStyle = '#1e293b';
  ctx.lineWidth = 1;
  for (let x = 0; x < 1024; x += 32) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, 512);
    ctx.stroke();
  }
  for (let y = 0; y < 512; y += 32) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(1024, y);
    ctx.stroke();
  }

  // Immersion Gold Traces & SMT Pads
  ctx.strokeStyle = '#eab308'; // Gold
  ctx.fillStyle = '#fbbf24';
  ctx.lineWidth = 2.5;

  // Circuit traces routing
  for (let i = 0; i < 28; i++) {
    const startX = (i * 36) + 40;
    const startY = 80 + (i % 6) * 60;
    ctx.beginPath();
    ctx.moveTo(startX, startY);
    ctx.lineTo(startX + 80, startY + 30);
    ctx.lineTo(startX + 140, startY + 30);
    ctx.stroke();

    // SMT solder pads
    ctx.fillRect(startX - 6, startY - 4, 12, 8);
    ctx.fillRect(startX + 134, startY + 26, 12, 8);
  }

  // Brand silkscreen on PCB
  ctx.fillStyle = '#f8fafc';
  ctx.font = 'bold 20px "Courier New", monospace';
  ctx.fillText('CYBERKEY GASKET CUSTOM PCB — REV 2.4 IMMERSION GOLD', 60, 480);

  const texture = new THREE.CanvasTexture(canvas);
  texture.anisotropy = 4;
  return texture;
}

export const GasketStack: React.FC<GasketStackProps> = ({
  model,
  explodedProgress,
  layerVisibility,
  isolatedLayer,
  selectedKeyIds,
  activePressedKeys,
  keycapColorOverrides,
  activePresetTheme,
  keycapMaterial,
  switchType,
  switchModel,
  onKeyClick,
}) => {
  const layout = KEYBOARD_LAYOUTS[model];
  const { width: W, depth: D } = layout.dimensions;

  // Key matrix layout bounds calculation
  const { keyPositions, matrixW, matrixD } = useMemo(() => {
    let maxX = 0;
    let maxY = 0;
    layout.keys.forEach((k) => {
      const endX = k.gridX + k.unitWidth;
      const endY = k.gridY + (k.unitHeight || 1.0);
      if (endX > maxX) maxX = endX;
      if (endY > maxY) maxY = endY;
    });

    const totalW = maxX * 19.05;
    const totalD = maxY * 19.05;

    const positions = layout.keys.map((k) => {
      const centerX = (k.gridX + k.unitWidth / 2) * 19.05 - totalW / 2;
      const centerZ = (k.gridY + (k.unitHeight || 1.0) / 2) * 19.05 - totalD / 2;
      return {
        id: k.id,
        keyDef: k,
        x: centerX,
        z: centerZ,
      };
    });

    return { keyPositions: positions, matrixW: totalW, matrixD: totalD };
  }, [layout]);

  // Eased displacement
  const t = cubicEase(explodedProgress);

  // Exact layer offsets (along local Y axis) calibrated for >= 0.10mm clearance everywhere
  const keycapsY = 22.45 + 115.0 * t;
  const switchUpperY = 14.35 + 85.0 * t;
  const switchLowerY = 9.00 + 70.0 * t;
  const plateY = 5.65 + 48.0 * t;
  const poronFoamY = 3.05 + 28.0 * t;
  const ixpePadY = 0.95 + 24.0 * t;
  const pcbY = 0.0 + 10.0 * t;
  const caseFoamY = -2.20 - 18.0 * t;

  // Visibility flags
  const showKeycaps = (!isolatedLayer || isolatedLayer === 'keycaps') && layerVisibility.keycaps;
  const showSwitches = (!isolatedLayer || isolatedLayer === 'switches') && layerVisibility.switches;
  const showPlate = (!isolatedLayer || isolatedLayer === 'plate') && layerVisibility.plate;
  const showPoron = (!isolatedLayer || isolatedLayer === 'poron_ixpe') && layerVisibility.poron_ixpe;
  const showPcb = (!isolatedLayer || isolatedLayer === 'pcb') && layerVisibility.pcb;
  const showCaseFoam = (!isolatedLayer || isolatedLayer === 'case_foam') && layerVisibility.case_foam;

  // 1. Gasket Plate Geometry with perimeter mounting tabs and flex cuts
  const plateGeom = useMemo(() => {
    const plateW = matrixW + 2.0;
    const plateD = matrixD + 2.0;
    const shape = new THREE.Shape();
    const x = -plateW / 2;
    const y = -plateD / 2;
    shape.moveTo(x, y);
    shape.lineTo(x + plateW, y);
    shape.lineTo(x + plateW, y + plateD);
    shape.lineTo(x, y + plateD);
    shape.closePath();

    // 14x14mm square switch cutouts
    keyPositions.forEach((pos) => {
      const hole = new THREE.Path();
      const hw = 7.0;
      const hz = 7.0;
      // In shape coordinates (X and Y map to 3D X and -Z)
      const hx = pos.x;
      const hy = -pos.z;
      hole.moveTo(hx - hw, hy - hz);
      hole.lineTo(hx + hw, hy - hz);
      hole.lineTo(hx + hw, hy + hz);
      hole.lineTo(hx - hw, hy + hz);
      hole.closePath();
      shape.holes.push(hole);
    });

    const g = new THREE.ExtrudeGeometry(shape, { depth: 1.5, bevelEnabled: false });
    g.rotateX(Math.PI / 2);
    g.center();
    return g;
  }, [keyPositions, matrixW, matrixD]);

  // Gasket tabs around perimeter (12 silicone tabs) resting on internal case mounting ledges
  const gasketTabs = useMemo(() => {
    const tabs: { x: number; z: number; w: number; d: number }[] = [];
    const halfW = (matrixW + 2.0) / 2;
    const halfD = (matrixD + 2.0) / 2;

    // Top and Bottom tabs
    for (let i = -2; i <= 2; i++) {
      tabs.push({ x: (i * matrixW) / 5, z: -halfD - 0.75, w: 10.0, d: 2.0 });
      tabs.push({ x: (i * matrixW) / 5, z: halfD + 0.75, w: 10.0, d: 2.0 });
    }
    // Left and Right tabs
    tabs.push({ x: -halfW - 0.75, z: -halfD / 2, w: 2.0, d: 10.0 });
    tabs.push({ x: -halfW - 0.75, z: halfD / 2, w: 2.0, d: 10.0 });
    tabs.push({ x: halfW + 0.75, z: -halfD / 2, w: 2.0, d: 10.0 });
    tabs.push({ x: halfW + 0.75, z: halfD / 2, w: 2.0, d: 10.0 });

    return tabs;
  }, [matrixW, matrixD]);

  // 2. Poron Sandwich Foam Geometry
  const poronGeom = useMemo(() => {
    const shape = new THREE.Shape();
    const w = matrixW + 1.5;
    const d = matrixD + 1.5;
    shape.moveTo(-w / 2, -d / 2);
    shape.lineTo(w / 2, -d / 2);
    shape.lineTo(w / 2, d / 2);
    shape.lineTo(-w / 2, d / 2);
    shape.closePath();

    keyPositions.forEach((pos) => {
      const hole = new THREE.Path();
      const hw = 6.8;
      const hz = 6.8;
      const hx = pos.x;
      const hy = -pos.z;
      hole.moveTo(hx - hw, hy - hz);
      hole.lineTo(hx + hw, hy - hz);
      hole.lineTo(hx + hw, hy + hz);
      hole.lineTo(hx - hw, hy + hz);
      hole.closePath();
      shape.holes.push(hole);
    });

    const g = new THREE.ExtrudeGeometry(shape, { depth: 3.5, bevelEnabled: false });
    g.rotateX(Math.PI / 2);
    g.center();
    return g;
  }, [keyPositions, matrixW, matrixD]);

  // 3. IXPE Switch Sheet Geometry
  const ixpeGeom = useMemo(() => {
    const shape = new THREE.Shape();
    const w = matrixW + 1.0;
    const d = matrixD + 1.0;
    shape.moveTo(-w / 2, -d / 2);
    shape.lineTo(w / 2, -d / 2);
    shape.lineTo(w / 2, d / 2);
    shape.lineTo(-w / 2, d / 2);
    shape.closePath();

    // Small pin perforations
    keyPositions.forEach((pos) => {
      const hole = new THREE.Path();
      const r = 2.5;
      hole.absarc(pos.x, -pos.z, r, 0, Math.PI * 2, true);
      shape.holes.push(hole);
    });

    const g = new THREE.ExtrudeGeometry(shape, { depth: 0.5, bevelEnabled: false });
    g.rotateX(Math.PI / 2);
    g.center();
    return g;
  }, [keyPositions, matrixW, matrixD]);

  // 4. Flex-Cut PCB Geometry & Texture
  const pcbTexture = useMemo(() => createPcbGoldTexture(matrixW, matrixD), [matrixW, matrixD]);

  const pcbGeom = useMemo(() => {
    const shape = new THREE.Shape();
    const w = matrixW + 2.0;
    const d = matrixD + 2.0;
    shape.moveTo(-w / 2, -d / 2);
    shape.lineTo(w / 2, -d / 2);
    shape.lineTo(w / 2, d / 2);
    shape.lineTo(-w / 2, d / 2);
    shape.closePath();

    const g = new THREE.ExtrudeGeometry(shape, { depth: 1.2, bevelEnabled: false });
    g.rotateX(Math.PI / 2);
    g.center();
    return g;
  }, [matrixW, matrixD]);

  // 5. Bottom Case Dampener Foam Geometry
  const caseFoamGeom = useMemo(() => {
    const shape = new THREE.Shape();
    const w = matrixW + 1.5;
    const d = matrixD + 1.5;
    shape.moveTo(-w / 2, -d / 2);
    shape.lineTo(w / 2, -d / 2);
    shape.lineTo(w / 2, d / 2);
    shape.lineTo(-w / 2, d / 2);
    shape.closePath();

    const g = new THREE.ExtrudeGeometry(shape, { depth: 2.0, bevelEnabled: false });
    g.rotateX(Math.PI / 2);
    g.center();
    return g;
  }, [matrixW, matrixD]);

  // Materials
  const plateMat = useMemo(() => {
    return new THREE.MeshStandardMaterial({
      color: new THREE.Color('#334155'), // FR4 Matte Slate
      roughness: 0.45,
      metalness: 0.4,
    });
  }, []);

  const siliconeTabMat = useMemo(() => {
    return new THREE.MeshStandardMaterial({
      color: new THREE.Color('#0f172a'), // Black silicone damping sock
      roughness: 0.95,
      metalness: 0.05,
    });
  }, []);

  const poronMat = useMemo(() => {
    return new THREE.MeshStandardMaterial({
      color: new THREE.Color('#141416'),
      roughness: 0.98,
      metalness: 0.0,
    });
  }, []);

  const ixpeMat = useMemo(() => {
    return new THREE.MeshStandardMaterial({
      color: new THREE.Color('#1e222d'),
      roughness: 0.9,
      metalness: 0.05,
    });
  }, []);

  const pcbMat = useMemo(() => {
    return new THREE.MeshStandardMaterial({
      map: pcbTexture,
      roughness: 0.5,
      metalness: 0.35,
    });
  }, [pcbTexture]);

  return (
    <group>
      {/* ======================================================== */}
      {/* LAYER 1: KEYCAP ARRAY (Cherry Profile)                  */}
      {/* ======================================================== */}
      {showKeycaps && (
        <group position={[0, keycapsY, 0]}>
          {keyPositions.map((item) => {
            const isSelected = selectedKeyIds.includes(item.id);
            const isPressed = activePressedKeys.includes(item.keyDef.code);
            const topColor =
              keycapColorOverrides[item.id] ||
              (item.keyDef.region === 'accent'
                ? '#7b9a7b'
                : item.keyDef.region === 'modifiers'
                ? '#c1beb5'
                : '#e3dfd5');

            return (
              <KeycapItem
                key={item.id}
                keyDef={item.keyDef}
                xPos={item.x}
                zPos={item.z}
                topColor={topColor}
                legendColor={item.keyDef.region === 'accent' ? '#ffffff' : '#2b2d2f'}
                materialParams={keycapMaterial}
                isSelected={isSelected}
                isPressed={isPressed}
                onClick={(e) => onKeyClick(item.id, e)}
              />
            );
          })}
        </group>
      )}

      {/* ======================================================== */}
      {/* LAYER 2: MECHANICAL SWITCH ARRAY (4 Instanced Meshes)   */}
      {/* ======================================================== */}
      <InstancedSwitchArray
        keyPositions={keyPositions}
        switchType={switchType}
        switchModel={switchModel}
        upperY={switchUpperY}
        lowerY={switchLowerY}
        visible={showSwitches}
      />

      {/* ======================================================== */}
      {/* LAYER 3: GASKET-TABBED SWITCH PLATE                     */}
      {/* ======================================================== */}
      {showPlate && (
        <group position={[0, plateY, 0]}>
          <mesh geometry={plateGeom} material={plateMat} castShadow receiveShadow />

          {/* Silicone Gasket Dampers (Socks) on Perimeter Tabs */}
          {gasketTabs.map((tab, idx) => (
            <mesh key={`tab-${idx}`} position={[tab.x, 0, tab.z]}>
              <boxGeometry args={[tab.w, 2.4, tab.d]} />
              <primitive object={siliconeTabMat} attach="material" />
            </mesh>
          ))}
        </group>
      )}

      {/* ======================================================== */}
      {/* LAYER 4: PORON SANDWICH FOAM & IXPE SWITCH SHEET       */}
      {/* ======================================================== */}
      {showPoron && (
        <>
          {/* Poron Sandwich Foam */}
          <group position={[0, poronFoamY, 0]}>
            <mesh geometry={poronGeom} material={poronMat} receiveShadow />
          </group>
          {/* IXPE Acoustic Switch Pad Sheet */}
          <group position={[0, ixpePadY, 0]}>
            <mesh geometry={ixpeGeom} material={ixpeMat} receiveShadow />
          </group>
        </>
      )}

      {/* ======================================================== */}
      {/* LAYER 5: FLEX-CUT PCB & HOT-SWAP SOCKETS                */}
      {/* ======================================================== */}
      {showPcb && (
        <group position={[0, pcbY, 0]}>
          <mesh geometry={pcbGeom} material={pcbMat} receiveShadow />

          {/* Kailh Hot-Swap Sockets on Underside of PCB */}
          {keyPositions.map((pos) => (
            <group key={`socket-${pos.id}`} position={[pos.x, -0.85, pos.z]}>
              <mesh position={[0, 0, 3.5]}>
                <boxGeometry args={[10.5, 0.5, 4.0]} />
                <meshStandardMaterial color="#0f172a" roughness={0.9} />
              </mesh>
              {/* Gold socket contact pins */}
              <mesh position={[-3.2, 0.15, 3.5]}>
                <boxGeometry args={[1.5, 0.3, 1.5]} />
                <meshStandardMaterial color="#eab308" metalness={0.9} roughness={0.2} />
              </mesh>
              <mesh position={[3.2, 0.15, 3.5]}>
                <boxGeometry args={[1.5, 0.3, 1.5]} />
                <meshStandardMaterial color="#eab308" metalness={0.9} roughness={0.2} />
              </mesh>
            </group>
          ))}
        </group>
      )}

      {/* ======================================================== */}
      {/* LAYER 6: BOTTOM CASE DAMPENER FOAM                      */}
      {/* ======================================================== */}
      {showCaseFoam && (
        <group position={[0, caseFoamY, 0]}>
          <mesh geometry={caseFoamGeom} material={poronMat} receiveShadow />
        </group>
      )}
    </group>
  );
};
