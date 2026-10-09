export type KeyboardModelId = 'eveningstar75' | 'mrsuit80' | 'tofu60' | 'bakeneko65' | 'polaris_pad17';

export type GasketLayerId =
  | 'keycaps'
  | 'switches'
  | 'plate'
  | 'poron_ixpe'
  | 'pcb'
  | 'case_foam'
  | 'bottom_case_weight';

export type KeyRegion =
  | 'alphas'
  | 'modifiers'
  | 'accents'
  | 'accent'
  | 'function'
  | 'nav'
  | 'numpad';

export type KeycapMaterialType = 'pbt' | 'abs';
export type KeycapProfile = 'cherry' | 'oem' | 'xda' | 'sa';

export type SwitchType = 'linear' | 'clicky' | 'tactile';

export type SwitchModelId =
  | 'cherry_red'
  | 'gateron_yellow'
  | 'cherry_blue'
  | 'holy_panda'
  | 'kailh_box_jade';

export type CameraPreset = 'default' | 'top' | 'front' | 'back' | 'side' | 'iso';

export interface KeycapColorEntry {
  topColor: string;
  legendColor: string;
}

export interface KeycapMaterialParams {
  type: KeycapMaterialType;
  roughness: number;         // PBT: ~0.72, ABS: ~0.18
  metalness: number;         // ~0.04
  clearcoat: number;         // PBT: 0.0, ABS: ~0.85
  clearcoatRoughness: number;// ABS: ~0.10
}

export interface KeyDefinition {
  id: string;          // e.g. 'Key_Esc', 'Key_A'
  code: string;        // KeyboardEvent.code: 'Escape', 'KeyA'
  label: string;       // Display label: 'ESC', 'A', 'ENTER'
  subLabel?: string;   // Secondary label: '~', '!', 'F1'
  unitWidth: number;   // 1.0, 1.25, 1.5, 1.75, 2.0, 2.25, 2.75, 6.25
  unitHeight?: number; // default 1.0
  row: number;         // Row index from top (0 to 5)
  gridX: number;       // Horizontal layout unit position in U
  gridY: number;       // Vertical layout unit position in U
  region: KeyRegion;   // 'alphas' | 'modifiers' | 'accents' | 'function' | 'nav'
  profileRow: 'R1' | 'R2' | 'R3' | 'R4'; // For sculpted keycaps
}

export interface KeyboardDimensions {
  width: number;       // in mm
  depth: number;       // in mm
  frontHeight: number; // in mm
  rearHeight: number;  // in mm
  typingAngleDeg: number; // e.g. 7.0 or 6.8
  bezelWidth: number;
}

export interface KeyboardLayoutDefinition {
  model: KeyboardModelId;
  name: string;
  keyCount: number;
  dimensions: KeyboardDimensions;
  keys: KeyDefinition[];
}

export type WeightMaterialId =
  | 'brass_pvd'
  | 'mirror_chroma'
  | 'matte_black'
  | 'anodized_gold'
  | 'rx78_mecha'
  | 'polaris_hexagram';

export interface KeyboardConfigV1 {
  version: 1;
  name: string;
  timestamp: number;
  model: KeyboardModelId;
  caseColor: string;
  caseFinish: 'anodized' | 'e_white' | 'raw_alu';
  weightMaterial: WeightMaterialId;
  plateMaterial: 'aluminum' | 'fr4' | 'brass' | 'polycarbonate';
  switchType: SwitchType;
  switchModel: SwitchModelId;
  keycapMaterial: KeycapMaterialType;
  themePreset: string | null;
  keycapColorOverrides: Record<string, string>;
  explodedViewProgress: number;
  dampeningFoamInstalled: boolean;
}

export type KeyboardCategory = 'main' | 'pad';

export interface KeyboardCategoryDefinition {
  id: KeyboardCategory;
  name: string;
  icon: string;
  description: string;
  models: KeyboardModelId[];
}

export const KEYBOARD_CATEGORIES: KeyboardCategoryDefinition[] = [
  {
    id: 'main',
    name: '主力键盘',
    icon: '⌨️',
    description: '标准与紧凑主力配列 (60% ~ 80%)',
    models: ['eveningstar75', 'mrsuit80', 'bakeneko65', 'tofu60'],
  },
  {
    id: 'pad',
    name: '独立数字 PAD',
    icon: '🔢',
    description: '独立小键盘 / 数字输入矩阵 (17 键)',
    models: ['polaris_pad17'],
  },
];
