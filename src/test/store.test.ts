import { describe, it, expect, beforeEach } from 'vitest';
import { useKeyboardStore } from '../store/useKeyboardStore';

describe('Zustand useKeyboardStore Core State', () => {
  beforeEach(() => {
    useKeyboardStore.getState().resetDefaults();
  });

  it('initializes with default model and properties', () => {
    const state = useKeyboardStore.getState();
    expect(state.model).toBe('eveningstar75');
    expect(state.explodedProgress).toBe(0.0);
    expect(state.switchType).toBe('linear');
    expect(state.layerVisibility.keycaps).toBe(true);
    expect(state.layerVisibility.bottom_case_weight).toBe(true);
  });

  it('switches keyboard models correctly', () => {
    const store = useKeyboardStore.getState();
    store.setModel('mrsuit80');
    expect(useKeyboardStore.getState().model).toBe('mrsuit80');

    store.setModel('tofu60');
    expect(useKeyboardStore.getState().model).toBe('tofu60');
  });

  it('clamps exploded progress between 0 and 1', () => {
    const store = useKeyboardStore.getState();
    store.setExplodedProgress(0.75);
    expect(useKeyboardStore.getState().explodedProgress).toBe(0.75);

    store.setExplodedProgress(-0.5);
    expect(useKeyboardStore.getState().explodedProgress).toBe(0.0);

    store.setExplodedProgress(1.8);
    expect(useKeyboardStore.getState().explodedProgress).toBe(1.0);
  });

  it('toggles layer visibility and isolation', () => {
    const store = useKeyboardStore.getState();
    store.toggleLayerVisibility('keycaps');
    expect(useKeyboardStore.getState().layerVisibility.keycaps).toBe(false);

    store.setIsolatedLayer('plate');
    expect(useKeyboardStore.getState().isolatedLayer).toBe('plate');

    store.setAllLayersVisible();
    expect(useKeyboardStore.getState().layerVisibility.keycaps).toBe(true);
    expect(useKeyboardStore.getState().isolatedLayer).toBeNull();
  });

  it('handles single and multi-key selection and color overrides', () => {
    const store = useKeyboardStore.getState();
    store.selectKey('KeyA');
    expect(useKeyboardStore.getState().selectedKeyIds).toEqual(['KeyA']);

    store.selectKey('KeyB', true);
    expect(useKeyboardStore.getState().selectedKeyIds).toEqual(['KeyA', 'KeyB']);

    store.setKeycapColor(['KeyA', 'KeyB'], '#ff0055');
    expect(useKeyboardStore.getState().keycapColorOverrides['KeyA']).toBe('#ff0055');
    expect(useKeyboardStore.getState().keycapColorOverrides['KeyB']).toBe('#ff0055');
  });

  it('updates switch type and switch model synchronously', () => {
    const store = useKeyboardStore.getState();
    store.setSwitchType('clicky');
    expect(useKeyboardStore.getState().switchType).toBe('clicky');
    expect(useKeyboardStore.getState().switchModel).toBe('cherry_blue');

    store.setSwitchType('tactile');
    expect(useKeyboardStore.getState().switchType).toBe('tactile');
    expect(useKeyboardStore.getState().switchModel).toBe('holy_panda');
  });

  it('exports valid config and imports it successfully', () => {
    const store = useKeyboardStore.getState();
    store.setModel('tofu60');
    store.setCaseColor('#2f4838');
    store.setExplodedProgress(0.42);

    const config = store.exportConfiguration();
    expect(config.version).toBe(1);
    expect(config.model).toBe('tofu60');
    expect(config.caseColor).toBe('#2f4838');
    expect(config.explodedViewProgress).toBe(0.42);

    store.resetDefaults();
    expect(useKeyboardStore.getState().model).toBe('eveningstar75');

    const imported = store.importConfiguration(config);
    expect(imported).toBe(true);
    expect(useKeyboardStore.getState().model).toBe('tofu60');
    expect(useKeyboardStore.getState().caseColor).toBe('#2f4838');
    expect(useKeyboardStore.getState().explodedProgress).toBe(0.42);
  });
});
