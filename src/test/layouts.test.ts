import { describe, it, expect } from 'vitest';
import { KEYBOARD_LAYOUTS } from '../constants/keyboardLayouts';

describe('Authentic Keyboard Layout Matrices', () => {
  it('EveningStar 75 has exactly 82 keys and valid compact dimensions', () => {
    const layout = KEYBOARD_LAYOUTS.eveningstar75;
    expect(layout).toBeDefined();
    expect(layout.model).toBe('eveningstar75');
    expect(layout.keyCount).toBe(82);
    expect(layout.keys.length).toBe(82);

    expect(layout.dimensions.width).toBe(318.0);
    expect(layout.dimensions.depth).toBe(138.5);
    expect(layout.dimensions.typingAngleDeg).toBe(7.0);

    // Verify key regions present
    const alphaKeys = layout.keys.filter((k) => k.region === 'alphas');
    const modKeys = layout.keys.filter((k) => k.region === 'modifiers');
    const navKeys = layout.keys.filter((k) => k.region === 'nav');
    const fnKeys = layout.keys.filter((k) => k.region === 'function');

    expect(alphaKeys.length).toBeGreaterThan(30);
    expect(modKeys.length).toBeGreaterThan(10);
    expect(navKeys.length).toBeGreaterThan(4);
    expect(fnKeys.length).toBe(12); // F1 to F12

    // Check spacebar width
    const spaceKey = layout.keys.find((k) => k.code === 'Space');
    expect(spaceKey).toBeDefined();
    expect(spaceKey?.unitWidth).toBe(6.25);
  });

  it('Mr. Suit 80 has exactly 87 keys with classic TKL layout', () => {
    const layout = KEYBOARD_LAYOUTS.mrsuit80;
    expect(layout).toBeDefined();
    expect(layout.model).toBe('mrsuit80');
    expect(layout.keyCount).toBe(87);
    expect(layout.keys.length).toBe(87);

    expect(layout.dimensions.width).toBe(362.5);
    expect(layout.dimensions.depth).toBe(142.0);
    expect(layout.dimensions.typingAngleDeg).toBe(6.8);

    // Arrow cluster
    const upArrow = layout.keys.find((k) => k.code === 'ArrowUp');
    const downArrow = layout.keys.find((k) => k.code === 'ArrowDown');
    expect(upArrow).toBeDefined();
    expect(downArrow).toBeDefined();
  });

  it('Tofu 60 has exactly 61 keys with minimalist ANSI 60% layout', () => {
    const layout = KEYBOARD_LAYOUTS.tofu60;
    expect(layout).toBeDefined();
    expect(layout.model).toBe('tofu60');
    expect(layout.keyCount).toBe(61);
    expect(layout.keys.length).toBe(61);

    expect(layout.dimensions.width).toBe(304.0);
    expect(layout.dimensions.depth).toBe(112.0);
    expect(layout.dimensions.typingAngleDeg).toBe(7.0);

    // Check Esc key
    const esc = layout.keys.find((k) => k.code === 'Escape');
    expect(esc).toBeDefined();
    expect(esc?.unitWidth).toBe(1.0);
  });
});
