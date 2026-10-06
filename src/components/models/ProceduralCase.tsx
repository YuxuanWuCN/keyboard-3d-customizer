import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { KeyboardModelId, GasketLayerId, WeightMaterialId } from '../../types/keyboard';
import { KEYBOARD_LAYOUTS } from '../../constants/keyboardLayouts';

interface ProceduralCaseProps {
  model: KeyboardModelId;
  caseColor: string;
  caseFinish: 'anodized' | 'e_white' | 'raw_alu';
  weightMaterial: WeightMaterialId;
  explodedProgress: number;
  layerVisibility: Record<GasketLayerId, boolean>;
  isolatedLayer: GasketLayerId | null;
  rx78Edition?: boolean;
  polarisEdition?: boolean;
}

// Cubic easing for exploded displacement: 3t^2 - 2t^3
function cubicEase(t: number): number {
  return t * t * (3 - 2 * t);
}

// Procedural Canvas Texture for Gundam RX-78 3D Relief Backplate
function createRx78BackplateTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 340;
  const ctx = canvas.getContext('2d')!;

  // 1. Dark graphite metallic background
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(0, 0, 1024, 340);

  // Mechanical grid lines
  ctx.strokeStyle = '#1e293b';
  ctx.lineWidth = 1.5;
  for (let x = 0; x < 1024; x += 32) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, 340);
    ctx.stroke();
  }
  for (let y = 0; y < 340; y += 32) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(1024, y);
    ctx.stroke();
  }

  // 2. Upper Badge: Gold Cartouche & Red Gundam Shield Motif
  const bX = 392, bY = 16, bW = 240, bH = 80;
  ctx.fillStyle = '#d97706';
  ctx.fillRect(bX, bY, bW, bH);
  ctx.strokeStyle = '#fde047';
  ctx.lineWidth = 3;
  ctx.strokeRect(bX + 3, bY + 3, bW - 6, bH - 6);

  // Red enamel field
  ctx.fillStyle = '#dc2626';
  ctx.fillRect(bX + 8, bY + 8, bW - 16, bH - 16);

  // White Federation Cross / Shield Emblem
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(bX + 36, bY + 18, 12, 44);
  ctx.fillRect(bX + 20, bY + 32, 44, 12);
  // Yellow star center
  ctx.fillStyle = '#facc15';
  ctx.beginPath();
  ctx.arc(bX + 42, bY + 38, 5, 0, Math.PI * 2);
  ctx.fill();

  // "RX-78" Bold Typography
  ctx.font = '900 44px "Segoe UI", Arial, sans-serif';
  ctx.fillStyle = '#ffffff';
  ctx.fillText('RX-78', bX + 82, bY + 54);

  // Japanese Katakana: ガンダム
  ctx.font = '700 16px "Segoe UI", Arial, sans-serif';
  ctx.fillStyle = '#fef08a';
  ctx.fillText('機動戦士ガンダム  E.F.S.F.', bX + 84, bY + 70);

  // 3. Lower Main Cyan/Teal Relief Plate
  const cX = 36, cY = 112, cW = 952, cH = 208;
  const grad = ctx.createLinearGradient(cX, cY, cX + cW, cY + cH);
  grad.addColorStop(0, '#0e7490');
  grad.addColorStop(0.5, '#06b6d4');
  grad.addColorStop(1, '#0891b2');
  ctx.fillStyle = grad;
  ctx.fillRect(cX, cY, cW, cH);

  ctx.strokeStyle = '#22d3ee';
  ctx.lineWidth = 4;
  ctx.strokeRect(cX + 5, cY + 5, cW - 10, cH - 10);

  ctx.font = '900 52px "Segoe UI", Arial, sans-serif';
  ctx.fillStyle = '#164e63';
  ctx.fillText('RX-78  GUNDAM', cX + 42, cY + 68);
  ctx.fillStyle = '#ecfeff';
  ctx.fillText('RX-78  GUNDAM', cX + 40, cY + 66);

  ctx.font = '700 22px "Segoe UI", Arial, sans-serif';
  ctx.fillStyle = '#a5f3fc';
  ctx.fillText('E.F.S.F.  EARTH FEDERATION SPACE FORCE  •  WHITE BASE SQUADRON', cX + 40, cY + 104);
  ctx.fillText('MOBILE SUIT SPECIFICATION  •  OPERATION V  •  CORE FIGHTER LINKED', cX + 40, cY + 130);

  // Squadron 74 Badge Box
  ctx.fillStyle = '#155e75';
  ctx.fillRect(cX + 40, cY + 146, 96, 50);
  ctx.strokeStyle = '#38bdf8';
  ctx.lineWidth = 2;
  ctx.strokeRect(cX + 40, cY + 146, 96, 50);
  ctx.font = '900 36px "Segoe UI", Arial, sans-serif';
  ctx.fillStyle = '#ffffff';
  ctx.fillText('74', cX + 68, cY + 184);

  // Directional Hazard Chevrons
  ctx.font = '900 40px "Segoe UI", Arial, sans-serif';
  ctx.fillStyle = '#facc15';
  ctx.fillText('>>>  >>>  >>>', cX + 160, cY + 184);

  // 4. Orange / Amber Caution Hazard Block
  const oX = cX + 570, oY = cY + 136, oW = 340, oH = 62;
  ctx.fillStyle = '#ea580c';
  ctx.fillRect(oX, oY, oW, oH);
  ctx.strokeStyle = '#fdba74';
  ctx.lineWidth = 3;
  ctx.strokeRect(oX + 2, oY + 2, oW - 4, oH - 4);

  ctx.fillStyle = '#1c1917';
  for (let i = 0; i < oW; i += 20) {
    ctx.beginPath();
    ctx.moveTo(oX + i, oY);
    ctx.lineTo(oX + i + 10, oY);
    ctx.lineTo(oX + i + 4, oY + 14);
    ctx.lineTo(oX + i - 6, oY + 14);
    ctx.fill();
  }

  ctx.font = '900 18px "Segoe UI", Arial, sans-serif';
  ctx.fillStyle = '#ffffff';
  ctx.fillText('CAUTION: MINOVSKY REACTOR', oX + 14, oY + 34);
  ctx.font = '700 16px "Segoe UI", monospace';
  ctx.fillStyle = '#fef08a';
  ctx.fillText('LIMITED EDITION: 001/020', oX + 14, oY + 53);

  const texture = new THREE.CanvasTexture(canvas);
  texture.anisotropy = 16;
  texture.needsUpdate = true;
  return texture;
}

// Procedural Canvas Texture for Polaris 80 Gold PVD Underside Border
function createPolarisGoldBorderTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 2048;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  // 1. Brushed PVD Gold metallic gradient background
  const grad = ctx.createLinearGradient(0, 0, 2048, 512);
  grad.addColorStop(0.0, '#b45309');
  grad.addColorStop(0.2, '#d97706');
  grad.addColorStop(0.5, '#f59e0b');
  grad.addColorStop(0.8, '#d97706');
  grad.addColorStop(1.0, '#92400e');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 2048, 512);

  // Micro brushed metal texture lines
  ctx.strokeStyle = 'rgba(254, 240, 138, 0.15)';
  ctx.lineWidth = 1;
  for (let y = 0; y < 512; y += 4) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(2048, y);
    ctx.stroke();
  }

  // Polished gold outer border highlights
  ctx.strokeStyle = '#fef08a';
  ctx.lineWidth = 6;
  ctx.strokeRect(10, 10, 2028, 492);
  ctx.strokeStyle = '#78350f';
  ctx.lineWidth = 3;
  ctx.strokeRect(18, 18, 2012, 476);

  // Clear inner window cutout so mirror PVD plate & 3D hexagram shine through completely
  ctx.clearRect(108, 80, 1832, 352);

  // Inner cutout beveled border
  ctx.strokeStyle = '#fef08a';
  ctx.lineWidth = 4;
  ctx.strokeRect(108, 80, 1832, 352);
  ctx.strokeStyle = '#78350f';
  ctx.lineWidth = 2;
  ctx.strokeRect(104, 76, 1840, 360);

  // 2. PlayStation Button Symbols: ▲ ■ ● ✖ in 4 corners
  const drawSymbols = (x: number, y: number) => {
    ctx.save();
    ctx.font = '900 40px "Segoe UI", Arial, sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    // Deep laser engraved shadow
    ctx.fillStyle = '#451a03';
    ctx.fillText('▲   ■   ●   ✖', x + 2, y + 2);
    // Brilliant metallic gold face
    ctx.fillStyle = '#fef08a';
    ctx.fillText('▲   ■   ●   ✖', x, y);
    ctx.restore();
  };

  // Top-Left and Bottom-Left corners
  drawSymbols(140, 46);
  drawSymbols(140, 474);
  // Top-Right and Bottom-Right corners
  drawSymbols(1520, 46);
  drawSymbols(1520, 474);

  // 3. Directional Arrows: ◀ on left margin, ▶ on right margin
  ctx.save();
  ctx.font = '900 52px "Segoe UI", Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  // Shadow
  ctx.fillStyle = '#451a03';
  ctx.fillText('◀', 56, 258);
  ctx.fillText('▶', 1992, 258);
  // Brilliant face
  ctx.fillStyle = '#fef08a';
  ctx.fillText('◀', 54, 256);
  ctx.fillText('▶', 1990, 256);
  ctx.restore();

  // 4. Centered Edition Engravings
  ctx.save();
  ctx.font = 'bold 26px "Segoe UI", Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#451a03';
  ctx.fillText('★  POLARIS 80  •  RETRO HANDHELD SPECIAL EDITION  ★', 1024, 46);
  ctx.fillText('DUAL-LAYER CNC PVD WEIGHT  •  HEXAGRAM MEDALLION  •  001/080', 1024, 474);
  ctx.fillStyle = '#fef08a';
  ctx.fillText('★  POLARIS 80  •  RETRO HANDHELD SPECIAL EDITION  ★', 1024, 44);
  ctx.fillText('DUAL-LAYER CNC PVD WEIGHT  •  HEXAGRAM MEDALLION  •  001/080', 1024, 472);
  ctx.restore();

  const texture = new THREE.CanvasTexture(canvas);
  texture.anisotropy = 16;
  texture.needsUpdate = true;
  return texture;
}

// Procedural Canvas Texture for Polaris 80 Front Nameplate ("🌈 Polaris ★ !")
function createPolarisNameplateTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 128;
  const ctx = canvas.getContext('2d')!;

  // Mirror chrome / pearlescent background
  const bgGrad = ctx.createLinearGradient(0, 0, 512, 128);
  bgGrad.addColorStop(0, '#f1f5f9');
  bgGrad.addColorStop(0.5, '#ffffff');
  bgGrad.addColorStop(1, '#e2e8f0');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, 512, 128);

  // Chrome bevel border
  ctx.strokeStyle = '#94a3b8';
  ctx.lineWidth = 4;
  ctx.strokeRect(4, 4, 504, 120);
  ctx.strokeStyle = '#f8fafc';
  ctx.lineWidth = 2;
  ctx.strokeRect(8, 8, 496, 112);

  // Rainbow text gradient
  const textGrad = ctx.createLinearGradient(50, 0, 460, 0);
  textGrad.addColorStop(0.0, '#ec4899'); // Peach / Pink
  textGrad.addColorStop(0.25, '#a855f7'); // Lilac
  textGrad.addColorStop(0.5, '#6366f1'); // Indigo
  textGrad.addColorStop(0.75, '#06b6d4'); // Mint / Cyan
  textGrad.addColorStop(1.0, '#10b981'); // Pastel Green

  // Title: "🌈 Polaris ★ !"
  ctx.font = '900 44px "Segoe UI", Arial, sans-serif';
  // Subtle drop shadow
  ctx.fillStyle = 'rgba(0, 0, 0, 0.22)';
  ctx.fillText('🌈 Polaris ★ !', 50, 74);
  // Main gradient fill
  ctx.fillStyle = textGrad;
  ctx.fillText('🌈 Polaris ★ !', 48, 72);

  // Subtitle
  ctx.font = '700 15px "Segoe UI", sans-serif';
  ctx.fillStyle = '#64748b';
  ctx.fillText('LIMITED CNC EDITION  •  POLARIS 80', 60, 104);

  const texture = new THREE.CanvasTexture(canvas);
  texture.anisotropy = 16;
  texture.needsUpdate = true;
  return texture;
}

// Rounded rectangle 2D shape in XY plane
function createRoundedRectShape(w: number, d: number, radius: number): THREE.Shape {
  const shape = new THREE.Shape();
  const x = -w / 2;
  const y = -d / 2;
  const r = Math.min(radius, w / 2, d / 2);
  shape.moveTo(x + r, y);
  shape.lineTo(x + w - r, y);
  shape.quadraticCurveTo(x + w, y, x + w, y + r);
  shape.lineTo(x + w, y + d - r);
  shape.quadraticCurveTo(x + w, y + d, x + w - r, y + d);
  shape.lineTo(x + r, y + d);
  shape.quadraticCurveTo(x, y + d, x, y + d - r);
  shape.lineTo(x, y + r);
  shape.quadraticCurveTo(x, y, x + r, y);
  return shape;
}

// 5-pointed star 2D shape
function createStarShape(outerRadius: number, innerRadius: number): THREE.Shape {
  const shape = new THREE.Shape();
  const points = 5;
  for (let i = 0; i < points * 2; i++) {
    const angle = (i * Math.PI) / points - Math.PI / 2;
    const r = i % 2 === 0 ? outerRadius : innerRadius;
    const x = r * Math.cos(angle);
    const y = r * Math.sin(angle);
    if (i === 0) shape.moveTo(x, y);
    else shape.lineTo(x, y);
  }
  shape.closePath();
  return shape;
}

// Hollow equilateral triangle 2D shape for interlaced hexagram ribbon
function createHollowTriangleShape(radius: number, wallWidth: number, pointingUp: boolean): THREE.Shape {
  const shape = new THREE.Shape();
  const baseAngle = pointingUp ? Math.PI / 2 : -Math.PI / 2;
  const angles = [baseAngle, baseAngle + (2 * Math.PI) / 3, baseAngle + (4 * Math.PI) / 3];

  shape.moveTo(radius * Math.cos(angles[0]), radius * Math.sin(angles[0]));
  shape.lineTo(radius * Math.cos(angles[1]), radius * Math.sin(angles[1]));
  shape.lineTo(radius * Math.cos(angles[2]), radius * Math.sin(angles[2]));
  shape.closePath();

  // Reverse winding hole for Three.js extrusion
  const innerR = Math.max(1.0, radius - wallWidth);
  const hole = new THREE.Path();
  hole.moveTo(innerR * Math.cos(angles[0]), innerR * Math.sin(angles[0]));
  hole.lineTo(innerR * Math.cos(angles[2]), innerR * Math.sin(angles[2]));
  hole.lineTo(innerR * Math.cos(angles[1]), innerR * Math.sin(angles[1]));
  hole.closePath();
  shape.holes.push(hole);

  return shape;
}

export const ProceduralCase: React.FC<ProceduralCaseProps> = ({
  model,
  caseColor,
  caseFinish,
  weightMaterial,
  explodedProgress,
  layerVisibility,
  isolatedLayer,
  rx78Edition,
  polarisEdition,
}) => {
  const layout = KEYBOARD_LAYOUTS[model];
  const { width: W, depth: D } = layout.dimensions;

  const isRx78 =
    Boolean(rx78Edition) ||
    weightMaterial === 'rx78_mecha' ||
    caseColor.toLowerCase() === '#1d4ed8' ||
    caseColor.toLowerCase() === '#2563eb';

  const isPolaris =
    Boolean(polarisEdition) ||
    weightMaterial === 'polaris_hexagram' ||
    (model === 'mrsuit80' && !isRx78);

  const t = cubicEase(explodedProgress);
  // Exploded offsets (in mm) calibrated for solid CNC case wrapping and clear explosion
  const topCaseY = 10.0 + 60.0 * t;
  const bottomCaseY = -7.50 - 42.0 * t;
  const weightY = -14.20 - 72.0 * t;

  // Visibility logic
  const showBottom =
    (!isolatedLayer || isolatedLayer === 'bottom_case_weight') &&
    layerVisibility.bottom_case_weight;
  const showTop = !isolatedLayer || isolatedLayer === 'plate' || isolatedLayer === 'bottom_case_weight';

  // Procedural Canvas Textures
  const rx78Texture = useMemo(() => createRx78BackplateTexture(), []);
  const polarisGoldTexture = useMemo(() => createPolarisGoldBorderTexture(), []);
  const polarisNameplateTexture = useMemo(() => createPolarisNameplateTexture(), []);

  // Animatable Material and Light Refs
  const leftLightRef = useRef<THREE.MeshStandardMaterial>(null);
  const rightLightRef = useRef<THREE.MeshStandardMaterial>(null);
  const arrowLedRef = useRef<THREE.MeshStandardMaterial>(null);
  const leftPointLightRef = useRef<THREE.PointLight>(null);
  const rightPointLightRef = useRef<THREE.PointLight>(null);
  const arrowPointLightRef = useRef<THREE.PointLight>(null);

  // Smooth animated gradient breathing pulse in useFrame for Polaris 80
  useFrame((state) => {
    if (!isPolaris) return;
    const time = state.clock.elapsedTime;

    // Smooth breathing pulse
    const pulse = 2.0 + Math.sin(time * 3.0) * 0.7;

    // Dynamic rainbow candy gradient cycling
    const hueL = (time * 0.12) % 1.0;
    const hueR = (time * 0.12 + 0.45) % 1.0;
    const colorL = new THREE.Color().setHSL(hueL, 0.85, 0.65);
    const colorR = new THREE.Color().setHSL(hueR, 0.85, 0.65);

    if (leftLightRef.current) {
      leftLightRef.current.emissive = colorL;
      leftLightRef.current.emissiveIntensity = pulse;
    }
    if (rightLightRef.current) {
      rightLightRef.current.emissive = colorR;
      rightLightRef.current.emissiveIntensity = pulse;
    }
    if (arrowLedRef.current) {
      const arrowHue = (time * 0.16 + 0.25) % 1.0;
      arrowLedRef.current.emissive = new THREE.Color().setHSL(arrowHue, 0.9, 0.7);
      arrowLedRef.current.emissiveIntensity = 1.8 + Math.sin(time * 3.5) * 0.6;
    }
    if (leftPointLightRef.current) {
      leftPointLightRef.current.color = colorL;
      leftPointLightRef.current.intensity = pulse * 0.4;
    }
    if (rightPointLightRef.current) {
      rightPointLightRef.current.color = colorR;
      rightPointLightRef.current.intensity = pulse * 0.4;
    }
    if (arrowPointLightRef.current) {
      arrowPointLightRef.current.intensity = (1.8 + Math.sin(time * 3.5) * 0.6) * 0.3;
    }
  });

  // Dedicated Materials for Gundam RX-78 Aesthetics
  const redChamferMat = useMemo(
    () => new THREE.MeshStandardMaterial({ color: '#dc2626', roughness: 0.32, metalness: 0.45 }),
    []
  );
  const goldSlatMat = useMemo(
    () => new THREE.MeshStandardMaterial({ color: '#eab308', roughness: 0.22, metalness: 0.92 }),
    []
  );
  const rubberFootMat = useMemo(
    () => new THREE.MeshStandardMaterial({ color: '#111827', roughness: 0.95, metalness: 0.05 }),
    []
  );

  // Dedicated Materials for Polaris 80 Aesthetics
  const polarisGoldBorderMat = useMemo(
    () =>
      new THREE.MeshPhysicalMaterial({
        color: '#f59e0b',
        metalness: 0.86,
        roughness: 0.18,
        clearcoat: 0.8,
        clearcoatRoughness: 0.05,
        reflectivity: 0.95,
        envMapIntensity: 2.8,
      }),
    []
  );

  const polarisMirrorPlateMat = useMemo(
    () =>
      new THREE.MeshPhysicalMaterial({
        color: '#f8fafc',
        metalness: 0.88,
        roughness: 0.08,
        clearcoat: 1.0,
        clearcoatRoughness: 0.02,
        reflectivity: 1.0,
        envMapIntensity: 3.2,
      }),
    []
  );

  const polarisHexagramMat = useMemo(
    () =>
      new THREE.MeshPhysicalMaterial({
        color: '#ffffff',
        metalness: 0.90,
        roughness: 0.05,
        clearcoat: 1.0,
        clearcoatRoughness: 0.02,
        reflectivity: 1.0,
        envMapIntensity: 3.5,
      }),
    []
  );

  const polarisChromeChamferMat = useMemo(
    () =>
      new THREE.MeshPhysicalMaterial({
        color: '#ffffff',
        metalness: 0.98,
        roughness: 0.04,
        clearcoat: 1.0,
        clearcoatRoughness: 0.01,
        reflectivity: 1.0,
        envMapIntensity: 3.5,
      }),
    []
  );

  // Case Material Calculation
  const caseMat = useMemo(() => {
    let roughness = 0.35;
    let metalness = 0.42;

    let resolvedHex = caseColor;
    if (
      isRx78 &&
      (caseColor === '#1e2330' ||
        caseColor === '#2b2d38' ||
        caseColor === '#383b42' ||
        caseColor.toLowerCase() === '#1d4ed8' ||
        caseColor.toLowerCase() === '#2563eb')
    ) {
      resolvedHex = '#1D4ED8';
      roughness = 0.32;
      metalness = 0.45;
    } else if (isPolaris && (caseColor === '#2b2d38' || polarisEdition)) {
      // Polaris 80: Flagship Anodized Sakura Pink (#F8B4C4)
      resolvedHex = '#F8B4C4';
      roughness = 0.30;
      metalness = 0.42;
    } else if (caseColor === '#1e2330') {
      // EveningStar 75: Flagship Bright Arctic Ice Silver
      resolvedHex = '#D4DAE4';
    } else if (caseColor === '#2b2d38') {
      // Mr. Suit 80: Flagship Pristine Pure E-White
      resolvedHex = '#F5F6F8';
    } else if (caseColor === '#383b42') {
      // Tofu 60: Flagship Bright Anodized Silver
      resolvedHex = '#E2E6EA';
    }

    let color = new THREE.Color(resolvedHex);

    if (caseFinish === 'e_white') {
      roughness = 0.28;
      metalness = 0.05;
      color = new THREE.Color(
        caseColor && caseColor !== '#1e2330' && caseColor !== '#2b2d38' && caseColor !== '#383b42'
          ? caseColor
          : '#F8F9FA'
      );
    } else if (caseFinish === 'raw_alu') {
      roughness = 0.22;
      metalness = 0.85;
      color = new THREE.Color('#D8DCE3');
    }

    return new THREE.MeshStandardMaterial({
      color,
      roughness,
      metalness,
      envMapIntensity: 1.8,
    });
  }, [caseColor, caseFinish, isRx78, isPolaris, polarisEdition]);

  // Weight Material Fallback
  const weightMat = useMemo(() => {
    switch (weightMaterial) {
      case 'polaris_hexagram':
        return polarisGoldBorderMat;
      case 'rx78_mecha':
        return new THREE.MeshStandardMaterial({
          color: new THREE.Color('#0f172a'),
          metalness: 0.85,
          roughness: 0.25,
        });
      case 'mirror_chroma':
        return new THREE.MeshPhysicalMaterial({
          color: new THREE.Color('#e2e8f0'),
          metalness: 0.99,
          roughness: 0.02,
          clearcoat: 1.0,
          clearcoatRoughness: 0.01,
          reflectivity: 1.0,
          envMapIntensity: 3.0,
        });
      case 'matte_black':
        return new THREE.MeshStandardMaterial({
          color: new THREE.Color('#18181b'),
          metalness: 0.5,
          roughness: 0.65,
        });
      case 'anodized_gold':
        return new THREE.MeshStandardMaterial({
          color: new THREE.Color('#fbbf24'),
          metalness: 0.92,
          roughness: 0.25,
        });
      case 'brass_pvd':
      default:
        return new THREE.MeshPhysicalMaterial({
          color: new THREE.Color('#d4af37'),
          metalness: 0.98,
          roughness: 0.04,
          clearcoat: 1.0,
          clearcoatRoughness: 0.02,
          reflectivity: 1.0,
          envMapIntensity: 2.8,
        });
    }
  }, [weightMaterial, polarisGoldBorderMat]);

  // Top Case Bezel Geometry with inner cavity hole
  const topBezelGeom = useMemo(() => {
    let innerW = W - 14.0;
    let innerD = D - 14.0;
    if (model === 'tofu60') {
      innerW = 290.0;
      innerD = 98.0;
    } else if (model === 'eveningstar75') {
      innerW = 313.5;
      innerD = 118.5;
    } else if (model === 'mrsuit80') {
      innerW = 356.5;
      innerD = 124.0;
    }

    const cornerR = model === 'mrsuit80' ? 4.5 : model === 'eveningstar75' ? 1.5 : 0.4;
    const outerShape = createRoundedRectShape(W, D, cornerR);

    // Inner cavity cutout for plate and key switches
    const cavityHole = new THREE.Path();
    const x = -innerW / 2;
    const y = -innerD / 2;
    cavityHole.moveTo(x, y);
    cavityHole.lineTo(x + innerW, y);
    cavityHole.lineTo(x + innerW, y + innerD);
    cavityHole.lineTo(x, y + innerD);
    cavityHole.closePath();

    outerShape.holes.push(cavityHole);

    const extrudeSettings: THREE.ExtrudeGeometryOptions = {
      depth: 16.0,
      bevelEnabled: true,
      bevelThickness: model === 'tofu60' ? 0.6 : 1.0,
      bevelSize: model === 'tofu60' ? 0.6 : 1.0,
      bevelSegments: model === 'mrsuit80' ? 4 : 2,
    };

    const geom = new THREE.ExtrudeGeometry(outerShape, extrudeSettings);
    geom.rotateX(Math.PI / 2);
    geom.center();
    return geom;
  }, [W, D, model]);

  // Bottom Chassis Geometry
  const bottomCaseGeom = useMemo(() => {
    let innerW = W - 8.0;
    let innerD = D - 8.0;
    if (model === 'tofu60') {
      innerW = 294.0;
      innerD = 102.0;
    } else if (model === 'eveningstar75') {
      innerW = 316.0;
      innerD = 122.0;
    } else if (model === 'mrsuit80') {
      innerW = 358.5;
      innerD = 126.0;
    }

    const cornerR = model === 'mrsuit80' ? 4.5 : model === 'eveningstar75' ? 1.5 : 0.4;
    const outerShape = createRoundedRectShape(W - 0.5, D - 0.5, cornerR);

    const innerCavity = new THREE.Path();
    innerCavity.moveTo(-innerW / 2, -innerD / 2);
    innerCavity.lineTo(innerW / 2, -innerD / 2);
    innerCavity.lineTo(innerW / 2, innerD / 2);
    innerCavity.lineTo(-innerW / 2, innerD / 2);
    innerCavity.closePath();
    outerShape.holes.push(innerCavity);

    const extrudeSettings: THREE.ExtrudeGeometryOptions = {
      depth: 8.0,
      bevelEnabled: true,
      bevelThickness: 0.6,
      bevelSize: 0.6,
      bevelSegments: 2,
    };
    const geom = new THREE.ExtrudeGeometry(outerShape, extrudeSettings);
    geom.rotateX(Math.PI / 2);
    geom.center();
    return geom;
  }, [W, D, model]);

  // Bottom Base Plate
  const bottomBasePlateGeom = useMemo(() => {
    const cornerR = model === 'mrsuit80' ? 4.0 : model === 'eveningstar75' ? 1.2 : 0.2;
    const shape = createRoundedRectShape(W - 1.2, D - 1.2, cornerR);
    const geom = new THREE.ExtrudeGeometry(shape, { depth: 2.2, bevelEnabled: false });
    geom.rotateX(Math.PI / 2);
    geom.center();
    return geom;
  }, [W, D, model]);

  // Polaris 80 Outer Gold Border Geometry (with cutout for inner plate)
  const polarisGoldBorderGeom = useMemo(() => {
    const shape = createRoundedRectShape(296.0, 74.0, 3.5);
    const innerHole = new THREE.Path();
    const ix = -264.0 / 2;
    const iy = -50.0 / 2;
    innerHole.moveTo(ix, iy);
    innerHole.lineTo(ix + 264.0, iy);
    innerHole.lineTo(ix + 264.0, iy + 50.0);
    innerHole.lineTo(ix, iy + 50.0);
    innerHole.closePath();
    shape.holes.push(innerHole);

    const geom = new THREE.ExtrudeGeometry(shape, {
      depth: 3.6,
      bevelEnabled: true,
      bevelThickness: 0.6,
      bevelSize: 0.6,
      bevelSegments: 3,
    });
    geom.rotateX(Math.PI / 2);
    geom.center();
    return geom;
  }, []);

  // Polaris 80 Inner Mirror PVD Silver Plate Geometry
  const polarisMirrorPlateGeom = useMemo(() => {
    const shape = createRoundedRectShape(263.6, 49.6, 1.5);
    const geom = new THREE.ExtrudeGeometry(shape, {
      depth: 2.6,
      bevelEnabled: true,
      bevelThickness: 0.4,
      bevelSize: 0.4,
      bevelSegments: 2,
    });
    geom.rotateX(Math.PI / 2);
    geom.center();
    return geom;
  }, []);

  // Polaris 80 3D Hexagram Medallion: Interlaced Triangle 1 (Pointing UP)
  const polarisHexTriangleUpGeom = useMemo(() => {
    const shape = createHollowTriangleShape(25.5, 4.0, true);
    const geom = new THREE.ExtrudeGeometry(shape, {
      depth: 2.2,
      bevelEnabled: true,
      bevelThickness: 0.6,
      bevelSize: 0.6,
      bevelSegments: 3,
    });
    geom.rotateX(Math.PI / 2);
    geom.computeBoundingBox();
    const yMid = (geom.boundingBox!.min.y + geom.boundingBox!.max.y) / 2;
    geom.translate(0, -yMid, 0);
    return geom;
  }, []);

  // Polaris 80 3D Hexagram Medallion: Interlaced Triangle 2 (Pointing DOWN)
  const polarisHexTriangleDownGeom = useMemo(() => {
    const shape = createHollowTriangleShape(25.5, 4.0, false);
    const geom = new THREE.ExtrudeGeometry(shape, {
      depth: 2.2,
      bevelEnabled: true,
      bevelThickness: 0.6,
      bevelSize: 0.6,
      bevelSegments: 3,
    });
    geom.rotateX(Math.PI / 2);
    geom.computeBoundingBox();
    const yMid = (geom.boundingBox!.min.y + geom.boundingBox!.max.y) / 2;
    geom.translate(0, -yMid, 0);
    return geom;
  }, []);

  // Polaris 80 3D Star Button Shape for Rear Console
  const polarisStarGeom = useMemo(() => {
    const shape = createStarShape(4.2, 1.9);
    const geom = new THREE.ExtrudeGeometry(shape, {
      depth: 1.8,
      bevelEnabled: true,
      bevelThickness: 0.4,
      bevelSize: 0.4,
      bevelSegments: 2,
    });
    geom.center();
    return geom;
  }, []);

  // Weight Geometry specific to model (default when not custom edition)
  const weightGeom = useMemo(() => {
    if (model === 'eveningstar75') {
      const weightW = 240.0;
      const weightD = 78.0;
      const shape = new THREE.Shape();
      const x = -weightW / 2;
      const y = -weightD / 2;
      const chamfer = 8.0;
      shape.moveTo(x + chamfer, y);
      shape.lineTo(x + weightW - chamfer, y);
      shape.lineTo(x + weightW, y + chamfer);
      shape.lineTo(x + weightW, y + weightD - chamfer);
      shape.lineTo(x + weightW - chamfer, y + weightD);
      shape.lineTo(x + chamfer, y + weightD);
      shape.lineTo(x, y + weightD - chamfer);
      shape.lineTo(x, y + chamfer);
      shape.closePath();

      const geom = new THREE.ExtrudeGeometry(shape, {
        depth: 3.5,
        bevelEnabled: true,
        bevelThickness: 0.5,
        bevelSize: 0.5,
        bevelSegments: 2,
      });
      geom.rotateX(Math.PI / 2);
      geom.center();
      return geom;
    } else if (model === 'mrsuit80') {
      const weightW = 290.0;
      const weightD = 62.0;
      const shape = createRoundedRectShape(weightW, weightD, 3.0);
      const geom = new THREE.ExtrudeGeometry(shape, {
        depth: 3.8,
        bevelEnabled: true,
        bevelThickness: 0.6,
        bevelSize: 0.6,
        bevelSegments: 3,
      });
      geom.rotateX(Math.PI / 2);
      geom.center();
      return geom;
    } else {
      const weightW = 180.0;
      const weightD = 44.0;
      const shape = new THREE.Shape();
      shape.moveTo(-weightW / 2, -weightD / 2);
      shape.lineTo(weightW / 2, -weightD / 2);
      shape.lineTo(weightW / 2, weightD / 2);
      shape.lineTo(-weightW / 2, weightD / 2);
      shape.closePath();

      const geom = new THREE.ExtrudeGeometry(shape, {
        depth: 4.5,
        bevelEnabled: true,
        bevelThickness: 0.4,
        bevelSize: 0.4,
        bevelSegments: 1,
      });
      geom.rotateX(Math.PI / 2);
      geom.center();
      return geom;
    }
  }, [model]);

  return (
    <group>
      {/* 1. Top Bezel Case */}
      {showTop && (
        <group position={[0, topCaseY, 0]}>
          <mesh geometry={topBezelGeom} material={caseMat} castShadow receiveShadow />

          {/* EveningStar 75 Signature Side Waistline Cutouts & Front Badge */}
          {model === 'eveningstar75' && (
            <>
              <mesh position={[-W / 2 + 0.8, 0, 0]}>
                <boxGeometry args={[1.6, 6.0, D - 16]} />
                <meshStandardMaterial color="#64748b" roughness={0.4} metalness={0.8} />
              </mesh>
              <mesh position={[W / 2 - 0.8, 0, 0]}>
                <boxGeometry args={[1.6, 6.0, D - 16]} />
                <meshStandardMaterial color="#64748b" roughness={0.4} metalness={0.8} />
              </mesh>
              <mesh position={[84.0, 8.2, D / 2 - 3.2]}>
                <boxGeometry args={[26.0, 1.2, 5.0]} />
                <meshPhysicalMaterial
                  color="#d4af37"
                  metalness={0.98}
                  roughness={0.06}
                  clearcoat={1.0}
                />
              </mesh>
              <mesh position={[84.0, 8.4, D / 2 - 0.4]}>
                <boxGeometry args={[20.0, 0.8, 1.2]} />
                <meshStandardMaterial
                  color="#67e8f9"
                  emissive="#38bdf8"
                  emissiveIntensity={1.8}
                  transparent
                  opacity={0.92}
                />
              </mesh>
            </>
          )}

          {/* Gundam RX-78 Signature Crimson Red Accent Top Chamfer Bevel */}
          {isRx78 && (
            <group position={[0, 8.5, 0]}>
              <mesh position={[0, 0, D / 2 - 1.2]}>
                <boxGeometry args={[W - 2.0, 1.2, 2.4]} />
                <primitive object={redChamferMat} attach="material" />
              </mesh>
              <mesh position={[0, 0, -D / 2 + 1.2]}>
                <boxGeometry args={[W - 2.0, 1.2, 2.4]} />
                <primitive object={redChamferMat} attach="material" />
              </mesh>
              <mesh position={[-W / 2 + 1.2, 0, 0]}>
                <boxGeometry args={[2.4, 1.2, D - 4.0]} />
                <primitive object={redChamferMat} attach="material" />
              </mesh>
              <mesh position={[W / 2 - 1.2, 0, 0]}>
                <boxGeometry args={[2.4, 1.2, D - 4.0]} />
                <primitive object={redChamferMat} attach="material" />
              </mesh>
            </group>
          )}

          {/* Gundam RX-78 Signature 4-Tier Side Cooling Ventilation Grilles */}
          {isRx78 && (
            <>
              <group position={[-W / 2 + 0.6, 0, 0]}>
                <mesh position={[-0.4, 0, 0]}>
                  <boxGeometry args={[1.2, 7.5, D - 22]} />
                  <primitive object={goldSlatMat} attach="material" />
                </mesh>
                {[-2.2, -0.7, 0.8, 2.3].map((yOff, i) => (
                  <mesh key={`l-slat-${i}`} position={[0.2, yOff, 0]}>
                    <boxGeometry args={[1.6, 0.6, D - 24]} />
                    <primitive object={caseMat} attach="material" />
                  </mesh>
                ))}
              </group>
              <group position={[W / 2 - 0.6, 0, 0]}>
                <mesh position={[0.4, 0, 0]}>
                  <boxGeometry args={[1.2, 7.5, D - 22]} />
                  <primitive object={goldSlatMat} attach="material" />
                </mesh>
                {[-2.2, -0.7, 0.8, 2.3].map((yOff, i) => (
                  <mesh key={`r-slat-${i}`} position={[-0.2, yOff, 0]}>
                    <boxGeometry args={[1.6, 0.6, D - 24]} />
                    <primitive object={caseMat} attach="material" />
                  </mesh>
                ))}
              </group>
            </>
          )}

          {/* ============================================================== */}
          {/* Polaris 80: R2 Top Case & Bezel, R3 Rear Console & Lightbars   */}
          {/* ============================================================== */}
          {isPolaris && (
            <>
              {/* R2. Diamond-Cut Mirror Chrome Chamfer inner bezel around keycap well */}
              <group position={[0, 8.35, 0]}>
                {/* Front inner chamfer strip */}
                <mesh position={[0, 0, 62.0 - 0.8]}>
                  <boxGeometry args={[356.5, 0.9, 1.8]} />
                  <primitive object={polarisChromeChamferMat} attach="material" />
                </mesh>
                {/* Rear inner chamfer strip */}
                <mesh position={[0, 0, -62.0 + 0.8]}>
                  <boxGeometry args={[356.5, 0.9, 1.8]} />
                  <primitive object={polarisChromeChamferMat} attach="material" />
                </mesh>
                {/* Left inner chamfer strip */}
                <mesh position={[-178.25 + 0.8, 0, 0]}>
                  <boxGeometry args={[1.8, 0.9, 124.0]} />
                  <primitive object={polarisChromeChamferMat} attach="material" />
                </mesh>
                {/* Right inner chamfer strip */}
                <mesh position={[178.25 - 0.8, 0, 0]}>
                  <boxGeometry args={[1.8, 0.9, 124.0]} />
                  <primitive object={polarisChromeChamferMat} attach="material" />
                </mesh>
              </group>

              {/* R2. Above Arrow Keys: Dedicated Nameplate "🌈 Polaris ★ !" & RGB Diffuser */}
              <group position={[147.5, 8.5, 15.0]}>
                {/* Polished Chrome Badge Backplate */}
                <mesh position={[-7.5, 0, 0]}>
                  <boxGeometry args={[31.0, 1.2, 11.5]} />
                  <primitive object={polarisChromeChamferMat} attach="material" />
                </mesh>
                {/* Front Nameplate Decal with High-Resolution Typography */}
                <mesh position={[-7.5, 0.65, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                  <planeGeometry args={[29.5, 10.5]} />
                  <meshStandardMaterial
                    map={polarisNameplateTexture}
                    roughness={0.15}
                    metalness={0.85}
                  />
                </mesh>

                {/* Vertical Breathing RGB Frosted Acrylic Diffuser Column */}
                <mesh position={[12.5, 0.3, 0]}>
                  <boxGeometry args={[3.2, 1.8, 12.5]} />
                  <meshStandardMaterial
                    ref={arrowLedRef}
                    color="#c084fc"
                    emissive="#a855f7"
                    emissiveIntensity={2.0}
                    roughness={0.15}
                    transparent
                    opacity={0.92}
                  />
                </mesh>
                {/* Diffuser Ambient Point Light */}
                <pointLight
                  ref={arrowPointLightRef}
                  position={[12.5, 2.5, 0]}
                  color="#c084fc"
                  intensity={0.6}
                  distance={28}
                />
              </group>

              {/* R3. Rear Console Handheld Elements (Z = -D/2 = -62.0 mm) */}
              <group position={[0, 1.5, -D / 2]}>
                {/* Centered Recessed Type-C Port */}
                <group position={[0, 0, 0]}>
                  {/* Outer Chrome Bezel Rim */}
                  <mesh position={[0, 0, -0.2]}>
                    <boxGeometry args={[17.0, 9.2, 0.8]} />
                    <primitive object={polarisChromeChamferMat} attach="material" />
                  </mesh>
                  {/* Recessed Dark Interior Socket */}
                  <mesh position={[0, 0, 2.2]}>
                    <boxGeometry args={[14.5, 7.0, 4.8]} />
                    <meshStandardMaterial color="#0b0f19" roughness={0.8} />
                  </mesh>
                  {/* Center Gold Type-C Contact Tongue */}
                  <mesh position={[0, 0, 1.8]}>
                    <boxGeometry args={[7.5, 1.2, 3.4]} />
                    <primitive object={goldSlatMat} attach="material" />
                  </mesh>
                </group>

                {/* Retro Handheld Cartridge Slot (Left side at X = -62.0) */}
                <group position={[-62.0, 0, 0]}>
                  {/* Beveled Cartridge Guide Housing */}
                  <mesh position={[0, 0, -0.2]}>
                    <boxGeometry args={[52.0, 8.5, 0.8]} />
                    <meshStandardMaterial color="#334155" roughness={0.4} metalness={0.6} />
                  </mesh>
                  {/* Deep Cartridge Chamber */}
                  <mesh position={[0, 0, 2.4]}>
                    <boxGeometry args={[48.0, 6.6, 5.2]} />
                    <meshStandardMaterial color="#090d16" roughness={0.9} />
                  </mesh>
                  {/* Gold Cartridge Connector Pins */}
                  <mesh position={[0, -1.8, 2.0]}>
                    <boxGeometry args={[38.0, 0.6, 2.4]} />
                    <primitive object={goldSlatMat} attach="material" />
                  </mesh>
                  {/* Cartridge Ejection Grip Notch */}
                  <mesh position={[0, 3.2, 0.2]}>
                    <boxGeometry args={[14.0, 1.2, 1.4]} />
                    <meshStandardMaterial color="#64748b" roughness={0.6} />
                  </mesh>
                </group>

                {/* 3D Star Key ⭐ (Right side at X = +62.0) */}
                <group position={[62.0, 0, 0]}>
                  {/* Recessed Housing Circular Bezel */}
                  <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0, 0.6]}>
                    <cylinderGeometry args={[6.8, 6.8, 1.6, 32]} />
                    <meshStandardMaterial color="#0f172a" roughness={0.7} />
                  </mesh>
                  {/* Chrome Bezel Outer Ring */}
                  <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0, -0.1]}>
                    <ringGeometry args={[6.2, 7.6, 32]} />
                    <primitive object={polarisChromeChamferMat} attach="material" />
                  </mesh>
                  {/* 3D Extruded 5-Pointed Star Key ⭐ */}
                  <mesh geometry={polarisStarGeom} position={[0, 0, -0.6]} rotation={[0, Math.PI, 0]}>
                    <primitive object={polarisGoldBorderMat} attach="material" />
                  </mesh>
                </group>

                {/* Left 3D Embossed D-pad Cross ➕ (at X = -136.0) */}
                <group position={[-136.0, 0, 0]}>
                  {/* Recessed Circular Housing Bezel */}
                  <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0, 0.8]}>
                    <cylinderGeometry args={[9.6, 9.6, 1.8, 32]} />
                    <meshStandardMaterial color="#0f172a" roughness={0.8} />
                  </mesh>
                  <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0, -0.1]}>
                    <ringGeometry args={[9.2, 10.6, 32]} />
                    <primitive object={polarisChromeChamferMat} attach="material" />
                  </mesh>
                  {/* 3D Embossed D-pad Cross */}
                  <mesh position={[0, 0, -0.6]}>
                    <boxGeometry args={[14.2, 4.4, 2.2]} />
                    <meshStandardMaterial color="#1e293b" roughness={0.85} metalness={0.2} />
                  </mesh>
                  <mesh position={[0, 0, -0.6]}>
                    <boxGeometry args={[4.4, 14.2, 2.2]} />
                    <meshStandardMaterial color="#1e293b" roughness={0.85} metalness={0.2} />
                  </mesh>
                  {/* Center Concave Dish */}
                  <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0, -1.8]}>
                    <cylinderGeometry args={[1.8, 1.8, 0.4, 16]} />
                    <meshStandardMaterial color="#0f172a" roughness={0.9} />
                  </mesh>
                </group>

                {/* Right 3D Embossed D-pad Cross ➕ (at X = +136.0) */}
                <group position={[136.0, 0, 0]}>
                  <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0, 0.8]}>
                    <cylinderGeometry args={[9.6, 9.6, 1.8, 32]} />
                    <meshStandardMaterial color="#0f172a" roughness={0.8} />
                  </mesh>
                  <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0, -0.1]}>
                    <ringGeometry args={[9.2, 10.6, 32]} />
                    <primitive object={polarisChromeChamferMat} attach="material" />
                  </mesh>
                  <mesh position={[0, 0, -0.6]}>
                    <boxGeometry args={[14.2, 4.4, 2.2]} />
                    <meshStandardMaterial color="#1e293b" roughness={0.85} metalness={0.2} />
                  </mesh>
                  <mesh position={[0, 0, -0.6]}>
                    <boxGeometry args={[4.4, 14.2, 2.2]} />
                    <meshStandardMaterial color="#1e293b" roughness={0.85} metalness={0.2} />
                  </mesh>
                  <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0, -1.8]}>
                    <cylinderGeometry args={[1.8, 1.8, 0.4, 16]} />
                    <meshStandardMaterial color="#0f172a" roughness={0.9} />
                  </mesh>
                </group>

                {/* Horizontal Handheld Slider Rails */}
                {[-104.0, 104.0].map((rx, idx) => (
                  <group key={`polaris-rails-${idx}`} position={[rx, 0, 0]}>
                    {[-2.0, 0.0, 2.0].map((ry, j) => (
                      <mesh key={`rail-groove-${j}`} position={[0, ry, -0.2]}>
                        <boxGeometry args={[20.0, 0.8, 1.2]} />
                        <meshStandardMaterial color="#334155" roughness={0.4} metalness={0.8} />
                      </mesh>
                    ))}
                  </group>
                ))}
              </group>

              {/* R3. Dual Side Waistline Runway Neon Lightbars */}
              {/* Left Runway Lightbar */}
              <group position={[-W / 2 + 0.4, 1.5, 0]}>
                {/* Recessed Frame */}
                <mesh position={[-0.4, 0, 0]}>
                  <boxGeometry args={[1.6, 6.8, 76.0]} />
                  <meshStandardMaterial color="#334155" roughness={0.5} metalness={0.7} />
                </mesh>
                {/* Frosted Acrylic Runway Diffuser Lens */}
                <mesh position={[-0.8, 0, 0]}>
                  <boxGeometry args={[1.8, 4.6, 70.0]} />
                  <meshStandardMaterial
                    ref={leftLightRef}
                    color="#38bdf8"
                    emissive="#0284c7"
                    emissiveIntensity={2.0}
                    roughness={0.15}
                    transparent
                    opacity={0.94}
                  />
                </mesh>
                {/* Runway Semicircular End Caps */}
                {[-35.0, 35.0].map((ez, k) => (
                  <mesh key={`l-cap-${k}`} position={[-0.8, 0, ez]} rotation={[0, 0, 0]}>
                    <cylinderGeometry args={[2.3, 2.3, 1.8, 16]} />
                    <meshStandardMaterial
                      color="#38bdf8"
                      emissive="#0284c7"
                      emissiveIntensity={2.0}
                      roughness={0.15}
                      transparent
                      opacity={0.94}
                    />
                  </mesh>
                ))}
                {/* Side Desk Illuminating Point Light */}
                <pointLight
                  ref={leftPointLightRef}
                  position={[-6.0, 0, 0]}
                  color="#38bdf8"
                  intensity={0.5}
                  distance={38}
                />
              </group>

              {/* Right Runway Lightbar */}
              <group position={[W / 2 - 0.4, 1.5, 0]}>
                <mesh position={[0.4, 0, 0]}>
                  <boxGeometry args={[1.6, 6.8, 76.0]} />
                  <meshStandardMaterial color="#334155" roughness={0.5} metalness={0.7} />
                </mesh>
                <mesh position={[0.8, 0, 0]}>
                  <boxGeometry args={[1.8, 4.6, 70.0]} />
                  <meshStandardMaterial
                    ref={rightLightRef}
                    color="#f472b6"
                    emissive="#db2777"
                    emissiveIntensity={2.0}
                    roughness={0.15}
                    transparent
                    opacity={0.94}
                  />
                </mesh>
                {[-35.0, 35.0].map((ez, k) => (
                  <mesh key={`r-cap-${k}`} position={[0.8, 0, ez]}>
                    <cylinderGeometry args={[2.3, 2.3, 1.8, 16]} />
                    <meshStandardMaterial
                      color="#f472b6"
                      emissive="#db2777"
                      emissiveIntensity={2.0}
                      roughness={0.15}
                      transparent
                      opacity={0.94}
                    />
                  </mesh>
                ))}
                <pointLight
                  ref={rightPointLightRef}
                  position={[6.0, 0, 0]}
                  color="#f472b6"
                  intensity={0.5}
                  distance={38}
                />
              </group>
            </>
          )}
        </group>
      )}

      {/* 2. CNC Bottom Chassis & Base Plate */}
      {showBottom && (
        <group position={[0, bottomCaseY, 0]}>
          <mesh geometry={bottomCaseGeom} material={caseMat} castShadow receiveShadow />
          <mesh position={[0, -2.9, 0]} geometry={bottomBasePlateGeom} material={caseMat} receiveShadow />

          {/* Standard rubber non-slip feet */}
          {!isRx78 && !isPolaris && (
            <>
              <mesh position={[-W / 2 + 25.0, -5.3, -D / 2 + 15.0]}>
                <boxGeometry args={[24.0, 1.6, 6.0]} />
                <meshStandardMaterial color="#1f2937" roughness={0.95} />
              </mesh>
              <mesh position={[W / 2 - 25.0, -5.3, -D / 2 + 15.0]}>
                <boxGeometry args={[24.0, 1.6, 6.0]} />
                <meshStandardMaterial color="#1f2937" roughness={0.95} />
              </mesh>
              <mesh position={[-W / 2 + 25.0, -5.3, D / 2 - 15.0]}>
                <boxGeometry args={[24.0, 1.6, 6.0]} />
                <meshStandardMaterial color="#1f2937" roughness={0.95} />
              </mesh>
              <mesh position={[W / 2 - 25.0, -5.3, D / 2 - 15.0]}>
                <boxGeometry args={[24.0, 1.6, 6.0]} />
                <meshStandardMaterial color="#1f2937" roughness={0.95} />
              </mesh>
            </>
          )}

          {/* Polaris 80: 4 Oblong Black Silicone Rubber Anti-Slip Feet (2 Top, 2 Bottom) */}
          {isPolaris && (
            <>
              {[-W / 2 + 35.0, W / 2 - 35.0].map((fx, i) => (
                <group key={`polaris-foot-top-${i}`} position={[fx, -5.3, -D / 2 + 12.0]}>
                  <mesh>
                    <boxGeometry args={[28.0, 1.6, 6.2]} />
                    <primitive object={rubberFootMat} attach="material" />
                  </mesh>
                  <mesh position={[-14.0, 0, 0]}>
                    <cylinderGeometry args={[3.1, 3.1, 1.6, 16]} />
                    <primitive object={rubberFootMat} attach="material" />
                  </mesh>
                  <mesh position={[14.0, 0, 0]}>
                    <cylinderGeometry args={[3.1, 3.1, 1.6, 16]} />
                    <primitive object={rubberFootMat} attach="material" />
                  </mesh>
                </group>
              ))}
              {[-W / 2 + 35.0, W / 2 - 35.0].map((fx, i) => (
                <group key={`polaris-foot-bot-${i}`} position={[fx, -5.3, D / 2 - 12.0]}>
                  <mesh>
                    <boxGeometry args={[28.0, 1.6, 6.2]} />
                    <primitive object={rubberFootMat} attach="material" />
                  </mesh>
                  <mesh position={[-14.0, 0, 0]}>
                    <cylinderGeometry args={[3.1, 3.1, 1.6, 16]} />
                    <primitive object={rubberFootMat} attach="material" />
                  </mesh>
                  <mesh position={[14.0, 0, 0]}>
                    <cylinderGeometry args={[3.1, 3.1, 1.6, 16]} />
                    <primitive object={rubberFootMat} attach="material" />
                  </mesh>
                </group>
              ))}
            </>
          )}

          {/* Gundam RX-78 Dual Pill-shaped Rubber Feet (Left and Right Flanks) */}
          {isRx78 && (
            <>
              <mesh position={[-W / 2 + 16.0, -5.3, 0]} rotation={[Math.PI / 2, 0, 0]}>
                <cylinderGeometry args={[2.8, 2.8, 38.0, 16]} />
                <primitive object={rubberFootMat} attach="material" />
              </mesh>
              <mesh position={[W / 2 - 16.0, -5.3, 0]} rotation={[Math.PI / 2, 0, 0]}>
                <cylinderGeometry args={[2.8, 2.8, 38.0, 16]} />
                <primitive object={rubberFootMat} attach="material" />
              </mesh>
            </>
          )}
        </group>
      )}

      {/* 3. Underside Signature Weight */}
      {showBottom && (
        <group position={[0, weightY, 0]}>
          {isRx78 ? (
            /* High-Precision Gundam RX-78 Dual-Module 3D CNC Relief Backplate */
            <group>
              <mesh position={[0, 0, 0]}>
                <boxGeometry args={[236.0, 3.2, 78.0]} />
                <meshStandardMaterial color="#0f172a" roughness={0.7} metalness={0.5} />
              </mesh>

              <mesh position={[0, -1.75, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                <planeGeometry args={[232.0, 74.0]} />
                <meshStandardMaterial map={rx78Texture} roughness={0.25} metalness={0.35} />
              </mesh>

              <mesh position={[0, -1.95, -19.5]}>
                <boxGeometry args={[70.0, 0.6, 25.0]} />
                <primitive object={goldSlatMat} attach="material" />
              </mesh>

              <mesh position={[0, -1.9, 9.0]}>
                <boxGeometry args={[220.0, 0.5, 50.0]} />
                <meshStandardMaterial color="#0891b2" metalness={0.75} roughness={0.3} />
              </mesh>

              <mesh position={[68.0, -2.1, 19.0]}>
                <boxGeometry args={[76.0, 0.7, 22.0]} />
                <meshStandardMaterial color="#ea580c" metalness={0.4} roughness={0.4} />
              </mesh>

              {[-104, 104].map((sx, i) =>
                [-28, 28].map((sz, j) => (
                  <group key={`rx78-screw-${i}-${j}`} position={[sx, -1.9, sz]}>
                    <mesh>
                      <cylinderGeometry args={[1.8, 1.8, 0.9, 16]} />
                      <primitive object={goldSlatMat} attach="material" />
                    </mesh>
                    <mesh position={[0, -0.46, 0]}>
                      <cylinderGeometry args={[0.7, 0.7, 0.3, 6]} />
                      <meshStandardMaterial color="#1e293b" roughness={0.9} />
                    </mesh>
                  </group>
                ))
              )}
            </group>
          ) : isPolaris ? (
            /* ============================================================== */
            /* Polaris 80: R1 Underside Dual-Layer CNC Weight & 3D Hexagram   */
            /* ============================================================== */
            <group>
              {/* Outer PVD Gold Border */}
              <mesh geometry={polarisGoldBorderGeom} material={polarisGoldBorderMat} castShadow receiveShadow />

              {/* Gold Border High-DPI Procedural Decal with PlayStation Symbols & Markings */}
              <mesh position={[0, -2.42, 0]} rotation={[Math.PI / 2, 0, 0]}>
                <planeGeometry args={[296.0, 74.0]} />
                <meshStandardMaterial
                  map={polarisGoldTexture}
                  roughness={0.18}
                  metalness={0.86}
                  transparent
                  opacity={0.99}
                  depthWrite={false}
                  side={THREE.DoubleSide}
                />
              </mesh>

              {/* 3D Embossed PlayStation Symbols & Directional Arrows on Outer Gold Border */}
              <group position={[0, -2.44, 0]}>
                {/* 3D Directional Arrows: Left ◀ and Right ▶ */}
                <mesh position={[-140.0, 0, 0]} rotation={[Math.PI / 2, 0, Math.PI / 2]}>
                  <cylinderGeometry args={[2.5, 2.5, 0.6, 3]} />
                  <primitive object={polarisGoldBorderMat} attach="material" />
                </mesh>
                <mesh position={[140.0, 0, 0]} rotation={[Math.PI / 2, 0, -Math.PI / 2]}>
                  <cylinderGeometry args={[2.5, 2.5, 0.6, 3]} />
                  <primitive object={polarisGoldBorderMat} attach="material" />
                </mesh>

                {/* 3D PlayStation Symbols in 4 Corners: ▲ ■ ● ✖ */}
                {/* Top-Left Corner */}
                <group position={[-125.0, 0, -28.5]}>
                  <mesh position={[-10.0, 0, 0]} rotation={[Math.PI / 2, 0, 0]}>
                    <cylinderGeometry args={[2.0, 2.0, 0.6, 3]} />
                    <primitive object={polarisGoldBorderMat} attach="material" />
                  </mesh>
                  <mesh position={[-3.5, 0, 0]}>
                    <boxGeometry args={[3.2, 0.6, 3.2]} />
                    <primitive object={polarisGoldBorderMat} attach="material" />
                  </mesh>
                  <mesh position={[3.5, 0, 0]} rotation={[Math.PI / 2, 0, 0]}>
                    <cylinderGeometry args={[1.8, 1.8, 0.6, 20]} />
                    <primitive object={polarisGoldBorderMat} attach="material" />
                  </mesh>
                  <group position={[10.0, 0, 0]} rotation={[0, Math.PI / 4, 0]}>
                    <mesh><boxGeometry args={[3.6, 0.6, 1.0]} /><primitive object={polarisGoldBorderMat} attach="material" /></mesh>
                    <mesh><boxGeometry args={[1.0, 0.6, 3.6]} /><primitive object={polarisGoldBorderMat} attach="material" /></mesh>
                  </group>
                </group>

                {/* Bottom-Left Corner */}
                <group position={[-125.0, 0, 28.5]}>
                  <mesh position={[-10.0, 0, 0]} rotation={[Math.PI / 2, 0, 0]}>
                    <cylinderGeometry args={[2.0, 2.0, 0.6, 3]} />
                    <primitive object={polarisGoldBorderMat} attach="material" />
                  </mesh>
                  <mesh position={[-3.5, 0, 0]}>
                    <boxGeometry args={[3.2, 0.6, 3.2]} />
                    <primitive object={polarisGoldBorderMat} attach="material" />
                  </mesh>
                  <mesh position={[3.5, 0, 0]} rotation={[Math.PI / 2, 0, 0]}>
                    <cylinderGeometry args={[1.8, 1.8, 0.6, 20]} />
                    <primitive object={polarisGoldBorderMat} attach="material" />
                  </mesh>
                  <group position={[10.0, 0, 0]} rotation={[0, Math.PI / 4, 0]}>
                    <mesh><boxGeometry args={[3.6, 0.6, 1.0]} /><primitive object={polarisGoldBorderMat} attach="material" /></mesh>
                    <mesh><boxGeometry args={[1.0, 0.6, 3.6]} /><primitive object={polarisGoldBorderMat} attach="material" /></mesh>
                  </group>
                </group>

                {/* Top-Right Corner */}
                <group position={[125.0, 0, -28.5]}>
                  <mesh position={[-10.0, 0, 0]} rotation={[Math.PI / 2, 0, 0]}>
                    <cylinderGeometry args={[2.0, 2.0, 0.6, 3]} />
                    <primitive object={polarisGoldBorderMat} attach="material" />
                  </mesh>
                  <mesh position={[-3.5, 0, 0]}>
                    <boxGeometry args={[3.2, 0.6, 3.2]} />
                    <primitive object={polarisGoldBorderMat} attach="material" />
                  </mesh>
                  <mesh position={[3.5, 0, 0]} rotation={[Math.PI / 2, 0, 0]}>
                    <cylinderGeometry args={[1.8, 1.8, 0.6, 20]} />
                    <primitive object={polarisGoldBorderMat} attach="material" />
                  </mesh>
                  <group position={[10.0, 0, 0]} rotation={[0, Math.PI / 4, 0]}>
                    <mesh><boxGeometry args={[3.6, 0.6, 1.0]} /><primitive object={polarisGoldBorderMat} attach="material" /></mesh>
                    <mesh><boxGeometry args={[1.0, 0.6, 3.6]} /><primitive object={polarisGoldBorderMat} attach="material" /></mesh>
                  </group>
                </group>

                {/* Bottom-Right Corner */}
                <group position={[125.0, 0, 28.5]}>
                  <mesh position={[-10.0, 0, 0]} rotation={[Math.PI / 2, 0, 0]}>
                    <cylinderGeometry args={[2.0, 2.0, 0.6, 3]} />
                    <primitive object={polarisGoldBorderMat} attach="material" />
                  </mesh>
                  <mesh position={[-3.5, 0, 0]}>
                    <boxGeometry args={[3.2, 0.6, 3.2]} />
                    <primitive object={polarisGoldBorderMat} attach="material" />
                  </mesh>
                  <mesh position={[3.5, 0, 0]} rotation={[Math.PI / 2, 0, 0]}>
                    <cylinderGeometry args={[1.8, 1.8, 0.6, 20]} />
                    <primitive object={polarisGoldBorderMat} attach="material" />
                  </mesh>
                  <group position={[10.0, 0, 0]} rotation={[0, Math.PI / 4, 0]}>
                    <mesh><boxGeometry args={[3.6, 0.6, 1.0]} /><primitive object={polarisGoldBorderMat} attach="material" /></mesh>
                    <mesh><boxGeometry args={[1.0, 0.6, 3.6]} /><primitive object={polarisGoldBorderMat} attach="material" /></mesh>
                  </group>
                </group>
              </group>

              {/* Inner Mirror PVD Silver Plate */}
              <mesh
                geometry={polarisMirrorPlateGeom}
                material={polarisMirrorPlateMat}
                position={[0, -0.3, 0]}
                receiveShadow
              />

              {/* Twin Engraved Horizontal Groove Lines traversing the Mirror Plate */}
              {/* Upper Groove (Z = -13.0) */}
              <mesh position={[-76.0, -2.02, -13.0]}>
                <boxGeometry args={[100.0, 0.35, 1.2]} />
                <meshStandardMaterial color="#334155" metalness={0.85} roughness={0.25} />
              </mesh>
              <mesh position={[76.0, -2.02, -13.0]}>
                <boxGeometry args={[100.0, 0.35, 1.2]} />
                <meshStandardMaterial color="#334155" metalness={0.85} roughness={0.25} />
              </mesh>

              {/* Lower Groove (Z = +13.0) */}
              <mesh position={[-76.0, -2.02, 13.0]}>
                <boxGeometry args={[100.0, 0.35, 1.2]} />
                <meshStandardMaterial color="#334155" metalness={0.85} roughness={0.25} />
              </mesh>
              <mesh position={[76.0, -2.02, 13.0]}>
                <boxGeometry args={[100.0, 0.35, 1.2]} />
                <meshStandardMaterial color="#334155" metalness={0.85} roughness={0.25} />
              </mesh>

              {/* Central 3D Pure Metal Polyhedral Hexagram Medallion */}
              {/* Top & bottom points (Z = ±25.5) bite into the outer gold border frame */}
              <group position={[0, -1.8, 0]}>
                {/* Interlaced Equilateral Triangle 1 (Pointing UP) */}
                <mesh
                  geometry={polarisHexTriangleUpGeom}
                  material={polarisHexagramMat}
                  position={[0, -0.2, 0]}
                  castShadow
                  receiveShadow
                />

                {/* Interlaced Equilateral Triangle 2 (Pointing DOWN) */}
                <mesh
                  geometry={polarisHexTriangleDownGeom}
                  material={polarisHexagramMat}
                  position={[0, -0.2, 0]}
                  castShadow
                  receiveShadow
                />

                {/* Central Hexagonal Hub */}
                <mesh position={[0, -0.3, 0]}>
                  <cylinderGeometry args={[12.5, 12.5, 2.6, 6]} />
                  <primitive object={polarisHexagramMat} attach="material" />
                </mesh>
                {/* Central Hexagonal Cavity / Recess */}
                <mesh position={[0, -1.4, 0]}>
                  <cylinderGeometry args={[8.5, 8.5, 1.0, 6]} />
                  <meshStandardMaterial color="#090d16" roughness={0.5} metalness={0.9} />
                </mesh>
                {/* Center Faceted Gold Star Emblem Core */}
                <mesh position={[0, -1.6, 0]}>
                  <cylinderGeometry args={[5.2, 5.2, 0.8, 6]} />
                  <primitive object={polarisGoldBorderMat} attach="material" />
                </mesh>

                {/* 6 Faceted Diamond Bevel Cut Pyramids at Outer Star Tips */}
                {[0, 1, 2, 3, 4, 5].map((idx) => {
                  const angle = (idx * Math.PI) / 3 + Math.PI / 6;
                  const dist = 21.5;
                  const px = dist * Math.cos(angle);
                  const pz = dist * Math.sin(angle);
                  return (
                    <mesh
                      key={`hex-diamond-tip-${idx}`}
                      position={[px, -0.6, pz]}
                      rotation={[0, -angle + Math.PI / 2, Math.PI / 2]}
                    >
                      <coneGeometry args={[3.6, 8.5, 4]} />
                      <primitive object={polarisHexagramMat} attach="material" />
                    </mesh>
                  );
                })}
              </group>

              {/* 4 Corner Gold Retention Screws */}
              {[-140.0, 140.0].map((sx, i) =>
                [-30.0, 30.0].map((sz, j) => (
                  <group key={`polaris-screw-${i}-${j}`} position={[sx, -2.42, sz]}>
                    <mesh>
                      <cylinderGeometry args={[1.8, 1.8, 0.8, 16]} />
                      <primitive object={polarisGoldBorderMat} attach="material" />
                    </mesh>
                    <mesh position={[0, -0.42, 0]}>
                      <cylinderGeometry args={[0.7, 0.7, 0.3, 6]} />
                      <meshStandardMaterial color="#78350f" roughness={0.8} />
                    </mesh>
                  </group>
                ))
              )}
            </group>
          ) : (
            <>
              <mesh geometry={weightGeom} material={weightMat} castShadow receiveShadow />

              {/* EveningStar 75 Celestial Star Emblem on Weight */}
              {model === 'eveningstar75' && (
                <mesh position={[0, -2.0, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                  <ringGeometry args={[8.0, 9.5, 32]} />
                  <meshStandardMaterial color="#fef08a" metalness={0.9} roughness={0.1} />
                </mesh>
              )}

              {/* Torx Screws on Weight Corners */}
              {[-W / 3, W / 3].map((sx, i) =>
                [-18, 18].map((sz, j) => (
                  <mesh key={`screw-${i}-${j}`} position={[sx, -1.8, sz]}>
                    <cylinderGeometry args={[1.5, 1.5, 0.6, 12]} />
                    <meshStandardMaterial color="#94a3b8" metalness={0.95} roughness={0.2} />
                  </mesh>
                ))
              )}
            </>
          )}
        </group>
      )}
    </group>
  );
};
