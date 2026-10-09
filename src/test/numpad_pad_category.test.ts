import { describe, it, expect, beforeEach } from 'vitest';
import { useKeyboardStore } from '../store/useKeyboardStore';
import { KEYBOARD_LAYOUTS } from '../constants/keyboardLayouts';
import { KEYBOARD_CATEGORIES, KeyboardModelId } from '../types/keyboard';
import { generateSyntheticImpulseResponse } from '../audio/SyntheticImpulseResponse';

describe('17-Key Numeric PAD Categorization & Hardware Architecture Suite', () => {
  beforeEach(() => {
    useKeyboardStore.getState().resetDefaults();
  });

  describe('1. Dedicated Category Classification (主力键盘 vs 独立数字 PAD)', () => {
    it('provides distinct categories separating standard main keyboards from numeric PADs', () => {
      expect(KEYBOARD_CATEGORIES).toBeDefined();
      expect(KEYBOARD_CATEGORIES.length).toBe(2);

      const mainCategory = KEYBOARD_CATEGORIES.find((c) => c.id === 'main');
      const padCategory = KEYBOARD_CATEGORIES.find((c) => c.id === 'pad');

      expect(mainCategory).toBeDefined();
      expect(mainCategory?.name).toBe('主力键盘');
      expect(mainCategory?.models).toEqual([
        'eveningstar75',
        'mrsuit80',
        'bakeneko65',
        'tofu60',
      ]);

      expect(padCategory).toBeDefined();
      expect(padCategory?.name).toBe('独立数字 PAD');
      expect(padCategory?.models).toEqual(['polaris_pad17']);
    });

    it('guarantees every registered category model exists in KEYBOARD_LAYOUTS registry', () => {
      KEYBOARD_CATEGORIES.forEach((cat) => {
        expect(cat.id).toBeTruthy();
        expect(cat.name).toBeTruthy();
        expect(cat.icon).toBeTruthy();
        expect(cat.models.length).toBeGreaterThan(0);

        cat.models.forEach((m: KeyboardModelId) => {
          expect(KEYBOARD_LAYOUTS[m]).toBeDefined();
          expect(KEYBOARD_LAYOUTS[m].model).toBe(m);
        });
      });
    });
  });

  describe('2. Polaris Pad 17 Layout Definition & Precision Matrix', () => {
    const padLayout = KEYBOARD_LAYOUTS.polaris_pad17;

    it('has exactly 17 keys with zero duplicate identifiers', () => {
      expect(padLayout).toBeDefined();
      expect(padLayout.model).toBe('polaris_pad17');
      expect(padLayout.keyCount).toBe(17);
      expect(padLayout.keys.length).toBe(17);

      const idSet = new Set<string>();
      padLayout.keys.forEach((k) => {
        expect(idSet.has(k.id)).toBe(false);
        idSet.add(k.id);
      });
      expect(idSet.size).toBe(17);
    });

    it('contains all 17 standard calculator/numpad keycodes', () => {
      const expectedCodes = [
        'NumLock',
        'NumpadDivide',
        'NumpadMultiply',
        'NumpadSubtract',
        'Numpad7',
        'Numpad8',
        'Numpad9',
        'NumpadAdd',
        'Numpad4',
        'Numpad5',
        'Numpad6',
        'Numpad1',
        'Numpad2',
        'Numpad3',
        'NumpadEnter',
        'Numpad0',
        'NumpadDecimal',
      ];

      const actualCodes = padLayout.keys.map((k) => k.code);
      expectedCodes.forEach((code) => {
        expect(actualCodes).toContain(code);
      });
    });

    it('verifies 2U vertical and horizontal key dimensions', () => {
      const addKey = padLayout.keys.find((k) => k.code === 'NumpadAdd');
      const enterKey = padLayout.keys.find((k) => k.code === 'NumpadEnter');
      const zeroKey = padLayout.keys.find((k) => k.code === 'Numpad0');

      expect(addKey).toBeDefined();
      expect(addKey?.unitWidth).toBe(1.0);
      expect(addKey?.unitHeight).toBe(2.0);

      expect(enterKey).toBeDefined();
      expect(enterKey?.unitWidth).toBe(1.0);
      expect(enterKey?.unitHeight).toBe(2.0);

      expect(zeroKey).toBeDefined();
      expect(zeroKey?.unitWidth).toBe(2.0);
      expect(zeroKey?.unitHeight ?? 1.0).toBe(1.0);
    });

    it('verifies physical case dimensions and matrix fit non-interference', () => {
      const { width: caseW, depth: caseD, frontHeight, rearHeight, typingAngleDeg } = padLayout.dimensions;

      expect(caseW).toBe(96.0);
      expect(caseD).toBe(128.0);
      expect(frontHeight).toBe(18.0);
      expect(rearHeight).toBe(28.0);
      expect(rearHeight).toBeGreaterThan(frontHeight);
      expect(typingAngleDeg).toBe(6.0);

      let maxX = 0;
      let maxY = 0;
      padLayout.keys.forEach((k) => {
        const endX = k.gridX + k.unitWidth;
        const endY = k.gridY + (k.unitHeight ?? 1.0);
        if (endX > maxX) maxX = endX;
        if (endY > maxY) maxY = endY;
      });

      const matrixW = maxX * 19.05;
      const matrixD = maxY * 19.05;

      expect(matrixW).toBe(76.2);
      expect(matrixD).toBe(95.25);

      expect(caseW - matrixW).toBeGreaterThan(15.0); // > 15mm clearance
      expect(caseD - matrixD).toBeGreaterThan(25.0); // > 25mm clearance
    });
  });

  describe('3. Audio Engine Synthetic Impulse Response for Pad 17', () => {
    it('synthesizes stable high-frequency cavity acoustic response for polaris_pad17', () => {
      const mockAudioCtx = {
        sampleRate: 44100,
        createBuffer: (channels: number, length: number, sampleRate: number) => {
          const channelData = [new Float32Array(length), new Float32Array(length)];
          return {
            numberOfChannels: channels,
            length,
            sampleRate,
            getChannelData: (ch: number) => channelData[ch],
          };
        },
      };

      const buffer = generateSyntheticImpulseResponse(mockAudioCtx as any, {
        caseModel: 'polaris_pad17',
        hasFoam: true,
        hasGasket: true,
      });

      expect(buffer).toBeDefined();
      expect(buffer.numberOfChannels).toBe(2);
      expect(buffer.length).toBeGreaterThan(1000);

      const left = buffer.getChannelData(0);
      for (let i = 0; i < buffer.length; i++) {
        expect(Number.isFinite(left[i])).toBe(true);
        expect(Number.isNaN(left[i])).toBe(false);
      }

      // Energy dissipation check
      const half = Math.floor(buffer.length / 2);
      let sumFirst = 0;
      let sumSecond = 0;
      for (let i = 0; i < half; i++) {
        sumFirst += left[i] * left[i];
        sumSecond += left[half + i] * left[half + i];
      }
      expect(sumSecond).toBeLessThan(sumFirst);
    });
  });

  describe('4. Zustand State Management & Configuration Roundtrip', () => {
    it('switches to polaris_pad17 and applies iconic lilac pink case color', () => {
      const store = useKeyboardStore.getState();
      store.setModel('polaris_pad17');

      const state = useKeyboardStore.getState();
      expect(state.model).toBe('polaris_pad17');
      expect(state.caseColor).toBe('#f5d0fe');
    });

    it('exports and restores polaris_pad17 configuration accurately', () => {
      const store = useKeyboardStore.getState();
      store.setModel('polaris_pad17');
      store.setCaseColor('#e0e7ff');
      store.setExplodedProgress(0.5);

      const config = store.exportConfiguration();
      expect(config.model).toBe('polaris_pad17');
      expect(config.caseColor).toBe('#e0e7ff');
      expect(config.explodedViewProgress).toBe(0.5);

      store.resetDefaults();
      expect(useKeyboardStore.getState().model).toBe('eveningstar75');

      const success = store.importConfiguration(config);
      expect(success).toBe(true);

      const restoredState = useKeyboardStore.getState();
      expect(restoredState.model).toBe('polaris_pad17');
      expect(restoredState.caseColor).toBe('#e0e7ff');
      expect(restoredState.explodedProgress).toBe(0.5);
    });
  });
});
