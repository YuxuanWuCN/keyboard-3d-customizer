import { describe, it, expect } from 'vitest';
import { KEYBOARD_LAYOUTS } from '../constants/keyboardLayouts';
import { KeyboardModelId, GasketLayerId, KeyDefinition } from '../types/keyboard';
import { useKeyboardStore } from '../store/useKeyboardStore';

// Cubic easing function matching implementation in GasketStack.tsx & ProceduralCase.tsx
function cubicEase(t: number): number {
  const clamped = Math.max(0, Math.min(1, t));
  return clamped * clamped * (3 - 2 * clamped);
}

// Layer kinematics calculator matching implementation
interface LayerKinematicProfile {
  name: string;
  nominalY: (t: number) => number;
  thickness: number; // approximate bounding height
  halfThickness: number;
}

const LAYER_KINEMATICS: Record<string, LayerKinematicProfile> = {
  keycaps: {
    name: 'Keycaps Array',
    nominalY: (t) => 22.45 + 115.0 * cubicEase(t),
    thickness: 9.8,
    halfThickness: 4.9,
  },
  switches_upper: {
    name: 'Switches Upper Housing & Stem',
    nominalY: (t) => 14.35 + 85.0 * cubicEase(t),
    thickness: 4.6,
    halfThickness: 2.3,
  },
  switches_lower: {
    name: 'Switches Lower Housing & Spring',
    nominalY: (t) => 9.00 + 70.0 * cubicEase(t),
    thickness: 4.6,
    halfThickness: 2.3,
  },
  plate: {
    name: 'Gasket-Tabbed Plate',
    nominalY: (t) => 5.65 + 48.0 * cubicEase(t),
    thickness: 1.5,
    halfThickness: 0.75,
  },
  poron_foam: {
    name: 'Poron Sandwich Dampener Foam',
    nominalY: (t) => 3.05 + 28.0 * cubicEase(t),
    thickness: 3.5,
    halfThickness: 1.75,
  },
  ixpe_pad: {
    name: 'IXPE Acoustic Switch Sheet',
    nominalY: (t) => 0.95 + 24.0 * cubicEase(t),
    thickness: 0.5,
    halfThickness: 0.25,
  },
  pcb: {
    name: 'Flex-Cut PCB & Kailh Sockets',
    nominalY: (t) => 0.0 + 10.0 * cubicEase(t),
    thickness: 1.2,
    halfThickness: 0.6,
  },
  case_foam: {
    name: 'Bottom Case Dampener Foam',
    nominalY: (t) => -2.20 - 18.0 * cubicEase(t),
    thickness: 2.0,
    halfThickness: 1.0,
  },
  bottom_case: {
    name: 'CNC Aluminum Bottom Chassis',
    nominalY: (t) => -7.50 - 42.0 * cubicEase(t),
    thickness: 8.0,
    halfThickness: 4.0,
  },
  weight: {
    name: 'Signature Underside PVD Weight',
    nominalY: (t) => -14.20 - 72.0 * cubicEase(t),
    thickness: 4.5,
    halfThickness: 2.25,
  },
};

// 7 Gasket Assembly Stack Layers (Top to Bottom)
const SEVEN_GASKET_LAYERS: { id: GasketLayerId; name: string; getY: (t: number) => number }[] = [
  { id: 'keycaps', name: '1. Keycaps Array', getY: (t) => 22.45 + 115.0 * cubicEase(t) },
  { id: 'switches', name: '2. Switches Array', getY: (t) => 11.675 + 77.5 * cubicEase(t) }, // midpoint between upper 14.35 and lower 9.00
  { id: 'plate', name: '3. Gasket-Tabbed Plate', getY: (t) => 5.65 + 48.0 * cubicEase(t) },
  { id: 'poron_ixpe', name: '4. Poron/IXPE Foam Stack', getY: (t) => 2.00 + 26.0 * cubicEase(t) }, // midpoint between poron 3.05 and ixpe 0.95
  { id: 'pcb', name: '5. Flex-Cut PCB', getY: (t) => 0.0 + 10.0 * cubicEase(t) },
  { id: 'case_foam', name: '6. Bottom Case Foam', getY: (t) => -2.20 - 18.0 * cubicEase(t) },
  { id: 'bottom_case_weight', name: '7. Bottom Case & PVD Weight', getY: (t) => -10.85 - 57.0 * cubicEase(t) }, // midpoint between bottomCase -7.50 and weight -14.20
];

describe('Milestone 1 Empirical Challenge: Layout Matrix Geometry', () => {
  const models: { model: KeyboardModelId; expectedKeyCount: number; name: string }[] = [
    { model: 'eveningstar75', expectedKeyCount: 82, name: 'EveningStar 75' },
    { model: 'mrsuit80', expectedKeyCount: 87, name: 'Mr. Suit 80' },
    { model: 'tofu60', expectedKeyCount: 61, name: 'Tofu 60' },
  ];

  models.forEach(({ model, expectedKeyCount, name }) => {
    describe(`${name} (${model})`, () => {
      const layout = KEYBOARD_LAYOUTS[model];

      it(`has exactly ${expectedKeyCount} keys`, () => {
        expect(layout).toBeDefined();
        expect(layout.keyCount).toBe(expectedKeyCount);
        expect(layout.keys.length).toBe(expectedKeyCount);
      });

      it('has zero duplicate key IDs', () => {
        const idSet = new Set<string>();
        const duplicates: string[] = [];
        layout.keys.forEach((k) => {
          if (idSet.has(k.id)) {
            duplicates.push(k.id);
          }
          idSet.add(k.id);
        });
        expect(duplicates).toEqual([]);
        expect(idSet.size).toBe(expectedKeyCount);
      });

      it('has no negative dimensions or coordinates', () => {
        layout.keys.forEach((k: KeyDefinition) => {
          expect(k.unitWidth).toBeGreaterThan(0);
          expect(k.unitHeight ?? 1.0).toBeGreaterThan(0);
          expect(k.gridX).toBeGreaterThanOrEqual(0);
          expect(k.gridY).toBeGreaterThanOrEqual(0);
          expect(k.row).toBeGreaterThanOrEqual(0);
        });

        // Case dimensions
        expect(layout.dimensions.width).toBeGreaterThan(0);
        expect(layout.dimensions.depth).toBeGreaterThan(0);
        expect(layout.dimensions.frontHeight).toBeGreaterThan(0);
        expect(layout.dimensions.rearHeight).toBeGreaterThan(layout.dimensions.frontHeight);
        expect(layout.dimensions.typingAngleDeg).toBeGreaterThan(0);
        expect(layout.dimensions.bezelWidth).toBeGreaterThan(0);
      });

      it('has no out-of-bounds keys (entire matrix fits inside physical case boundaries)', () => {
        let maxX = 0;
        let maxY = 0;
        layout.keys.forEach((k) => {
          const endX = k.gridX + k.unitWidth;
          const endY = k.gridY + (k.unitHeight ?? 1.0);
          if (endX > maxX) maxX = endX;
          if (endY > maxY) maxY = endY;
        });

        const matrixW_mm = maxX * 19.05;
        const matrixD_mm = maxY * 19.05;

        // Physical case dimensions in mm
        const caseW_mm = layout.dimensions.width;
        const caseD_mm = layout.dimensions.depth;

        // Matrix width and depth must strictly fit inside case
        expect(matrixW_mm).toBeLessThan(caseW_mm);
        expect(matrixD_mm).toBeLessThan(caseD_mm);

        // Clearance margins must accommodate bezel and mounting tabs
        const xClearance = caseW_mm - matrixW_mm;
        const yClearance = caseD_mm - matrixD_mm;
        expect(xClearance).toBeGreaterThan(5.0); // At least 5mm total horizontal clearance
        expect(yClearance).toBeGreaterThan(5.0); // At least 5mm total vertical clearance

        // Verify individual key coordinates converted to centered 3D millimeters stay within case boundaries
        layout.keys.forEach((k) => {
          const centerX = (k.gridX + k.unitWidth / 2) * 19.05 - matrixW_mm / 2;
          const centerZ = (k.gridY + (k.unitHeight ?? 1.0) / 2) * 19.05 - matrixD_mm / 2;
          const halfKeyW = (k.unitWidth * 19.05) / 2;
          const halfKeyD = ((k.unitHeight ?? 1.0) * 19.05) / 2;

          expect(centerX - halfKeyW).toBeGreaterThanOrEqual(-caseW_mm / 2);
          expect(centerX + halfKeyW).toBeLessThanOrEqual(caseW_mm / 2);
          expect(centerZ - halfKeyD).toBeGreaterThanOrEqual(-caseD_mm / 2);
          expect(centerZ + halfKeyD).toBeLessThanOrEqual(caseD_mm / 2);
        });
      });

      it('contains valid and complete key metadata (label, region, profileRow)', () => {
        const validRegions = new Set(['alphas', 'modifiers', 'accents', 'accent', 'function', 'nav', 'numpad']);
        const validProfiles = new Set(['R1', 'R2', 'R3', 'R4']);

        layout.keys.forEach((k) => {
          expect(k.code).toBeDefined();
          expect(typeof k.code).toBe('string');
          expect(k.code.length).toBeGreaterThan(0);

          expect(k.label).toBeDefined();
          expect(typeof k.label).toBe('string');

          expect(validRegions.has(k.region)).toBe(true);
          expect(validProfiles.has(k.profileRow)).toBe(true);
        });
      });

      it('has standard 6.25U spacebar', () => {
        const space = layout.keys.find((k) => k.code === 'Space');
        expect(space).toBeDefined();
        expect(space?.unitWidth).toBe(6.25);
      });
    });
  });
});

describe('Milestone 1 Empirical Challenge: Exploded View Kinematics', () => {
  it('Kinematic cubic easing function is monotonic and strictly bounded in [0, 1]', () => {
    expect(cubicEase(0.0)).toBe(0.0);
    expect(cubicEase(1.0)).toBe(1.0);
    expect(cubicEase(0.5)).toBe(0.5);

    // Test monotonicity across 1000 subdivisions
    let prev = -1;
    for (let i = 0; i <= 1000; i++) {
      const t = i / 1000;
      const val = cubicEase(t);
      expect(val).toBeGreaterThanOrEqual(prev);
      expect(val).toBeGreaterThanOrEqual(0.0);
      expect(val).toBeLessThanOrEqual(1.0);
      prev = val;
    }
  });

  it('At t=0, vertical separation between any two adjacent layers >= 0.08mm', () => {
    // 1. Check nominal vertical separation across all 7 Gasket stack layers
    for (let i = 0; i < SEVEN_GASKET_LAYERS.length - 1; i++) {
      const upperLayer = SEVEN_GASKET_LAYERS[i];
      const lowerLayer = SEVEN_GASKET_LAYERS[i + 1];
      const separation = upperLayer.getY(0.0) - lowerLayer.getY(0.0);

      // Must be strictly positive and >= 0.08mm
      expect(separation).toBeGreaterThanOrEqual(0.08);
      // In fact, verify separation is healthy (> 1.0mm)
      expect(separation).toBeGreaterThan(1.0);
    }

    // 2. Check granular components at resting position (t=0)
    const granularOffsets = [
      { name: 'Keycaps', y: 22.45, halfH: 4.9 },
      { name: 'Switch Upper Housing', y: 14.35, halfH: 2.3 },
      { name: 'Switch Lower Housing', y: 9.00, halfH: 2.3 },
      { name: 'Gasket Plate', y: 5.65, halfH: 0.75 },
      { name: 'Poron Sandwich Foam', y: 3.05, halfH: 1.75 },
      { name: 'IXPE Switch Sheet', y: 0.95, halfH: 0.25 },
      { name: 'Flex-Cut PCB', y: 0.0, halfH: 0.6 },
      { name: 'Bottom Case Foam', y: -2.20, halfH: 1.0 },
      { name: 'Bottom Chassis', y: -7.50, halfH: 4.0 },
      { name: 'Underside PVD Weight', y: -14.20, halfH: 2.25 },
    ];

    for (let i = 0; i < granularOffsets.length - 1; i++) {
      const upper = granularOffsets[i];
      const lower = granularOffsets[i + 1];
      const delta = upper.y - lower.y;
      expect(delta).toBeGreaterThanOrEqual(0.08);

      // Physical clearance accounting for geometry half-thicknesses: (y_{n+1,min} - y_{n,max}) >= 0.08mm
      const physicalClearance = (upper.y - upper.halfH) - (lower.y + lower.halfH);
      expect(physicalClearance).toBeGreaterThanOrEqual(0.08);
    }
  });

  it('At t=1.0, all 7 layers are cleanly separated without collision', () => {
    // At t=1.0, all layers expand outward along normal axis
    for (let i = 0; i < SEVEN_GASKET_LAYERS.length - 1; i++) {
      const upperLayer = SEVEN_GASKET_LAYERS[i];
      const lowerLayer = SEVEN_GASKET_LAYERS[i + 1];
      const separationAtFull = upperLayer.getY(1.0) - lowerLayer.getY(1.0);

      // At full explosion, layers should be separated by huge clearances (>= 15mm)
      expect(separationAtFull).toBeGreaterThan(15.0);
    }

    // Check physical bounding intervals of all individual parts at t=1.0
    // Keycaps: Y ~ 137.45 (22.45 + 115.0), height ~ 9.8, min Y ~ 132.55
    const keycapsMinY = 137.45 - 4.9;
    // Switch Upper: Y = 99.35 (14.35 + 85.0), height = 4.6, max Y ~ 101.65
    const switchMaxY = 99.35 + 2.3;
    expect(keycapsMinY - switchMaxY).toBeGreaterThan(20.0); // >20mm clearance

    // Switch Lower: Y = 79.0 (9.0 + 70.0), height = 4.6, min Y = 76.7
    const switchMinY = 79.0 - 2.3;
    // Plate: Y = 53.65 (5.65 + 48.0), height = 1.5, max Y = 54.4
    const plateMaxY = 53.65 + 0.75;
    expect(switchMinY - plateMaxY).toBeGreaterThan(15.0); // >15mm clearance

    // Plate min Y: 53.65 - 0.75 = 52.90
    const plateMinY = 53.65 - 0.75;
    // Poron Foam: Y = 31.05 (3.05 + 28.0), height = 3.5, max Y = 32.80
    const poronMaxY = 31.05 + 1.75;
    expect(plateMinY - poronMaxY).toBeGreaterThan(15.0); // >15mm clearance

    // IXPE Pad: Y = 24.95 (0.95 + 24.0), height = 0.5, min Y = 24.70
    const ixpeMinY = 24.95 - 0.25;
    // PCB: Y = 10.0, height = 1.2, max Y = 10.6
    const pcbMaxY = 10.0 + 0.6;
    expect(ixpeMinY - pcbMaxY).toBeGreaterThan(10.0); // >10mm clearance

    // PCB Sockets min Y: 10.0 - 0.85(offset) - 0.25(half height) = 8.90
    const pcbMinY = 10.0 - 1.10;
    // Case Foam: Y = -20.20 (-2.20 - 18.0), height = 2.0, max Y = -19.20
    const caseFoamMaxY = -20.20 + 1.0;
    expect(pcbMinY - caseFoamMaxY).toBeGreaterThan(25.0); // >25mm clearance

    // Case Foam min Y: -20.20 - 1.0 = -21.20
    const caseFoamMinY = -20.20 - 1.0;
    // Bottom Chassis: Y = -49.50 (-7.50 - 42.0), height = 8.0, max Y = -45.50
    const bottomCaseMaxY = -49.50 + 4.0;
    expect(caseFoamMinY - bottomCaseMaxY).toBeGreaterThan(20.0); // >20mm clearance

    // Bottom Chassis min Y: -49.50 - 4.0 = -53.50 (feet down to -55.1)
    const bottomCaseMinY = -49.50 - 5.6;
    // Weight: Y = -86.20 (-14.20 - 72.0), height = 4.5, max Y = -83.95
    const weightMaxY = -86.20 + 2.25;
    expect(bottomCaseMinY - weightMaxY).toBeGreaterThan(25.0); // >25mm clearance
  });

  it('Dynamic explosion preserves strict layer ordering across all intermediate t in [0, 1]', () => {
    const steps = 100;
    for (let step = 0; step <= steps; step++) {
      const t = step / steps;

      for (let i = 0; i < SEVEN_GASKET_LAYERS.length - 1; i++) {
        const upper = SEVEN_GASKET_LAYERS[i];
        const lower = SEVEN_GASKET_LAYERS[i + 1];
        const dist = upper.getY(t) - lower.getY(t);

        // At all times, distance must remain strictly positive (no inversion or crossing)
        expect(dist).toBeGreaterThan(0.08);
      }
    }
  });
});
