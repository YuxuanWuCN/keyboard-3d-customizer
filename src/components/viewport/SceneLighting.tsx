import React from 'react';
import { useKeyboardStore } from '../../store/useKeyboardStore';

export const SceneLighting: React.FC = () => {
  const lightingMode = useKeyboardStore((s) => s.lightingMode);

  if (lightingMode === 'cyber_neon') {
    return (
      <group>
        <ambientLight intensity={0.25} />
        {/* Neon Cyan Key Light */}
        <directionalLight
          position={[180, 240, 160]}
          intensity={1.8}
          color="#38bdf8"
          castShadow
          shadow-mapSize-width={2048}
          shadow-mapSize-height={2048}
          shadow-camera-near={10}
          shadow-camera-far={600}
          shadow-camera-left={-250}
          shadow-camera-right={250}
          shadow-camera-top={250}
          shadow-camera-bottom={-250}
          shadow-bias={-0.0005}
        />
        {/* Hot Pink Rim Light */}
        <directionalLight position={[-200, 120, -180]} intensity={1.5} color="#ec4899" />
        {/* Soft Violet Fill */}
        <pointLight position={[0, -50, 100]} intensity={0.6} color="#8b5cf6" />
        {/* Underside Cyber Fill Light */}
        <directionalLight position={[0, -180, -100]} intensity={2.0} color="#38bdf8" />
        <directionalLight position={[0, -220, 40]} intensity={1.6} color="#ec4899" />
      </group>
    );
  }

  if (lightingMode === 'dark_minimal') {
    return (
      <group>
        <ambientLight intensity={0.2} />
        <directionalLight
          position={[120, 260, 140]}
          intensity={1.2}
          color="#f1f5f9"
          castShadow
          shadow-mapSize-width={2048}
          shadow-mapSize-height={2048}
          shadow-bias={-0.0005}
        />
        <directionalLight position={[-160, 80, -140]} intensity={0.4} color="#64748b" />
        {/* Underside Inspection Light for Dark Minimal */}
        <directionalLight position={[0, -200, -80]} intensity={1.5} color="#cbd5e1" />
      </group>
    );
  }

  // Default: Photorealistic Studio Lighting with 360° Inspection Support
  return (
    <group>
      <ambientLight intensity={1.1} color="#ffffff" />
      <hemisphereLight args={['#ffffff', '#94a3b8', 1.0]} />
      {/* Primary Top Key Light with Soft PCF Shadows */}
      <directionalLight
        position={[160, 280, 180]}
        intensity={1.9}
        color="#fffaf0"
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-near={10}
        shadow-camera-far={600}
        shadow-camera-left={-240}
        shadow-camera-right={240}
        shadow-camera-top={240}
        shadow-camera-bottom={-240}
        shadow-bias={-0.0004}
      />
      {/* Rim / Fillet Edge Highlight Light */}
      <directionalLight position={[-180, 150, -160]} intensity={1.2} color="#e0f2fe" />
      {/* Front Soft Bounce Light */}
      <directionalLight position={[0, -20, 220]} intensity={0.8} color="#f8fafc" />
      {/* Lateral Fill Light to brighten case side walls and chamfers */}
      <directionalLight position={[220, 60, -40]} intensity={0.8} color="#f1f5f9" />

      {/* ============================================================== */}
      {/* Underside Studio Inspection Rig (Brightens PVD Weight & Hexagram) */}
      {/* ============================================================== */}
      {/* Direct Bottom Key Light: illuminates gold frame engravings & mirror PVD plate */}
      <directionalLight position={[0, -260, -100]} intensity={3.2} color="#ffffff" />
      {/* Warm Golden Cross Light: highlights PVD brass border & PlayStation symbols */}
      <directionalLight position={[-180, -180, 60]} intensity={2.2} color="#fef08a" />
      {/* Cool Silver Fill Light: produces crisp diamond glints on 3D hexagram star facets */}
      <directionalLight position={[180, -180, 60]} intensity={2.2} color="#e0f2fe" />
      {/* Upward Diffuse Fill: eliminates any dark ambient void on the underside */}
      <directionalLight position={[0, -320, 0]} intensity={1.8} color="#f8fafc" />
    </group>
  );
};
