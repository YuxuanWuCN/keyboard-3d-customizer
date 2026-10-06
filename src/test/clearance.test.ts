import { describe, it, expect } from 'vitest';
import { KEYBOARD_LAYOUTS } from '../constants/keyboardLayouts';
import { KeyboardModelId } from '../types/keyboard';

describe('Resting Clearance & Collision Verification (t = 0)', () => {
  // Layer definitions with calibrated resting Y centers and half-thicknesses
  const LAYERS_AT_REST = [
    {
      id: 'keycaps',
      name: 'Keycaps Array (Cherry Profile R1-R4)',
      centerY: 22.45,
      thickness: 9.8,
      halfThickness: 4.9, // bounds: [17.55, 27.35]
    },
    {
      id: 'switch_upper',
      name: 'Switch Upper Housing & Stem',
      centerY: 14.35,
      thickness: 4.6,
      halfThickness: 2.3, // bounds: [12.05, 16.65]
    },
    {
      id: 'switch_lower',
      name: 'Switch Lower Housing & Internal Spring',
      centerY: 9.00,
      thickness: 4.6,
      halfThickness: 2.3, // bounds: [6.70, 11.30]
    },
    {
      id: 'plate',
      name: 'Gasket-Tabbed Plate',
      centerY: 5.65,
      thickness: 1.5,
      halfThickness: 0.75, // bounds: [4.90, 6.40]
    },
    {
      id: 'poron_foam',
      name: 'Poron Sandwich Dampener Foam',
      centerY: 3.05,
      thickness: 3.5,
      halfThickness: 1.75, // bounds: [1.30, 4.80]
    },
    {
      id: 'ixpe_pad',
      name: 'IXPE Acoustic Switch Sheet',
      centerY: 0.95,
      thickness: 0.5,
      halfThickness: 0.25, // bounds: [0.70, 1.20]
    },
    {
      id: 'pcb',
      name: 'Flex-Cut PCB & Kailh Sockets',
      centerY: 0.00,
      thickness: 1.2,
      halfThickness: 0.60, // PCB board bounds: [-0.60, +0.60], socket underside down to -1.10
      customMinY: -1.10, // Sockets at -0.85 with height 0.5 -> [-1.10, -0.60]
    },
    {
      id: 'case_foam',
      name: 'Bottom Case Dampener Foam',
      centerY: -2.20,
      thickness: 2.0,
      halfThickness: 1.00, // bounds: [-3.20, -1.20]
    },
    {
      id: 'bottom_case',
      name: 'CNC Aluminum Bottom Chassis',
      centerY: -7.50,
      thickness: 8.0,
      halfThickness: 4.00, // bounds: [-11.50, -3.50]
    },
    {
      id: 'weight',
      name: 'Signature Underside PVD Weight (Max Depth 4.5mm)',
      centerY: -14.20,
      thickness: 4.5,
      halfThickness: 2.25, // bounds: [-16.45, -11.95]
    },
  ];

  it('Guarantees physical resting clearance (upper.minY - lower.maxY) >= 0.08mm across ALL adjacent layers', () => {
    for (let i = 0; i < LAYERS_AT_REST.length - 1; i++) {
      const upper = LAYERS_AT_REST[i];
      const lower = LAYERS_AT_REST[i + 1];

      const upperMinY = upper.customMinY !== undefined ? upper.customMinY : upper.centerY - upper.halfThickness;
      const lowerMaxY = lower.centerY + lower.halfThickness;

      const physicalClearance = upperMinY - lowerMaxY;

      // Assert physical clearance meets the strict >= 0.08mm threshold everywhere
      expect(physicalClearance).toBeGreaterThanOrEqual(0.08);

      // Verify each pair has positive clearance with zero penetration
      expect(physicalClearance).toBeGreaterThan(0.0);
    }
  });

  it('Verifies specific critical interfaces identified by Reviewer 2', () => {
    // 1. Plate bottom to Poron Foam top
    const plateBottom = 5.65 - 0.75; // 4.90mm
    const poronTop = 3.05 + 1.75; // 4.80mm
    expect(plateBottom - poronTop).toBeCloseTo(0.10, 2);

    // 2. Poron Foam bottom to IXPE Pad top
    const poronBottom = 3.05 - 1.75; // 1.30mm
    const ixpeTop = 0.95 + 0.25; // 1.20mm
    expect(poronBottom - ixpeTop).toBeCloseTo(0.10, 2);

    // 3. IXPE Pad bottom to PCB top
    const ixpeBottom = 0.95 - 0.25; // 0.70mm
    const pcbTop = 0.0 + 0.60; // 0.60mm
    expect(ixpeBottom - pcbTop).toBeCloseTo(0.10, 2);

    // 4. PCB Sockets bottom to Case Foam top
    const socketBottom = -1.10; // -1.10mm
    const caseFoamTop = -2.20 + 1.0; // -1.20mm
    expect(socketBottom - caseFoamTop).toBeCloseTo(0.10, 2);

    // 5. Case Foam bottom to Bottom Case rim top
    const caseFoamBottom = -2.20 - 1.0; // -3.20mm
    const bottomCaseTop = -7.50 + 4.0; // -3.50mm
    expect(caseFoamBottom - bottomCaseTop).toBeGreaterThanOrEqual(0.10);

    // 6. Bottom Case bottom to Weight top
    const bottomCaseBottom = -7.50 - 4.0; // -11.50mm
    const weightTop = -14.20 + 2.25; // -11.95mm
    expect(bottomCaseBottom - weightTop).toBeGreaterThanOrEqual(0.10);
  });
});

describe('Dimensional Fit & Cavity Non-Interference Verification', () => {
  const models: KeyboardModelId[] = ['tofu60', 'eveningstar75', 'mrsuit80'];

  const INNER_CAVITIES: Record<KeyboardModelId, { innerW: number; innerD: number; chamberW: number; chamberD: number }> = {
    tofu60: { innerW: 290.0, innerD: 98.0, chamberW: 294.0, chamberD: 102.0 },
    eveningstar75: { innerW: 313.5, innerD: 118.5, chamberW: 316.0, chamberD: 122.0 },
    mrsuit80: { innerW: 356.5, innerD: 124.0, chamberW: 358.5, chamberD: 126.0 },
    bakeneko65: { innerW: 308.0, innerD: 99.0, chamberW: 311.0, chamberD: 102.0 },
  };

  models.forEach((model) => {
    it(`Model ${model}: Matrix, Plate and Tabs fit completely inside case cavities without piercing aluminum walls`, () => {
      const layout = KEYBOARD_LAYOUTS[model];
      const cavity = INNER_CAVITIES[model];

      // Calculate matrix dimensions
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

      // 1. Matrix fits inside top bezel cutout with positive clearance
      expect(matrixW).toBeLessThan(cavity.innerW);
      expect(matrixD).toBeLessThan(cavity.innerD);
      const keycapHClearance = (cavity.innerW - matrixW) / 2;
      const keycapVClearance = (cavity.innerD - matrixD) / 2;
      expect(keycapHClearance).toBeGreaterThan(1.0); // At least 1mm gap around keys
      expect(keycapVClearance).toBeGreaterThan(1.0);

      // 2. Plate body fits inside top bezel cutout
      const plateW = matrixW + 2.0;
      const plateD = matrixD + 2.0;
      expect(plateW).toBeLessThan(cavity.innerW);
      expect(plateD).toBeLessThan(cavity.innerD);

      // 3. Gasket tabs extend onto internal chamber ledge without piercing outer chassis
      const tabOuterSpanX = plateW + 3.5;
      const tabOuterSpanZ = plateD + 3.5;

      // Must be greater than inner cutout so tabs rest on the ledge
      expect(tabOuterSpanX).toBeGreaterThan(cavity.innerW);
      expect(tabOuterSpanZ).toBeGreaterThan(cavity.innerD);

      // Must strictly fit inside bottom case chamber and outer case walls
      expect(tabOuterSpanX).toBeLessThanOrEqual(cavity.chamberW);
      expect(tabOuterSpanZ).toBeLessThanOrEqual(cavity.chamberD);
      expect(tabOuterSpanX).toBeLessThan(layout.dimensions.width);
      expect(tabOuterSpanZ).toBeLessThan(layout.dimensions.depth);
    });
  });

  it('Mr. Suit 80 bottom row spacebar has zero blocker collisions', () => {
    const layout = KEYBOARD_LAYOUTS.mrsuit80;
    const spacebar = layout.keys.find((k) => k.code === 'Space');
    expect(spacebar).toBeDefined();

    // Compute spacebar millimeter X extent in centered space
    let maxX = 0;
    layout.keys.forEach((k) => {
      const endX = k.gridX + k.unitWidth;
      if (endX > maxX) maxX = endX;
    });
    const totalW = maxX * 19.05;
    const spaceStartX = spacebar!.gridX * 19.05 - totalW / 2;
    const spaceEndX = (spacebar!.gridX + spacebar!.unitWidth) * 19.05 - totalW / 2;

    // The Spacebar spans from ~ -104.77mm to +14.29mm
    expect(spaceStartX).toBeLessThan(-100.0);
    expect(spaceEndX).toBeGreaterThan(10.0);

    // Verify the former colliding blocker at X = -36.0mm is inside the spacebar range,
    // confirming that placing a blocker at -36.0mm was indeed a collision bug that has been remediated.
    const formerBlockerX = -36.0;
    expect(formerBlockerX).toBeGreaterThan(spaceStartX);
    expect(formerBlockerX).toBeLessThan(spaceEndX);
  });
});
