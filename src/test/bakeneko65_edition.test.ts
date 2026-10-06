import { describe, it, expect, beforeEach } from 'vitest';
import { KEYBOARD_LAYOUTS } from '../constants/keyboardLayouts';
import { useKeyboardStore } from '../store/useKeyboardStore';
import { generateSyntheticImpulseResponse } from '../audio/SyntheticImpulseResponse';

describe('Bakeneko 65 (化猫 65) Open-Source Keyboard Integration Verification', () => {
  beforeEach(() => {
    useKeyboardStore.getState().resetDefaults();
  });

  it('1. Bakeneko 65 layout matrix has exactly 67 keys with 65% ANSI cluster', () => {
    const layout = KEYBOARD_LAYOUTS['bakeneko65'];
    expect(layout).toBeDefined();
    expect(layout.name).toContain('Bakeneko 65');
    expect(layout.keyCount).toBe(67);
    expect(layout.keys.length).toBe(67);

    // Verify presence of dedicated arrow cluster
    const upArrow = layout.keys.find((k) => k.code === 'ArrowUp');
    const downArrow = layout.keys.find((k) => k.code === 'ArrowDown');
    const leftArrow = layout.keys.find((k) => k.code === 'ArrowLeft');
    const rightArrow = layout.keys.find((k) => k.code === 'ArrowRight');

    expect(upArrow).toBeDefined();
    expect(downArrow).toBeDefined();
    expect(leftArrow).toBeDefined();
    expect(rightArrow).toBeDefined();

    // Verify vertical navigation column: Del, PgUp, PgDn, End
    const delKey = layout.keys.find((k) => k.code === 'Delete');
    const pgUpKey = layout.keys.find((k) => k.code === 'PageUp');
    const pgDnKey = layout.keys.find((k) => k.code === 'PageDown');
    const endKey = layout.keys.find((k) => k.code === 'End');

    expect(delKey).toBeDefined();
    expect(pgUpKey).toBeDefined();
    expect(pgDnKey).toBeDefined();
    expect(endKey).toBeDefined();

    // Arrow keys and nav column are aligned at right margin
    expect(delKey!.gridX).toBe(15.0);
    expect(pgUpKey!.gridX).toBe(15.0);
    expect(pgDnKey!.gridX).toBe(15.0);
    expect(endKey!.gridX).toBe(15.0);
    expect(rightArrow!.gridX).toBe(15.0);
  });

  it('2. Zero duplicate key IDs and strict positive bounds', () => {
    const layout = KEYBOARD_LAYOUTS['bakeneko65'];
    const idSet = new Set<string>();
    layout.keys.forEach((k) => {
      expect(idSet.has(k.id)).toBe(false);
      idSet.add(k.id);
      expect(k.unitWidth).toBeGreaterThan(0);
      expect(k.unitHeight ?? 1.0).toBeGreaterThan(0);
      expect(k.gridX).toBeGreaterThanOrEqual(0);
      expect(k.gridY).toBeGreaterThanOrEqual(0);
    });
    expect(idSet.size).toBe(67);
  });

  it('3. Matrix dimensions fit with positive clearance inside case cavity', () => {
    const layout = KEYBOARD_LAYOUTS['bakeneko65'];
    let maxX = 0;
    let maxY = 0;
    layout.keys.forEach((k) => {
      const endX = k.gridX + k.unitWidth;
      const endY = k.gridY + (k.unitHeight ?? 1.0);
      if (endX > maxX) maxX = endX;
      if (endY > maxY) maxY = endY;
    });

    const matrixW = maxX * 19.05;
    const matrixD = maxY * 19.05;

    // 16U width * 19.05 = 304.8mm, 5U depth * 19.05 = 95.25mm
    expect(matrixW).toBeCloseTo(304.8, 1);
    expect(matrixD).toBeCloseTo(95.25, 1);

    // Case width is 315.0mm, inner clearance is >= 1.0mm
    const topBezelW = 308.0;
    const topBezelD = 99.0;
    expect(matrixW).toBeLessThan(topBezelW);
    expect(matrixD).toBeLessThan(topBezelD);
  });

  it('4. setModel("bakeneko65") updates state and applies iconic stealth case color', () => {
    const store = useKeyboardStore.getState();
    store.setModel('bakeneko65');

    const state = useKeyboardStore.getState();
    expect(state.model).toBe('bakeneko65');
    expect(state.caseColor).toBe('#18181b');
    expect(state.selectedKeyIds).toEqual([]);
  });

  it('5. Synthetic impulse response for Bakeneko 65 generates valid damped buffer', () => {
    class MockAudioContext {
      sampleRate = 44100;
      createBuffer(channels: number, length: number, sampleRate: number) {
        const data = [new Float32Array(length), new Float32Array(length)];
        return {
          numberOfChannels: channels,
          length,
          sampleRate,
          duration: length / sampleRate,
          getChannelData: (ch: number) => data[ch],
        };
      }
    }

    const ctx = new MockAudioContext() as unknown as AudioContext;
    const irBuffer = generateSyntheticImpulseResponse(ctx, {
      caseModel: 'bakeneko65',
      hasFoam: true,
      hasGasket: true,
    });

    expect(irBuffer).toBeDefined();
    expect(irBuffer.length).toBeGreaterThan(128);
    expect(irBuffer.numberOfChannels).toBe(2);
  });
});
