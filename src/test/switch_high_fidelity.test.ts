import { describe, it, expect } from 'vitest';
import {
  createUpperHousingGeometry,
  createLowerHousingGeometry,
  createMXCrossStemGeometry,
  createPinsGeometry,
  createGoldenSpringGeometry,
  HOUSING_SPECS,
  STEM_COLORS,
} from '../components/models/InstancedSwitchArray';

describe('High-Fidelity Industrial Mechanical Switch Geometry & Optics Suite', () => {
  it('1. Upper Housing Geometry exhibits trapezoidal pyramid taper, chimney collar and LED lens port', () => {
    const geom = createUpperHousingGeometry();
    expect(geom).toBeDefined();
    expect(geom.getAttribute('position')).toBeDefined();
    expect(geom.getAttribute('position').count).toBeGreaterThan(100);

    geom.computeBoundingBox();
    const box = geom.boundingBox!;

    // Collar width approx 15.6mm, height approx 4.8mm
    const w = box.max.x - box.min.x;
    const h = box.max.y - box.min.y;
    const d = box.max.z - box.min.z;

    expect(w).toBeGreaterThanOrEqual(14.0);
    expect(w).toBeLessThanOrEqual(16.5);
    expect(d).toBeGreaterThanOrEqual(14.0);
    expect(d).toBeLessThanOrEqual(16.5);
    expect(h).toBeGreaterThan(4.0);
  });

  it('2. Lower Housing Geometry features plate mounting flange, central well and 5-Pin studs', () => {
    const geom = createLowerHousingGeometry();
    expect(geom).toBeDefined();

    geom.computeBoundingBox();
    const box = geom.boundingBox!;

    // Flange width approx 15.6mm, depth approx 15.6mm, PCB pins reaching below -3.5mm
    const w = box.max.x - box.min.x;
    expect(w).toBeGreaterThanOrEqual(14.5);
    expect(box.min.y).toBeLessThan(-3.0); // Center pin and 5-pin studs extend down for PCB insertion
  });

  it('3. MX Cross Stem Geometry features 4.0mm cross, POM glider rails, tactile legs and extended bottom pole', () => {
    // Standard linear/tactile stem
    const standardStem = createMXCrossStemGeometry(false, 'cherry_red');
    expect(standardStem).toBeDefined();

    standardStem.computeBoundingBox();
    const stdBox = standardStem.boundingBox!;
    expect(stdBox.max.y).toBeGreaterThan(3.0); // Cross protrudes for keycap mount
    expect(stdBox.min.y).toBeLessThan(-2.0); // Extended pole extends down for bottom-out collision

    // Box stem with dustproof box enclosure
    const boxStem = createMXCrossStemGeometry(true, 'kailh_box_jade');
    expect(boxStem).toBeDefined();
    expect(boxStem.getAttribute('position').count).toBeGreaterThan(standardStem.getAttribute('position').count);
  });

  it('4. Dual Contact Pins & Phosphor Bronze Leaf Geometry', () => {
    const pinsGeom = createPinsGeometry();
    expect(pinsGeom).toBeDefined();

    pinsGeom.computeBoundingBox();
    const pBox = pinsGeom.boundingBox!;

    // Pins extend below to interface with Kailh hot-swap sockets
    expect(pBox.min.y).toBeLessThan(-3.5);
    // Span across X coordinates for dual pins
    expect(pBox.max.x - pBox.min.x).toBeGreaterThan(5.0);
  });

  it('5. Progressive Golden Helical Spring Geometry supports smooth extension during micro-disassembly', () => {
    const closedSpring = createGoldenSpringGeometry(0.0);
    const stretchedSpring = createGoldenSpringGeometry(1.0);

    expect(closedSpring).toBeDefined();
    expect(stretchedSpring).toBeDefined();

    closedSpring.computeBoundingBox();
    stretchedSpring.computeBoundingBox();

    const closedH = closedSpring.boundingBox!.max.y - closedSpring.boundingBox!.min.y;
    const stretchedH = stretchedSpring.boundingBox!.max.y - stretchedSpring.boundingBox!.min.y;

    expect(stretchedH).toBeGreaterThan(closedH);
  });

  it('6. Verifies Optical Material Specifications and Exact Stem Colors for All 5 Major Switches', () => {
    const models = ['cherry_red', 'gateron_yellow', 'cherry_blue', 'holy_panda', 'kailh_box_jade'] as const;

    models.forEach((m) => {
      const spec = HOUSING_SPECS[m];
      const stemColor = STEM_COLORS[m];

      expect(spec).toBeDefined();
      expect(stemColor).toBeDefined();
      expect(spec.color).toBeTruthy();
      expect(spec.lowerColor).toBeTruthy();
      expect(spec.opacity).toBeGreaterThan(0);
      expect(spec.roughness).toBeGreaterThanOrEqual(0);
    });

    // Exact stem color validation
    expect(STEM_COLORS.cherry_red).toBe('#ef4444');
    expect(STEM_COLORS.gateron_yellow).toBe('#eab308');
    expect(STEM_COLORS.cherry_blue).toBe('#3b82f6');
    expect(STEM_COLORS.holy_panda).toBe('#ea580c');
    expect(STEM_COLORS.kailh_box_jade).toBe('#10b981');
  });
});
