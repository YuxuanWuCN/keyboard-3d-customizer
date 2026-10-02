import { describe, it, expect, beforeEach } from 'vitest';
import { useKeyboardStore } from '../store/useKeyboardStore';
import { KEYBOARD_LAYOUTS } from '../constants/keyboardLayouts';
import { GasketLayerId, KeyboardModelId } from '../types/keyboard';

// Easing function used in 3D scene (GasketStack & ProceduralCase)
function cubicEase(t: number): number {
  return t * t * (3 - 2 * t);
}

describe('Adversarial Stress Test: Milestone 1 State Transitions & Clamping', () => {
  beforeEach(() => {
    useKeyboardStore.getState().resetDefaults();
  });

  it('Test 1: Rapid cycling between models (1000 iterations) with selection sanitization', () => {
    const models: KeyboardModelId[] = ['eveningstar75', 'mrsuit80', 'tofu60'];
    const store = useKeyboardStore.getState();

    for (let i = 0; i < 1000; i++) {
      const targetModel = models[i % models.length];
      store.setModel(targetModel);

      const state = useKeyboardStore.getState();
      expect(state.model).toBe(targetModel);
      expect(state.selectedKeyIds).toEqual([]); // Selection must be safely reset on model switch

      // Verify layout exists and is completely valid
      const layout = KEYBOARD_LAYOUTS[state.model];
      expect(layout).toBeDefined();
      expect(layout.keys.length).toBeGreaterThan(0);
      expect(layout.dimensions.width).toBeGreaterThan(200);
      expect(layout.dimensions.depth).toBeGreaterThan(100);
      expect(layout.dimensions.typingAngleDeg).toBeGreaterThanOrEqual(6.0);
    }
  });

  it('Test 2: Rapid toggling of layer visibility across all 7 layers (500 cycles)', () => {
    const layers: GasketLayerId[] = [
      'keycaps',
      'switches',
      'plate',
      'poron_ixpe',
      'pcb',
      'case_foam',
      'bottom_case_weight',
    ];
    const store = useKeyboardStore.getState();

    // Rapid toggle
    for (let cycle = 0; cycle < 500; cycle++) {
      const layer = layers[cycle % layers.length];
      const prev = useKeyboardStore.getState().layerVisibility[layer];
      store.toggleLayerVisibility(layer);
      expect(useKeyboardStore.getState().layerVisibility[layer]).toBe(!prev);
    }

    // Turn all off
    layers.forEach((l) => {
      if (useKeyboardStore.getState().layerVisibility[l]) {
        store.toggleLayerVisibility(l);
      }
    });
    layers.forEach((l) => {
      expect(useKeyboardStore.getState().layerVisibility[l]).toBe(false);
    });

    // Reset all layers visible
    store.setAllLayersVisible();
    layers.forEach((l) => {
      expect(useKeyboardStore.getState().layerVisibility[l]).toBe(true);
    });
    expect(useKeyboardStore.getState().isolatedLayer).toBeNull();
  });

  it('Test 3: Layer isolation cycling and edge states', () => {
    const layers: GasketLayerId[] = [
      'keycaps',
      'switches',
      'plate',
      'poron_ixpe',
      'pcb',
      'case_foam',
      'bottom_case_weight',
    ];
    const store = useKeyboardStore.getState();

    layers.forEach((layer) => {
      store.setIsolatedLayer(layer);
      expect(useKeyboardStore.getState().isolatedLayer).toBe(layer);
    });

    store.setIsolatedLayer(null);
    expect(useKeyboardStore.getState().isolatedLayer).toBeNull();
  });

  it('Test 4: Strict explodedProgress boundary clamping (-0.5, 0.0, 0.5, 1.0, 1.5, extremes)', () => {
    const store = useKeyboardStore.getState();

    // Explicit test vector from dispatch: -0.5, 0.0, 0.5, 1.0, 1.5
    store.setExplodedProgress(-0.5);
    expect(useKeyboardStore.getState().explodedProgress).toBe(0.0);

    store.setExplodedProgress(0.0);
    expect(useKeyboardStore.getState().explodedProgress).toBe(0.0);

    store.setExplodedProgress(0.5);
    expect(useKeyboardStore.getState().explodedProgress).toBe(0.5);

    store.setExplodedProgress(1.0);
    expect(useKeyboardStore.getState().explodedProgress).toBe(1.0);

    store.setExplodedProgress(1.5);
    expect(useKeyboardStore.getState().explodedProgress).toBe(1.0);

    // Far extremes
    store.setExplodedProgress(-9999.99);
    expect(useKeyboardStore.getState().explodedProgress).toBe(0.0);

    store.setExplodedProgress(9999.99);
    expect(useKeyboardStore.getState().explodedProgress).toBe(1.0);

    store.setExplodedProgress(-Infinity);
    expect(useKeyboardStore.getState().explodedProgress).toBe(0.0);

    store.setExplodedProgress(Infinity);
    expect(useKeyboardStore.getState().explodedProgress).toBe(1.0);

    // Rapid random jitter in and out of bounds (1000 iterations)
    for (let i = 0; i < 1000; i++) {
      const randVal = (Math.random() - 0.5) * 4; // Range [-2, 2]
      store.setExplodedProgress(randVal);
      const val = useKeyboardStore.getState().explodedProgress;
      expect(val).toBeGreaterThanOrEqual(0.0);
      expect(val).toBeLessThanOrEqual(1.0);
      expect(Number.isFinite(val)).toBe(true);
    }
  });

  it('Test 5: Volume boundary clamping (-1.0, 0.0, 0.8, 1.0, 2.5)', () => {
    const store = useKeyboardStore.getState();

    store.setVolume(-1.0);
    expect(useKeyboardStore.getState().volume).toBe(0.0);

    store.setVolume(0.0);
    expect(useKeyboardStore.getState().volume).toBe(0.0);

    store.setVolume(0.8);
    expect(useKeyboardStore.getState().volume).toBe(0.8);

    store.setVolume(1.0);
    expect(useKeyboardStore.getState().volume).toBe(1.0);

    store.setVolume(2.5);
    expect(useKeyboardStore.getState().volume).toBe(1.0);
  });

  it('Test 6: Matrix bounds and layout integrity across all models', () => {
    const models: KeyboardModelId[] = ['eveningstar75', 'mrsuit80', 'tofu60'];

    models.forEach((model) => {
      const layout = KEYBOARD_LAYOUTS[model];
      expect(layout.keys.length).toBe(layout.keyCount);

      // Verify no duplicate key IDs or positions
      const keyIds = new Set<string>();
      layout.keys.forEach((k) => {
        expect(keyIds.has(k.id)).toBe(false);
        keyIds.add(k.id);

        expect(k.gridX).toBeGreaterThanOrEqual(0);
        expect(k.gridY).toBeGreaterThanOrEqual(0);
        expect(k.unitWidth).toBeGreaterThan(0);
        expect(k.unitHeight || 1.0).toBeGreaterThan(0);
        expect(k.region).toBeDefined();
        expect(k.label).toBeDefined();
      });

      // Verify matrix bounds calculation
      let maxX = 0;
      let maxY = 0;
      layout.keys.forEach((k) => {
        const endX = k.gridX + k.unitWidth;
        const endY = k.gridY + (k.unitHeight || 1.0);
        if (endX > maxX) maxX = endX;
        if (endY > maxY) maxY = endY;
      });

      const matrixW = maxX * 19.05;
      const matrixD = maxY * 19.05;

      expect(matrixW).toBeLessThan(layout.dimensions.width); // Matrix must fit inside case width
      expect(matrixD).toBeLessThan(layout.dimensions.depth); // Matrix must fit inside case depth
    });
  });

  it('Test 7: Interleaved state mutations (model switch + region selection + keystrokes)', () => {
    const store = useKeyboardStore.getState();

    // Select keys, then change model
    store.selectKey('KeyA');
    store.selectKey('KeyB', true);
    expect(useKeyboardStore.getState().selectedKeyIds.length).toBe(2);

    store.setModel('mrsuit80');
    expect(useKeyboardStore.getState().selectedKeyIds.length).toBe(0);

    // Select regions across models
    store.selectRegion('alphas');
    const alphasCount = useKeyboardStore.getState().selectedKeyIds.length;
    expect(alphasCount).toBeGreaterThan(25);

    // Change model again, alphas must not bleed over
    store.setModel('tofu60');
    expect(useKeyboardStore.getState().selectedKeyIds.length).toBe(0);

    // Select all keys in Tofu60
    store.selectAllKeys();
    expect(useKeyboardStore.getState().selectedKeyIds.length).toBe(61);
  });

  it('Test 8: High concurrency keystroke actuation handling', () => {
    const store = useKeyboardStore.getState();

    // Send 100 keydown events
    for (let i = 0; i < 100; i++) {
      store.handleKeyDown(`Key${i}`);
    }
    // Duplicate keydown must not duplicate entries
    store.handleKeyDown('Key0');
    expect(useKeyboardStore.getState().activePressedKeys.length).toBe(100);

    // Release all keys
    for (let i = 0; i < 100; i++) {
      store.handleKeyUp(`Key${i}`);
    }
    expect(useKeyboardStore.getState().activePressedKeys.length).toBe(0);
  });

  it('Test 9: Kinematic Cubic Easing Monotonicity & Boundary Behavior', () => {
    // Verify cubicEase is strictly monotonic on [0, 1]
    const steps = 100;
    let prevVal = cubicEase(0);
    expect(prevVal).toBe(0);

    for (let i = 1; i <= steps; i++) {
      const t = i / steps;
      const val = cubicEase(t);
      expect(val).toBeGreaterThanOrEqual(prevVal);
      prevVal = val;
    }
    expect(prevVal).toBe(1.0);

    // Verify non-linear derivative at endpoints (smooth start and stop)
    // d/dt (3t^2 - 2t^3) = 6t - 6t^2 = 6t(1 - t), which is 0 at t=0 and t=1
    const delta = 0.001;
    const deriv0 = (cubicEase(delta) - cubicEase(0)) / delta;
    const deriv1 = (cubicEase(1) - cubicEase(1 - delta)) / delta;
    expect(deriv0).toBeLessThan(0.01);
    expect(deriv1).toBeLessThan(0.01);
  });

  it('Test 10: Configuration import boundary resilience', () => {
    const store = useKeyboardStore.getState();

    const configValid = store.exportConfiguration();
    configValid.explodedViewProgress = 0.5;
    expect(store.importConfiguration(configValid)).toBe(true);
    expect(useKeyboardStore.getState().explodedProgress).toBe(0.5);

    // Invalid version rejection
    const invalidConfig = { ...configValid, version: 2 as any };
    expect(store.importConfiguration(invalidConfig)).toBe(false);

    // Null config rejection
    expect(store.importConfiguration(null as any)).toBe(false);
  });
});
