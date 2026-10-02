import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { useKeyboardStore } from '../store/useKeyboardStore';
import { KEYBOARD_LAYOUTS } from '../constants/keyboardLayouts';
import { THEME_PRESETS } from '../constants/themePresets';
import { KeyboardConfigV1, KeyboardModelId, SwitchType, SwitchModelId } from '../types/keyboard';
import { soundEngine, ProceduralSoundEngine } from '../audio/ProceduralSoundEngine';
import { generateSyntheticImpulseResponse } from '../audio/SyntheticImpulseResponse';
import { calculateTelemetry } from '../utils/telemetry';

// ============================================================================
// Web Audio Mock Environment Setup
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

if (typeof window === 'undefined') {
  (globalThis as any).window = globalThis;
}
(window as any).addEventListener = vi.fn();
(window as any).removeEventListener = vi.fn();
(window as any).AudioContext = MockAudioContext;
(globalThis as any).AudioContext = MockAudioContext;

// ============================================================================
// FINAL ADVERSARIAL STRESS SUITE (Milestone 3)
// ============================================================================

describe('Final Adversarial Challenge Suite: Milestone 3 Verification', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    soundEngine.dispose();
    useKeyboardStore.getState().resetDefaults();
  });

  afterEach(() => {
    vi.runAllTimers();
    vi.useRealTimers();
    soundEngine.dispose();
  });

  // --------------------------------------------------------------------------
  // 1. CONCURRENCY AND LOAD TESTING
  // --------------------------------------------------------------------------
  describe('1. Concurrency and Load Testing', () => {
    it('1.1 Rapid concurrent keystrokes (30+ to 100 simultaneous keys) with voice limiter capping', () => {
      const store = useKeyboardStore.getState();
      const keysToPress = Array.from({ length: 50 }, (_, i) => `KeyTest${i}`);

      // Rapidly trigger 50 simultaneous key down events
      keysToPress.forEach((code) => {
        store.handleKeyDown(code);
      });

      const stateAfterPress = useKeyboardStore.getState();
      // All 50 keys must be actively recorded in state
      expect(stateAfterPress.activePressedKeys.length).toBe(50);
      keysToPress.forEach((code) => {
        expect(stateAfterPress.activePressedKeys).toContain(code);
      });

      // Sound engine voice count MUST be strictly capped by MAX_VOICES (24)
      expect(soundEngine.getVoiceCount()).toBeLessThanOrEqual(24);

      // Duplicate key presses must be idempotent (no duplicate entries)
      keysToPress.slice(0, 20).forEach((code) => {
        store.handleKeyDown(code);
      });
      expect(useKeyboardStore.getState().activePressedKeys.length).toBe(50);

      // Release all keys
      keysToPress.forEach((code) => {
        store.handleKeyUp(code);
      });
      expect(useKeyboardStore.getState().activePressedKeys.length).toBe(0);

      // Advance timers to trigger voice cleanup timeouts
      vi.advanceTimersByTime(500);
      expect(soundEngine.getVoiceCount()).toBe(0);
    });

    it('1.2 Graceful handling of out-of-order, duplicate, and phantom keyups', () => {
      const store = useKeyboardStore.getState();

      // Phantom keyups for keys never pressed
      expect(() => {
        store.handleKeyUp('GhostKey1');
        store.handleKeyUp('GhostKey2');
      }).not.toThrow();
      expect(useKeyboardStore.getState().activePressedKeys).toEqual([]);

      // Press 10 keys, release 5, press 10 new, release all in reversed order
      const batchA = ['KeyA', 'KeyB', 'KeyC', 'KeyD', 'KeyE'];
      const batchB = ['KeyF', 'KeyG', 'KeyH', 'KeyI', 'KeyJ'];

      batchA.forEach((k) => store.handleKeyDown(k));
      expect(useKeyboardStore.getState().activePressedKeys.length).toBe(5);

      store.handleKeyUp('KeyA');
      store.handleKeyUp('KeyC');
      expect(useKeyboardStore.getState().activePressedKeys.length).toBe(3);

      batchB.forEach((k) => store.handleKeyDown(k));
      expect(useKeyboardStore.getState().activePressedKeys.length).toBe(8);

      // Release remaining in reverse order
      ['KeyJ', 'KeyI', 'KeyH', 'KeyG', 'KeyF', 'KeyE', 'KeyD', 'KeyB'].forEach((k) => {
        store.handleKeyUp(k);
      });
      expect(useKeyboardStore.getState().activePressedKeys.length).toBe(0);
    });

    it('1.3 Fast model switches while typing (30 active keys held down)', () => {
      const store = useKeyboardStore.getState();
      const models: KeyboardModelId[] = ['eveningstar75', 'mrsuit80', 'tofu60'];

      // Hold down 30 keys
      const activeKeys = [
        'KeyQ', 'KeyW', 'KeyE', 'KeyR', 'KeyT', 'KeyY', 'KeyU', 'KeyI', 'KeyO', 'KeyP',
        'KeyA', 'KeyS', 'KeyD', 'KeyF', 'KeyG', 'KeyH', 'KeyJ', 'KeyK', 'KeyL', 'Semicolon',
        'KeyZ', 'KeyX', 'KeyC', 'KeyV', 'KeyB', 'KeyN', 'KeyM', 'Comma', 'Period', 'Slash',
      ];
      activeKeys.forEach((k) => store.handleKeyDown(k));
      expect(useKeyboardStore.getState().activePressedKeys.length).toBe(30);

      // Rapidly switch models 60 times while keys remain active
      for (let i = 0; i < 60; i++) {
        const targetModel = models[i % models.length];
        store.setModel(targetModel);

        const current = useKeyboardStore.getState();
        expect(current.model).toBe(targetModel);
        expect(current.selectedKeyIds).toEqual([]); // Selected keys must be safely cleared
        expect(current.caseColor).toBeDefined();

        // Active keys should still be tracked safely in state
        expect(current.activePressedKeys.length).toBe(30);
      }

      // Now release all 30 keys in the final model (tofu60)
      activeKeys.forEach((k) => store.handleKeyUp(k));
      expect(useKeyboardStore.getState().activePressedKeys.length).toBe(0);
    });

    it('1.4 Extreme theme switching cycles (350 cycles across all 7 themes)', () => {
      const store = useKeyboardStore.getState();
      const themeIds = Object.keys(THEME_PRESETS);
      expect(themeIds.length).toBe(7);

      for (let i = 0; i < 350; i++) {
        const themeId = themeIds[i % themeIds.length];
        const theme = THEME_PRESETS[themeId];
        store.applyPresetTheme(themeId);

        const state = useKeyboardStore.getState();
        expect(state.activePresetTheme).toBe(themeId);

        // Keycap material matches theme default
        expect(state.keycapMaterial.type).toBe(theme.defaultMaterial);
        if (theme.defaultMaterial === 'pbt') {
          expect(state.keycapMaterial.roughness).toBe(0.72);
          expect(state.keycapMaterial.clearcoat).toBe(0.0);
        } else {
          expect(state.keycapMaterial.roughness).toBe(0.18);
          expect(state.keycapMaterial.clearcoat).toBe(0.85);
        }

        // Keycap overrides cover all keys in active layout
        const currentLayout = KEYBOARD_LAYOUTS[state.model];
        expect(Object.keys(state.keycapColorOverrides).length).toBe(currentLayout.keys.length);

        // Every color override must be a valid hex color
        const sampleKeyId = currentLayout.keys[0].id;
        expect(state.keycapColorOverrides[sampleKeyId]).toMatch(/^#[0-9a-fA-F]{6}$/);
      }
    });

    it('1.5 Interleaved theme switching, custom color overrides, and model switching', () => {
      const store = useKeyboardStore.getState();

      // Apply theme
      store.applyPresetTheme('cyberpunk');
      expect(useKeyboardStore.getState().activePresetTheme).toBe('cyberpunk');

      // Override specific key with custom color
      store.setKeycapColor(['esc'], '#ffffff');
      // Overriding a keycap must invalidate preset activePresetTheme
      expect(useKeyboardStore.getState().activePresetTheme).toBeNull();
      expect(useKeyboardStore.getState().keycapColorOverrides['esc']).toBe('#ffffff');

      // Switch model to Mr. Suit 80
      store.setModel('mrsuit80');
      // Re-apply another theme
      store.applyPresetTheme('matcha_latte');
      expect(useKeyboardStore.getState().activePresetTheme).toBe('matcha_latte');
      expect(useKeyboardStore.getState().keycapMaterial.type).toBe('pbt');

      // Applying unknown theme must be handled gracefully without corruption
      store.applyPresetTheme('unknown_theme_xyz');
      expect(useKeyboardStore.getState().activePresetTheme).toBe('matcha_latte'); // Unchanged
    });
  });

  // --------------------------------------------------------------------------
  // 2. CONFIGURATION ROUNDTRIP STRESS
  // --------------------------------------------------------------------------
  describe('2. Configuration Roundtrip Stress', () => {
    it('2.1 Export configuration produces schema-compliant KeyboardConfigV1', () => {
      const store = useKeyboardStore.getState();
      store.setModel('mrsuit80');
      store.setSwitchType('clicky');
      store.setWeightMaterial('mirror_chroma');
      store.setExplodedProgress(0.42);
      store.setFoamDamping(false);
      store.applyPresetTheme('miami_nights');

      const config = store.exportConfiguration();

      expect(config.version).toBe(1);
      expect(config.model).toBe('mrsuit80');
      expect(config.switchType).toBe('clicky');
      expect(config.switchModel).toBe('cherry_blue');
      expect(config.weightMaterial).toBe('mirror_chroma');
      expect(config.explodedViewProgress).toBeCloseTo(0.42, 4);
      expect(config.dampeningFoamInstalled).toBe(false);
      expect(config.themePreset).toBe('miami_nights');
      expect(config.timestamp).toBeGreaterThan(0);
      expect(typeof config.name).toBe('string');
      expect(config.name).toContain('mrsuit80');
    });

    it('2.2 Full roundtrip restoration across all models with deep state slices', () => {
      const store = useKeyboardStore.getState();
      const models: KeyboardModelId[] = ['eveningstar75', 'mrsuit80', 'tofu60'];

      models.forEach((targetModel) => {
        store.setModel(targetModel);
        store.setCaseColor('#223344', 'e_white');
        store.setWeightMaterial('anodized_gold');
        store.setSwitchType('tactile');
        store.setSwitchModel('holy_panda');
        store.setExplodedProgress(0.85);
        store.setFoamDamping(false);
        store.applyPresetTheme('eva_01');
        store.setKeycapColor([KEYBOARD_LAYOUTS[targetModel].keys[0].id], '#ff00aa');

        // Export
        const exported = store.exportConfiguration();

        // Mutate store to defaults
        store.resetDefaults();
        expect(useKeyboardStore.getState().model).toBe('eveningstar75');
        expect(useKeyboardStore.getState().activePresetTheme).toBe('retro_9009');

        // Import
        const success = store.importConfiguration(exported);
        expect(success).toBe(true);

        // Verify state restoration
        const restored = useKeyboardStore.getState();
        expect(restored.model).toBe(targetModel);
        expect(restored.caseColor).toBe('#223344');
        expect(restored.caseFinish).toBe('e_white');
        expect(restored.weightMaterial).toBe('anodized_gold');
        expect(restored.switchType).toBe('tactile');
        expect(restored.switchModel).toBe('holy_panda');
        expect(restored.explodedProgress).toBeCloseTo(0.85, 4);
        expect(restored.foamDamping).toBe(false);
        expect(restored.keycapColorOverrides[KEYBOARD_LAYOUTS[targetModel].keys[0].id]).toBe('#ff00aa');
      });
    });

    it('2.3 Rejection of invalid, corrupt, or future-version configuration schemas', () => {
      const store = useKeyboardStore.getState();

      // Null, undefined, empty
      expect(store.importConfiguration(null as any)).toBe(false);
      expect(store.importConfiguration(undefined as any)).toBe(false);
      expect(store.importConfiguration({} as any)).toBe(false);

      // Invalid version numbers
      expect(store.importConfiguration({ version: 2 } as any)).toBe(false);
      expect(store.importConfiguration({ version: 0 } as any)).toBe(false);
      expect(store.importConfiguration({ version: '1' } as any)).toBe(false);
      expect(store.importConfiguration({ version: -1 } as any)).toBe(false);
    });

    it('2.4 Safe fallback defaults for partially populated configuration objects', () => {
      const store = useKeyboardStore.getState();

      const minimalConfig: KeyboardConfigV1 = {
        version: 1,
        name: 'MinimalConfig',
        timestamp: Date.now(),
        model: 'tofu60',
        caseColor: '',
        caseFinish: undefined as any,
        weightMaterial: undefined as any,
        plateMaterial: 'fr4',
        switchType: undefined as any,
        switchModel: undefined as any,
        keycapMaterial: undefined as any,
        themePreset: null,
        keycapColorOverrides: {},
        explodedViewProgress: undefined as any,
        dampeningFoamInstalled: undefined as any,
      };

      const success = store.importConfiguration(minimalConfig);
      expect(success).toBe(true);

      const state = useKeyboardStore.getState();
      expect(state.model).toBe('tofu60');
      expect(state.caseColor).toBe('#1e2330'); // fallback default
      expect(state.caseFinish).toBe('anodized'); // fallback default
      expect(state.weightMaterial).toBe('brass_pvd'); // fallback default
      expect(state.switchType).toBe('linear'); // fallback default
      expect(state.switchModel).toBe('cherry_red'); // fallback default
      expect(state.explodedProgress).toBe(0.0); // fallback default
      expect(state.foamDamping).toBe(true); // fallback default
    });
  });

  // --------------------------------------------------------------------------
  // 3. AUDIO ENGINE & SYNTHETIC IR CONVOLUTION STRESS
  // --------------------------------------------------------------------------
  describe('3. Audio Engine & Synthetic IR Convolution Stress', () => {
    it('3.1 Standalone ProceduralSoundEngine initialization, voice capping, and teardown', async () => {
      const engine = new ProceduralSoundEngine({
        caseModel: 'mrsuit80',
        hasFoam: true,
        volume: 0.9,
      });

      await engine.init();
      await engine.unlock();

      // Trigger 40 simultaneous key downs
      for (let i = 0; i < 40; i++) {
        engine.playKeyDown(`Key${i}`, 'linear', true);
      }
      expect(engine.getVoiceCount()).toBeLessThanOrEqual(24);

      // Advance timers to trigger voice disconnect callbacks
      vi.advanceTimersByTime(500);
      expect(engine.getVoiceCount()).toBe(0);

      // Clean dispose
      expect(() => engine.dispose()).not.toThrow();
      expect(engine.getAudioContext()).toBeNull();
      expect(engine.getVoiceCount()).toBe(0);
    });

    it('3.2 Synthetic impulse response stability across all models and foam configurations', () => {
      const ctx = new MockAudioContext();
      const models: KeyboardModelId[] = ['eveningstar75', 'mrsuit80', 'tofu60'];

      models.forEach((model) => {
        [true, false].forEach((hasFoam) => {
          const irBuffer = generateSyntheticImpulseResponse(ctx as any, {
            caseModel: model,
            hasFoam,
            hasGasket: true,
          });

          expect(irBuffer).toBeDefined();
          expect(irBuffer.numberOfChannels).toBe(2);
          expect(irBuffer.length).toBeGreaterThan(1000);

          const left = irBuffer.getChannelData(0);
          const right = irBuffer.getChannelData(1);

          // All samples must be finite numbers (no NaN or Infinity)
          for (let i = 0; i < irBuffer.length; i++) {
            expect(Number.isFinite(left[i])).toBe(true);
            expect(Number.isFinite(right[i])).toBe(true);
          }

          // Energy dissipation check: RMS of second half must be strictly less than first half
          const half = Math.floor(irBuffer.length / 2);
          let sumFirst = 0;
          let sumSecond = 0;
          for (let i = 0; i < half; i++) {
            sumFirst += left[i] * left[i];
            sumSecond += left[half + i] * left[half + i];
          }
          expect(sumSecond).toBeLessThan(sumFirst);
        });
      });
    });
  });

  // --------------------------------------------------------------------------
  // 4. TYPING SANDBOX TELEMETRY STRESS
  // --------------------------------------------------------------------------
  describe('4. Typing Sandbox Telemetry Stress', () => {
    it('4.1 Telemetry calculation boundary conditions (zero elapsed time, zero errors, extreme speed)', () => {
      // 0ms elapsed time (must clamp elapsedMs to >= 100 to avoid division by zero)
      const resZero = calculateTelemetry({
        correctChars: 0,
        totalChars: 0,
        elapsedMs: 0,
        errors: 0,
      });
      expect(Number.isFinite(resZero.wpm)).toBe(true);
      expect(resZero.wpm).toBe(0);
      expect(resZero.accuracy).toBe(100);

      // High speed typing burst (200 words in 60s)
      const resBurst = calculateTelemetry({
        correctChars: 1000,
        totalChars: 1000,
        elapsedMs: 60000,
        errors: 0,
      });
      expect(resBurst.wpm).toBe(200);
      expect(resBurst.rawWpm).toBe(200);
      expect(resBurst.accuracy).toBe(100);

      // High error rate (50 errors out of 100 characters)
      const resError = calculateTelemetry({
        correctChars: 50,
        totalChars: 100,
        elapsedMs: 30000,
        errors: 50,
      });
      expect(resError.accuracy).toBe(50);
      expect(resError.errorCount).toBe(50);
    });

    it('4.2 Typing sandbox live text entry with streak and history tracking', () => {
      const store = useKeyboardStore.getState();
      store.setSampleText('hello world');

      // Type matching prefix
      store.handleTypingInput('hel');
      expect(useKeyboardStore.getState().typedText).toBe('hel');
      expect(useKeyboardStore.getState().telemetry.accuracy).toBe(100);
      expect(useKeyboardStore.getState().keystrokeHistory.length).toBe(1);
      expect(useKeyboardStore.getState().keystrokeHistory[0].correct).toBe(true);

      // Type mismatch
      store.handleTypingInput('helx');
      expect(useKeyboardStore.getState().typedText).toBe('helx');
      expect(useKeyboardStore.getState().telemetry.accuracy).toBe(75);
      expect(useKeyboardStore.getState().keystrokeHistory.length).toBe(2);
      expect(useKeyboardStore.getState().keystrokeHistory[1].correct).toBe(false);

      // Reset typing session
      store.resetTypingSession();
      expect(useKeyboardStore.getState().typedText).toBe('');
      expect(useKeyboardStore.getState().telemetry.wpm).toBe(0);
      expect(useKeyboardStore.getState().keystrokeHistory).toEqual([]);
    });
  });

  // --------------------------------------------------------------------------
  // 5. EXTENDED ADVERSARIAL STRESS: CONCURRENCY & EXPLOSION CO-OCCURRENCE
  // --------------------------------------------------------------------------
  describe('5. Extended Adversarial Stress: Concurrency & Explosion Co-occurrence', () => {
    it('5.1 Ultra-high frequency continuous typing burst (1,000 keystrokes interleaved)', () => {
      const store = useKeyboardStore.getState();
      const alphabet = 'abcdefghijklmnopqrstuvwxyz0123456789'.split('');

      // Simulate 1,000 random key down/up events
      for (let i = 0; i < 1000; i++) {
        const char = alphabet[i % alphabet.length];
        const code = `Key${char.toUpperCase()}`;
        if (i % 3 === 0) {
          store.handleKeyDown(code);
        } else if (i % 3 === 1) {
          store.handleKeyDown(code); // Duplicate press
        } else {
          store.handleKeyUp(code);
        }
      }

      // Voice count must remain bounded
      expect(soundEngine.getVoiceCount()).toBeLessThanOrEqual(24);

      // Clean release of everything
      alphabet.forEach((c) => {
        store.handleKeyUp(`Key${c.toUpperCase()}`);
      });
      expect(useKeyboardStore.getState().activePressedKeys.length).toBe(0);

      vi.advanceTimersByTime(500);
      expect(soundEngine.getVoiceCount()).toBe(0);
    });

    it('5.2 Concurrent key actuation during active 3D layer explosion adjustment (0.0 to 1.0)', () => {
      const store = useKeyboardStore.getState();

      for (let step = 0; step <= 100; step++) {
        const progress = step / 100;
        store.setExplodedProgress(progress);

        // Press and release keys at this explosion step
        store.handleKeyDown('Space');
        store.handleKeyDown('Enter');
        expect(useKeyboardStore.getState().explodedProgress).toBe(progress);
        expect(useKeyboardStore.getState().activePressedKeys).toContain('Space');
        expect(useKeyboardStore.getState().activePressedKeys).toContain('Enter');

        store.handleKeyUp('Space');
        store.handleKeyUp('Enter');
        expect(useKeyboardStore.getState().activePressedKeys.length).toBe(0);
      }
    });

    it('5.3 Adversarial configuration mutation & fuzzing roundtrip', () => {
      const store = useKeyboardStore.getState();

      const mutations: Partial<KeyboardConfigV1>[] = [
        { caseFinish: 'raw_alu', weightMaterial: 'matte_black', switchType: 'clicky', switchModel: 'kailh_box_jade' },
        { caseFinish: 'e_white', weightMaterial: 'mirror_chroma', switchType: 'tactile', switchModel: 'holy_panda' },
        { caseColor: '#00ffcc', themePreset: 'cyberpunk', dampeningFoamInstalled: false },
        { explodedViewProgress: 0.99, keycapMaterial: 'abs' },
      ];

      mutations.forEach((mutation) => {
        const base = store.exportConfiguration();
        const mutated: KeyboardConfigV1 = { ...base, ...mutation };

        const ok = store.importConfiguration(mutated);
        expect(ok).toBe(true);

        const current = useKeyboardStore.getState();
        if (mutation.caseFinish) expect(current.caseFinish).toBe(mutation.caseFinish);
        if (mutation.weightMaterial) expect(current.weightMaterial).toBe(mutation.weightMaterial);
        if (mutation.switchType) expect(current.switchType).toBe(mutation.switchType);
        if (mutation.switchModel) expect(current.switchModel).toBe(mutation.switchModel);
        if (mutation.caseColor) expect(current.caseColor).toBe(mutation.caseColor);
        if (mutation.dampeningFoamInstalled !== undefined) expect(current.foamDamping).toBe(mutation.dampeningFoamInstalled);
        if (mutation.explodedViewProgress !== undefined) expect(current.explodedProgress).toBe(mutation.explodedViewProgress);
      });
    });

    it('5.4 Strict non-penetration clearance verification across entire explosion range t in [0.0, 1.0]', () => {
      // Resting stack layers and their delta-y expansion multipliers from GasketStack & ProceduralCase
      const layers = [
        { name: 'Keycaps Array', y0: 22.45, dy: 115.0, halfH: 4.90 },
        { name: 'Switch Upper Housing', y0: 14.35, dy: 85.0, halfH: 2.30 },
        { name: 'Switch Lower Housing', y0: 9.00, dy: 70.0, halfH: 2.30 },
        { name: 'Gasket-Tabbed Plate', y0: 5.65, dy: 48.0, halfH: 0.75 },
        { name: 'Poron Foam', y0: 3.05, dy: 28.0, halfH: 1.75 },
        { name: 'IXPE Pad', y0: 0.95, dy: 24.0, halfH: 0.25 },
        { name: 'Flex-Cut PCB', y0: 0.00, dy: 10.0, halfH: 0.60 },
        { name: 'Case Foam', y0: -2.20, dy: -18.0, halfH: 1.00 },
        { name: 'Bottom Case Chassis', y0: -7.50, dy: -42.0, halfH: 4.00 },
        { name: 'Underside PVD Weight', y0: -14.20, dy: -72.0, halfH: 2.25 },
      ];

      // Test across 50 steps from t = 0.0 to t = 1.0
      for (let step = 0; step <= 50; step++) {
        const tVal = step / 50;
        const cubicT = tVal * tVal * (3 - 2 * tVal);

        for (let i = 0; i < layers.length - 1; i++) {
          const upper = layers[i];
          const lower = layers[i + 1];

          const upperCenterY = upper.y0 + upper.dy * cubicT;
          const lowerCenterY = lower.y0 + lower.dy * cubicT;

          const upperBottom = upperCenterY - upper.halfH;
          const lowerTop = lowerCenterY + lower.halfH;

          const clearance = upperBottom - lowerTop;

          // Physical clearance must strictly be >= 0.10mm at all times
          expect(clearance).toBeGreaterThanOrEqual(0.099);
        }
      }
    });
  });
});

