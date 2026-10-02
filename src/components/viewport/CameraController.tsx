import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { useThree, useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import { useKeyboardStore } from '../../store/useKeyboardStore';
import { KEYBOARD_LAYOUTS } from '../../constants/keyboardLayouts';

export const CameraController: React.FC = () => {
  const { camera } = useThree();
  const controlsRef = useRef<OrbitControlsImpl>(null);

  const model = useKeyboardStore((s) => s.model);
  const cameraPreset = useKeyboardStore((s) => s.cameraPreset);
  const autoRotate = useKeyboardStore((s) => s.autoRotate);

  const targetPosRef = useRef(new THREE.Vector3(140, 220, 260));
  const targetLookAtRef = useRef(new THREE.Vector3(0, 0, 0));
  const isTransitioningRef = useRef(true);

  // Compute camera position based on preset and model layout size
  useEffect(() => {
    const layout = KEYBOARD_LAYOUTS[model];
    const { width: W } = layout.dimensions;
    const baseDist = (W / 2) / Math.tan((42 * Math.PI) / 360) * 0.95;

    let pos = new THREE.Vector3(baseDist * 0.48, baseDist * 0.72, baseDist * 0.85);
    let lookAt = new THREE.Vector3(0, 0, 0);

    switch (cameraPreset) {
      case 'top':
        pos = new THREE.Vector3(0, baseDist * 1.35, 1.0);
        break;
      case 'front':
        pos = new THREE.Vector3(0, baseDist * 0.2, baseDist * 1.15);
        break;
      case 'back':
        // Rear weight inspection angle (flip to look from underneath/rear)
        pos = new THREE.Vector3(0, -baseDist * 0.65, -baseDist * 0.95);
        break;
      case 'side':
        // Lateral waistline view
        pos = new THREE.Vector3(baseDist * 1.2, baseDist * 0.25, 0);
        break;
      case 'iso':
        pos = new THREE.Vector3(baseDist * 0.8, baseDist * 0.8, baseDist * 0.8);
        break;
      case 'default':
      default:
        pos = new THREE.Vector3(baseDist * 0.48, baseDist * 0.72, baseDist * 0.85);
        break;
    }

    targetPosRef.current.copy(pos);
    targetLookAtRef.current.copy(lookAt);
    isTransitioningRef.current = true;
  }, [model, cameraPreset]);

  // Yield camera control immediately when user starts dragging/interacting
  useEffect(() => {
    const controls = controlsRef.current;
    if (!controls) return;

    const onStart = () => {
      isTransitioningRef.current = false;
    };

    controls.addEventListener('start', onStart);
    return () => {
      controls.removeEventListener('start', onStart);
    };
  }, []);

  // Smooth camera transition (lerp) only when explicitly transitioning
  useFrame((_, delta) => {
    if (!controlsRef.current) return;

    if (isTransitioningRef.current) {
      const dist = camera.position.distanceTo(targetPosRef.current);
      if (dist < 0.5) {
        camera.position.copy(targetPosRef.current);
        controlsRef.current.target.copy(targetLookAtRef.current);
        isTransitioningRef.current = false;
      } else {
        const lerpSpeed = Math.min(1.0, delta * 4.5);
        camera.position.lerp(targetPosRef.current, lerpSpeed);
        controlsRef.current.target.lerp(targetLookAtRef.current, lerpSpeed);
      }
    }

    controlsRef.current.update();
  });

  return (
    <OrbitControls
      ref={controlsRef}
      enableDamping
      dampingFactor={0.06}
      minDistance={60}
      maxDistance={800}
      maxPolarAngle={Math.PI} // Allow full 360 inspection to view rear PVD weight!
      autoRotate={autoRotate}
      autoRotateSpeed={1.0}
    />
  );
};
