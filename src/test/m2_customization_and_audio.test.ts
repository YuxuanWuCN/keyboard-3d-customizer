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
import { KeyboardConfigV1 } from '../types/keyboard';

// ============================================================================
// Mock AudioContext for headless node verification
// ============================================================================

class MockAudioParam {
  value = 0;
  setValueAtTime = vi.fn();
  linearRampToValueAtTime = vi.fn();
  exponentialRampToValueAtTime = vi.fn();
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

// Global window mock for AudioContext
if (typeof window !== 'undefined') {
  (window as any).AudioContext = MockAudioContext;
}

// ============================================================================
// TEST SUITES
// ============================================================================

describe('Milestone 2: R3 Keycap Customization, Themes & Materials', () => {
  beforeEach(() => {
    useKeyboardStore.getState().resetDefaults();
  });

  it('provides all 7 classic custom keyboard themes', () => {
    const requiredThemes = [
      'retro_9009',
      'cyberpunk',
      'miami_nights',
      'dark_stealth',
      'eva_01',
      'matcha_latte',
      'olivia',
    ];

    requiredThemes.forEach((themeId) => {
      const theme = THEME_PRESETS[themeId];
      expect(theme).toBeDefined();
      expect(theme.id).toBe(themeId);
      expect(theme.name).toBeTruthy();
      expect(theme.palette.alphas.top).toMatch(/^#[0-9A-Fa-f]{6}$/);
      expect(theme.palette.modifiers.top).toMatch(/^#[0-9A-Fa-f]{6}$/);
      expect(theme.palette.accents.top).toMatch(/^#[0-9A-Fa-f]{6}$/);
      expect(['pbt', 'abs']).toContain(theme.defaultMaterial);
    });
  });

  it('applies theme presets with correct colors and default materials', () => {
    const store = useKeyboardStore.getState();

    // 1. Cyberpunk theme (ABS default)
    store.applyPresetTheme('cyberpunk');
    const stateCyber = useKeyboardStore.getState();
    expect(stateCyber.activePresetTheme).toBe('cyberpunk');
    expect(stateCyber.keycapMaterial.type).toBe('abs');
    expect(stateCyber.keycapMaterial.roughness).toBe(0.18);
    expect(stateCyber.keycapMaterial.clearcoat).toBe(0.85);

    // Verify key color override on Space key
    const layout = KEYBOARD_LAYOUTS[stateCyber.model];
    const spaceKey = layout.keys.find((k) => k.code === 'Space');
    expect(spaceKey).toBeDefined();
    expect(stateCyber.keycapColorOverrides[spaceKey!.id]).toBe(
      THEME_PRESETS.cyberpunk.palette.spacebar?.top || THEME_PRESETS.cyberpunk.palette.alphas.top
    );

    // 2. Matcha Latte theme (PBT default)
    store.applyPresetTheme('matcha_latte');
    const stateMatcha = useKeyboardStore.getState();
    expect(stateMatcha.activePresetTheme).toBe('matcha_latte');
    expect(stateMatcha.keycapMaterial.type).toBe('pbt');
    expect(stateMatcha.keycapMaterial.roughness).toBe(0.72);
    expect(stateMatcha.keycapMaterial.clearcoat).toBe(0.0);
  });

  it('supports single key click and multi-select (Shift/Ctrl)', () => {
    const store = useKeyboardStore.getState();

    // Single click
    store.selectKey('KeyA');
    expect(useKeyboardStore.getState().selectedKeyIds).toEqual(['KeyA']);

    // Another single click replaces selection
    store.selectKey('KeyB');
    expect(useKeyboardStore.getState().selectedKeyIds).toEqual(['KeyB']);

    // Multi-select with Shift/Ctrl
    store.selectKey('KeyC', true);
    expect(useKeyboardStore.getState().selectedKeyIds).toEqual(['KeyB', 'KeyC']);

    // Toggle off with multi-select
    store.selectKey('KeyB', true);
    expect(useKeyboardStore.getState().selectedKeyIds).toEqual(['KeyC']);
  });

  it('supports region batch select (Alphas, Modifiers, Accent/Space/Enter/Esc, All, Invert, Clear)', () => {
    const store = useKeyboardStore.getState();
    const layout = KEYBOARD_LAYOUTS.eveningstar75;

    // Batch select Alphas
    store.selectRegion('alphas');
    const alphaKeys = layout.keys.filter((k) => k.region === 'alphas').map((k) => k.id);
    expect(useKeyboardStore.getState().selectedKeyIds.length).toBe(alphaKeys.length);
    expect(useKeyboardStore.getState().selectedKeyIds).toEqual(expect.arrayContaining(alphaKeys));

    // Batch select Modifiers
    store.selectRegion('modifiers');
    expect(useKeyboardStore.getState().selectedKeyIds.length).toBeGreaterThan(10);

    // Batch select Accent / Space / Enter / Esc
    store.selectEscEnterSpace();
    const accentIds = useKeyboardStore.getState().selectedKeyIds;
    expect(accentIds).toContain('Escape');
    expect(accentIds).toContain('Enter');
    expect(accentIds).toContain('Space');

    // Invert selection
    const prevCount = accentIds.length;
    store.invertSelection();
    expect(useKeyboardStore.getState().selectedKeyIds.length).toBe(layout.keys.length - prevCount);

    // Clear selection
    store.clearSelection();
    expect(useKeyboardStore.getState().selectedKeyIds).toEqual([]);

    // Select all keys
    store.selectAllKeys();
    expect(useKeyboardStore.getState().selectedKeyIds.length).toBe(layout.keys.length);
  });

  it('enforces PBT vs ABS material physics parameters', () => {
    const store = useKeyboardStore.getState();

    // Switch to PBT
    store.setKeycapMaterial({ type: 'pbt' });
    let mat = useKeyboardStore.getState().keycapMaterial;
    expect(mat.type).toBe('pbt');
    expect(mat.roughness).toBe(0.72);
    expect(mat.clearcoat).toBe(0.0);

    // Switch to ABS
    store.setKeycapMaterial({ type: 'abs' });
    mat = useKeyboardStore.getState().keycapMaterial;
    expect(mat.type).toBe('abs');
    expect(mat.roughness).toBe(0.18);
    expect(mat.clearcoat).toBe(0.85);
  });
});

describe('Milestone 2: R4 Web Audio API Procedural Sound Engine & Switch Acoustics', () => {
  const ctx = new MockAudioContext() as unknown as AudioContext;
  const noiseBuffer = createPinkNoiseBuffer(ctx, 0.5);

  it('creates in-memory pink noise buffer without external assets', () => {
    expect(noiseBuffer).toBeDefined();
    expect(noiseBuffer.numberOfChannels).toBe(1);
    expect(noiseBuffer.length).toBeGreaterThan(0);
    const data = noiseBuffer.getChannelData(0);
    expect(data.length).toBe(noiseBuffer.length);
  });

  it('generates synthetic impulse response with case resonance and foam damping differences', () => {
    const irFoam = generateSyntheticImpulseResponse(ctx, {
      caseModel: 'eveningstar75',
      hasFoam: true,
    });
    const irAlu = generateSyntheticImpulseResponse(ctx, {
      caseModel: 'eveningstar75',
      hasFoam: false,
    });

    expect(irFoam.numberOfChannels).toBe(2);
    expect(irAlu.numberOfChannels).toBe(2);
    // Foam damped IR is shorter than hollow aluminum IR
    expect(irFoam.length).toBeLessThan(irAlu.length);

    // Non-zero audio samples
    const leftAlu = irAlu.getChannelData(0);
    let hasSignal = false;
    for (let i = 0; i < 50; i++) {
      if (leftAlu[i] !== 0) hasSignal = true;
    }
    expect(hasSignal).toBe(true);
  });

  it('synthesizes Linear switch downstroke (pitch sweep 340Hz -> 155Hz + pink lowpass 680Hz Q=2.2)', () => {
    const dest = ctx.createGain();
    const voice = synthesizeLinearDown(ctx, dest, noiseBuffer, 0, 1.0, 1.0);

    expect(voice.sources.length).toBe(2); // Sine oscillator + Pink noise source
    expect(voice.nodes.length).toBeGreaterThan(3);

    // Verify frequency sweep on oscillator
    const osc = voice.sources.find((s) => s instanceof MockOscillatorNode) as unknown as MockOscillatorNode;
    expect(osc).toBeDefined();
    expect(osc.frequency.setValueAtTime).toHaveBeenCalledWith(340, 0);
    expect(osc.frequency.exponentialRampToValueAtTime).toHaveBeenCalledWith(155, 0.035);

    // Verify lowpass filter
    const filter = voice.nodes.find(
      (n) => n instanceof MockBiquadFilterNode && (n as any).type === 'lowpass'
    ) as unknown as MockBiquadFilterNode;
    expect(filter).toBeDefined();
    expect(filter.frequency.setValueAtTime).toHaveBeenCalledWith(680, 0);
    expect(filter.Q.setValueAtTime).toHaveBeenCalledWith(2.2, 0);
  });

  it('synthesizes Clicky switch (click leaf snap 3.8kHz, Q=11.0, 4ms + bottom clack + reset click)', () => {
    const dest = ctx.createGain();
    const downVoice = synthesizeClickyDown(ctx, dest, noiseBuffer, 0, 1.0, 1.0);

    // Verify click leaf filter
    const clickFilter = downVoice.nodes.find(
      (n) => n instanceof MockBiquadFilterNode && (n as any).type === 'bandpass'
    ) as unknown as MockBiquadFilterNode;
    expect(clickFilter).toBeDefined();
    expect(clickFilter.frequency.setValueAtTime).toHaveBeenCalledWith(3800, 0);
    expect(clickFilter.Q.setValueAtTime).toHaveBeenCalledWith(11.0, 0);

    // Upstroke reset click
    const upVoice = synthesizeClickyUp(ctx, dest, noiseBuffer, 0, 1.0, 1.0);
    const resetFilter = upVoice.nodes.find(
      (n) => n instanceof MockBiquadFilterNode && (n as any).type === 'bandpass'
    ) as unknown as MockBiquadFilterNode;
    expect(resetFilter).toBeDefined();
    expect(resetFilter.frequency.setValueAtTime).toHaveBeenCalledWith(3200, 0);
    expect(resetFilter.Q.setValueAtTime).toHaveBeenCalledWith(8.0, 0);
  });

  it('synthesizes Tactile switch (Holy Panda bump pop 1150Hz -> 680Hz + thud 260Hz)', () => {
    const dest = ctx.createGain();
    const downVoice = synthesizeTactileDown(ctx, dest, noiseBuffer, 0, 1.0, 1.0);

    const oscillators = downVoice.sources.filter(
      (s) => s instanceof MockOscillatorNode
    ) as unknown as MockOscillatorNode[];
    expect(oscillators.length).toBe(2);

    // Pop oscillator
    const popOsc = oscillators[0];
    expect(popOsc.frequency.setValueAtTime).toHaveBeenCalledWith(1150, 0);
    expect(popOsc.frequency.exponentialRampToValueAtTime).toHaveBeenCalledWith(680, 0.012);

    // Thud oscillator
    const thudOsc = oscillators[1];
    expect(thudOsc.frequency.setValueAtTime).toHaveBeenCalledWith(260, 0);
  });

  it('enforces 24-voice polyphony limit in ProceduralSoundEngine', async () => {
    const engine = new ProceduralSoundEngine();
    await engine.init();

    // Trigger 30 rapid keypresses
    for (let i = 0; i < 30; i++) {
      engine.playKeyDown(`Key_${i}`, 'linear', true);
    }

    // Must be capped at 24 active voices
    expect(engine.getVoiceCount()).toBeLessThanOrEqual(24);

    engine.dispose();
  });
});

describe('Milestone 2: R5 Typing Sandbox Telemetry & WPM Math', () => {
  it('calculates gross WPM, net WPM and accuracy correctly according to 5 chars/word standard', () => {
    // 50 characters in 30 seconds (0.5 minute) = 10 words / 0.5 = 20 WPM, 0 errors -> 100% accuracy
    const tel1 = calculateTelemetry({
      correctChars: 50,
      totalChars: 50,
      elapsedMs: 30000,
      errors: 0,
    });
    expect(tel1.rawWpm).toBe(20);
    expect(tel1.wpm).toBe(20);
    expect(tel1.accuracy).toBe(100);

    // 50 characters in 30 seconds with 5 errors:
    // Raw WPM = (50 / 5) / 0.5 = 20
    // Net WPM = ((45 / 5) - 5) / 0.5 = (9 - 5) / 0.5 = 8
    // Accuracy = (45 / 50) * 100 = 90%
    const tel2 = calculateTelemetry({
      correctChars: 45,
      totalChars: 50,
      elapsedMs: 30000,
      errors: 5,
    });
    expect(tel2.rawWpm).toBe(20);
    expect(tel2.wpm).toBe(8);
    expect(tel2.accuracy).toBe(90);

    // Under 500ms should safely return 0 WPM without NaN or division by zero
    const telZero = calculateTelemetry({
      correctChars: 5,
      totalChars: 5,
      elapsedMs: 200,
      errors: 0,
    });
    expect(telZero.wpm).toBe(0);
    expect(telZero.rawWpm).toBe(0);
    expect(telZero.accuracy).toBe(100);
  });

  it('updates store telemetry and keystroke history upon typing input', () => {
    const store = useKeyboardStore.getState();
    store.setSampleText('Hello World');

    // Type 'Hello' character by character
    let text = '';
    for (const char of 'Hello') {
      text += char;
      store.handleTypingInput(text);
    }
    let state = useKeyboardStore.getState();
    expect(state.typedText).toBe('Hello');
    expect(state.telemetry.totalKeystrokes).toBe(5);
    expect(state.telemetry.correctKeystrokes).toBe(5);
    expect(state.telemetry.accuracy).toBe(100);
    expect(state.keystrokeHistory.length).toBe(5);
    expect(state.keystrokeHistory[4].correct).toBe(true);

    // Next prompt changes sample text and resets session
    store.nextSamplePrompt();
    state = useKeyboardStore.getState();
    expect(SAMPLE_TYPING_PROMPTS).toContain(state.sampleText);
    expect(state.typedText).toBe('');
    expect(state.telemetry.totalKeystrokes).toBe(0);
  });
});

describe('Milestone 2: Configuration Import/Export Roundtrip (KeyboardConfigV1)', () => {
  beforeEach(() => {
    useKeyboardStore.getState().resetDefaults();
  });

  it('exports valid KeyboardConfigV1 conforming to specification', () => {
    const store = useKeyboardStore.getState();
    store.setModel('mrsuit80');
    store.setCaseColor('#2f4838', 'anodized');
    store.setWeightMaterial('mirror_chroma');
    store.setSwitchModel('holy_panda');
    store.applyPresetTheme('eva_01');
    store.setExplodedProgress(0.65);
    store.setFoamDamping(false);

    const config: KeyboardConfigV1 = store.exportConfiguration();

    expect(config.version).toBe(1);
    expect(config.name).toBeTruthy();
    expect(config.timestamp).toBeGreaterThan(0);
    expect(config.model).toBe('mrsuit80');
    expect(config.caseColor).toBe('#2f4838');
    expect(config.weightMaterial).toBe('mirror_chroma');
    expect(config.switchType).toBe('tactile');
    expect(config.switchModel).toBe('holy_panda');
    expect(config.themePreset).toBe('eva_01');
    expect(config.explodedViewProgress).toBe(0.65);
    expect(config.dampeningFoamInstalled).toBe(false);
  });

  it('imports configuration faithfully and restores entire customizer state', () => {
    const store = useKeyboardStore.getState();
    store.setModel('tofu60');
    store.setCaseColor('#5c1d24');
    store.applyPresetTheme('cyberpunk');
    store.setSwitchModel('cherry_blue');
    store.setExplodedProgress(0.85);

    const exported = store.exportConfiguration();

    // Reset store to defaults
    store.resetDefaults();
    expect(useKeyboardStore.getState().model).toBe('eveningstar75');
    expect(useKeyboardStore.getState().switchModel).toBe('cherry_red');

    // Import back
    const success = store.importConfiguration(exported);
    expect(success).toBe(true);

    const restored = useKeyboardStore.getState();
    expect(restored.model).toBe('tofu60');
    expect(restored.caseColor).toBe('#5c1d24');
    expect(restored.switchModel).toBe('cherry_blue');
    expect(restored.switchType).toBe('clicky');
    expect(restored.activePresetTheme).toBe('cyberpunk');
    expect(restored.explodedProgress).toBe(0.85);
  });

  it('rejects invalid or corrupted configurations gracefully', () => {
    const store = useKeyboardStore.getState();
    expect(store.importConfiguration(null as any)).toBe(false);
    expect(store.importConfiguration({} as any)).toBe(false);
    expect(store.importConfiguration({ version: 2 } as any)).toBe(false);
  });
});
