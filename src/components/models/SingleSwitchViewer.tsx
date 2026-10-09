import React, { useMemo, useState, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { SwitchModelId } from '../../types/keyboard';
import {
  createUpperHousingGeometry,
  createLowerHousingGeometry,
  createMXCrossStemGeometry,
  createPinsGeometry,
  createGoldenSpringGeometry,
  HOUSING_SPECS,
  STEM_COLORS,
} from './InstancedSwitchArray';
import { Sparkles, Layers, RotateCcw } from 'lucide-react';

interface SingleSwitchMeshProps {
  switchModel: SwitchModelId;
  explodeProgress: number;
  autoRotate: boolean;
}

const SingleSwitchMesh: React.FC<SingleSwitchMeshProps> = ({
  switchModel,
  explodeProgress,
  autoRotate,
}) => {
  const groupRef = useRef<THREE.Group>(null);
  const isBoxType = switchModel === 'kailh_box_jade';

  // Geometries
  const upperGeom = useMemo(() => createUpperHousingGeometry(), []);
  const lowerGeom = useMemo(() => createLowerHousingGeometry(), []);
  const stemGeom = useMemo(() => createMXCrossStemGeometry(isBoxType, switchModel), [isBoxType, switchModel]);
  const pinsGeom = useMemo(() => createPinsGeometry(), []);
  const springGeom = useMemo(() => createGoldenSpringGeometry(explodeProgress), [explodeProgress]);

  // Materials matching optical specifications
  const spec = HOUSING_SPECS[switchModel] || HOUSING_SPECS.cherry_red;
  const stemColor = STEM_COLORS[switchModel] || '#ef4444';

  const upperMat = useMemo(
    () =>
      new THREE.MeshPhysicalMaterial({
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
      }),
    [spec]
  );

  const lowerMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: new THREE.Color(spec.lowerColor),
        roughness: 0.58,
        metalness: 0.12,
      }),
    [spec]
  );

  const stemMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: new THREE.Color(stemColor),
        roughness: 0.22,
        metalness: 0.05,
      }),
    [stemColor]
  );

  const springMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: new THREE.Color('#f59e0b'), // Gleaming 24K gold PVD
        metalness: 0.98,
        roughness: 0.1,
      }),
    []
  );

  const pinsMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: new THREE.Color('#d97706'), // Phosphor bronze
        metalness: 0.95,
        roughness: 0.18,
      }),
    []
  );

  // Smooth gentle auto-rotation
  useFrame((_, delta) => {
    if (autoRotate && groupRef.current) {
      groupRef.current.rotation.y += delta * 0.45;
    }
  });

  // Vertical displacement for micro-exploded view (mm scale)
  const t = explodeProgress;
  const upperY = 3.6 + 14.0 * t;
  const stemY = 4.2 + 26.0 * t;
  const springY = 1.0 + 8.0 * t;
  const lowerY = -1.8 - 4.0 * t;

  return (
    <group ref={groupRef} position={[0, -2.5, 0]}>
      {/* 1. Upper Housing */}
      <mesh geometry={upperGeom} material={upperMat} position={[0, upperY, 0]} castShadow receiveShadow />

      {/* 2. Cross Stem */}
      <mesh geometry={stemGeom} material={stemMat} position={[0, stemY, 0]} castShadow receiveShadow />

      {/* 3. Golden Progressive Spring */}
      <mesh geometry={springGeom} material={springMat} position={[0, springY, 0]} castShadow />

      {/* 4. Lower Housing with 5-Pin Base & Center Well */}
      <mesh geometry={lowerGeom} material={lowerMat} position={[0, lowerY, 0]} castShadow receiveShadow />

      {/* 5. Phosphor Bronze Solder Pins & Contact Leaf */}
      <mesh geometry={pinsGeom} material={pinsMat} position={[0, lowerY, 0]} castShadow />
    </group>
  );
};

export const SingleSwitchViewer: React.FC<{
  switchModel: SwitchModelId;
  name: string;
  force: string;
  type: string;
}> = ({ switchModel, name, force, type }) => {
  const [explodeProgress, setExplodeProgress] = useState(0.0);
  const [autoRotate, setAutoRotate] = useState(true);

  return (
    <div className="flex flex-col gap-2 p-3 rounded-2xl bg-slate-900/90 border border-sky-500/30 shadow-[0_10px_30px_rgba(0,0,0,0.6)]">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/10 pb-2">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-sky-400 animate-pulse" />
          <div>
            <span className="text-xs font-bold text-white tracking-wide">3D 工业级单轴微距解构展台</span>
            <span className="block text-[9px] text-slate-400 font-mono">Microscopic 3D Switch Inspector</span>
          </div>
        </div>
        <span className="text-[10px] px-2 py-0.5 rounded-full bg-sky-500/20 text-sky-300 font-mono border border-sky-500/30">
          {name}
        </span>
      </div>

      {/* 3D Canvas Box */}
      <div className="relative w-full h-52 rounded-xl bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 border border-white/10 overflow-hidden shadow-inner group">
        <Canvas
          camera={{ position: [20, 16, 22], fov: 38 }}
          gl={{ antialias: true, alpha: true }}
          shadows
        >
          <ambientLight intensity={1.2} />
          <directionalLight position={[15, 25, 20]} intensity={2.2} castShadow />
          <directionalLight position={[-15, -10, -15]} intensity={0.9} color="#93c5fd" />
          <pointLight position={[0, 10, 0]} intensity={1.5} color="#ffffff" />
          <SingleSwitchMesh
            switchModel={switchModel}
            explodeProgress={explodeProgress}
            autoRotate={autoRotate}
          />
          <OrbitControls
            enablePan={false}
            minDistance={12}
            maxDistance={50}
            onStart={() => setAutoRotate(false)}
          />
        </Canvas>

        {/* Overlay Badges */}
        <div className="absolute top-2 left-2 pointer-events-none flex flex-col gap-1">
          <span className="text-[9px] px-1.5 py-0.5 rounded bg-black/60 text-slate-300 font-mono backdrop-blur-md border border-white/10">
            按住左键 360° 自由旋转 • 滚轮缩放
          </span>
        </div>

        {/* Reset View Button */}
        <button
          onClick={() => setAutoRotate(!autoRotate)}
          className="absolute top-2 right-2 p-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white border border-white/10 text-[10px] flex items-center gap-1 backdrop-blur-md transition-colors"
          title={autoRotate ? '暂停旋转' : '自动旋转'}
        >
          <RotateCcw className="w-3 h-3" />
          <span>{autoRotate ? '自转中' : '已暂停'}</span>
        </button>

        {/* Bottom Explode Status Pill */}
        <div className="absolute bottom-2 left-2 pointer-events-none">
          <span className="text-[9px] px-2 py-0.5 rounded-full bg-slate-800/80 text-sky-300 font-mono border border-sky-400/30 backdrop-blur-md">
            解构率: {Math.round(explodeProgress * 100)}%
          </span>
        </div>
      </div>

      {/* Exploded Disassembly Slider Control */}
      <div className="flex flex-col gap-1.5 pt-1">
        <div className="flex items-center justify-between text-[11px]">
          <span className="text-slate-300 font-semibold flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-sky-400" />
            <span>单轴微观五层解构展开</span>
          </span>
          <span className="text-slate-400 font-mono text-[10px]">
            {explodeProgress > 0 ? '轴壳悬浮 • 轴心拔出 • 弹簧透视' : '完全闭合'}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[10px] text-slate-400">闭合</span>
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={explodeProgress}
            onChange={(e) => setExplodeProgress(parseFloat(e.target.value))}
            className="flex-1 accent-sky-400 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
          />
          <span className="text-[10px] text-sky-400 font-semibold">解构</span>
        </div>
      </div>

      {/* Industrial Specs Summary */}
      <div className="grid grid-cols-3 gap-1 pt-1 border-t border-white/5 text-[9px] font-mono text-center">
        <div className="p-1 rounded bg-slate-800/50 text-slate-300">
          <span className="text-slate-500 block">手感类型</span>
          <span className="font-bold text-sky-300">{type}</span>
        </div>
        <div className="p-1 rounded bg-slate-800/50 text-slate-300">
          <span className="text-slate-500 block">触底触发</span>
          <span className="font-bold text-emerald-300">{force}</span>
        </div>
        <div className="p-1 rounded bg-slate-800/50 text-slate-300">
          <span className="text-slate-500 block">PCB 脚位</span>
          <span className="font-bold text-amber-300">5-Pin 热插拔</span>
        </div>
      </div>
    </div>
  );
};
