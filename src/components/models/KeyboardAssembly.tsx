import React from 'react';
import { useKeyboardStore } from '../../store/useKeyboardStore';
import { KEYBOARD_LAYOUTS } from '../../constants/keyboardLayouts';
import { ProceduralCase } from './ProceduralCase';
import { GasketStack } from './GasketStack';

export const KeyboardAssembly: React.FC = () => {
  const model = useKeyboardStore((s) => s.model);
  const caseColor = useKeyboardStore((s) => s.caseColor);
  const caseFinish = useKeyboardStore((s) => s.caseFinish);
  const weightMaterial = useKeyboardStore((s) => s.weightMaterial);
  const explodedProgress = useKeyboardStore((s) => s.explodedProgress);
  const isolatedLayer = useKeyboardStore((s) => s.isolatedLayer);
  const layerVisibility = useKeyboardStore((s) => s.layerVisibility);
  const selectedKeyIds = useKeyboardStore((s) => s.selectedKeyIds);
  const activePressedKeys = useKeyboardStore((s) => s.activePressedKeys);
  const keycapColorOverrides = useKeyboardStore((s) => s.keycapColorOverrides);
  const activePresetTheme = useKeyboardStore((s) => s.activePresetTheme);
  const keycapMaterial = useKeyboardStore((s) => s.keycapMaterial);
  const switchType = useKeyboardStore((s) => s.switchType);
  const switchModel = useKeyboardStore((s) => s.switchModel);
  const selectKey = useKeyboardStore((s) => s.selectKey);
  const handleKeyDown = useKeyboardStore((s) => s.handleKeyDown);
  const handleKeyUp = useKeyboardStore((s) => s.handleKeyUp);

  const layout = KEYBOARD_LAYOUTS[model];
  const angleRad = (layout.dimensions.typingAngleDeg * Math.PI) / 180;

  const handleKeyClick = (keyId: string, e: any) => {
    e.stopPropagation();
    const isMulti = e.shiftKey || e.ctrlKey || e.metaKey;
    selectKey(keyId, isMulti);

    // Trigger visual keypress down and up
    const key = layout.keys.find((k) => k.id === keyId);
    if (key) {
      handleKeyDown(key.code);
      setTimeout(() => {
        handleKeyUp(key.code);
      }, 150);
    }
  };

  return (
    <group rotation={[-angleRad, 0, 0]} position={[0, 0, 0]}>
      {/* Procedural CNC Top Case, Bottom Case, and Underside Weight */}
      <ProceduralCase
        model={model}
        caseColor={caseColor}
        caseFinish={caseFinish}
        weightMaterial={weightMaterial}
        explodedProgress={explodedProgress}
        layerVisibility={layerVisibility}
        isolatedLayer={isolatedLayer}
      />

      {/* 7 Gasket Internal Layers Stack */}
      <GasketStack
        model={model}
        explodedProgress={explodedProgress}
        layerVisibility={layerVisibility}
        isolatedLayer={isolatedLayer}
        selectedKeyIds={selectedKeyIds}
        activePressedKeys={activePressedKeys}
        keycapColorOverrides={keycapColorOverrides}
        activePresetTheme={activePresetTheme}
        keycapMaterial={keycapMaterial}
        switchType={switchType}
        switchModel={switchModel}
        onKeyClick={handleKeyClick}
      />
    </group>
  );
};
