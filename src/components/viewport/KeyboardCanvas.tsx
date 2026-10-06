import React, { Suspense } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { ContactShadows } from '@react-three/drei';
import * as THREE from 'three';
import { SceneLighting } from './SceneLighting';
import { CameraController } from './CameraController';
import { KeyboardAssembly } from '../models/KeyboardAssembly';
import { useKeyboardStore } from '../../store/useKeyboardStore';

const DynamicContactShadows: React.FC = () => {
  const cameraPreset = useKeyboardStore((s) => s.cameraPreset);
  const explodedProgress = useKeyboardStore((s) => s.explodedProgress);
  const [isUnderneath, setIsUnderneath] = React.useState(false);

  useFrame(({ camera }) => {
    const under = camera.position.y < -15;
    if (under !== isUnderneath) {
      setIsUnderneath(under);
    }
  });

  if (cameraPreset === 'back' || isUnderneath) {
    return null;
  }

  const shadowOpacity = Math.max(0.05, 0.45 * (1 - explodedProgress * 0.75));
  if (shadowOpacity <= 0.01) return null;

  return (
    <ContactShadows
      position={[0, -25.2, 0]}
      opacity={shadowOpacity}
      scale={480}
      blur={2.4}
      far={45}
      resolution={1024}
      color="#0f172a"
    />
  );
};

export const KeyboardCanvas: React.FC = () => {
  return (
    <div className="w-full h-full relative cursor-grab active:cursor-grabbing">
      <Canvas
        shadows
        camera={{
          fov: 42,
          near: 1.0,
          far: 4000.0,
          position: [140, 220, 260],
        }}
        gl={{
          antialias: true,
          alpha: true,
          powerPreference: 'high-performance',
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1.25,
        }}
      >
        <Suspense fallback={null}>
          <SceneLighting />
          <CameraController />
          <KeyboardAssembly />

          {/* Studio-Grade Blurred Contact Shadow (Grounded at keyboard feet, dissolves on back inspect) */}
          <DynamicContactShadows />
        </Suspense>
      </Canvas>
    </div>
  );
};
