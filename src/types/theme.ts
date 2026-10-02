import { KeycapMaterialType } from './keyboard';

export interface KeycapPaletteGroup {
  top: string;
  legend: string;
}

export interface KeycapThemePreset {
  id: string;
  name: string;
  description: string;
  designer: string;
  palette: {
    alphas: KeycapPaletteGroup;
    modifiers: KeycapPaletteGroup;
    accents: KeycapPaletteGroup;
    spacebar?: KeycapPaletteGroup;
  };
  recommendedCase: string;
  recommendedWeight: 'brass_pvd' | 'mirror_chroma' | 'matte_black' | 'anodized_gold' | 'rx78_mecha';
  defaultMaterial: KeycapMaterialType;
}
