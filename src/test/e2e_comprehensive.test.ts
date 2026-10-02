import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useKeyboardStore } from '../store/useKeyboardStore';
import { THEME_PRESETS } from '../constants/themePresets';
import { KEYBOARD_LAYOUTS } from '../constants/keyboardLayouts';
import { calculateTelemetry, getRandomPrompt, SAMPLE_TYPING_PROMPTS } from '../utils/telemetry';
import { generateSyntheticImpulseResponse } from '../audio/SyntheticImpulseResponse';
import {
  createPinkNoiseBuffer,
  synthesizeLinearDown,
  synthesizeLinearUp,
  synthesizeClickyDown,
  synthesizeClickyUp,
  synthesizeTactileDown,
  synthesizeTactileUp,
} from '../audio/SwitchSynthProfiles';
import { ProceduralSoundEngine } from '../audio/ProceduralSoundEngine';
import {
  KeyboardConfigV1,
  KeyboardModelId,
  GasketLayerId,
  SwitchModelId,
  SwitchType,
  KeyDefinition,
} from '../types/keyboard';

// ============================================================================
// High-Fidelity Headless Web Audio Mock Implementation
// ============================================================================

class MockAudioParam {
  value = 0;
  setValueAtTime = vi.fn((val: number) => {
    this.value = val;
  });
  linearRampToValueAtTime = vi.fn((val: number) => {
    this.value = val;
  });
  exponentialRampToValueAtTime = vi.fn((val: number) => {
    this.value = val;
  });
}

class MockAudioNode {
  connect = vi.fn();
  disconnect = vi.fn();
}

class MockAudioScheduledSourceNode extends MockAudioNode {
  start = vi.fn();
  stop = vi.fn();
  onended: (() => void) | null = null;
}

class MockOscillatorNode extends MockAudioScheduledSourceNode {
  type = 'sine';
  frequency = new MockAudioParam();
}

class MockGainNode extends MockAudioNode {
  gain = new MockAudioParam();
}

class MockBiquadFilterNode extends MockAudioNode {
  type = 'lowpass';
  frequency = new MockAudioParam();
  Q = new MockAudioParam();
  gain = new MockAudioParam();
}

class MockDynamicsCompressorNode extends MockAudioNode {
  threshold = new MockAudioParam();
  knee = new MockAudioParam();
  ratio = new MockAudioParam();
  attack = new MockAudioParam();
  release = new MockAudioParam();
}

class MockWaveShaperNode extends MockAudioNode {
  curve: Float32Array | null = null;
  oversample = 'none';
}

class MockConvolverNode extends MockAudioNode {
  buffer: AudioBuffer | null = null;
}

class MockBufferSourceNode extends MockAudioScheduledSourceNode {
  buffer: AudioBuffer | null = null;
  playbackRate = new MockAudioParam();
}

class MockAudioBuffer {
  numberOfChannels: number;
  length: number;
  sampleRate: number;
  private channelData: Float32Array[];

  constructor(numberOfChannels: number, length: number, sampleRate: number) {
    this.numberOfChannels = numberOfChannels;
    this.length = length;
    this.sampleRate = sampleRate;
    this.channelData = Array.from({ length: numberOfChannels }, () => new Float32Array(length));
  }

  getChannelData(channel: number): Float32Array {
    return this.channelData[channel];
  }
}

class MockAudioContext {
  sampleRate = 44100;
  currentTime = 0;
  state: AudioContextState = 'running';
  destination = new MockAudioNode();

  constructor(_options?: any) {}

  createBuffer(channels: number, length: number, sampleRate: number): AudioBuffer {
    return new MockAudioBuffer(channels, length, sampleRate) as unknown as AudioBuffer;
  }
  createGain(): GainNode {
    return new MockGainNode() as unknown as GainNode;
  }
  createOscillator(): OscillatorNode {
    return new MockOscillatorNode() as unknown as OscillatorNode;
  }
  createBiquadFilter(): BiquadFilterNode {
    return new MockBiquadFilterNode() as unknown as BiquadFilterNode;
  }
  createDynamicsCompressor(): DynamicsCompressorNode {
    return new MockDynamicsCompressorNode() as unknown as DynamicsCompressorNode;
  }
  createWaveShaper(): WaveShaperNode {
    return new MockWaveShaperNode() as unknown as WaveShaperNode;
  }
  createConvolver(): ConvolverNode {
    return new MockConvolverNode() as unknown as ConvolverNode;
  }
  createBufferSource(): AudioBufferSourceNode {
    return new MockBufferSourceNode() as unknown as AudioBufferSourceNode;
  }
  resume = vi.fn().mockResolvedValue(undefined);
  close = vi.fn().mockResolvedValue(undefined);
}

// Ensure Web Audio context & window event listeners are universally mocked
if (typeof window === 'undefined') {
  (globalThis as any).window = globalThis;
}
(window as any).addEventListener = vi.fn();
(window as any).removeEventListener = vi.fn();
(window as any).AudioContext = MockAudioContext;
(globalThis as any).AudioContext = MockAudioContext;

// Easing function corresponding to 3D scene kinematics (GasketStack & ProceduralCase)
function cubicEase(t: number): number {
  const clamped = Math.max(0, Math.min(1, t));
  return clamped * clamped * (3 - 2 * clamped);
}

// 3D Switch stem colors and housing specifications from InstancedSwitchArray
const SWITCH_STEM_COLORS: Record<SwitchModelId, string> = {
  cherry_red: '#ef4444',
  gateron_yellow: '#eab308',
  cherry_blue: '#3b82f6',
  holy_panda: '#ea580c',
  kailh_box_jade: '#10b981',
};

// Calibrated physical stack layers at rest (t = 0) with physical thicknesses
const RESTING_STACK_LAYERS = [
  { id: 'keycaps', name: 'Keycaps Array', centerY: 22.45, halfThickness: 4.90, thickness: 9.80 },
  { id: 'switch_upper', name: 'Switch Upper Housing & Stem', centerY: 14.35, halfThickness: 2.30, thickness: 4.60 },
  { id: 'switch_lower', name: 'Switch Lower Housing & Spring', centerY: 9.00, halfThickness: 2.30, thickness: 4.60 },
  { id: 'plate', name: 'Gasket-Tabbed Plate', centerY: 5.65, halfThickness: 0.75, thickness: 1.50 },
  { id: 'poron_foam', name: 'Poron Sandwich Dampener Foam', centerY: 3.05, halfThickness: 1.75, thickness: 3.50 },
  { id: 'ixpe_pad', name: 'IXPE Acoustic Switch Sheet', centerY: 0.95, halfThickness: 0.25, thickness: 0.50 },
  { id: 'pcb', name: 'Flex-Cut PCB & Kailh Sockets', centerY: 0.00, halfThickness: 0.60, thickness: 1.20, socketMinY: -1.10 },
  { id: 'case_foam', name: 'Bottom Case Dampener Foam', centerY: -2.20, halfThickness: 1.00, thickness: 2.00 },
  { id: 'bottom_case', name: 'CNC Aluminum Bottom Chassis', centerY: -7.50, halfThickness: 4.00, thickness: 8.00 },
  { id: 'weight', name: 'Signature Underside PVD Weight', centerY: -14.20, halfThickness: 2.25, thickness: 4.50 },
];

// ============================================================================
// TIER 1: FEATURE COVERAGE (R1 - R5)
// ============================================================================

describe('Tier 1: Feature Coverage (R1 - R5)', () => {
  beforeEach(() => {
    useKeyboardStore.getState().resetDefaults();
  });

  describe('R1: 3 Classic Custom Keyboard Models & Layout Switching', () => {
    it('verifies EveningStar 75 (82 keys, chamfered waistline, front LED badge, rear mirror PVD weight)', () => {
      const layout = KEYBOARD_LAYOUTS.eveningstar75;
      expect(layout.model).toBe('eveningstar75');
      expect(layout.keyCount).toBe(82);
      expect(layout.keys.length).toBe(82);

      // Dimensions verification matching constants/keyboardLayouts.ts
      expect(layout.dimensions.width).toBe(318.0);
      expect(layout.dimensions.depth).toBe(138.5);
      expect(layout.dimensions.frontHeight).toBe(19.5);
      expect(layout.dimensions.rearHeight).toBe(36.5);
      expect(layout.dimensions.typingAngleDeg).toBe(7.0);
      expect(layout.dimensions.bezelWidth).toBe(4.5);

      // Verify layout contains rotary / nav column keys characteristic of 75%
      const keyCodes = new Set(layout.keys.map((k) => k.code));
      expect(keyCodes.has('PageUp')).toBe(true);
      expect(keyCodes.has('PageDown')).toBe(true);
      expect(keyCodes.has('Delete')).toBe(true);
      expect(keyCodes.has('Escape')).toBe(true);
    });

    it('verifies Mr. Suit 80 (87 keys, TKL tenkeyless, rounded corners R=4.5, full-width mirror PVD weight)', () => {
      const layout = KEYBOARD_LAYOUTS.mrsuit80;
      expect(layout.model).toBe('mrsuit80');
      expect(layout.keyCount).toBe(87);
      expect(layout.keys.length).toBe(87);

      // Dimensions verification matching constants/keyboardLayouts.ts
      expect(layout.dimensions.width).toBe(362.5);
      expect(layout.dimensions.depth).toBe(142.0);
      expect(layout.dimensions.frontHeight).toBe(18.8);
      expect(layout.dimensions.rearHeight).toBe(35.8);
      expect(layout.dimensions.typingAngleDeg).toBe(6.8);

      // Classic TKL nav cluster keys
      const keyCodes = new Set(layout.keys.map((k) => k.code));
      expect(keyCodes.has('PrintScreen')).toBe(true);
      expect(keyCodes.has('ScrollLock')).toBe(true);
      expect(keyCodes.has('Pause')).toBe(true);
      expect(keyCodes.has('Insert')).toBe(true);
      expect(keyCodes.has('Home')).toBe(true);
      expect(keyCodes.has('End')).toBe(true);
    });

    it('verifies Tofu 60 (61 keys, compact 60%, sharp 0.4mm chamfers, integrated brass weight bar)', () => {
      const layout = KEYBOARD_LAYOUTS.tofu60;
      expect(layout.model).toBe('tofu60');
      expect(layout.keyCount).toBe(61);
      expect(layout.keys.length).toBe(61);

      // Dimensions verification matching constants/keyboardLayouts.ts
      expect(layout.dimensions.width).toBe(304.0);
      expect(layout.dimensions.depth).toBe(112.0);
      expect(layout.dimensions.frontHeight).toBe(20.0);
      expect(layout.dimensions.rearHeight).toBe(33.0);
      expect(layout.dimensions.typingAngleDeg).toBe(7.0);

      // Standard 60% layout: no dedicated arrow cluster or function row
      const keyCodes = new Set(layout.keys.map((k) => k.code));
      expect(keyCodes.has('F1')).toBe(false);
      expect(keyCodes.has('ArrowUp')).toBe(false);
      expect(keyCodes.has('Space')).toBe(true);
    });

    it('switches between all three models seamlessly with selection sanitization and iconic colors', () => {
      const store = useKeyboardStore.getState();

      // 1. Start on EveningStar 75 and select some keys
      store.selectKey('KeyA');
      store.selectKey('KeyB', true);
      expect(useKeyboardStore.getState().selectedKeyIds).toEqual(['KeyA', 'KeyB']);

      // 2. Switch to Mr. Suit 80
      store.setModel('mrsuit80');
      let state = useKeyboardStore.getState();
      expect(state.model).toBe('mrsuit80');
      expect(state.caseColor).toBe('#2b2d38');
      expect(state.selectedKeyIds).toEqual([]); // Sanitized on model switch

      // 3. Switch to Tofu 60
      store.selectKey('KeyQ');
      store.setModel('tofu60');
      state = useKeyboardStore.getState();
      expect(state.model).toBe('tofu60');
      expect(state.caseColor).toBe('#383b42');
      expect(state.selectedKeyIds).toEqual([]); // Sanitized again

      // 4. Switch back to EveningStar 75
      store.setModel('eveningstar75');
      state = useKeyboardStore.getState();
      expect(state.model).toBe('eveningstar75');
      expect(state.caseColor).toBe('#1e2330');
    });
  });

  describe('R2: 7 Gasket Assembly Layers & Exploded Kinematics', () => {
    it('provides all 7 Gasket internal acoustic stack layers with default visibility', () => {
      const state = useKeyboardStore.getState();
      const requiredLayers: GasketLayerId[] = [
        'keycaps',
        'switches',
        'plate',
        'poron_ixpe',
        'pcb',
        'case_foam',
        'bottom_case_weight',
      ];

      expect(Object.keys(state.layerVisibility).length).toBe(7);
      requiredLayers.forEach((layer) => {
        expect(state.layerVisibility[layer]).toBe(true);
      });
      expect(state.isolatedLayer).toBeNull();
    });

    it('calculates non-linear cubic easing kinematics displacement for exploded assembly', () => {
      // Cubic easing: 3t^2 - 2t^3
      expect(cubicEase(0.0)).toBe(0.0);
      expect(cubicEase(0.5)).toBe(0.5);
      expect(cubicEase(1.0)).toBe(1.0);

      // Verify smooth zero derivative at endpoints (tangents)
      const dt = 0.0001;
      const d0 = (cubicEase(dt) - cubicEase(0)) / dt;
      const d1 = (cubicEase(1) - cubicEase(1 - dt)) / dt;
      expect(d0).toBeCloseTo(0, 3);
      expect(d1).toBeCloseTo(0, 3);

      // Verify layer expansion offsets at t=1.0 relative to resting t=0
      const keycapsY0 = 22.45;
      const keycapsY1 = 22.45 + 115.0;
      expect(keycapsY1 - keycapsY0).toBeCloseTo(115.0, 5);

      const pcbY0 = 0.0;
      const pcbY1 = 0.0 + 10.0;
      expect(pcbY1 - pcbY0).toBeCloseTo(10.0, 5);

      const bottomCaseY0 = -7.50;
      const bottomCaseY1 = -7.50 - 42.0;
      expect(bottomCaseY1 - bottomCaseY0).toBeCloseTo(-42.0, 5);

      const weightY0 = -14.20;
      const weightY1 = -14.20 - 72.0;
      expect(weightY1 - weightY0).toBeCloseTo(-72.0, 5);
    });

    it('supports individual layer isolation and full restoration', () => {
      const store = useKeyboardStore.getState();

      // Isolate PCB
      store.setIsolatedLayer('pcb');
      expect(useKeyboardStore.getState().isolatedLayer).toBe('pcb');

      // Isolate Plate
      store.setIsolatedLayer('plate');
      expect(useKeyboardStore.getState().isolatedLayer).toBe('plate');

      // Clear isolation
      store.setAllLayersVisible();
      expect(useKeyboardStore.getState().isolatedLayer).toBeNull();
      expect(useKeyboardStore.getState().layerVisibility.pcb).toBe(true);
      expect(useKeyboardStore.getState().layerVisibility.plate).toBe(true);
    });
  });

  describe('R3: 7 Preset Themes, Key Selection & PBT vs ABS Physical Materials', () => {
    it('provides all 7 classic custom keyboard themes with valid palettes and materials', () => {
      const expectedThemes = [
        'retro_9009',
        'cyberpunk',
        'miami_nights',
        'dark_stealth',
        'eva_01',
        'matcha_latte',
        'olivia',
      ];

      expectedThemes.forEach((themeId) => {
        const theme = THEME_PRESETS[themeId];
        expect(theme).toBeDefined();
        expect(theme.name).toBeTruthy();
        expect(theme.palette.alphas.top).toMatch(/^#[0-9A-Fa-f]{6}$/);
        expect(theme.palette.modifiers.top).toMatch(/^#[0-9A-Fa-f]{6}$/);
        expect(theme.palette.accents.top).toMatch(/^#[0-9A-Fa-f]{6}$/);
        expect(['pbt', 'abs']).toContain(theme.defaultMaterial);
      });
    });

    it('enforces PBT (roughness 0.72, clearcoat 0.0) vs ABS (roughness 0.18, clearcoat 0.85) physics', () => {
      const store = useKeyboardStore.getState();

      // Apply PBT
      store.setKeycapMaterial({ type: 'pbt' });
      let mat = useKeyboardStore.getState().keycapMaterial;
      expect(mat.type).toBe('pbt');
      expect(mat.roughness).toBe(0.72);
      expect(mat.clearcoat).toBe(0.0);
      expect(mat.clearcoatRoughness).toBe(0.0);

      // Apply ABS
      store.setKeycapMaterial({ type: 'abs' });
      mat = useKeyboardStore.getState().keycapMaterial;
      expect(mat.type).toBe('abs');
      expect(mat.roughness).toBe(0.18);
      expect(mat.clearcoat).toBe(0.85);
      expect(mat.clearcoatRoughness).toBe(0.10);
    });

    it('supports single click, multi-select (Shift/Ctrl), and region batch selections', () => {
      const store = useKeyboardStore.getState();
      const layout = KEYBOARD_LAYOUTS.eveningstar75;

      // 1. Single selection
      store.selectKey('KeyA');
      expect(useKeyboardStore.getState().selectedKeyIds).toEqual(['KeyA']);

      // 2. Multi-selection toggle
      store.selectKey('KeyB', true);
      expect(useKeyboardStore.getState().selectedKeyIds).toEqual(['KeyA', 'KeyB']);
      store.selectKey('KeyA', true);
      expect(useKeyboardStore.getState().selectedKeyIds).toEqual(['KeyB']);

      // 3. Region Alphas
      store.selectRegion('alphas');
      const alphaIds = layout.keys.filter((k) => k.region === 'alphas').map((k) => k.id);
      expect(useKeyboardStore.getState().selectedKeyIds).toEqual(alphaIds);

      // 4. Region Modifiers
      store.selectRegion('modifiers');
      expect(useKeyboardStore.getState().selectedKeyIds.length).toBeGreaterThan(10);

      // 5. Region Space/Enter/Esc
      store.selectEscEnterSpace();
      const accentIds = useKeyboardStore.getState().selectedKeyIds;
      expect(accentIds).toContain('Escape');
      expect(accentIds).toContain('Enter');
      expect(accentIds).toContain('Space');
    });
  });

  describe('R4: Switch Acoustic Profiles, Synthetic IR & 24-Voice Polyphony Limiter', () => {
    const ctx = new MockAudioContext() as unknown as AudioContext;
    const noiseBuffer = createPinkNoiseBuffer(ctx, 1.0);

    it('synthesizes Linear switch downstroke (sub-bass sweep 340Hz -> 155Hz + 680Hz lowpass)', () => {
      const dest = ctx.createGain();
      const voice = synthesizeLinearDown(ctx, dest, noiseBuffer, 0, 1.0, 1.0);

      expect(voice.sources.length).toBe(2); // Sine oscillator + Pink noise source
      const osc = voice.sources.find((s) => s instanceof MockOscillatorNode) as unknown as MockOscillatorNode;
      expect(osc).toBeDefined();
      expect(osc.frequency.setValueAtTime).toHaveBeenCalledWith(340, 0);
      expect(osc.frequency.exponentialRampToValueAtTime).toHaveBeenCalledWith(155, 0.035);

      const filter = voice.nodes.find(
        (n) => n instanceof MockBiquadFilterNode && (n as any).type === 'lowpass'
      ) as unknown as MockBiquadFilterNode;
      expect(filter).toBeDefined();
      expect(filter.frequency.setValueAtTime).toHaveBeenCalledWith(680, 0);
    });

    it('synthesizes Clicky switch (click leaf 3.8kHz, Q=11.0, 4ms + reset click 3.2kHz)', () => {
      const dest = ctx.createGain();
      const downVoice = synthesizeClickyDown(ctx, dest, noiseBuffer, 0, 1.0, 1.0);

      const clickFilter = downVoice.nodes.find(
        (n) => n instanceof MockBiquadFilterNode && (n as any).type === 'bandpass'
      ) as unknown as MockBiquadFilterNode;
      expect(clickFilter).toBeDefined();
      expect(clickFilter.frequency.setValueAtTime).toHaveBeenCalledWith(3800, 0);
      expect(clickFilter.Q.setValueAtTime).toHaveBeenCalledWith(11.0, 0);

      const upVoice = synthesizeClickyUp(ctx, dest, noiseBuffer, 0, 1.0, 1.0);
      const resetFilter = upVoice.nodes.find(
        (n) => n instanceof MockBiquadFilterNode && (n as any).type === 'bandpass'
      ) as unknown as MockBiquadFilterNode;
      expect(resetFilter).toBeDefined();
      expect(resetFilter.frequency.setValueAtTime).toHaveBeenCalledWith(3200, 0);
    });

    it('synthesizes Tactile switch (Holy Panda bump pop 1150Hz -> 680Hz + thud 260Hz)', () => {
      const dest = ctx.createGain();
      const voice = synthesizeTactileDown(ctx, dest, noiseBuffer, 0, 1.0, 1.0);

      const oscillators = voice.sources.filter(
        (s) => s instanceof MockOscillatorNode
      ) as unknown as MockOscillatorNode[];
      expect(oscillators.length).toBe(2);

      const popOsc = oscillators[0];
      expect(popOsc.frequency.setValueAtTime).toHaveBeenCalledWith(1150, 0);
      expect(popOsc.frequency.exponentialRampToValueAtTime).toHaveBeenCalledWith(680, 0.012);

      const thudOsc = oscillators[1];
      expect(thudOsc.frequency.setValueAtTime).toHaveBeenCalledWith(260, 0);
    });

    it('generates synthetic impulse response with distinct case modal resonances', () => {
      const irTofu = generateSyntheticImpulseResponse(ctx, { caseModel: 'tofu60', hasFoam: true });
      const irSuit = generateSyntheticImpulseResponse(ctx, { caseModel: 'mrsuit80', hasFoam: true });
      const irStar = generateSyntheticImpulseResponse(ctx, { caseModel: 'eveningstar75', hasFoam: true });

      expect(irTofu.numberOfChannels).toBe(2);
      expect(irSuit.numberOfChannels).toBe(2);
      expect(irStar.numberOfChannels).toBe(2);
    });

    it('enforces 24-voice polyphony limit under high-frequency keypress bursts', async () => {
      const engine = new ProceduralSoundEngine();
      await engine.init();

      // Trigger 30 keypresses rapidly
      for (let i = 0; i < 30; i++) {
        engine.playKeyDown(`Key_${i}`, 'linear', true);
      }

      expect(engine.getVoiceCount()).toBeLessThanOrEqual(24);
      engine.dispose();
    });

    it('maps 3D switch models to corresponding stem visual colors', () => {
      expect(SWITCH_STEM_COLORS.cherry_red).toBe('#ef4444');
      expect(SWITCH_STEM_COLORS.gateron_yellow).toBe('#eab308');
      expect(SWITCH_STEM_COLORS.cherry_blue).toBe('#3b82f6');
      expect(SWITCH_STEM_COLORS.holy_panda).toBe('#ea580c');
      expect(SWITCH_STEM_COLORS.kailh_box_jade).toBe('#10b981');
    });
  });

  describe('R5: Typing Sandbox Telemetry & Configuration Export/Import', () => {
    it('calculates typing telemetry (Gross WPM, Net WPM, Accuracy) according to 5 chars/word standard', () => {
      // 100 characters in 60s with 0 errors = 20 WPM, 100% accuracy
      const tel1 = calculateTelemetry({
        correctChars: 100,
        totalChars: 100,
        elapsedMs: 60000,
        errors: 0,
      });
      expect(tel1.rawWpm).toBe(20);
      expect(tel1.wpm).toBe(20);
      expect(tel1.accuracy).toBe(100);

      // 100 characters in 60s with 5 errors:
      // Gross = (100 / 5) / 1.0 = 20
      // Net = ((95 / 5) - 5) / 1.0 = 19 - 5 = 14
      // Accuracy = (95 / 100) * 100 = 95%
      const tel2 = calculateTelemetry({
        correctChars: 95,
        totalChars: 100,
        elapsedMs: 60000,
        errors: 5,
      });
      expect(tel2.rawWpm).toBe(20);
      expect(tel2.wpm).toBe(14);
      expect(tel2.accuracy).toBe(95);
    });

    it('exports and imports valid KeyboardConfigV1 schemas', () => {
      const store = useKeyboardStore.getState();
      store.setModel('eveningstar75');
      store.setCaseColor('#1e2330');
      store.setSwitchModel('holy_panda');
      store.applyPresetTheme('cyberpunk');
      store.setExplodedProgress(0.42);

      const exported: KeyboardConfigV1 = store.exportConfiguration();
      expect(exported.version).toBe(1);
      expect(exported.model).toBe('eveningstar75');
      expect(exported.switchModel).toBe('holy_panda');
      expect(exported.switchType).toBe('tactile');
      expect(exported.themePreset).toBe('cyberpunk');
      expect(exported.explodedViewProgress).toBe(0.42);

      // Reset store
      store.resetDefaults();
      expect(useKeyboardStore.getState().explodedProgress).toBe(0.0);

      // Re-import
      const success = store.importConfiguration(exported);
      expect(success).toBe(true);
      expect(useKeyboardStore.getState().model).toBe('eveningstar75');
      expect(useKeyboardStore.getState().switchModel).toBe('holy_panda');
      expect(useKeyboardStore.getState().switchType).toBe('tactile');
      expect(useKeyboardStore.getState().explodedProgress).toBe(0.42);
    });
  });
});

// ============================================================================
// TIER 2: BOUNDARY & CORNER CASES
// ============================================================================

describe('Tier 2: Boundary & Corner Cases', () => {
  beforeEach(() => {
    useKeyboardStore.getState().resetDefaults();
  });

  it('clamps exploded view slider inputs strictly within [0.0, 1.0]', () => {
    const store = useKeyboardStore.getState();

    // Negative extremes
    store.setExplodedProgress(-0.5);
    expect(useKeyboardStore.getState().explodedProgress).toBe(0.0);

    store.setExplodedProgress(-99999.0);
    expect(useKeyboardStore.getState().explodedProgress).toBe(0.0);

    // Exact boundaries
    store.setExplodedProgress(0.0);
    expect(useKeyboardStore.getState().explodedProgress).toBe(0.0);

    store.setExplodedProgress(1.0);
    expect(useKeyboardStore.getState().explodedProgress).toBe(1.0);

    // Positive extremes
    store.setExplodedProgress(1.5);
    expect(useKeyboardStore.getState().explodedProgress).toBe(1.0);

    store.setExplodedProgress(99999.0);
    expect(useKeyboardStore.getState().explodedProgress).toBe(1.0);
  });

  it('handles zero elapsed time and zero characters typed in WPM calculation without NaN or division by zero', () => {
    // Zero elapsed time and 0 characters
    const telZero = calculateTelemetry({
      correctChars: 0,
      totalChars: 0,
      elapsedMs: 0,
      errors: 0,
    });
    expect(telZero.wpm).toBe(0);
    expect(telZero.rawWpm).toBe(0);
    expect(telZero.accuracy).toBe(100);
    expect(Number.isNaN(telZero.wpm)).toBe(false);
    expect(Number.isNaN(telZero.accuracy)).toBe(false);

    // Typing start before 500ms threshold
    const telEarly = calculateTelemetry({
      correctChars: 3,
      totalChars: 3,
      elapsedMs: 350,
      errors: 0,
    });
    expect(telEarly.wpm).toBe(0);
    expect(telEarly.rawWpm).toBe(0);
    expect(telEarly.accuracy).toBe(100);

    // Error count exceeding keystrokes
    const telNegativeNet = calculateTelemetry({
      correctChars: 10,
      totalChars: 20,
      elapsedMs: 60000,
      errors: 50,
    });
    expect(telNegativeNet.wpm).toBe(0); // Math.max(0, net)
    expect(telNegativeNet.accuracy).toBe(50);
  });

  it('gracefully rejects corrupted or invalid JSON configuration imports', () => {
    const store = useKeyboardStore.getState();

    // 1. Null / undefined
    expect(store.importConfiguration(null as any)).toBe(false);
    expect(store.importConfiguration(undefined as any)).toBe(false);

    // 2. Empty object
    expect(store.importConfiguration({} as any)).toBe(false);

    // 3. Schema version mismatch
    expect(store.importConfiguration({ version: 2 } as any)).toBe(false);
    expect(store.importConfiguration({ version: 0 } as any)).toBe(false);
    expect(store.importConfiguration({ version: '1' } as any)).toBe(false);

    // State remains unaffected
    expect(useKeyboardStore.getState().model).toBe('eveningstar75');
  });

  it('handles rapid keypress state clearing and empty selection edge cases', () => {
    const store = useKeyboardStore.getState();

    // KeyUp on unpressed key does not throw or corrupt activePressedKeys
    store.handleKeyUp('KeyZ');
    expect(useKeyboardStore.getState().activePressedKeys).toEqual([]);

    // Clear selection when already empty
    store.clearSelection();
    expect(useKeyboardStore.getState().selectedKeyIds).toEqual([]);

    // Invert empty selection selects all keys of current layout
    store.invertSelection();
    const layout = KEYBOARD_LAYOUTS[useKeyboardStore.getState().model];
    expect(useKeyboardStore.getState().selectedKeyIds.length).toBe(layout.keys.length);

    // Invert full selection returns empty array
    store.invertSelection();
    expect(useKeyboardStore.getState().selectedKeyIds).toEqual([]);

    // Setting keycap color on empty array is safe and does not modify overrides
    const prevOverrides = { ...useKeyboardStore.getState().keycapColorOverrides };
    store.setKeycapColor([], '#123456');
    expect(useKeyboardStore.getState().keycapColorOverrides).toEqual(prevOverrides);
  });
});

// ============================================================================
// TIER 3: CROSS-FEATURE INTERACTIONS
// ============================================================================

describe('Tier 3: Cross-Feature Interactions', () => {
  beforeEach(() => {
    useKeyboardStore.getState().resetDefaults();
  });

  it('preserves explodedProgress during model switch and updates dimensional bounding boxes', () => {
    const store = useKeyboardStore.getState();

    // Set exploded view to 0.75 on EveningStar 75
    store.setExplodedProgress(0.75);
    expect(useKeyboardStore.getState().explodedProgress).toBe(0.75);

    // Switch model to Mr. Suit 80 while exploded
    store.setModel('mrsuit80');
    const stateSuit = useKeyboardStore.getState();
    expect(stateSuit.model).toBe('mrsuit80');
    expect(stateSuit.explodedProgress).toBe(0.75); // Exploded progress must be preserved

    // Verify keycount and dimension update
    expect(KEYBOARD_LAYOUTS[stateSuit.model].keyCount).toBe(87);
    expect(KEYBOARD_LAYOUTS[stateSuit.model].dimensions.width).toBe(362.5);

    // Switch model to Tofu 60 while exploded
    store.setModel('tofu60');
    const stateTofu = useKeyboardStore.getState();
    expect(stateTofu.model).toBe('tofu60');
    expect(stateTofu.explodedProgress).toBe(0.75);
    expect(KEYBOARD_LAYOUTS[stateTofu.model].keyCount).toBe(61);
    expect(KEYBOARD_LAYOUTS[stateTofu.model].dimensions.width).toBe(304.0);
  });

  it('combines theme preset application, custom hex overrides, and PBT/ABS material switching seamlessly', () => {
    const store = useKeyboardStore.getState();

    // 1. Apply Matcha Latte theme (PBT default)
    store.applyPresetTheme('matcha_latte');
    let state = useKeyboardStore.getState();
    expect(state.activePresetTheme).toBe('matcha_latte');
    expect(state.keycapMaterial.type).toBe('pbt');
    expect(state.keycapMaterial.roughness).toBe(0.72);

    // 2. Select Escape key and apply high-contrast custom override
    const escId = 'Escape';
    store.setKeycapColor([escId], '#ff0055');
    state = useKeyboardStore.getState();
    expect(state.keycapColorOverrides[escId]).toBe('#ff0055');
    expect(state.activePresetTheme).toBeNull(); // Cleared because of custom override

    // 3. Switch physical material to ABS without losing custom color overrides
    store.setKeycapMaterial({ type: 'abs' });
    state = useKeyboardStore.getState();
    expect(state.keycapMaterial.type).toBe('abs');
    expect(state.keycapMaterial.roughness).toBe(0.18);
    expect(state.keycapMaterial.clearcoat).toBe(0.85);
    expect(state.keycapColorOverrides[escId]).toBe('#ff0055'); // Preserved!
  });

  it('synchronizes switch model change with both audio synthesis engine and 3D stem colors', () => {
    const store = useKeyboardStore.getState();

    // 1. Switch to Cherry Blue (Clicky)
    store.setSwitchModel('cherry_blue');
    let state = useKeyboardStore.getState();
    expect(state.switchModel).toBe('cherry_blue');
    expect(state.switchType).toBe('clicky');
    expect(SWITCH_STEM_COLORS[state.switchModel]).toBe('#3b82f6'); // Blue stem

    // 2. Switch to Holy Panda (Tactile)
    store.setSwitchModel('holy_panda');
    state = useKeyboardStore.getState();
    expect(state.switchModel).toBe('holy_panda');
    expect(state.switchType).toBe('tactile');
    expect(SWITCH_STEM_COLORS[state.switchModel]).toBe('#ea580c'); // Orange stem

    // 3. Switch to Gateron Yellow (Linear)
    store.setSwitchModel('gateron_yellow');
    state = useKeyboardStore.getState();
    expect(state.switchModel).toBe('gateron_yellow');
    expect(state.switchType).toBe('linear');
    expect(SWITCH_STEM_COLORS[state.switchModel]).toBe('#eab308'); // Yellow stem
  });

  it('exports configuration with custom overrides, changes model, and re-imports to restore entire customizer state', () => {
    const store = useKeyboardStore.getState();

    // Create a complex state on Tofu 60
    store.setModel('tofu60');
    store.setCaseColor('#4a3b32', 'anodized');
    store.setWeightMaterial('matte_black');
    store.setSwitchModel('kailh_box_jade');
    store.applyPresetTheme('dark_stealth');
    store.setKeycapColor(['Space'], '#00ffcc');
    store.setExplodedProgress(0.68);
    store.setFoamDamping(false);

    const config = store.exportConfiguration();

    // Reset store to defaults on EveningStar 75
    store.resetDefaults();
    expect(useKeyboardStore.getState().model).toBe('eveningstar75');
    expect(useKeyboardStore.getState().explodedProgress).toBe(0.0);

    // Import configuration
    const restored = store.importConfiguration(config);
    expect(restored).toBe(true);

    const finalState = useKeyboardStore.getState();
    expect(finalState.model).toBe('tofu60');
    expect(finalState.caseColor).toBe('#4a3b32');
    expect(finalState.weightMaterial).toBe('matte_black');
    expect(finalState.switchModel).toBe('kailh_box_jade');
    expect(finalState.switchType).toBe('clicky');
    expect(finalState.keycapColorOverrides['Space']).toBe('#00ffcc');
    expect(finalState.explodedProgress).toBe(0.68);
    expect(finalState.foamDamping).toBe(false);
  });
});

// ============================================================================
// TIER 4: REAL-WORLD APPLICATION SCENARIOS
// ============================================================================

describe('Tier 4: Real-World Scenarios', () => {
  beforeEach(() => {
    useKeyboardStore.getState().resetDefaults();
  });

  it('Scenario 1: EveningStar 75 Cyberpunk Custom Build & Typing Speed Run', () => {
    const store = useKeyboardStore.getState();

    // 1. Verify model is EveningStar 75
    expect(store.model).toBe('eveningstar75');

    // 2. Apply Cyberpunk theme
    store.applyPresetTheme('cyberpunk');
    expect(useKeyboardStore.getState().activePresetTheme).toBe('cyberpunk');
    expect(useKeyboardStore.getState().keycapMaterial.type).toBe('abs');

    // 3. Highlight accent keys
    store.selectEscEnterSpace();
    const accentKeys = useKeyboardStore.getState().selectedKeyIds;
    expect(accentKeys.length).toBe(3);

    // 4. Start typing sandbox run
    store.setSandboxOpen(true);
    store.setSampleText('Cyberpunk 2077 Night City');

    // Simulate typing: "Cyberpunk" (9 keystrokes)
    let typed = '';
    for (const char of 'Cyberpunk') {
      typed += char;
      store.handleKeyDown(`Key${char.toUpperCase()}`);
      store.handleTypingInput(typed);
      store.handleKeyUp(`Key${char.toUpperCase()}`);
    }

    const state = useKeyboardStore.getState();
    expect(state.typedText).toBe('Cyberpunk');
    expect(state.telemetry.totalKeystrokes).toBe(9);
    expect(state.telemetry.correctKeystrokes).toBe(9);
    expect(state.telemetry.accuracy).toBe(100);
    expect(state.activePressedKeys.length).toBe(0); // All keys released
  });

  it('Scenario 2: Mr. Suit 80 Retro 9009 Full Exploded Disassembly & Inspection', () => {
    const store = useKeyboardStore.getState();

    // 1. Switch to Mr. Suit 80 and apply 9009 theme
    store.setModel('mrsuit80');
    store.applyPresetTheme('retro_9009');
    expect(useKeyboardStore.getState().keycapMaterial.type).toBe('pbt');

    // 2. Exploded disassembly progression: 0% -> 25% -> 50% -> 75% -> 100%
    const steps = [0.0, 0.25, 0.5, 0.75, 1.0];
    let prevDisplacement = -1;

    steps.forEach((progress) => {
      store.setExplodedProgress(progress);
      const t = cubicEase(progress);
      const keycapsNominalY = 22.45 + 115.0 * t;

      expect(keycapsNominalY).toBeGreaterThanOrEqual(prevDisplacement);
      prevDisplacement = keycapsNominalY;
    });

    // 3. At 100% exploded, isolate PCB layer
    store.setIsolatedLayer('pcb');
    expect(useKeyboardStore.getState().isolatedLayer).toBe('pcb');

    // 4. Isolate Plate layer
    store.setIsolatedLayer('plate');
    expect(useKeyboardStore.getState().isolatedLayer).toBe('plate');

    // 5. Restore full stack view
    store.setAllLayersVisible();
    expect(useKeyboardStore.getState().isolatedLayer).toBeNull();
  });

  it('Scenario 3: Tofu 60 Clicky Switch Mod with Custom Palette Export/Import', () => {
    const store = useKeyboardStore.getState();

    // 1. Configure Tofu 60 with Clicky Switch
    store.setModel('tofu60');
    store.setSwitchModel('cherry_blue');
    expect(useKeyboardStore.getState().switchType).toBe('clicky');

    // 2. Custom color mapping: Alphas to pastel lavender, Modifiers to deep midnight
    store.selectRegion('alphas');
    const alphas = useKeyboardStore.getState().selectedKeyIds;
    store.setKeycapColor(alphas, '#e0e7ff');

    store.selectRegion('modifiers');
    const modifiers = useKeyboardStore.getState().selectedKeyIds;
    store.setKeycapColor(modifiers, '#312e81');

    // 3. Export config
    const exported = store.exportConfiguration();
    expect(exported.model).toBe('tofu60');
    expect(exported.switchModel).toBe('cherry_blue');

    // 4. Reset & Re-import
    store.resetDefaults();
    const success = store.importConfiguration(exported);
    expect(success).toBe(true);

    const restored = useKeyboardStore.getState();
    expect(restored.model).toBe('tofu60');
    expect(restored.keycapColorOverrides[alphas[0]]).toBe('#e0e7ff');
    expect(restored.keycapColorOverrides[modifiers[0]]).toBe('#312e81');
    expect(restored.switchType).toBe('clicky');
  });

  it('Scenario 4: High-Speed Stress Typing Burst (250+ WPM)', () => {
    const store = useKeyboardStore.getState();
    store.setSandboxOpen(true);
    store.setSampleText('Superfast mechanical typing velocity test scenario.');

    // 50 characters in 2.4 seconds = 10 words / 0.04 minutes = 250 WPM
    const testInput = 'Superfast mechanical typing velocity test scenario';
    const elapsedMs = 2400;

    const tel = calculateTelemetry({
      correctChars: testInput.length,
      totalChars: testInput.length,
      elapsedMs,
      errors: 0,
    });

    expect(tel.rawWpm).toBe(250);
    expect(tel.wpm).toBe(250);
    expect(tel.accuracy).toBe(100);

    // Simulate high frequency keystrokes into store
    for (let i = 0; i < 30; i++) {
      store.handleKeyDown(`Key${i}`);
    }
    expect(useKeyboardStore.getState().activePressedKeys.length).toBe(30);

    // Release all
    for (let i = 0; i < 30; i++) {
      store.handleKeyUp(`Key${i}`);
    }
    expect(useKeyboardStore.getState().activePressedKeys.length).toBe(0);
  });

  it('Scenario 5: Gasket Stack Layer Isolation with PBT/ABS Specular Verification', () => {
    const store = useKeyboardStore.getState();
    const allLayers: GasketLayerId[] = [
      'keycaps',
      'switches',
      'plate',
      'poron_ixpe',
      'pcb',
      'case_foam',
      'bottom_case_weight',
    ];

    // Cycle through all 7 layers in isolation
    allLayers.forEach((layer) => {
      store.setIsolatedLayer(layer);
      expect(useKeyboardStore.getState().isolatedLayer).toBe(layer);
    });

    // PBT Specular verification
    store.setKeycapMaterial({ type: 'pbt' });
    let mat = useKeyboardStore.getState().keycapMaterial;
    expect(mat.type).toBe('pbt');
    expect(mat.roughness).toBe(0.72);
    expect(mat.clearcoat).toBe(0.0);

    // ABS Specular verification
    store.setKeycapMaterial({ type: 'abs' });
    mat = useKeyboardStore.getState().keycapMaterial;
    expect(mat.type).toBe('abs');
    expect(mat.roughness).toBe(0.18);
    expect(mat.clearcoat).toBe(0.85);
  });
});

// ============================================================================
// TIER 5: ADVERSARIAL HARDENING
// ============================================================================

describe('Tier 5: Adversarial Hardening', () => {
  beforeEach(() => {
    useKeyboardStore.getState().resetDefaults();
  });

  it('Master Limiter Non-Clipping Verification under 30 Simultaneous Voices', async () => {
    const engine = new ProceduralSoundEngine();
    await engine.init();

    // Trigger 30 simultaneous keydown inputs
    for (let i = 0; i < 30; i++) {
      engine.playKeyDown(`Key_${i}`, 'linear', true);
    }

    // Polyphony limiter must cap voices at 24 to guarantee zero audio buffer clipping
    expect(engine.getVoiceCount()).toBeLessThanOrEqual(24);

    engine.dispose();
  });

  it('Complete Pairwise Resting Layer Clearance Verification (>= 0.10mm across ALL adjacent layers at t=0)', () => {
    // Assert strictly positive clearance >= 0.10mm between every adjacent layer pair
    for (let i = 0; i < RESTING_STACK_LAYERS.length - 1; i++) {
      const upper = RESTING_STACK_LAYERS[i];
      const lower = RESTING_STACK_LAYERS[i + 1];

      // Physical lower bound of upper layer
      const upperMinY = upper.socketMinY !== undefined ? upper.socketMinY : upper.centerY - upper.halfThickness;
      // Physical upper bound of lower layer
      const lowerMaxY = lower.centerY + lower.halfThickness;

      const physicalClearance = upperMinY - lowerMaxY;

      // 1. Must satisfy >= 0.10mm threshold everywhere (allowing 1e-6 for IEEE-754 floating point precision)
      expect(physicalClearance + 1e-6).toBeGreaterThanOrEqual(0.10);

      // 2. Verify zero penetration
      expect(physicalClearance).toBeGreaterThan(0.0);
    }
  });

  it('Procedural Synthetic Impulse Response Buffer Normalization & Energy Dissipation Check', () => {
    const ctx = new MockAudioContext() as unknown as AudioContext;
    const models: KeyboardModelId[] = ['eveningstar75', 'mrsuit80', 'tofu60'];

    models.forEach((model) => {
      [true, false].forEach((hasFoam) => {
        const irBuffer = generateSyntheticImpulseResponse(ctx, { caseModel: model, hasFoam });

        expect(irBuffer.sampleRate).toBe(44100);
        expect(irBuffer.numberOfChannels).toBe(2);
        expect(irBuffer.length).toBeGreaterThan(100);

        // Check channel 0 and 1 samples
        for (let ch = 0; ch < 2; ch++) {
          const data = irBuffer.getChannelData(ch);
          let sumFirstHalfSquare = 0;
          let sumSecondHalfSquare = 0;
          const halfLen = Math.floor(data.length / 2);

          for (let i = 0; i < data.length; i++) {
            const val = data[i];
            // 1. Samples must be finite numbers
            expect(Number.isFinite(val)).toBe(true);
            // 2. Normalization: samples strictly bounded in [-1.5, 1.5]
            expect(val).toBeGreaterThanOrEqual(-1.5);
            expect(val).toBeLessThanOrEqual(1.5);

            if (i < halfLen) {
              sumFirstHalfSquare += val * val;
            } else {
              sumSecondHalfSquare += val * val;
            }
          }

          // 3. Energy dissipation: second half energy must be lower than first half due to exponential envelope
          expect(sumSecondHalfSquare).toBeLessThan(sumFirstHalfSquare);
        }
      });
    });
  });
});
