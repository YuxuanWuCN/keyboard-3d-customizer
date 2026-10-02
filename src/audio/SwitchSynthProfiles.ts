export interface SynthesizedVoice {
  sources: AudioScheduledSourceNode[];
  nodes: AudioNode[];
  durationSeconds: number;
}

export function createPinkNoiseBuffer(ctx: AudioContext, durationSeconds = 1.0): AudioBuffer {
  const sampleRate = ctx.sampleRate;
  const length = Math.floor(sampleRate * durationSeconds);
  const buffer = ctx.createBuffer(1, length, sampleRate);
  const data = buffer.getChannelData(0);

  let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
  for (let i = 0; i < length; i++) {
    const white = Math.random() * 2 - 1;
    b0 = 0.99886 * b0 + white * 0.0555179;
    b1 = 0.99332 * b1 + white * 0.0750759;
    b2 = 0.96900 * b2 + white * 0.1538520;
    b3 = 0.86650 * b3 + white * 0.3104856;
    b4 = 0.55000 * b4 + white * 0.5329522;
    b5 = -0.7616 * b5 - white * 0.0168980;
    data[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.11;
    b6 = white * 0.115926;
  }
  return buffer;
}

// ============================================================================
// 1. Linear Switch Synthesis (Cherry MX Red / Gateron Yellow)
// Deep "Thock" / Mahjong tile profile: pitch-swept sub-bass 340Hz -> 155Hz
// + Pink noise lowpass 680Hz Q=2.2 + Top-out clack 1.75kHz
// ============================================================================

export function synthesizeLinearDown(
  ctx: AudioContext,
  dest: AudioNode,
  noiseBuffer: AudioBuffer,
  t0: number,
  velocity = 1.0,
  sizeMult = 1.0
): SynthesizedVoice {
  const sources: AudioScheduledSourceNode[] = [];
  const nodes: AudioNode[] = [];

  const voiceGain = ctx.createGain();
  voiceGain.connect(dest);
  nodes.push(voiceGain);

  // 1. Sub-bass Body Resonance: 340Hz -> 155Hz downward sweep
  const osc = ctx.createOscillator();
  const oscGain = ctx.createGain();
  osc.type = 'sine';

  const startFreq = 340 * sizeMult;
  const endFreq = 155 * sizeMult;
  osc.frequency.setValueAtTime(startFreq, t0);
  osc.frequency.exponentialRampToValueAtTime(endFreq, t0 + 0.035);

  oscGain.gain.setValueAtTime(0.001, t0);
  oscGain.gain.linearRampToValueAtTime(0.70 * velocity, t0 + 0.001);
  oscGain.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.048);

  osc.connect(oscGain);
  oscGain.connect(voiceGain);
  sources.push(osc);
  nodes.push(osc, oscGain);

  // 2. Housing Collision: Pink noise lowpass 680Hz, Q=2.2
  const noise = ctx.createBufferSource();
  noise.buffer = noiseBuffer;

  const noiseFilter = ctx.createBiquadFilter();
  noiseFilter.type = 'lowpass';
  noiseFilter.frequency.setValueAtTime(680 * sizeMult, t0);
  noiseFilter.Q.setValueAtTime(2.2, t0);

  const noiseGain = ctx.createGain();
  noiseGain.gain.setValueAtTime(0.001, t0);
  noiseGain.gain.linearRampToValueAtTime(0.48 * velocity, t0 + 0.001);
  noiseGain.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.032);

  noise.connect(noiseFilter);
  noiseFilter.connect(noiseGain);
  noiseGain.connect(voiceGain);
  sources.push(noise);
  nodes.push(noise, noiseFilter, noiseGain);

  osc.start(t0);
  noise.start(t0);
  osc.stop(t0 + 0.052);
  noise.stop(t0 + 0.036);

  return { sources, nodes, durationSeconds: 0.055 };
}

export function synthesizeLinearUp(
  ctx: AudioContext,
  dest: AudioNode,
  noiseBuffer: AudioBuffer,
  t0: number,
  velocity = 1.0,
  sizeMult = 1.0
): SynthesizedVoice {
  const sources: AudioScheduledSourceNode[] = [];
  const nodes: AudioNode[] = [];

  const voiceGain = ctx.createGain();
  voiceGain.connect(dest);
  nodes.push(voiceGain);

  // Top-out clack: bandpass filter 1.75kHz (1750Hz), Q=3.8
  const clack = ctx.createBufferSource();
  clack.buffer = noiseBuffer;

  const filter = ctx.createBiquadFilter();
  filter.type = 'bandpass';
  filter.frequency.setValueAtTime(1750 * sizeMult, t0);
  filter.Q.setValueAtTime(3.8, t0);

  const clackGain = ctx.createGain();
  clackGain.gain.setValueAtTime(0.001, t0);
  clackGain.gain.linearRampToValueAtTime(0.25 * velocity, t0 + 0.001);
  clackGain.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.022);

  clack.connect(filter);
  filter.connect(clackGain);
  clackGain.connect(voiceGain);
  sources.push(clack);
  nodes.push(clack, filter, clackGain);

  clack.start(t0);
  clack.stop(t0 + 0.025);

  return { sources, nodes, durationSeconds: 0.03 };
}

// ============================================================================
// 2. Clicky Switch Synthesis (Cherry MX Blue / Kailh Box Jade)
// Crisp click leaf snap (3.8kHz, Q=11.0, 4ms) + bottom-out clack + top-out click
// ============================================================================

export function synthesizeClickyDown(
  ctx: AudioContext,
  dest: AudioNode,
  noiseBuffer: AudioBuffer,
  t0: number,
  velocity = 1.0,
  sizeMult = 1.0
): SynthesizedVoice {
  const sources: AudioScheduledSourceNode[] = [];
  const nodes: AudioNode[] = [];

  const voiceGain = ctx.createGain();
  voiceGain.connect(dest);
  nodes.push(voiceGain);

  // 1. Crisp Click Leaf Snap: Bandpass 3.8kHz (3800Hz), Q=11.0, 4ms transient
  const click = ctx.createBufferSource();
  click.buffer = noiseBuffer;

  const clickFilter = ctx.createBiquadFilter();
  clickFilter.type = 'bandpass';
  clickFilter.frequency.setValueAtTime(3800, t0);
  clickFilter.Q.setValueAtTime(11.0, t0);

  const clickGain = ctx.createGain();
  clickGain.gain.setValueAtTime(0.001, t0);
  clickGain.gain.linearRampToValueAtTime(0.92 * velocity, t0 + 0.0005);
  clickGain.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.004); // 4ms snap

  click.connect(clickFilter);
  clickFilter.connect(clickGain);
  clickGain.connect(voiceGain);
  sources.push(click);
  nodes.push(click, clickFilter, clickGain);

  // 2. Bottom-out housing clack
  const clackOsc = ctx.createOscillator();
  clackOsc.type = 'triangle';
  clackOsc.frequency.setValueAtTime(750 * sizeMult, t0);

  const clackGain = ctx.createGain();
  clackGain.gain.setValueAtTime(0.001, t0);
  clackGain.gain.linearRampToValueAtTime(0.38 * velocity, t0 + 0.002);
  clackGain.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.028);

  clackOsc.connect(clackGain);
  clackGain.connect(voiceGain);
  sources.push(clackOsc);
  nodes.push(clackOsc, clackGain);

  click.start(t0);
  clackOsc.start(t0);
  click.stop(t0 + 0.005);
  clackOsc.stop(t0 + 0.03);

  return { sources, nodes, durationSeconds: 0.035 };
}

export function synthesizeClickyUp(
  ctx: AudioContext,
  dest: AudioNode,
  noiseBuffer: AudioBuffer,
  t0: number,
  velocity = 1.0,
  _sizeMult = 1.0
): SynthesizedVoice {
  const sources: AudioScheduledSourceNode[] = [];
  const nodes: AudioNode[] = [];

  const voiceGain = ctx.createGain();
  voiceGain.connect(dest);
  nodes.push(voiceGain);

  // Top-out reset click: 3.2kHz, Q=8.0, 6ms
  const resetClick = ctx.createBufferSource();
  resetClick.buffer = noiseBuffer;

  const resetFilter = ctx.createBiquadFilter();
  resetFilter.type = 'bandpass';
  resetFilter.frequency.setValueAtTime(3200, t0);
  resetFilter.Q.setValueAtTime(8.0, t0);

  const resetGain = ctx.createGain();
  resetGain.gain.setValueAtTime(0.001, t0);
  resetGain.gain.linearRampToValueAtTime(0.42 * velocity, t0 + 0.0005);
  resetGain.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.006);

  resetClick.connect(resetFilter);
  resetFilter.connect(resetGain);
  resetGain.connect(voiceGain);
  sources.push(resetClick);
  nodes.push(resetClick, resetFilter, resetGain);

  resetClick.start(t0);
  resetClick.stop(t0 + 0.008);

  return { sources, nodes, durationSeconds: 0.012 };
}

// ============================================================================
// 3. Tactile Switch Synthesis (Holy Panda / Boba U4T)
// Dual-phase tactile bump pop (1150Hz -> 680Hz) + solid stem thud (260Hz)
// ============================================================================

export function synthesizeTactileDown(
  ctx: AudioContext,
  dest: AudioNode,
  _noiseBuffer: AudioBuffer,
  t0: number,
  velocity = 1.0,
  sizeMult = 1.0
): SynthesizedVoice {
  const sources: AudioScheduledSourceNode[] = [];
  const nodes: AudioNode[] = [];

  const voiceGain = ctx.createGain();
  voiceGain.connect(dest);
  nodes.push(voiceGain);

  // 1. Dual-phase tactile bump pop: 1150Hz -> 680Hz over 12ms
  const popOsc = ctx.createOscillator();
  popOsc.type = 'sine';
  popOsc.frequency.setValueAtTime(1150 * sizeMult, t0);
  popOsc.frequency.exponentialRampToValueAtTime(680 * sizeMult, t0 + 0.012);

  const popGain = ctx.createGain();
  popGain.gain.setValueAtTime(0.001, t0);
  popGain.gain.linearRampToValueAtTime(0.60 * velocity, t0 + 0.001);
  popGain.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.015);

  popOsc.connect(popGain);
  popGain.connect(voiceGain);
  sources.push(popOsc);
  nodes.push(popOsc, popGain);

  // 2. Solid stem thud: 260Hz -> 140Hz triangle oscillator
  const thudOsc = ctx.createOscillator();
  thudOsc.type = 'triangle';
  thudOsc.frequency.setValueAtTime(260 * sizeMult, t0);
  thudOsc.frequency.exponentialRampToValueAtTime(140 * sizeMult, t0 + 0.04);

  const thudGain = ctx.createGain();
  thudGain.gain.setValueAtTime(0.001, t0 + 0.003); // Slightly delayed collision
  thudGain.gain.linearRampToValueAtTime(0.55 * velocity, t0 + 0.006);
  thudGain.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.052);

  thudOsc.connect(thudGain);
  thudGain.connect(voiceGain);
  sources.push(thudOsc);
  nodes.push(thudOsc, thudGain);

  popOsc.start(t0);
  thudOsc.start(t0 + 0.003);
  popOsc.stop(t0 + 0.018);
  thudOsc.stop(t0 + 0.055);

  return { sources, nodes, durationSeconds: 0.06 };
}

export function synthesizeTactileUp(
  ctx: AudioContext,
  dest: AudioNode,
  _noiseBuffer: AudioBuffer,
  t0: number,
  velocity = 1.0,
  sizeMult = 1.0
): SynthesizedVoice {
  const sources: AudioScheduledSourceNode[] = [];
  const nodes: AudioNode[] = [];

  const voiceGain = ctx.createGain();
  voiceGain.connect(dest);
  nodes.push(voiceGain);

  // Tactile upstroke rebound bump snap
  const upOsc = ctx.createOscillator();
  upOsc.type = 'sine';
  upOsc.frequency.setValueAtTime(1350 * sizeMult, t0);

  const upGain = ctx.createGain();
  upGain.gain.setValueAtTime(0.001, t0);
  upGain.gain.linearRampToValueAtTime(0.28 * velocity, t0 + 0.001);
  upGain.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.018);

  upOsc.connect(upGain);
  upGain.connect(voiceGain);
  sources.push(upOsc);
  nodes.push(upOsc, upGain);

  upOsc.start(t0);
  upOsc.stop(t0 + 0.02);

  return { sources, nodes, durationSeconds: 0.024 };
}
