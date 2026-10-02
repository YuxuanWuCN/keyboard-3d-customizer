import { SwitchType, KeyboardModelId } from '../types/keyboard';
import { SoundEngineInterface } from '../types/audio';
import { generateSyntheticImpulseResponse } from './SyntheticImpulseResponse';
import {
  createPinkNoiseBuffer,
  synthesizeLinearDown,
  synthesizeLinearUp,
  synthesizeClickyDown,
  synthesizeClickyUp,
  synthesizeTactileDown,
  synthesizeTactileUp,
  SynthesizedVoice,
} from './SwitchSynthProfiles';

export interface SoundEngineOptions {
  caseModel?: KeyboardModelId;
  hasFoam?: boolean;
  hasGasket?: boolean;
  volume?: number;
  muted?: boolean;
}

export class ProceduralSoundEngine implements SoundEngineInterface {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private compressor: DynamicsCompressorNode | null = null;
  private waveShaper: WaveShaperNode | null = null;
  private convolver: ConvolverNode | null = null;
  private noiseBuffer: AudioBuffer | null = null;

  private activeVoiceCount = 0;
  private readonly MAX_VOICES = 24;

  private caseModel: KeyboardModelId = 'eveningstar75';
  private hasFoam = true;
  private hasGasket = true;
  private volume = 0.8;
  private muted = false;
  private isUnlocked = false;

  private unlockListenerAttached = false;
  private activeTimeouts: Set<ReturnType<typeof setTimeout>> = new Set();

  constructor(options?: SoundEngineOptions) {
    if (options) {
      if (options.caseModel) this.caseModel = options.caseModel;
      if (options.hasFoam !== undefined) this.hasFoam = options.hasFoam;
      if (options.hasGasket !== undefined) this.hasGasket = options.hasGasket;
      if (options.volume !== undefined) this.volume = options.volume;
      if (options.muted !== undefined) this.muted = options.muted;
    }
  }

  public async init(): Promise<void> {
    if (this.ctx) return;

    if (typeof window === 'undefined') return;

    const AudioContextClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;

    if (!AudioContextClass) return;

    this.ctx = new AudioContextClass({ latencyHint: 'interactive' });

    // 1. Master Output Gain Node
    this.masterGain = this.ctx.createGain();
    const effectiveGain = this.muted ? 0 : this.volume;
    this.masterGain.gain.setValueAtTime(effectiveGain, this.ctx.currentTime);

    // 2. WaveShaper Tanh Soft-Clipper (prevents digital clipping at high typing bursts)
    this.waveShaper = this.ctx.createWaveShaper();
    this.waveShaper.curve = this.generateTanhCurve(4096);
    this.waveShaper.oversample = '2x';

    // 3. Fast Limiting Dynamics Compressor (-10dB threshold, 12:1 ratio)
    this.compressor = this.ctx.createDynamicsCompressor();
    this.compressor.threshold.setValueAtTime(-10, this.ctx.currentTime);
    this.compressor.knee.setValueAtTime(4, this.ctx.currentTime);
    this.compressor.ratio.setValueAtTime(12, this.ctx.currentTime);
    this.compressor.attack.setValueAtTime(0.001, this.ctx.currentTime);
    this.compressor.release.setValueAtTime(0.045, this.ctx.currentTime);

    // 4. Acoustic Convolver (Procedural case & Gasket simulation)
    this.convolver = this.ctx.createConvolver();
    this.updateAcousticImpulseResponse();

    // Signal Routing: Convolver -> DynamicsCompressor -> WaveShaper -> MasterGain -> Destination
    this.convolver.connect(this.compressor);
    this.compressor.connect(this.waveShaper);
    this.waveShaper.connect(this.masterGain);
    this.masterGain.connect(this.ctx.destination);

    // 5. Pre-generate reusable 1.0-second Pink Noise Buffer
    this.noiseBuffer = createPinkNoiseBuffer(this.ctx, 1.0);

    // Register auto-unlock listeners
    this.registerAutoUnlock();
  }

  public async unlock(): Promise<void> {
    if (!this.ctx) {
      await this.init();
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      try {
        await this.ctx.resume();
        this.isUnlocked = true;
      } catch (err) {
        console.warn('AudioContext resume failed:', err);
      }
    } else if (this.ctx && this.ctx.state === 'running') {
      this.isUnlocked = true;
    }
  }

  private registerAutoUnlock(): void {
    if (this.unlockListenerAttached || typeof window === 'undefined') return;

    const onUserGesture = async () => {
      await this.unlock();
      if (this.isUnlocked) {
        window.removeEventListener('pointerdown', onUserGesture);
        window.removeEventListener('keydown', onUserGesture);
        window.removeEventListener('touchstart', onUserGesture);
        this.unlockListenerAttached = false;
      }
    };

    window.addEventListener('pointerdown', onUserGesture, { passive: true });
    window.addEventListener('keydown', onUserGesture, { passive: true });
    window.addEventListener('touchstart', onUserGesture, { passive: true });
    this.unlockListenerAttached = true;
  }

  private generateTanhCurve(sampleCount = 4096): Float32Array<ArrayBuffer> {
    const buffer = new ArrayBuffer(sampleCount * 4);
    const curve = new Float32Array(buffer);
    for (let i = 0; i < sampleCount; ++i) {
      const x = (i * 2) / sampleCount - 1; // Range: -1 to 1
      curve[i] = Math.tanh(x * 1.5) / Math.tanh(1.5);
    }
    return curve;
  }

  public updateAcousticImpulseResponse(): void {
    if (!this.ctx || !this.convolver) return;
    this.convolver.buffer = generateSyntheticImpulseResponse(this.ctx, {
      caseModel: this.caseModel,
      hasFoam: this.hasFoam,
      hasGasket: this.hasGasket,
    });
  }

  public setVolume(volume: number): void {
    this.volume = Math.max(0, Math.min(1, volume));
    if (this.masterGain && this.ctx) {
      const effectiveGain = this.muted ? 0 : this.volume;
      this.masterGain.gain.setValueAtTime(effectiveGain, this.ctx.currentTime);
    }
  }

  public setMuted(muted: boolean): void {
    this.muted = muted;
    if (this.masterGain && this.ctx) {
      const effectiveGain = this.muted ? 0 : this.volume;
      this.masterGain.gain.setValueAtTime(effectiveGain, this.ctx.currentTime);
    }
  }

  public setFoamDamping(hasFoam: boolean): void {
    if (this.hasFoam !== hasFoam) {
      this.hasFoam = hasFoam;
      this.updateAcousticImpulseResponse();
    }
  }

  public setCaseModel(model: KeyboardModelId): void {
    if (this.caseModel !== model) {
      this.caseModel = model;
      this.updateAcousticImpulseResponse();
    }
  }

  public playKeyDown(keyId: string, switchType: SwitchType, hasFoam: boolean): void {
    if (this.muted) return;
    this.playKeyAction(keyId, switchType, 'down', hasFoam);
  }

  public playKeyUp(keyId: string, switchType: SwitchType, hasFoam: boolean): void {
    if (this.muted) return;
    this.playKeyAction(keyId, switchType, 'up', hasFoam);
  }

  private playKeyAction(
    keyId: string,
    switchType: SwitchType,
    phase: 'down' | 'up',
    hasFoam: boolean
  ): void {
    if (!this.ctx) {
      this.init();
    }

    if (!this.ctx || !this.convolver || !this.noiseBuffer) return;

    if (this.ctx.state !== 'running') {
      this.unlock();
      return;
    }

    // 24-voice polyphony limiter check
    if (this.activeVoiceCount >= this.MAX_VOICES) {
      return; // Cap voices to maintain absolute headroom and avoid GC spikes
    }

    // Update foam state if dynamic
    if (this.hasFoam !== hasFoam) {
      this.hasFoam = hasFoam;
      this.updateAcousticImpulseResponse();
    }

    this.activeVoiceCount++;
    const t0 = this.ctx.currentTime;

    // Pitch & mass scaling for larger keys (Space, Enter, Backspace, Modifiers)
    const normalizedKey = keyId.toLowerCase();
    const sizeMult = normalizedKey.includes('space')
      ? 0.72
      : normalizedKey.includes('enter') || normalizedKey.includes('backspace') || normalizedKey.includes('shift')
      ? 0.88
      : 1.0;

    let voice: SynthesizedVoice;

    if (phase === 'down') {
      switch (switchType) {
        case 'linear':
          voice = synthesizeLinearDown(this.ctx, this.convolver, this.noiseBuffer, t0, 1.0, sizeMult);
          break;
        case 'clicky':
          voice = synthesizeClickyDown(this.ctx, this.convolver, this.noiseBuffer, t0, 1.0, sizeMult);
          break;
        case 'tactile':
          voice = synthesizeTactileDown(this.ctx, this.convolver, this.noiseBuffer, t0, 1.0, sizeMult);
          break;
      }
    } else {
      switch (switchType) {
        case 'linear':
          voice = synthesizeLinearUp(this.ctx, this.convolver, this.noiseBuffer, t0, 1.0, sizeMult);
          break;
        case 'clicky':
          voice = synthesizeClickyUp(this.ctx, this.convolver, this.noiseBuffer, t0, 1.0, sizeMult);
          break;
        case 'tactile':
          voice = synthesizeTactileUp(this.ctx, this.convolver, this.noiseBuffer, t0, 1.0, sizeMult);
          break;
      }
    }

    // Strict node lifecycle garbage collection & cleanup
    const cleanupDelayMs = Math.ceil(voice.durationSeconds * 1000) + 10;
    const timeoutId = setTimeout(() => {
      this.activeTimeouts.delete(timeoutId);
      voice.sources.forEach((s) => {
        try {
          s.disconnect();
        } catch {
          // ignore already disconnected
        }
      });
      voice.nodes.forEach((n) => {
        try {
          n.disconnect();
        } catch {
          // ignore
        }
      });
      this.activeVoiceCount = Math.max(0, this.activeVoiceCount - 1);
    }, cleanupDelayMs);

    this.activeTimeouts.add(timeoutId);
  }

  public getVoiceCount(): number {
    return this.activeVoiceCount;
  }

  public getAudioContext(): AudioContext | null {
    return this.ctx;
  }

  public dispose(): void {
    this.activeTimeouts.forEach((id) => clearTimeout(id));
    this.activeTimeouts.clear();

    if (this.ctx && this.ctx.state !== 'closed') {
      this.ctx.close().catch(() => {});
    }
    this.ctx = null;
    this.masterGain = null;
    this.compressor = null;
    this.waveShaper = null;
    this.convolver = null;
    this.noiseBuffer = null;
    this.activeVoiceCount = 0;
  }
}

// Global audio engine singleton
export const soundEngine = new ProceduralSoundEngine();
