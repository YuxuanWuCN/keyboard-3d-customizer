import { describe, it, expect, beforeEach } from 'vitest';
import { useKeyboardStore } from '../store/useKeyboardStore';
import { POLARIS_CANDY_PRESET } from '../constants/themePresets';
import { KEYBOARD_LAYOUTS } from '../constants/keyboardLayouts';

describe('Polaris 80 Limited Edition & Retro Candy Customizer Verification', () => {
  beforeEach(() => {
    useKeyboardStore.getState().resetDefaults();
  });

  it('1. POLARIS_CANDY_PRESET definition strictly matches real photos', () => {
    expect(POLARIS_CANDY_PRESET.id).toBe('polaris_candy');
    expect(POLARIS_CANDY_PRESET.name).toContain('北极星');
    expect(POLARIS_CANDY_PRESET.palette.alphas.top).toBe('#FBF9F5'); // Milky Cream
    expect(POLARIS_CANDY_PRESET.palette.modifiers.top).toBe('#A594F9'); // Pastel Lilac
    expect(POLARIS_CANDY_PRESET.palette.accents.top).toBe('#5EEAD4'); // Mint Green
    expect(POLARIS_CANDY_PRESET.palette.spacebar?.top).toBe('#FBF9F5');
    expect(POLARIS_CANDY_PRESET.recommendedCase).toBe('#F8B4C4'); // Sakura Pink
    expect(POLARIS_CANDY_PRESET.recommendedWeight).toBe('polaris_hexagram');
  });

  it('2. applyPolarisTheme() activates full Polaris 80 state and exact keycap overrides', () => {
    const store = useKeyboardStore.getState();
    store.applyPolarisTheme();

    const state = useKeyboardStore.getState();
    expect(state.model).toBe('mrsuit80');
    expect(state.polarisEdition).toBe(true);
    expect(state.caseColor).toBe('#F8B4C4');
    expect(state.weightMaterial).toBe('polaris_hexagram');
    expect(state.activePresetTheme).toBe('polaris_candy');
    expect(state.cableColor).toBe('#F472B6');
    expect(state.cableLedColor).toBe('#A594F9');

    const layout = KEYBOARD_LAYOUTS['mrsuit80'];
    const overrides = state.keycapColorOverrides;

    // Esc is Peach Pink
    const escKey = layout.keys.find((k) => k.code === 'Escape');
    expect(escKey).toBeDefined();
    expect(overrides[escKey!.id]).toBe('#F472B6');

    // Enter is Mint Green
    const enterKey = layout.keys.find((k) => k.code === 'Enter');
    expect(enterKey).toBeDefined();
    expect(overrides[enterKey!.id]).toBe('#5EEAD4');

    // Space is Vanilla Cream
    const spaceKey = layout.keys.find((k) => k.code === 'Space');
    expect(spaceKey).toBeDefined();
    expect(overrides[spaceKey!.id]).toBe('#FBF9F5');

    // Arrow keys exact color distribution from photo
    const upKey = layout.keys.find((k) => k.code === 'ArrowUp');
    const downKey = layout.keys.find((k) => k.code === 'ArrowDown');
    const leftKey = layout.keys.find((k) => k.code === 'ArrowLeft');
    const rightKey = layout.keys.find((k) => k.code === 'ArrowRight');

    expect(overrides[upKey!.id]).toBe('#A594F9'); // Lilac
    expect(overrides[downKey!.id]).toBe('#FDE047'); // Yellow
    expect(overrides[leftKey!.id]).toBe('#F472B6'); // Pink
    expect(overrides[rightKey!.id]).toBe('#5EEAD4'); // Mint
  });

  it('3. Companion Numpad toggle works seamlessly', () => {
    const store = useKeyboardStore.getState();
    expect(store.polarisNumpad).toBe(false);

    store.setPolarisNumpad(true);
    expect(useKeyboardStore.getState().polarisNumpad).toBe(true);

    store.setPolarisNumpad(false);
    expect(useKeyboardStore.getState().polarisNumpad).toBe(false);
  });

  it('4. Configuration export and import preserves polaris_hexagram and theme', () => {
    const store = useKeyboardStore.getState();
    store.applyPolarisTheme();

    const exported = store.exportConfiguration();
    expect(exported.model).toBe('mrsuit80');
    expect(exported.caseColor).toBe('#F8B4C4');
    expect(exported.weightMaterial).toBe('polaris_hexagram');
    expect(exported.themePreset).toBe('polaris_candy');

    // Reset and re-import
    store.resetDefaults();
    expect(useKeyboardStore.getState().weightMaterial).toBe('brass_pvd');

    const success = store.importConfiguration(exported);
    expect(success).toBe(true);

    const restored = useKeyboardStore.getState();
    expect(restored.model).toBe('mrsuit80');
    expect(restored.caseColor).toBe('#F8B4C4');
    expect(restored.weightMaterial).toBe('polaris_hexagram');
    expect(restored.activePresetTheme).toBe('polaris_candy');
  });
});
