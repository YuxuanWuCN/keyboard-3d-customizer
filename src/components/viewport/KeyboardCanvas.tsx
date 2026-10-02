import React, { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { ContactShadows } from '@react-three/drei';
import * as THREE from 'three';
import { SceneLighting } from './SceneLighting';
import { CameraController } from './CameraController';
import { KeyboardAssembly } from '../models/KeyboardAssembly';
import { useKeyboardStore } from '../../store/useKeyboardStore';

export const KeyboardCanvas: React.FC = () => {
  const cameraPreset = useKeyboardStore((s) => s.cameraPreset);
  const explodedProgress = useKeyboardStore((s) => s.explodedProgress);

  // Smoothly dissolve contact shadow when inspecting back weight or when fully exploded
  const shadowOpacity =
    cameraPreset === 'back'
      ? 0.0
      : Math.max(0.05, 0.45 * (1 - explodedProgress * 0.75));

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
          {shadowOpacity > 0.01 && (
            <ContactShadows
              position={[0, -25.2, 0]}
              opacity={shadowOpacity}
              scale={480}
              blur={2.4}
              far={45}
              resolution={1024}
              color="#0f172a"
            />
          )}
        </Suspense>
      </Canvas>
    </div>
  );
};
