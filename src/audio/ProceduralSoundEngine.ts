import { SwitchType, KeyboardModelId, SwitchModelId } from '../types/keyboard';
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
import { SWITCH_SAMPLES_BASE64, SwitchAudioCategory } from './SwitchAudioSamples';

export interface SoundEngineOptions {
  caseModel?: KeyboardModelId;
  hasFoam?: boolean;
  hasGasket?: boolean;
  volume?: number;
  muted?: boolean;
  soundMode?: 'sampled' | 'synth';
}

export class ProceduralSoundEngine implements SoundEngineInterface {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private compressor: DynamicsCompressorNode | null = null;
  private waveShaper: WaveShaperNode | null = null;
  private convolver: ConvolverNode | null = null;
  private noiseBuffer: AudioBuffer | null = null;

  // Real Studio Microphone Audio Sample Buffers
  private soundMode: 'sampled' | 'synth' = 'sampled';
  private sampleBuffers: Partial<
    Record<
      SwitchAudioCategory,
      {
        press: {
          generic: AudioBuffer[];
          space: AudioBuffer | null;
          enter: AudioBuffer | null;
          backspace: AudioBuffer | null;
        };
        release: {
          generic: AudioBuffer | null;
          space: AudioBuffer | null;
          enter: AudioBuffer | null;
          backspace: AudioBuffer | null;
        };
      }
    >
  > = {};
  private samplesLoading = false;
  private samplesLoaded = false;
  private roundRobinIndex = 0;

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
      if (options.soundMode !== undefined) this.soundMode = options.soundMode;
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

    // 6. Preload and decode authentic studio switch recording samples asynchronously
    this.loadRealAudioSamples().catch(() => {});

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

  public setSoundMode(mode: 'sampled' | 'synth'): void {
    this.soundMode = mode;
  }

  public getSoundMode(): 'sampled' | 'synth' {
    return this.soundMode;
  }

  private async loadRealAudioSamples(): Promise<void> {
    if (this.samplesLoaded || this.samplesLoading || !this.ctx) return;
    if (typeof (this.ctx as any).decodeAudioData !== 'function') return;

    this.samplesLoading = true;
    try {
      const categories: SwitchAudioCategory[] = ['linear', 'clicky', 'tactile'];

      const decodeDataUri = async (dataUri: string): Promise<AudioBuffer | null> => {
        try {
          if (!this.ctx || typeof (this.ctx as any).decodeAudioData !== 'function') return null;
          const commaIdx = dataUri.indexOf(',');
          const base64 = commaIdx >= 0 ? dataUri.slice(commaIdx + 1) : dataUri;
          const binaryString = atob(base64);
          const len = binaryString.length;
          const bytes = new Uint8Array(len);
          for (let i = 0; i < len; i++) {
            bytes[i] = binaryString.charCodeAt(i);
          }
          const bufferCopy = bytes.buffer.slice(0);
          return await new Promise<AudioBuffer>((resolve, reject) => {
            const res = (this.ctx as any).decodeAudioData(
              bufferCopy,
              (decoded: AudioBuffer) => resolve(decoded),
              (err: any) => reject(err)
            );
            if (res && typeof res.then === 'function') {
              res.then(resolve).catch(reject);
            }
          });
        } catch {
          return null;
        }
      };

      for (const cat of categories) {
        const data = SWITCH_SAMPLES_BASE64[cat];
        if (!data) continue;
        const genericPromises = data.press.generic.map((uri) => decodeDataUri(uri));
        const [
          genericBuffers,
          spacePress,
          enterPress,
          backspacePress,
          genericRelease,
          spaceRelease,
          enterRelease,
          backspaceRelease,
        ] = await Promise.all([
          Promise.all(genericPromises),
          decodeDataUri(data.press.space),
          decodeDataUri(data.press.enter),
          decodeDataUri(data.press.backspace),
          decodeDataUri(data.release.generic),
          decodeDataUri(data.release.space),
          decodeDataUri(data.release.enter),
          decodeDataUri(data.release.backspace),
        ]);

        this.sampleBuffers[cat] = {
          press: {
            generic: genericBuffers.filter((b): b is AudioBuffer => b !== null),
            space: spacePress,
            enter: enterPress,
            backspace: backspacePress,
          },
          release: {
            generic: genericRelease,
            space: spaceRelease,
            enter: enterRelease,
            backspace: backspaceRelease,
          },
        };
      }
      this.samplesLoaded = true;
    } catch (err) {
      console.warn('Real audio sample loading error:', err);
    } finally {
      this.samplesLoading = false;
    }
  }

  public playKeyDown(keyId: string, switchType: SwitchType, hasFoam: boolean, switchModel?: SwitchModelId): void {
    if (this.muted) return;
    this.playKeyAction(keyId, switchType, 'down', hasFoam, switchModel);
  }

  public playKeyUp(keyId: string, switchType: SwitchType, hasFoam: boolean, switchModel?: SwitchModelId): void {
    if (this.muted) return;
    this.playKeyAction(keyId, switchType, 'up', hasFoam, switchModel);
  }

  private playKeyAction(
    keyId: string,
    switchType: SwitchType,
    phase: 'down' | 'up',
    hasFoam: boolean,
    switchModel?: SwitchModelId
  ): void {
    if (!this.ctx) {
      this.init();
    }

    if (!this.ctx || !this.convolver || !this.noiseBuffer || !this.compressor) return;

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
    const normalizedKey = keyId.toLowerCase();

    // 1. Authentic Studio Microphone Sample Playback Path
    if (this.soundMode === 'sampled' && this.samplesLoaded) {
      const cat: SwitchAudioCategory =
        switchType === 'clicky' ? 'clicky' : switchType === 'tactile' ? 'tactile' : 'linear';
      const pack = this.sampleBuffers[cat];
      let targetBuffer: AudioBuffer | null = null;

      if (pack) {
        if (phase === 'down') {
          if (normalizedKey.includes('space') && pack.press.space) {
            targetBuffer = pack.press.space;
          } else if (normalizedKey.includes('enter') && pack.press.enter) {
            targetBuffer = pack.press.enter;
          } else if (normalizedKey.includes('backspace') && pack.press.backspace) {
            targetBuffer = pack.press.backspace;
          } else if (pack.press.generic.length > 0) {
            const idx = (this.roundRobinIndex++) % pack.press.generic.length;
            targetBuffer = pack.press.generic[idx];
          }
        } else {
          if (normalizedKey.includes('space') && pack.release.space) {
            targetBuffer = pack.release.space;
          } else if (normalizedKey.includes('enter') && pack.release.enter) {
            targetBuffer = pack.release.enter;
          } else if (normalizedKey.includes('backspace') && pack.release.backspace) {
            targetBuffer = pack.release.backspace;
          } else {
            targetBuffer = pack.release.generic;
          }
        }
      }

      if (targetBuffer) {
        try {
          const source = this.ctx.createBufferSource();
          source.buffer = targetBuffer;

          // Natural acoustic micro-variance (+-20 cents detune)
          if (source.detune) {
            const detuneCents = (Math.random() - 0.5) * 30;
            source.detune.setValueAtTime(detuneCents, t0);
          }

          // Nuanced pitch characteristics based on switch model
          let playbackRate = 1.0;
          if (switchModel === 'kailh_box_jade') playbackRate = 1.06;
          else if (switchModel === 'gateron_yellow') playbackRate = 0.94;
          else if (normalizedKey.includes('space')) playbackRate = 0.95;
          source.playbackRate.setValueAtTime(playbackRate, t0);

          const voiceGain = this.ctx.createGain();
          const baseGain = phase === 'down' ? 1.0 : 0.65;
          voiceGain.gain.setValueAtTime(baseGain, t0);

          // Direct dry path to compressor & master
          source.connect(voiceGain);
          voiceGain.connect(this.compressor);

          // Dynamic case acoustic convolution (Poron foam damping & aluminum body reflection)
          const convolverGain = this.ctx.createGain();
          convolverGain.gain.setValueAtTime(this.hasFoam ? 0.3 : 0.6, t0);
          voiceGain.connect(convolverGain);
          convolverGain.connect(this.convolver);

          source.start(t0);

          const durationSeconds = targetBuffer.duration || 0.25;
          const cleanupDelayMs = Math.ceil(durationSeconds * 1000) + 15;
          const timeoutId = setTimeout(() => {
            this.activeTimeouts.delete(timeoutId);
            try {
              source.disconnect();
              voiceGain.disconnect();
              convolverGain.disconnect();
            } catch {}
            this.activeVoiceCount = Math.max(0, this.activeVoiceCount - 1);
          }, cleanupDelayMs);
          this.activeTimeouts.add(timeoutId);
          return;
        } catch (err) {
          console.warn('Real audio sample playback failed, falling back to synth:', err);
        }
      }
    }

    // 2. Procedural Synthesis Fallback Path (Multi-oscillator + pink noise)
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
        } catch {}
      });
      voice.nodes.forEach((n) => {
        try {
          n.disconnect();
        } catch {}
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
