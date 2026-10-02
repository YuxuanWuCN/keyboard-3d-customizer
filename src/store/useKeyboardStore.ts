import { create } from 'zustand';
import {
  KeyboardModelId,
  GasketLayerId,
  KeyRegion,
  KeycapMaterialParams,
  KeycapProfile,
  SwitchModelId,
  SwitchType,
  CameraPreset,
  KeyboardConfigV1,
} from '../types/keyboard';
import { THEME_PRESETS } from '../constants/themePresets';
import { KEYBOARD_LAYOUTS } from '../constants/keyboardLayouts';
import { soundEngine } from '../audio/ProceduralSoundEngine';
import { calculateTelemetry, getRandomPrompt, SAMPLE_TYPING_PROMPTS } from '../utils/telemetry';
import { KeystrokeEvent, TypingTelemetry } from '../types/audio';

export interface KeyboardState {
  // Layout & Case
  model: KeyboardModelId;
  caseColor: string;
  caseFinish: 'anodized' | 'e_white' | 'raw_alu';
  weightMaterial: 'brass_pvd' | 'mirror_chroma' | 'matte_black' | 'anodized_gold';
  explodedProgress: number; // 0.0 to 1.0
  isolatedLayer: GasketLayerId | null;
  layerVisibility: Record<GasketLayerId, boolean>;

  // Keycap Customization
  selectedKeyIds: string[];
  selectionMode: 'single' | 'multi' | 'region';
  activePresetTheme: string | null;
  keycapColorOverrides: Record<string, string>; // keyId -> topColor
  keycapMaterial: KeycapMaterialParams;
  keycapProfile: KeycapProfile;

  // Switches & Acoustics
  switchType: SwitchType;
  switchModel: SwitchModelId;
  volume: number;
  muted: boolean;
  foamDamping: boolean;

  // Active Keys (for physics & sandbox)
  activePressedKeys: string[];

  // Typing Sandbox & Telemetry
  sandboxOpen: boolean;
  sampleText: string;
  typedText: string;
  telemetry: TypingTelemetry;
  keystrokeHistory: KeystrokeEvent[];
  sessionStartTime: number | null;

  // Viewport & Lighting
  cameraPreset: CameraPreset;
  lightingMode: 'studio' | 'cyber_neon' | 'warm_wood' | 'dark_minimal';
  autoRotate: boolean;

  // Actions
  setModel: (model: KeyboardModelId) => void;
  setCaseColor: (color: string, finish?: KeyboardState['caseFinish']) => void;
  setWeightMaterial: (weight: KeyboardState['weightMaterial']) => void;
  setExplodedProgress: (progress: number) => void;
  setIsolatedLayer: (layer: GasketLayerId | null) => void;
  toggleLayerVisibility: (layer: GasketLayerId) => void;
  setAllLayersVisible: () => void;

  selectKey: (keyId: string, multiSelect?: boolean) => void;
  selectRegion: (region: KeyRegion | 'all' | 'accents_batch') => void;
  selectEscEnterSpace: () => void;
  invertSelection: () => void;
  clearSelection: () => void;
  selectAllKeys: () => void;
  setKeycapColor: (keyIds: string[], topColor: string) => void;
  setKeycapMaterial: (params: Partial<KeycapMaterialParams>) => void;
  applyPresetTheme: (themeId: string) => void;

  setSwitchType: (type: SwitchType) => void;
  setSwitchModel: (switchId: SwitchModelId) => void;
  setVolume: (volume: number) => void;
  setMuted: (muted: boolean) => void;
  setFoamDamping: (enabled: boolean) => void;

  handleKeyDown: (code: string) => void;
  handleKeyUp: (code: string) => void;

  // Typing Sandbox Actions
  setSandboxOpen: (open: boolean) => void;
  setSampleText: (text: string) => void;
  handleTypingInput: (text: string) => void;
  resetTypingSession: () => void;
  nextSamplePrompt: () => void;

  setCameraPreset: (preset: CameraPreset) => void;
  setLightingMode: (mode: KeyboardState['lightingMode']) => void;
  toggleAutoRotate: () => void;

  exportConfiguration: () => KeyboardConfigV1;
  importConfiguration: (config: KeyboardConfigV1) => boolean;
  resetDefaults: () => void;
}

const defaultLayers: Record<GasketLayerId, boolean> = {
  keycaps: true,
  switches: true,
  plate: true,
  poron_ixpe: true,
  pcb: true,
  case_foam: true,
  bottom_case_weight: true,
};

export const useKeyboardStore = create<KeyboardState>((set, get) => ({
  model: 'eveningstar75',
  caseColor: '#1e2330', // Deep midnight navy anodized
  caseFinish: 'anodized',
  weightMaterial: 'brass_pvd',
  explodedProgress: 0.0,
  isolatedLayer: null,
  layerVisibility: { ...defaultLayers },

  selectedKeyIds: [],
  selectionMode: 'single',
  activePresetTheme: 'retro_9009',
  keycapColorOverrides: {},
  keycapMaterial: {
    type: 'pbt',
    roughness: 0.72,
    metalness: 0.04,
    clearcoat: 0.0,
    clearcoatRoughness: 0.0,
  },
  keycapProfile: 'cherry',

  switchType: 'linear',
  switchModel: 'cherry_red',
  volume: 0.8,
  muted: false,
  foamDamping: true,

  activePressedKeys: [],

  // Typing Sandbox State
  sandboxOpen: false,
  sampleText: getRandomPrompt(),
  typedText: '',
  telemetry: {
    wpm: 0,
    rawWpm: 0,
    accuracy: 100,
    totalKeystrokes: 0,
    correctKeystrokes: 0,
    errorCount: 0,
    streak: 0,
    elapsedSeconds: 0,
  },
  keystrokeHistory: [],
  sessionStartTime: null,

  cameraPreset: 'default',
  lightingMode: 'studio',
  autoRotate: false,

  setModel: (model) => {
    soundEngine.setCaseModel(model);
    set({
      model,
      selectedKeyIds: [],
      // Auto adjust case color for iconic look if user switches
      caseColor:
        model === 'eveningstar75'
          ? '#1e2330'
          : model === 'mrsuit80'
          ? '#2b2d38'
          : '#383b42',
    });
  },

  setCaseColor: (caseColor, caseFinish) =>
    set((state) => ({
      caseColor,
      caseFinish: caseFinish || state.caseFinish,
    })),

  setWeightMaterial: (weightMaterial) => set({ weightMaterial }),

  setExplodedProgress: (explodedProgress) =>
    set({ explodedProgress: Math.max(0, Math.min(1, explodedProgress)) }),

  setIsolatedLayer: (isolatedLayer) => set({ isolatedLayer }),

  toggleLayerVisibility: (layer) =>
    set((state) => ({
      layerVisibility: {
        ...state.layerVisibility,
        [layer]: !state.layerVisibility[layer],
      },
    })),

  setAllLayersVisible: () => set({ layerVisibility: { ...defaultLayers }, isolatedLayer: null }),

  selectKey: (keyId, multiSelect = false) => {
    set((state) => {
      if (!multiSelect) {
        return { selectedKeyIds: [keyId] };
      }
      const exists = state.selectedKeyIds.includes(keyId);
      return {
        selectedKeyIds: exists
          ? state.selectedKeyIds.filter((id) => id !== keyId)
          : [...state.selectedKeyIds, keyId],
      };
    });
  },

  selectRegion: (region) => {
    const layout = KEYBOARD_LAYOUTS[get().model];
    let matching: string[] = [];
    if (region === 'alphas') {
      matching = layout.keys.filter((k) => k.region === 'alphas').map((k) => k.id);
    } else if (region === 'modifiers') {
      matching = layout.keys
        .filter((k) => k.region === 'modifiers' || k.region === 'function' || k.region === 'nav')
        .map((k) => k.id);
    } else if (region === 'accents' || region === 'accent' || region === 'accents_batch') {
      matching = layout.keys
        .filter(
          (k) =>
            k.region === 'accent' ||
            k.region === 'accents' ||
            ['Escape', 'Enter', 'Space'].includes(k.code)
        )
        .map((k) => k.id);
    } else if (region === 'all') {
      matching = layout.keys.map((k) => k.id);
    } else {
      matching = layout.keys.filter((k) => k.region === region).map((k) => k.id);
    }
    set({ selectedKeyIds: matching });
  },

  selectEscEnterSpace: () => {
    const layout = KEYBOARD_LAYOUTS[get().model];
    const matching = layout.keys
      .filter((k) => ['Escape', 'Enter', 'Space'].includes(k.code))
      .map((k) => k.id);
    set({ selectedKeyIds: matching });
  },

  invertSelection: () => {
    const layout = KEYBOARD_LAYOUTS[get().model];
    const current = get().selectedKeyIds;
    const inverted = layout.keys.filter((k) => !current.includes(k.id)).map((k) => k.id);
    set({ selectedKeyIds: inverted });
  },

  clearSelection: () => set({ selectedKeyIds: [] }),

  selectAllKeys: () => {
    const layout = KEYBOARD_LAYOUTS[get().model];
    set({ selectedKeyIds: layout.keys.map((k) => k.id) });
  },

  setKeycapColor: (keyIds, topColor) => {
    set((state) => {
      const updated = { ...state.keycapColorOverrides };
      keyIds.forEach((id) => {
        updated[id] = topColor;
      });
      return { keycapColorOverrides: updated, activePresetTheme: null };
    });
  },

  setKeycapMaterial: (params) =>
    set((state) => {
      const newType = params.type || state.keycapMaterial.type;
      const isPBT = newType === 'pbt';
      return {
        keycapMaterial: {
          ...state.keycapMaterial,
          ...params,
          type: newType,
          roughness: params.roughness ?? (isPBT ? 0.72 : 0.18),
          clearcoat: params.clearcoat ?? (isPBT ? 0.0 : 0.85),
          clearcoatRoughness: params.clearcoatRoughness ?? (isPBT ? 0.0 : 0.1),
        },
      };
    }),

  applyPresetTheme: (themeId) => {
    const theme = THEME_PRESETS[themeId];
    if (!theme) return;
    const layout = KEYBOARD_LAYOUTS[get().model];
    const overrides: Record<string, string> = {};

    layout.keys.forEach((key) => {
      if (key.code === 'Space' && theme.palette.spacebar) {
        overrides[key.id] = theme.palette.spacebar.top;
      } else if (key.region === 'alphas') {
        overrides[key.id] = theme.palette.alphas.top;
      } else if (key.region === 'modifiers' || key.region === 'function') {
        overrides[key.id] = theme.palette.modifiers.top;
      } else if (key.region === 'accent' || key.region === 'nav') {
        overrides[key.id] = theme.palette.accents.top;
      } else {
        overrides[key.id] = theme.palette.alphas.top;
      }
    });

    set({
      activePresetTheme: themeId,
      keycapColorOverrides: overrides,
      keycapMaterial: {
        type: theme.defaultMaterial,
        roughness: theme.defaultMaterial === 'pbt' ? 0.72 : 0.18,
        metalness: 0.04,
        clearcoat: theme.defaultMaterial === 'pbt' ? 0.0 : 0.85,
        clearcoatRoughness: theme.defaultMaterial === 'pbt' ? 0.0 : 0.1,
      },
    });
  },

  setSwitchType: (switchType) => {
    let switchModel: SwitchModelId = 'cherry_red';
    if (switchType === 'clicky') switchModel = 'cherry_blue';
    if (switchType === 'tactile') switchModel = 'holy_panda';
    set({ switchType, switchModel });
  },

  setSwitchModel: (switchModel) => {
    let switchType: SwitchType = 'linear';
    if (switchModel === 'cherry_blue' || switchModel === 'kailh_box_jade') switchType = 'clicky';
    if (switchModel === 'holy_panda') switchType = 'tactile';
    set({ switchModel, switchType });
  },

  setVolume: (volume) => {
    const clamped = Math.max(0, Math.min(1, volume));
    soundEngine.setVolume(clamped);
    set({ volume: clamped });
  },

  setMuted: (muted) => {
    soundEngine.setMuted(muted);
    set({ muted });
  },

  setFoamDamping: (foamDamping) => {
    soundEngine.setFoamDamping(foamDamping);
    set({ foamDamping });
  },

  handleKeyDown: (code) => {
    const s = get();
    soundEngine.playKeyDown(code, s.switchType, s.foamDamping);
    set((state) => {
      if (state.activePressedKeys.includes(code)) return state;
      return { activePressedKeys: [...state.activePressedKeys, code] };
    });
  },

  handleKeyUp: (code) => {
    const s = get();
    soundEngine.playKeyUp(code, s.switchType, s.foamDamping);
    set((state) => ({
      activePressedKeys: state.activePressedKeys.filter((c) => c !== code),
    }));
  },

  setSandboxOpen: (sandboxOpen) => set({ sandboxOpen }),

  setSampleText: (sampleText) =>
    set({
      sampleText,
      typedText: '',
      sessionStartTime: null,
      telemetry: {
        wpm: 0,
        rawWpm: 0,
        accuracy: 100,
        totalKeystrokes: 0,
        correctKeystrokes: 0,
        errorCount: 0,
        streak: 0,
        elapsedSeconds: 0,
      },
      keystrokeHistory: [],
    }),

  handleTypingInput: (newTypedText) => {
    const s = get();
    const now = Date.now();
    const startTime = s.sessionStartTime || now;

    let correctChars = 0;
    let errors = 0;
    for (let i = 0; i < newTypedText.length; i++) {
      if (i < s.sampleText.length && newTypedText[i] === s.sampleText[i]) {
        correctChars++;
      } else {
        errors++;
      }
    }

    const elapsedMs = Math.max(100, now - startTime);
    const telemetry = calculateTelemetry({
      correctChars,
      totalChars: newTypedText.length,
      elapsedMs,
      errors,
    });

    const lastChar = newTypedText[newTypedText.length - 1] || '';
    const isCorrect =
      newTypedText.length > 0 &&
      newTypedText.length <= s.sampleText.length &&
      newTypedText[newTypedText.length - 1] === s.sampleText[newTypedText.length - 1];

    const newHistory = [
      ...s.keystrokeHistory.slice(-24),
      {
        key: lastChar,
        code: `Key${lastChar.toUpperCase()}`,
        timestamp: now,
        correct: isCorrect,
      },
    ];

    set({
      typedText: newTypedText,
      sessionStartTime: startTime,
      telemetry,
      keystrokeHistory: newHistory,
    });
  },

  resetTypingSession: () =>
    set(() => ({
      typedText: '',
      sessionStartTime: null,
      telemetry: {
        wpm: 0,
        rawWpm: 0,
        accuracy: 100,
        totalKeystrokes: 0,
        correctKeystrokes: 0,
        errorCount: 0,
        streak: 0,
        elapsedSeconds: 0,
      },
      keystrokeHistory: [],
    })),

  nextSamplePrompt: () => {
    const prompt = getRandomPrompt();
    get().setSampleText(prompt);
  },

  setCameraPreset: (cameraPreset) => set({ cameraPreset }),
  setLightingMode: (lightingMode) => set({ lightingMode }),
  toggleAutoRotate: () => set((state) => ({ autoRotate: !state.autoRotate })),

  exportConfiguration: () => {
    const s = get();
    return {
      version: 1,
      name: `Customizer_${s.model}_${new Date().toISOString().slice(0, 10)}`,
      timestamp: Date.now(),
      model: s.model,
      caseColor: s.caseColor,
      caseFinish: s.caseFinish,
      weightMaterial: s.weightMaterial,
      plateMaterial: 'fr4',
      switchType: s.switchType,
      switchModel: s.switchModel,
      keycapMaterial: s.keycapMaterial.type,
      themePreset: s.activePresetTheme,
      keycapColorOverrides: s.keycapColorOverrides,
      explodedViewProgress: s.explodedProgress,
      dampeningFoamInstalled: s.foamDamping,
    };
  },

  importConfiguration: (config) => {
    if (!config || config.version !== 1) return false;
    set({
      model: config.model,
      caseColor: config.caseColor || '#1e2330',
      caseFinish: config.caseFinish || 'anodized',
      weightMaterial: config.weightMaterial || 'brass_pvd',
      switchType: config.switchType || 'linear',
      switchModel: config.switchModel || 'cherry_red',
      activePresetTheme: config.themePreset || null,
      keycapColorOverrides: config.keycapColorOverrides || {},
      explodedProgress: config.explodedViewProgress ?? 0.0,
      foamDamping: config.dampeningFoamInstalled ?? true,
      keycapMaterial: {
        type: config.keycapMaterial || 'pbt',
        roughness: config.keycapMaterial === 'pbt' ? 0.72 : 0.18,
        metalness: 0.04,
        clearcoat: config.keycapMaterial === 'pbt' ? 0.0 : 0.85,
        clearcoatRoughness: 0.1,
      },
    });
    return true;
  },

  resetDefaults: () => {
    soundEngine.setCaseModel('eveningstar75');
    soundEngine.setVolume(0.8);
    soundEngine.setMuted(false);
    soundEngine.setFoamDamping(true);
    set({
      model: 'eveningstar75',
      caseColor: '#1e2330',
      caseFinish: 'anodized',
      weightMaterial: 'brass_pvd',
      explodedProgress: 0.0,
      isolatedLayer: null,
      layerVisibility: { ...defaultLayers },
      selectedKeyIds: [],
      activePresetTheme: 'retro_9009',
      keycapColorOverrides: {},
      switchType: 'linear',
      switchModel: 'cherry_red',
      foamDamping: true,
      volume: 0.8,
      muted: false,
      sandboxOpen: false,
      sampleText: SAMPLE_TYPING_PROMPTS[0],
      typedText: '',
      sessionStartTime: null,
      telemetry: {
        wpm: 0,
        rawWpm: 0,
        accuracy: 100,
        totalKeystrokes: 0,
        correctKeystrokes: 0,
        errorCount: 0,
        streak: 0,
        elapsedSeconds: 0,
      },
      keystrokeHistory: [],
    });
    get().applyPresetTheme('retro_9009');
  },
}));
