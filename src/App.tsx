import React, { useEffect } from 'react';
import { useKeyboardStore } from './store/useKeyboardStore';
import { KeyboardCanvas } from './components/viewport/KeyboardCanvas';
import { GlassHeader } from './components/ui/GlassHeader';
import { LeftExplodedDrawer } from './components/ui/LeftExplodedDrawer';
import { RightCustomizerDrawer } from './components/ui/RightCustomizerDrawer';
import { BottomTypingDock } from './components/ui/BottomTypingDock';

export const App: React.FC = () => {
  const handleKeyDown = useKeyboardStore((s) => s.handleKeyDown);
  const handleKeyUp = useKeyboardStore((s) => s.handleKeyUp);

  // Global physical keystroke listener for live 3D key depression & procedural audio
  useEffect(() => {
    const onDown = (e: KeyboardEvent) => {
      handleKeyDown(e.code);
    };
    const onUp = (e: KeyboardEvent) => {
      handleKeyUp(e.code);
    };

    window.addEventListener('keydown', onDown);
    window.addEventListener('keyup', onUp);
    return () => {
      window.removeEventListener('keydown', onDown);
      window.removeEventListener('keyup', onUp);
    };
  }, [handleKeyDown, handleKeyUp]);

  return (
    <div className="w-screen h-screen relative bg-gradient-to-br from-[#f8fafc] via-[#f1f5f9] to-[#e2e8f0] text-slate-800 overflow-hidden font-sans select-none">
      {/* 3D Viewport Canvas */}
      <div className="absolute inset-0 z-0">
        <KeyboardCanvas />
      </div>

      {/* Floating Top Header: Brand, Case Switcher, Quick Tools, Audio & Config */}
      <GlassHeader />

      {/* Floating Left Drawer: Exploded Deconstruction, Gasket Stack & Case Finish */}
      <LeftExplodedDrawer />

      {/* Floating Right Drawer: 7 Theme Presets, Region Select, Color Picker, PBT/ABS, Switches */}
      <RightCustomizerDrawer />

      {/* Floating Bottom Dock: Interactive Typing Sandbox & Real-Time Telemetry HUD */}
      <BottomTypingDock />
    </div>
  );
};
