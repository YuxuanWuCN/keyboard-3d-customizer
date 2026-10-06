import { KeyDefinition, KeyboardLayoutDefinition, KeyboardModelId } from '../types/keyboard';

// Helper to create keys concisely
function createKey(
  id: string,
  code: string,
  label: string,
  subLabel: string | undefined,
  unitWidth: number,
  row: number,
  gridX: number,
  gridY: number,
  region: KeyDefinition['region'],
  profileRow: KeyDefinition['profileRow'],
  unitHeight: number = 1.0
): KeyDefinition {
  return {
    id,
    code,
    label,
    subLabel,
    unitWidth,
    unitHeight,
    row,
    gridX,
    gridY,
    region,
    profileRow,
  };
}

// ==========================================
// 1. Tofu 60 (61 Keys ANSI)
// ==========================================
function buildTofu60Keys(): KeyDefinition[] {
  const keys: KeyDefinition[] = [];

  // Row 0 (Number Row) - 15U
  const r0 = [
    { code: 'Escape', label: 'ESC', subLabel: '`', w: 1.0, reg: 'accent' },
    { code: 'Digit1', label: '1', subLabel: '!', w: 1.0, reg: 'alphas' },
    { code: 'Digit2', label: '2', subLabel: '@', w: 1.0, reg: 'alphas' },
    { code: 'Digit3', label: '3', subLabel: '#', w: 1.0, reg: 'alphas' },
    { code: 'Digit4', label: '4', subLabel: '$', w: 1.0, reg: 'alphas' },
    { code: 'Digit5', label: '5', subLabel: '%', w: 1.0, reg: 'alphas' },
    { code: 'Digit6', label: '6', subLabel: '^', w: 1.0, reg: 'alphas' },
    { code: 'Digit7', label: '7', subLabel: '&', w: 1.0, reg: 'alphas' },
    { code: 'Digit8', label: '8', subLabel: '*', w: 1.0, reg: 'alphas' },
    { code: 'Digit9', label: '9', subLabel: '(', w: 1.0, reg: 'alphas' },
    { code: 'Digit0', label: '0', subLabel: ')', w: 1.0, reg: 'alphas' },
    { code: 'Minus', label: '-', subLabel: '_', w: 1.0, reg: 'alphas' },
    { code: 'Equal', label: '=', subLabel: '+', w: 1.0, reg: 'alphas' },
    { code: 'Backspace', label: 'BACKSPACE', w: 2.0, reg: 'modifiers' },
  ];
  let curX = 0;
  r0.forEach((k) => {
    keys.push(createKey(k.code, k.code, k.label, k.subLabel, k.w, 0, curX, 0, k.reg as any, 'R1'));
    curX += k.w;
  });

  // Row 1 (Tab / Q-P) - 15U
  const r1 = [
    { code: 'Tab', label: 'TAB', w: 1.5, reg: 'modifiers' },
    { code: 'KeyQ', label: 'Q', w: 1.0, reg: 'alphas' },
    { code: 'KeyW', label: 'W', w: 1.0, reg: 'alphas' },
    { code: 'KeyE', label: 'E', w: 1.0, reg: 'alphas' },
    { code: 'KeyR', label: 'R', w: 1.0, reg: 'alphas' },
    { code: 'KeyT', label: 'T', w: 1.0, reg: 'alphas' },
    { code: 'KeyY', label: 'Y', w: 1.0, reg: 'alphas' },
    { code: 'KeyU', label: 'U', w: 1.0, reg: 'alphas' },
    { code: 'KeyI', label: 'I', w: 1.0, reg: 'alphas' },
    { code: 'KeyO', label: 'O', w: 1.0, reg: 'alphas' },
    { code: 'KeyP', label: 'P', w: 1.0, reg: 'alphas' },
    { code: 'BracketLeft', label: '[', subLabel: '{', w: 1.0, reg: 'alphas' },
    { code: 'BracketRight', label: ']', subLabel: '}', w: 1.0, reg: 'alphas' },
    { code: 'Backslash', label: '\\', subLabel: '|', w: 1.5, reg: 'modifiers' },
  ];
  curX = 0;
  r1.forEach((k) => {
    keys.push(createKey(k.code, k.code, k.label, k.subLabel, k.w, 1, curX, 1, k.reg as any, 'R2'));
    curX += k.w;
  });

  // Row 2 (Caps / A-L) - 15U
  const r2 = [
    { code: 'CapsLock', label: 'CAPS', w: 1.75, reg: 'modifiers' },
    { code: 'KeyA', label: 'A', w: 1.0, reg: 'alphas' },
    { code: 'KeyS', label: 'S', w: 1.0, reg: 'alphas' },
    { code: 'KeyD', label: 'D', w: 1.0, reg: 'alphas' },
    { code: 'KeyF', label: 'F', w: 1.0, reg: 'alphas' },
    { code: 'KeyG', label: 'G', w: 1.0, reg: 'alphas' },
    { code: 'KeyH', label: 'H', w: 1.0, reg: 'alphas' },
    { code: 'KeyJ', label: 'J', w: 1.0, reg: 'alphas' },
    { code: 'KeyK', label: 'K', w: 1.0, reg: 'alphas' },
    { code: 'KeyL', label: 'L', w: 1.0, reg: 'alphas' },
    { code: 'Semicolon', label: ';', subLabel: ':', w: 1.0, reg: 'alphas' },
    { code: 'Quote', label: '\'', subLabel: '"', w: 1.0, reg: 'alphas' },
    { code: 'Enter', label: 'ENTER', w: 2.25, reg: 'accent' },
  ];
  curX = 0;
  r2.forEach((k) => {
    keys.push(createKey(k.code, k.code, k.label, k.subLabel, k.w, 2, curX, 2, k.reg as any, 'R3'));
    curX += k.w;
  });

  // Row 3 (Shift / Z-/) - 15U
  const r3 = [
    { code: 'ShiftLeft', label: 'SHIFT', w: 2.25, reg: 'modifiers' },
    { code: 'KeyZ', label: 'Z', w: 1.0, reg: 'alphas' },
    { code: 'KeyX', label: 'X', w: 1.0, reg: 'alphas' },
    { code: 'KeyC', label: 'C', w: 1.0, reg: 'alphas' },
    { code: 'KeyV', label: 'V', w: 1.0, reg: 'alphas' },
    { code: 'KeyB', label: 'B', w: 1.0, reg: 'alphas' },
    { code: 'KeyN', label: 'N', w: 1.0, reg: 'alphas' },
    { code: 'KeyM', label: 'M', w: 1.0, reg: 'alphas' },
    { code: 'Comma', label: ',', subLabel: '<', w: 1.0, reg: 'alphas' },
    { code: 'Period', label: '.', subLabel: '>', w: 1.0, reg: 'alphas' },
    { code: 'Slash', label: '/', subLabel: '?', w: 1.0, reg: 'alphas' },
    { code: 'ShiftRight', label: 'SHIFT', w: 2.75, reg: 'modifiers' },
  ];
  curX = 0;
  r3.forEach((k) => {
    keys.push(createKey(k.code, k.code, k.label, k.subLabel, k.w, 3, curX, 3, k.reg as any, 'R4'));
    curX += k.w;
  });

  // Row 4 (Bottom Mods & Spacebar) - 15U
  const r4 = [
    { code: 'ControlLeft', label: 'CTRL', w: 1.25, reg: 'modifiers' },
    { code: 'MetaLeft', label: 'WIN', w: 1.25, reg: 'modifiers' },
    { code: 'AltLeft', label: 'ALT', w: 1.25, reg: 'modifiers' },
    { code: 'Space', label: '', w: 6.25, reg: 'accent' },
    { code: 'AltRight', label: 'ALT', w: 1.25, reg: 'modifiers' },
    { code: 'MetaRight', label: 'WIN', w: 1.25, reg: 'modifiers' },
    { code: 'ContextMenu', label: 'MENU', w: 1.25, reg: 'modifiers' },
    { code: 'ControlRight', label: 'CTRL', w: 1.25, reg: 'modifiers' },
  ];
  curX = 0;
  r4.forEach((k) => {
    keys.push(createKey(k.code, k.code, k.label, undefined, k.w, 4, curX, 4, k.reg as any, 'R4'));
    curX += k.w;
  });

  return keys;
}

// ==========================================
// 2. EveningStar 75 (82 Keys Compact Exploded)
// ==========================================
function buildEveningStar75Keys(): KeyDefinition[] {
  const keys: KeyDefinition[] = [];

  // Row 0 (F-Row & Del/PrtSc) - 16 keys total width ~16U
  const r0 = [
    { code: 'Escape', label: 'ESC', w: 1.0, reg: 'accent', x: 0 },
    { code: 'F1', label: 'F1', w: 1.0, reg: 'function', x: 1.25 },
    { code: 'F2', label: 'F2', w: 1.0, reg: 'function', x: 2.25 },
    { code: 'F3', label: 'F3', w: 1.0, reg: 'function', x: 3.25 },
    { code: 'F4', label: 'F4', w: 1.0, reg: 'function', x: 4.25 },
    { code: 'F5', label: 'F5', w: 1.0, reg: 'function', x: 5.5 },
    { code: 'F6', label: 'F6', w: 1.0, reg: 'function', x: 6.5 },
    { code: 'F7', label: 'F7', w: 1.0, reg: 'function', x: 7.5 },
    { code: 'F8', label: 'F8', w: 1.0, reg: 'function', x: 8.5 },
    { code: 'F9', label: 'F9', w: 1.0, reg: 'function', x: 9.75 },
    { code: 'F10', label: 'F10', w: 1.0, reg: 'function', x: 10.75 },
    { code: 'F11', label: 'F11', w: 1.0, reg: 'function', x: 11.75 },
    { code: 'F12', label: 'F12', w: 1.0, reg: 'function', x: 12.75 },
    { code: 'PrintScreen', label: 'PRT', w: 1.0, reg: 'nav', x: 14.0 },
    { code: 'Delete', label: 'DEL', w: 1.0, reg: 'nav', x: 15.0 },
  ];
  r0.forEach((k) => {
    keys.push(createKey(k.code, k.code, k.label, undefined, k.w, 0, k.x, 0, k.reg as any, 'R1'));
  });

  // Row 1 (Number row + Home)
  const r1 = [
    { code: 'Backquote', label: '`', subLabel: '~', w: 1.0, reg: 'alphas', x: 0 },
    { code: 'Digit1', label: '1', subLabel: '!', w: 1.0, reg: 'alphas', x: 1 },
    { code: 'Digit2', label: '2', subLabel: '@', w: 1.0, reg: 'alphas', x: 2 },
    { code: 'Digit3', label: '3', subLabel: '#', w: 1.0, reg: 'alphas', x: 3 },
    { code: 'Digit4', label: '4', subLabel: '$', w: 1.0, reg: 'alphas', x: 4 },
    { code: 'Digit5', label: '5', subLabel: '%', w: 1.0, reg: 'alphas', x: 5 },
    { code: 'Digit6', label: '6', subLabel: '^', w: 1.0, reg: 'alphas', x: 6 },
    { code: 'Digit7', label: '7', subLabel: '&', w: 1.0, reg: 'alphas', x: 7 },
    { code: 'Digit8', label: '8', subLabel: '*', w: 1.0, reg: 'alphas', x: 8 },
    { code: 'Digit9', label: '9', subLabel: '(', w: 1.0, reg: 'alphas', x: 9 },
    { code: 'Digit0', label: '0', subLabel: ')', w: 1.0, reg: 'alphas', x: 10 },
    { code: 'Minus', label: '-', subLabel: '_', w: 1.0, reg: 'alphas', x: 11 },
    { code: 'Equal', label: '=', subLabel: '+', w: 1.0, reg: 'alphas', x: 12 },
    { code: 'Backspace', label: 'BACKSPACE', w: 2.0, reg: 'modifiers', x: 13 },
    { code: 'Home', label: 'HOME', w: 1.0, reg: 'nav', x: 15.25 },
  ];
  r1.forEach((k) => {
    keys.push(createKey(k.code, k.code, k.label, k.subLabel, k.w, 1, k.x, 1, k.reg as any, 'R1'));
  });

  // Row 2 (Tab / Q-P + PgUp)
  const r2 = [
    { code: 'Tab', label: 'TAB', w: 1.5, reg: 'modifiers', x: 0 },
    { code: 'KeyQ', label: 'Q', w: 1.0, reg: 'alphas', x: 1.5 },
    { code: 'KeyW', label: 'W', w: 1.0, reg: 'alphas', x: 2.5 },
    { code: 'KeyE', label: 'E', w: 1.0, reg: 'alphas', x: 3.5 },
    { code: 'KeyR', label: 'R', w: 1.0, reg: 'alphas', x: 4.5 },
    { code: 'KeyT', label: 'T', w: 1.0, reg: 'alphas', x: 5.5 },
    { code: 'KeyY', label: 'Y', w: 1.0, reg: 'alphas', x: 6.5 },
    { code: 'KeyU', label: 'U', w: 1.0, reg: 'alphas', x: 7.5 },
    { code: 'KeyI', label: 'I', w: 1.0, reg: 'alphas', x: 8.5 },
    { code: 'KeyO', label: 'O', w: 1.0, reg: 'alphas', x: 9.5 },
    { code: 'KeyP', label: 'P', w: 1.0, reg: 'alphas', x: 10.5 },
    { code: 'BracketLeft', label: '[', subLabel: '{', w: 1.0, reg: 'alphas', x: 11.5 },
    { code: 'BracketRight', label: ']', subLabel: '}', w: 1.0, reg: 'alphas', x: 12.5 },
    { code: 'Backslash', label: '\\', subLabel: '|', w: 1.5, reg: 'modifiers', x: 13.5 },
    { code: 'PageUp', label: 'PGUP', w: 1.0, reg: 'nav', x: 15.25 },
  ];
  r2.forEach((k) => {
    keys.push(createKey(k.code, k.code, k.label, k.subLabel, k.w, 2, k.x, 2, k.reg as any, 'R2'));
  });

  // Row 3 (Caps / A-L + PgDn)
  const r3 = [
    { code: 'CapsLock', label: 'CAPS', w: 1.75, reg: 'modifiers', x: 0 },
    { code: 'KeyA', label: 'A', w: 1.0, reg: 'alphas', x: 1.75 },
    { code: 'KeyS', label: 'S', w: 1.0, reg: 'alphas', x: 2.75 },
    { code: 'KeyD', label: 'D', w: 1.0, reg: 'alphas', x: 3.75 },
    { code: 'KeyF', label: 'F', w: 1.0, reg: 'alphas', x: 4.75 },
    { code: 'KeyG', label: 'G', w: 1.0, reg: 'alphas', x: 5.75 },
    { code: 'KeyH', label: 'H', w: 1.0, reg: 'alphas', x: 6.75 },
    { code: 'KeyJ', label: 'J', w: 1.0, reg: 'alphas', x: 7.75 },
    { code: 'KeyK', label: 'K', w: 1.0, reg: 'alphas', x: 8.75 },
    { code: 'KeyL', label: 'L', w: 1.0, reg: 'alphas', x: 9.75 },
    { code: 'Semicolon', label: ';', subLabel: ':', w: 1.0, reg: 'alphas', x: 10.75 },
    { code: 'Quote', label: '\'', subLabel: '"', w: 1.0, reg: 'alphas', x: 11.75 },
    { code: 'Enter', label: 'ENTER', w: 2.25, reg: 'accent', x: 12.75 },
    { code: 'PageDown', label: 'PGDN', w: 1.0, reg: 'nav', x: 15.25 },
  ];
  r3.forEach((k) => {
    keys.push(createKey(k.code, k.code, k.label, k.subLabel, k.w, 3, k.x, 3, k.reg as any, 'R3'));
  });

  // Row 4 (Shift / Z-/ + Up + End)
  const r4 = [
    { code: 'ShiftLeft', label: 'SHIFT', w: 2.25, reg: 'modifiers', x: 0 },
    { code: 'KeyZ', label: 'Z', w: 1.0, reg: 'alphas', x: 2.25 },
    { code: 'KeyX', label: 'X', w: 1.0, reg: 'alphas', x: 3.25 },
    { code: 'KeyC', label: 'C', w: 1.0, reg: 'alphas', x: 4.25 },
    { code: 'KeyV', label: 'V', w: 1.0, reg: 'alphas', x: 5.25 },
    { code: 'KeyB', label: 'B', w: 1.0, reg: 'alphas', x: 6.25 },
    { code: 'KeyN', label: 'N', w: 1.0, reg: 'alphas', x: 7.25 },
    { code: 'KeyM', label: 'M', w: 1.0, reg: 'alphas', x: 8.25 },
    { code: 'Comma', label: ',', subLabel: '<', w: 1.0, reg: 'alphas', x: 9.25 },
    { code: 'Period', label: '.', subLabel: '>', w: 1.0, reg: 'alphas', x: 10.25 },
    { code: 'Slash', label: '/', subLabel: '?', w: 1.0, reg: 'alphas', x: 11.25 },
    { code: 'ShiftRight', label: 'SHIFT', w: 1.75, reg: 'modifiers', x: 12.25 },
    { code: 'ArrowUp', label: '▲', w: 1.0, reg: 'nav', x: 14.125 },
    { code: 'End', label: 'END', w: 1.0, reg: 'nav', x: 15.25 },
  ];
  r4.forEach((k) => {
    keys.push(createKey(k.code, k.code, k.label, k.subLabel, k.w, 4, k.x, 4, k.reg as any, 'R4'));
  });

  // Row 5 (Bottom row + Arrows)
  const r5 = [
    { code: 'ControlLeft', label: 'CTRL', w: 1.25, reg: 'modifiers', x: 0 },
    { code: 'MetaLeft', label: 'WIN', w: 1.25, reg: 'modifiers', x: 1.25 },
    { code: 'AltLeft', label: 'ALT', w: 1.25, reg: 'modifiers', x: 2.5 },
    { code: 'Space', label: '', w: 6.25, reg: 'accent', x: 3.75 },
    { code: 'AltRight', label: 'ALT', w: 1.25, reg: 'modifiers', x: 10.0 },
    { code: 'Fn', label: 'FN', w: 1.25, reg: 'modifiers', x: 11.25 },
    { code: 'ArrowLeft', label: '◄', w: 1.0, reg: 'nav', x: 13.0 },
    { code: 'ArrowDown', label: '▼', w: 1.0, reg: 'nav', x: 14.125 },
    { code: 'ArrowRight', label: '►', w: 1.0, reg: 'nav', x: 15.25 },
  ];
  r5.forEach((k) => {
    keys.push(createKey(k.code, k.code, k.label, undefined, k.w, 5, k.x, 5, k.reg as any, 'R4'));
  });

  // Total keys: 15 + 15 + 15 + 14 + 14 + 9 = 82 keys
  return keys;
}

// ==========================================
// 3. Mr. Suit 80 (87 Keys TKL ANSI)
// ==========================================
function buildMrSuit80Keys(): KeyDefinition[] {
  const keys: KeyDefinition[] = [];

  // Row 0 (F-Row + Nav Cluster Top) - 16 keys
  const r0 = [
    { code: 'Escape', label: 'ESC', w: 1.0, reg: 'accent', x: 0 },
    { code: 'F1', label: 'F1', w: 1.0, reg: 'function', x: 2.0 },
    { code: 'F2', label: 'F2', w: 1.0, reg: 'function', x: 3.0 },
    { code: 'F3', label: 'F3', w: 1.0, reg: 'function', x: 4.0 },
    { code: 'F4', label: 'F4', w: 1.0, reg: 'function', x: 5.0 },
    { code: 'F5', label: 'F5', w: 1.0, reg: 'function', x: 6.5 },
    { code: 'F6', label: 'F6', w: 1.0, reg: 'function', x: 7.5 },
    { code: 'F7', label: 'F7', w: 1.0, reg: 'function', x: 8.5 },
    { code: 'F8', label: 'F8', w: 1.0, reg: 'function', x: 9.5 },
    { code: 'F9', label: 'F9', w: 1.0, reg: 'function', x: 11.0 },
    { code: 'F10', label: 'F10', w: 1.0, reg: 'function', x: 12.0 },
    { code: 'F11', label: 'F11', w: 1.0, reg: 'function', x: 13.0 },
    { code: 'F12', label: 'F12', w: 1.0, reg: 'function', x: 14.0 },
    { code: 'PrintScreen', label: 'PRT', w: 1.0, reg: 'nav', x: 15.5 },
    { code: 'ScrollLock', label: 'SCRLK', w: 1.0, reg: 'nav', x: 16.5 },
    { code: 'Pause', label: 'PAUSE', w: 1.0, reg: 'nav', x: 17.5 },
  ];
  r0.forEach((k) => {
    keys.push(createKey(k.code, k.code, k.label, undefined, k.w, 0, k.x, 0, k.reg as any, 'R1'));
  });

  // Row 1 (Number row + Ins/Home/PgUp) - 17 keys
  const r1 = [
    { code: 'Backquote', label: '`', subLabel: '~', w: 1.0, reg: 'alphas', x: 0 },
    { code: 'Digit1', label: '1', subLabel: '!', w: 1.0, reg: 'alphas', x: 1 },
    { code: 'Digit2', label: '2', subLabel: '@', w: 1.0, reg: 'alphas', x: 2 },
    { code: 'Digit3', label: '3', subLabel: '#', w: 1.0, reg: 'alphas', x: 3 },
    { code: 'Digit4', label: '4', subLabel: '$', w: 1.0, reg: 'alphas', x: 4 },
    { code: 'Digit5', label: '5', subLabel: '%', w: 1.0, reg: 'alphas', x: 5 },
    { code: 'Digit6', label: '6', subLabel: '^', w: 1.0, reg: 'alphas', x: 6 },
    { code: 'Digit7', label: '7', subLabel: '&', w: 1.0, reg: 'alphas', x: 7 },
    { code: 'Digit8', label: '8', subLabel: '*', w: 1.0, reg: 'alphas', x: 8 },
    { code: 'Digit9', label: '9', subLabel: '(', w: 1.0, reg: 'alphas', x: 9 },
    { code: 'Digit0', label: '0', subLabel: ')', w: 1.0, reg: 'alphas', x: 10 },
    { code: 'Minus', label: '-', subLabel: '_', w: 1.0, reg: 'alphas', x: 11 },
    { code: 'Equal', label: '=', subLabel: '+', w: 1.0, reg: 'alphas', x: 12 },
    { code: 'Backspace', label: 'BACKSPACE', w: 2.0, reg: 'modifiers', x: 13 },
    { code: 'Insert', label: 'INS', w: 1.0, reg: 'nav', x: 15.5 },
    { code: 'Home', label: 'HOME', w: 1.0, reg: 'nav', x: 16.5 },
    { code: 'PageUp', label: 'PGUP', w: 1.0, reg: 'nav', x: 17.5 },
  ];
  r1.forEach((k) => {
    keys.push(createKey(k.code, k.code, k.label, k.subLabel, k.w, 1, k.x, 1.25, k.reg as any, 'R1'));
  });

  // Row 2 (Tab / Q-P + Del/End/PgDn) - 17 keys
  const r2 = [
    { code: 'Tab', label: 'TAB', w: 1.5, reg: 'modifiers', x: 0 },
    { code: 'KeyQ', label: 'Q', w: 1.0, reg: 'alphas', x: 1.5 },
    { code: 'KeyW', label: 'W', w: 1.0, reg: 'alphas', x: 2.5 },
    { code: 'KeyE', label: 'E', w: 1.0, reg: 'alphas', x: 3.5 },
    { code: 'KeyR', label: 'R', w: 1.0, reg: 'alphas', x: 4.5 },
    { code: 'KeyT', label: 'T', w: 1.0, reg: 'alphas', x: 5.5 },
    { code: 'KeyY', label: 'Y', w: 1.0, reg: 'alphas', x: 6.5 },
    { code: 'KeyU', label: 'U', w: 1.0, reg: 'alphas', x: 7.5 },
    { code: 'KeyI', label: 'I', w: 1.0, reg: 'alphas', x: 8.5 },
    { code: 'KeyO', label: 'O', w: 1.0, reg: 'alphas', x: 9.5 },
    { code: 'KeyP', label: 'P', w: 1.0, reg: 'alphas', x: 10.5 },
    { code: 'BracketLeft', label: '[', subLabel: '{', w: 1.0, reg: 'alphas', x: 11.5 },
    { code: 'BracketRight', label: ']', subLabel: '}', w: 1.0, reg: 'alphas', x: 12.5 },
    { code: 'Backslash', label: '\\', subLabel: '|', w: 1.5, reg: 'modifiers', x: 13.5 },
    { code: 'Delete', label: 'DEL', w: 1.0, reg: 'nav', x: 15.5 },
    { code: 'End', label: 'END', w: 1.0, reg: 'nav', x: 16.5 },
    { code: 'PageDown', label: 'PGDN', w: 1.0, reg: 'nav', x: 17.5 },
  ];
  r2.forEach((k) => {
    keys.push(createKey(k.code, k.code, k.label, k.subLabel, k.w, 2, k.x, 2.25, k.reg as any, 'R2'));
  });

  // Row 3 (Caps / A-L) - 13 keys
  const r3 = [
    { code: 'CapsLock', label: 'CAPS', w: 1.75, reg: 'modifiers', x: 0 },
    { code: 'KeyA', label: 'A', w: 1.0, reg: 'alphas', x: 1.75 },
    { code: 'KeyS', label: 'S', w: 1.0, reg: 'alphas', x: 2.75 },
    { code: 'KeyD', label: 'D', w: 1.0, reg: 'alphas', x: 3.75 },
    { code: 'KeyF', label: 'F', w: 1.0, reg: 'alphas', x: 4.75 },
    { code: 'KeyG', label: 'G', w: 1.0, reg: 'alphas', x: 5.75 },
    { code: 'KeyH', label: 'H', w: 1.0, reg: 'alphas', x: 6.75 },
    { code: 'KeyJ', label: 'J', w: 1.0, reg: 'alphas', x: 7.75 },
    { code: 'KeyK', label: 'K', w: 1.0, reg: 'alphas', x: 8.75 },
    { code: 'KeyL', label: 'L', w: 1.0, reg: 'alphas', x: 9.75 },
    { code: 'Semicolon', label: ';', subLabel: ':', w: 1.0, reg: 'alphas', x: 10.75 },
    { code: 'Quote', label: '\'', subLabel: '"', w: 1.0, reg: 'alphas', x: 11.75 },
    { code: 'Enter', label: 'ENTER', w: 2.25, reg: 'accent', x: 12.75 },
  ];
  r3.forEach((k) => {
    keys.push(createKey(k.code, k.code, k.label, k.subLabel, k.w, 3, k.x, 3.25, k.reg as any, 'R3'));
  });

  // Row 4 (Shift / Z-/ + Up) - 13 keys
  const r4 = [
    { code: 'ShiftLeft', label: 'SHIFT', w: 2.25, reg: 'modifiers', x: 0 },
    { code: 'KeyZ', label: 'Z', w: 1.0, reg: 'alphas', x: 2.25 },
    { code: 'KeyX', label: 'X', w: 1.0, reg: 'alphas', x: 3.25 },
    { code: 'KeyC', label: 'C', w: 1.0, reg: 'alphas', x: 4.25 },
    { code: 'KeyV', label: 'V', w: 1.0, reg: 'alphas', x: 5.25 },
    { code: 'KeyB', label: 'B', w: 1.0, reg: 'alphas', x: 6.25 },
    { code: 'KeyN', label: 'N', w: 1.0, reg: 'alphas', x: 7.25 },
    { code: 'KeyM', label: 'M', w: 1.0, reg: 'alphas', x: 8.25 },
    { code: 'Comma', label: ',', subLabel: '<', w: 1.0, reg: 'alphas', x: 9.25 },
    { code: 'Period', label: '.', subLabel: '>', w: 1.0, reg: 'alphas', x: 10.25 },
    { code: 'Slash', label: '/', subLabel: '?', w: 1.0, reg: 'alphas', x: 11.25 },
    { code: 'ShiftRight', label: 'SHIFT', w: 2.75, reg: 'modifiers', x: 12.25 },
    { code: 'ArrowUp', label: '▲', w: 1.0, reg: 'nav', x: 16.5 },
  ];
  r4.forEach((k) => {
    keys.push(createKey(k.code, k.code, k.label, k.subLabel, k.w, 4, k.x, 4.25, k.reg as any, 'R4'));
  });

  // Row 5 (Bottom Row + Left/Down/Right) - 11 keys
  const r5 = [
    { code: 'ControlLeft', label: 'CTRL', w: 1.25, reg: 'modifiers', x: 0 },
    { code: 'MetaLeft', label: 'WIN', w: 1.25, reg: 'modifiers', x: 1.25 },
    { code: 'AltLeft', label: 'ALT', w: 1.25, reg: 'modifiers', x: 2.5 },
    { code: 'Space', label: '', w: 6.25, reg: 'accent', x: 3.75 },
    { code: 'AltRight', label: 'ALT', w: 1.25, reg: 'modifiers', x: 10.0 },
    { code: 'MetaRight', label: 'WIN', w: 1.25, reg: 'modifiers', x: 11.25 },
    { code: 'ContextMenu', label: 'MENU', w: 1.25, reg: 'modifiers', x: 12.5 },
    { code: 'ControlRight', label: 'CTRL', w: 1.25, reg: 'modifiers', x: 13.75 },
    { code: 'ArrowLeft', label: '◄', w: 1.0, reg: 'nav', x: 15.5 },
    { code: 'ArrowDown', label: '▼', w: 1.0, reg: 'nav', x: 16.5 },
    { code: 'ArrowRight', label: '►', w: 1.0, reg: 'nav', x: 17.5 },
  ];
  r5.forEach((k) => {
    keys.push(createKey(k.code, k.code, k.label, undefined, k.w, 5, k.x, 5.25, k.reg as any, 'R4'));
  });

  // Total keys: 16 + 17 + 17 + 13 + 13 + 11 = 87 keys
  return keys;
}

// ==========================================
// 4. Bakeneko 65 (67 Keys ANSI 65% Compact)
// ==========================================
function buildBakeneko65Keys(): KeyDefinition[] {
  const keys: KeyDefinition[] = [];

  // Row 0 (Number Row + Del) - 16U (15 keys)
  const r0 = [
    { code: 'Escape', label: 'ESC', subLabel: '`', w: 1.0, reg: 'accent', x: 0 },
    { code: 'Digit1', label: '1', subLabel: '!', w: 1.0, reg: 'alphas', x: 1.0 },
    { code: 'Digit2', label: '2', subLabel: '@', w: 1.0, reg: 'alphas', x: 2.0 },
    { code: 'Digit3', label: '3', subLabel: '#', w: 1.0, reg: 'alphas', x: 3.0 },
    { code: 'Digit4', label: '4', subLabel: '$', w: 1.0, reg: 'alphas', x: 4.0 },
    { code: 'Digit5', label: '5', subLabel: '%', w: 1.0, reg: 'alphas', x: 5.0 },
    { code: 'Digit6', label: '6', subLabel: '^', w: 1.0, reg: 'alphas', x: 6.0 },
    { code: 'Digit7', label: '7', subLabel: '&', w: 1.0, reg: 'alphas', x: 7.0 },
    { code: 'Digit8', label: '8', subLabel: '*', w: 1.0, reg: 'alphas', x: 8.0 },
    { code: 'Digit9', label: '9', subLabel: '(', w: 1.0, reg: 'alphas', x: 9.0 },
    { code: 'Digit0', label: '0', subLabel: ')', w: 1.0, reg: 'alphas', x: 10.0 },
    { code: 'Minus', label: '-', subLabel: '_', w: 1.0, reg: 'alphas', x: 11.0 },
    { code: 'Equal', label: '=', subLabel: '+', w: 1.0, reg: 'alphas', x: 12.0 },
    { code: 'Backspace', label: 'BACKSPACE', w: 2.0, reg: 'modifiers', x: 13.0 },
    { code: 'Delete', label: 'DEL', w: 1.0, reg: 'nav', x: 15.0 },
  ];
  r0.forEach((k) => {
    keys.push(createKey(k.code, k.code, k.label, k.subLabel, k.w, 0, k.x, 0, k.reg as any, 'R1'));
  });

  // Row 1 (QWERTY + PgUp) - 16U (15 keys)
  const r1 = [
    { code: 'Tab', label: 'TAB', w: 1.5, reg: 'modifiers', x: 0 },
    { code: 'KeyQ', label: 'Q', w: 1.0, reg: 'alphas', x: 1.5 },
    { code: 'KeyW', label: 'W', w: 1.0, reg: 'alphas', x: 2.5 },
    { code: 'KeyE', label: 'E', w: 1.0, reg: 'alphas', x: 3.5 },
    { code: 'KeyR', label: 'R', w: 1.0, reg: 'alphas', x: 4.5 },
    { code: 'KeyT', label: 'T', w: 1.0, reg: 'alphas', x: 5.5 },
    { code: 'KeyY', label: 'Y', w: 1.0, reg: 'alphas', x: 6.5 },
    { code: 'KeyU', label: 'U', w: 1.0, reg: 'alphas', x: 7.5 },
    { code: 'KeyI', label: 'I', w: 1.0, reg: 'alphas', x: 8.5 },
    { code: 'KeyO', label: 'O', w: 1.0, reg: 'alphas', x: 9.5 },
    { code: 'KeyP', label: 'P', w: 1.0, reg: 'alphas', x: 10.5 },
    { code: 'BracketLeft', label: '[', subLabel: '{', w: 1.0, reg: 'alphas', x: 11.5 },
    { code: 'BracketRight', label: ']', subLabel: '}', w: 1.0, reg: 'alphas', x: 12.5 },
    { code: 'Backslash', label: '\\', subLabel: '|', w: 1.5, reg: 'alphas', x: 13.5 },
    { code: 'PageUp', label: 'PGUP', w: 1.0, reg: 'nav', x: 15.0 },
  ];
  r1.forEach((k) => {
    keys.push(createKey(k.code, k.code, k.label, k.subLabel, k.w, 1, k.x, 1.0, k.reg as any, 'R2'));
  });

  // Row 2 (ASDF + PgDn) - 16U (14 keys)
  const r2 = [
    { code: 'CapsLock', label: 'CAPS', w: 1.75, reg: 'modifiers', x: 0 },
    { code: 'KeyA', label: 'A', w: 1.0, reg: 'alphas', x: 1.75 },
    { code: 'KeyS', label: 'S', w: 1.0, reg: 'alphas', x: 2.75 },
    { code: 'KeyD', label: 'D', w: 1.0, reg: 'alphas', x: 3.75 },
    { code: 'KeyF', label: 'F', w: 1.0, reg: 'alphas', x: 4.75 },
    { code: 'KeyG', label: 'G', w: 1.0, reg: 'alphas', x: 5.75 },
    { code: 'KeyH', label: 'H', w: 1.0, reg: 'alphas', x: 6.75 },
    { code: 'KeyJ', label: 'J', w: 1.0, reg: 'alphas', x: 7.75 },
    { code: 'KeyK', label: 'K', w: 1.0, reg: 'alphas', x: 8.75 },
    { code: 'KeyL', label: 'L', w: 1.0, reg: 'alphas', x: 9.75 },
    { code: 'Semicolon', label: ';', subLabel: ':', w: 1.0, reg: 'alphas', x: 10.75 },
    { code: 'Quote', label: '\'', subLabel: '"', w: 1.0, reg: 'alphas', x: 11.75 },
    { code: 'Enter', label: 'ENTER', w: 2.25, reg: 'accent', x: 12.75 },
    { code: 'PageDown', label: 'PGDN', w: 1.0, reg: 'nav', x: 15.0 },
  ];
  r2.forEach((k) => {
    keys.push(createKey(k.code, k.code, k.label, k.subLabel, k.w, 2, k.x, 2.0, k.reg as any, 'R3'));
  });

  // Row 3 (ZXCV + Up + End) - 16U (14 keys)
  const r3 = [
    { code: 'ShiftLeft', label: 'SHIFT', w: 2.25, reg: 'modifiers', x: 0 },
    { code: 'KeyZ', label: 'Z', w: 1.0, reg: 'alphas', x: 2.25 },
    { code: 'KeyX', label: 'X', w: 1.0, reg: 'alphas', x: 3.25 },
    { code: 'KeyC', label: 'C', w: 1.0, reg: 'alphas', x: 4.25 },
    { code: 'KeyV', label: 'V', w: 1.0, reg: 'alphas', x: 5.25 },
    { code: 'KeyB', label: 'B', w: 1.0, reg: 'alphas', x: 6.25 },
    { code: 'KeyN', label: 'N', w: 1.0, reg: 'alphas', x: 7.25 },
    { code: 'KeyM', label: 'M', w: 1.0, reg: 'alphas', x: 8.25 },
    { code: 'Comma', label: ',', subLabel: '<', w: 1.0, reg: 'alphas', x: 9.25 },
    { code: 'Period', label: '.', subLabel: '>', w: 1.0, reg: 'alphas', x: 10.25 },
    { code: 'Slash', label: '/', subLabel: '?', w: 1.0, reg: 'alphas', x: 11.25 },
    { code: 'ShiftRight', label: 'SHIFT', w: 1.75, reg: 'modifiers', x: 12.25 },
    { code: 'ArrowUp', label: '▲', w: 1.0, reg: 'nav', x: 14.0 },
    { code: 'End', label: 'END', w: 1.0, reg: 'nav', x: 15.0 },
  ];
  r3.forEach((k) => {
    keys.push(createKey(k.code, k.code, k.label, k.subLabel, k.w, 3, k.x, 3.0, k.reg as any, 'R4'));
  });

  // Row 4 (Bottom Row + Left/Down/Right) - 16U (9 keys with 0.5U blocker)
  const r4 = [
    { code: 'ControlLeft', label: 'CTRL', w: 1.25, reg: 'modifiers', x: 0 },
    { code: 'MetaLeft', label: 'WIN', w: 1.25, reg: 'modifiers', x: 1.25 },
    { code: 'AltLeft', label: 'ALT', w: 1.25, reg: 'modifiers', x: 2.5 },
    { code: 'Space', label: '', w: 6.25, reg: 'accent', x: 3.75 },
    { code: 'AltRight', label: 'ALT', w: 1.25, reg: 'modifiers', x: 10.0 },
    { code: 'Fn', label: 'FN', w: 1.25, reg: 'modifiers', x: 11.25 },
    // 0.5U blocker gap (12.5 to 13.0)
    { code: 'ArrowLeft', label: '◄', w: 1.0, reg: 'nav', x: 13.0 },
    { code: 'ArrowDown', label: '▼', w: 1.0, reg: 'nav', x: 14.0 },
    { code: 'ArrowRight', label: '►', w: 1.0, reg: 'nav', x: 15.0 },
  ];
  r4.forEach((k) => {
    keys.push(createKey(k.code, k.code, k.label, undefined, k.w, 4, k.x, 4.0, k.reg as any, 'R4'));
  });

  return keys;
}

// ==========================================
// Layout Definitions Registry
// ==========================================
export const KEYBOARD_LAYOUTS: Record<KeyboardModelId, KeyboardLayoutDefinition> = {
  eveningstar75: {
    model: 'eveningstar75',
    name: 'EveningStar 75 (晚星 75)',
    keyCount: 82,
    dimensions: {
      width: 318.0,
      depth: 138.5,
      frontHeight: 19.5,
      rearHeight: 36.5,
      typingAngleDeg: 7.0,
      bezelWidth: 4.5,
    },
    keys: buildEveningStar75Keys(),
  },
  mrsuit80: {
    model: 'mrsuit80',
    name: 'Mr. Suit 80 (西装 80)',
    keyCount: 87,
    dimensions: {
      width: 362.5,
      depth: 142.0,
      frontHeight: 18.8,
      rearHeight: 35.8,
      typingAngleDeg: 6.8,
      bezelWidth: 5.0,
    },
    keys: buildMrSuit80Keys(),
  },
  tofu60: {
    model: 'tofu60',
    name: 'Tofu 60 (豆腐 60)',
    keyCount: 61,
    dimensions: {
      width: 304.0,
      depth: 112.0,
      frontHeight: 20.0,
      rearHeight: 33.0,
      typingAngleDeg: 7.0,
      bezelWidth: 7.0,
    },
    keys: buildTofu60Keys(),
  },
  bakeneko65: {
    model: 'bakeneko65',
    name: 'Bakeneko 65 (化猫 65)',
    keyCount: 67,
    dimensions: {
      width: 315.0,
      depth: 112.0,
      frontHeight: 18.2,
      rearHeight: 31.8,
      typingAngleDeg: 6.0,
      bezelWidth: 4.8,
    },
    keys: buildBakeneko65Keys(),
  },
};
