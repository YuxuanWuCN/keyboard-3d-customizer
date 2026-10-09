import React, { useState } from 'react';
import { useKeyboardStore } from '../../store/useKeyboardStore';
import { THEME_PRESETS, POLARIS_CANDY_PRESET } from '../../constants/themePresets';
import { SwitchModelId, SwitchType } from '../../types/keyboard';
import { SingleSwitchViewer } from '../models/SingleSwitchViewer';
import {
  Palette,
  Sparkles,
  Layers,
  ChevronRight,
  ChevronLeft,
  Check,
  Disc,
  Activity,
  Pipette,
} from 'lucide-react';

const QUICK_COLORS = [
  '#E3DFD5', '#C1BEB5', '#7B9A7B', '#D0706B',
  '#FCEE0A', '#00F0FF', '#FF0055', '#181A20',
  '#5C2D91', '#00FF66', '#FF6600', '#F5F2EB',
  '#8FA391', '#385A48', '#EDEBE6', '#E5B2B7',
  '#1e293b', '#ef4444', '#3b82f6', '#10b981',
];

interface SwitchItem {
  id: SwitchModelId;
  name: string;
  type: SwitchType;
  stemColor: string;
  housingDesc: string;
  soundLabel: string;
  force: string;
}

const SWITCH_MODELS: SwitchItem[] = [
  {
    id: 'cherry_red',
    name: 'Cherry MX 红轴',
    type: 'linear',
    stemColor: '#ef4444',
    housingDesc: '高透/微雾 PC 上盖 • 顺滑 POM 轴心',
    soundLabel: '温润石子音 (155-340Hz)',
    force: '45gf 压力',
  },
  {
    id: 'gateron_yellow',
    name: '佳达隆 G黄 Pro',
    type: 'linear',
    stemColor: '#eab308',
    housingDesc: '乳白半透尼龙外壳 • 出厂厚润',
    soundLabel: '沉闷麻将音 (Thocky)',
    force: '50gf 压力',
  },
  {
    id: 'cherry_blue',
    name: 'Cherry MX 青轴',
    type: 'clicky',
    stemColor: '#3b82f6',
    housingDesc: '全透明外壳 • 经典发声金属弹片',
    soundLabel: '清脆炸裂 Click 响 (3.8kHz)',
    force: '60gf 压力',
  },
  {
    id: 'holy_panda',
    name: '圣熊猫 Holy Panda',
    type: 'tactile',
    stemColor: '#ea580c',
    housingDesc: '奶白不透明 Invyr 轴壳 • 提前大段落',
    soundLabel: '双峰段落微爆音 (Pop & Thud)',
    force: '67gf 压力',
  },
  {
    id: 'kailh_box_jade',
    name: '凯华 Box 翡翠',
    type: 'clicky',
    stemColor: '#10b981',
    housingDesc: 'Box 独立防水防尘仓 • 加粗扭簧',
    soundLabel: '极度清脆加粗扭簧重撞击声',
    force: '50gf 压力',
  },
];

const CASE_COLOR_PRESETS = [
  { name: '北极星樱花粉', en: 'Sakura Pink', hex: '#F8B4C4', finish: 'anodized' as const },
  { name: '高达电光蓝', en: 'Gundam Blue', hex: '#1D4ED8', finish: 'anodized' as const },
  { name: '晚星阳极冰银', en: 'Silver', hex: '#C5CCD6', finish: 'anodized' as const },
  { name: '电泳极白', en: 'E-White', hex: '#F4F4F6', finish: 'e_white' as const },
  { name: '晚星冰晶浅蓝', en: 'Ice Blue', hex: '#8DA8BF', finish: 'anodized' as const },
  { name: '西装复古酒红', en: 'Burgundy', hex: '#6B212D', finish: 'anodized' as const },
  { name: '晚星丁香淡紫', en: 'Lilac', hex: '#B8A9C9', finish: 'anodized' as const },
  { name: '抹茶雅绿', en: 'Sage Green', hex: '#607B68', finish: 'anodized' as const },
  { name: '香槟浅金', en: 'Champagne', hex: '#D4B996', finish: 'anodized' as const },
  { name: '原色喷砂银', en: 'Raw Alu', hex: '#D1D5DB', finish: 'raw_alu' as const },
  { name: '晚星深墨蓝', en: 'Midnight', hex: '#1E2330', finish: 'anodized' as const },
  { name: '曜石深空黑', en: 'Obsidian', hex: '#181A20', finish: 'anodized' as const },
];

const WEIGHT_PRESETS = [
  { id: 'polaris_hexagram' as const, name: '北极星六芒星 PVD', tag: '双层立体勋章', color: '#F472B6' },
  { id: 'rx78_mecha' as const, name: '高达 RX-78 浮雕背板', tag: '双层立体机甲', color: '#0891B2' },
  { id: 'brass_pvd' as const, name: 'PVD 镜面黄铜', tag: '高光金色', color: '#D4AF37' },
  { id: 'mirror_chroma' as const, name: 'PVD 极光炫彩', tag: '流光幻彩', color: '#93C5FD' },
  { id: 'anodized_gold' as const, name: '阳极喷砂金', tag: '细腻微光', color: '#FBBF24' },
  { id: 'matte_black' as const, name: '曜石磨砂黑', tag: '沉稳低调', color: '#27272A' },
];

export const RightCustomizerDrawer: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState<'keycaps' | 'case' | 'switches'>('keycaps');
  const [customHex, setCustomHex] = useState('#38bdf8');
  const [customCaseHex, setCustomCaseHex] = useState('#C5CCD6');

  const selectedKeyIds = useKeyboardStore((s) => s.selectedKeyIds);
  const selectRegion = useKeyboardStore((s) => s.selectRegion);
  const selectEscEnterSpace = useKeyboardStore((s) => s.selectEscEnterSpace);
  const invertSelection = useKeyboardStore((s) => s.invertSelection);
  const clearSelection = useKeyboardStore((s) => s.clearSelection);
  const selectAllKeys = useKeyboardStore((s) => s.selectAllKeys);
  const setKeycapColor = useKeyboardStore((s) => s.setKeycapColor);
  const keycapMaterial = useKeyboardStore((s) => s.keycapMaterial);
  const setKeycapMaterial = useKeyboardStore((s) => s.setKeycapMaterial);
  const activePresetTheme = useKeyboardStore((s) => s.activePresetTheme);
  const applyPresetTheme = useKeyboardStore((s) => s.applyPresetTheme);

  const model = useKeyboardStore((s) => s.model);
  const caseColor = useKeyboardStore((s) => s.caseColor);
  const caseFinish = useKeyboardStore((s) => s.caseFinish);
  const setCaseColor = useKeyboardStore((s) => s.setCaseColor);
  const weightMaterial = useKeyboardStore((s) => s.weightMaterial);
  const setWeightMaterial = useKeyboardStore((s) => s.setWeightMaterial);
  const rx78Edition = useKeyboardStore((s) => s.rx78Edition);
  const setRx78Edition = useKeyboardStore((s) => s.setRx78Edition);
  const applyRx78GundamTheme = useKeyboardStore((s) => s.applyRx78GundamTheme);
  const polarisEdition = useKeyboardStore((s) => s.polarisEdition);
  const setPolarisEdition = useKeyboardStore((s) => s.setPolarisEdition);
  const applyPolarisTheme = useKeyboardStore((s) => s.applyPolarisTheme);
  const cableVisible = useKeyboardStore((s) => s.cableVisible);
  const setCableVisible = useKeyboardStore((s) => s.setCableVisible);
  const cableStyle = useKeyboardStore((s) => s.cableStyle);
  const setCableStyle = useKeyboardStore((s) => s.setCableStyle);
  const cableColor = useKeyboardStore((s) => s.cableColor);
  const setCableColor = useKeyboardStore((s) => s.setCableColor);
  const cableLedColor = useKeyboardStore((s) => s.cableLedColor);
  const setCableLedColor = useKeyboardStore((s) => s.setCableLedColor);
  const cableConnectorMaterial = useKeyboardStore((s) => s.cableConnectorMaterial);
  const setCableConnectorMaterial = useKeyboardStore((s) => s.setCableConnectorMaterial);

  const switchModel = useKeyboardStore((s) => s.switchModel);
  const setSwitchModel = useKeyboardStore((s) => s.setSwitchModel);
  const soundMode = useKeyboardStore((s) => s.soundMode);
  const setSoundMode = useKeyboardStore((s) => s.setSoundMode);

  const handleApplyColor = (color: string) => {
    setCustomHex(color);
    if (selectedKeyIds.length > 0) {
      setKeycapColor(selectedKeyIds, color);
    } else {
      // If none selected, apply to all alphas as convenience
      selectRegion('alphas');
      setKeycapColor(selectedKeyIds, color);
    }
  };

  const handleApplyCaseColor = (color: string, finish?: 'anodized' | 'e_white' | 'raw_alu') => {
    setCustomCaseHex(color);
    setCaseColor(color, finish || caseFinish);
  };

  return (
    <aside
      className={`absolute right-6 top-24 bottom-24 z-20 flex transition-all duration-300 pointer-events-none ${
        collapsed ? 'w-10' : 'w-88'
      }`}
      style={{ width: collapsed ? '2.5rem' : '23.5rem' }}
    >
      <div className="relative w-full h-full flex">
        {/* Toggle Collapse Button */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="pointer-events-auto absolute -left-3 top-6 z-30 p-1.5 rounded-full bg-slate-800/90 text-slate-300 hover:text-white border border-white/10 shadow-lg backdrop-blur-md transition-transform"
          title={collapsed ? '展开个性定制面板' : '收起个性定制面板'}
        >
          {collapsed ? <ChevronLeft className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
        </button>

        {!collapsed ? (
          <div className="pointer-events-auto w-full h-full overflow-y-auto p-4 rounded-3xl bg-slate-900/80 backdrop-blur-xl border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.6)] flex flex-col gap-4 scrollbar-thin scrollbar-thumb-slate-700">
            {/* Header Tabs */}
            <div className="grid grid-cols-3 p-1 rounded-2xl bg-slate-800/80 border border-white/5 gap-1">
              <button
                onClick={() => setActiveTab('keycaps')}
                className={`py-1.5 rounded-xl text-[11px] font-semibold flex items-center justify-center gap-1 transition-all ${
                  activeTab === 'keycaps'
                    ? 'bg-sky-500 text-white shadow-md shadow-sky-500/25'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Palette className="w-3 h-3" />
                <span>键帽定制</span>
              </button>
              <button
                onClick={() => setActiveTab('case')}
                className={`py-1.5 rounded-xl text-[11px] font-semibold flex items-center justify-center gap-1 transition-all ${
                  activeTab === 'case'
                    ? 'bg-sky-500 text-white shadow-md shadow-sky-500/25'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Layers className="w-3 h-3" />
                <span>外壳/配重</span>
              </button>
              <button
                onClick={() => setActiveTab('switches')}
                className={`py-1.5 rounded-xl text-[11px] font-semibold flex items-center justify-center gap-1 transition-all ${
                  activeTab === 'switches'
                    ? 'bg-sky-500 text-white shadow-md shadow-sky-500/25'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Activity className="w-3 h-3" />
                <span>轴体声学</span>
              </button>
            </div>

            {/* TAB 1: KEYCAPS & THEMES */}
            {activeTab === 'keycaps' && (
              <div className="flex flex-col gap-4">
                {/* 7 Preset Themes Grid */}
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-300">
                      经典客制化键帽主题 (7款)
                    </span>
                    <span className="text-[10px] text-sky-400 font-mono">一键换装</span>
                  </div>
                  <div className="flex flex-col gap-2">
                    {/* Polaris Candy Special Edition Theme Card */}
                    <button
                      key={POLARIS_CANDY_PRESET.id}
                      onClick={() => applyPresetTheme('polaris_candy')}
                      className={`p-2.5 rounded-2xl border text-left flex flex-col gap-1.5 transition-all ${
                        activePresetTheme === 'polaris_candy'
                          ? 'bg-pink-500/20 border-pink-400 shadow-md shadow-pink-500/20'
                          : 'bg-slate-800/50 border-white/5 hover:bg-slate-800/80 hover:border-white/15'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-bold text-pink-200">{POLARIS_CANDY_PRESET.name}</span>
                          <span className="px-1.5 py-0.5 rounded text-[8px] font-bold bg-pink-500/20 text-pink-300 border border-pink-400/30">
                            实拍限定
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <span
                            className="w-3.5 h-3.5 rounded-full border border-white/20 shadow-sm"
                            style={{ backgroundColor: POLARIS_CANDY_PRESET.palette.alphas.top }}
                            title="香草奶白字母区"
                          />
                          <span
                            className="w-3.5 h-3.5 rounded-full border border-white/20 shadow-sm"
                            style={{ backgroundColor: POLARIS_CANDY_PRESET.palette.modifiers.top }}
                            title="丁香紫修饰键"
                          />
                          <span
                            className="w-3.5 h-3.5 rounded-full border border-white/20 shadow-sm"
                            style={{ backgroundColor: POLARIS_CANDY_PRESET.palette.accents.top }}
                            title="薄荷绿/蜜桃粉个性"
                          />
                          {activePresetTheme === 'polaris_candy' && <Check className="w-3.5 h-3.5 text-pink-400 ml-1" />}
                        </div>
                      </div>
                      <p className="text-[10px] text-slate-400 line-clamp-1 leading-snug">
                        {POLARIS_CANDY_PRESET.description}
                      </p>
                    </button>

                    {Object.values(THEME_PRESETS).map((t) => {
                      const isActive = activePresetTheme === t.id;
                      return (
                        <button
                          key={t.id}
                          onClick={() => applyPresetTheme(t.id)}
                          className={`p-2.5 rounded-2xl border text-left flex flex-col gap-1.5 transition-all ${
                            isActive
                              ? 'bg-sky-500/15 border-sky-400 shadow-md shadow-sky-500/20'
                              : 'bg-slate-800/50 border-white/5 hover:bg-slate-800/80 hover:border-white/15'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-slate-100">{t.name}</span>
                            <div className="flex items-center gap-1">
                              <span
                                className="w-3.5 h-3.5 rounded-full border border-white/20 shadow-sm"
                                style={{ backgroundColor: t.palette.alphas.top }}
                                title="字母区"
                              />
                              <span
                                className="w-3.5 h-3.5 rounded-full border border-white/20 shadow-sm"
                                style={{ backgroundColor: t.palette.modifiers.top }}
                                title="修饰键"
                              />
                              <span
                                className="w-3.5 h-3.5 rounded-full border border-white/20 shadow-sm"
                                style={{ backgroundColor: t.palette.accents.top }}
                                title="个性增补"
                              />
                              {isActive && <Check className="w-3.5 h-3.5 text-sky-400 ml-1" />}
                            </div>
                          </div>
                          <p className="text-[10px] text-slate-400 line-clamp-1 leading-snug">
                            {t.description}
                          </p>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Region Selection Pills */}
                <div className="flex flex-col gap-2 border-t border-white/10 pt-3">
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-300">
                    <span>批量选键与增补</span>
                    <span className="text-[10px] font-mono text-slate-400">
                      已选 {selectedKeyIds.length} 键
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-1.5">
                    <button
                      onClick={() => selectRegion('alphas')}
                      className="px-2 py-1.5 rounded-xl bg-slate-800 text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-700 transition-colors"
                    >
                      字母区
                    </button>
                    <button
                      onClick={() => selectRegion('modifiers')}
                      className="px-2 py-1.5 rounded-xl bg-slate-800 text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-700 transition-colors"
                    >
                      修饰大键
                    </button>
                    <button
                      onClick={selectEscEnterSpace}
                      className="px-2 py-1.5 rounded-xl bg-slate-800 text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-700 transition-colors"
                    >
                      增补/空格
                    </button>
                    <button
                      onClick={selectAllKeys}
                      className="px-2 py-1.5 rounded-xl bg-slate-800 text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-700 transition-colors"
                    >
                      全选按键
                    </button>
                    <button
                      onClick={invertSelection}
                      className="px-2 py-1.5 rounded-xl bg-slate-800 text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-700 transition-colors"
                    >
                      反选按键
                    </button>
                    <button
                      onClick={clearSelection}
                      className="px-2 py-1.5 rounded-xl bg-slate-800 text-xs font-medium text-rose-300 hover:text-rose-100 hover:bg-rose-900/40 transition-colors"
                    >
                      清除选择
                    </button>
                  </div>
                </div>

                {/* Custom Color Palette & Picker */}
                <div className="flex flex-col gap-2 border-t border-white/10 pt-3">
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-300">
                    <div className="flex items-center gap-1.5">
                      <Pipette className="w-3.5 h-3.5 text-sky-400" />
                      <span>自定义键帽取色</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="color"
                        value={customHex}
                        onChange={(e) => handleApplyColor(e.target.value)}
                        className="w-5 h-5 rounded cursor-pointer border-0 bg-transparent p-0"
                      />
                      <span className="font-mono text-[11px] text-sky-300">{customHex}</span>
                    </div>
                  </div>

                  {/* Swatches */}
                  <div className="grid grid-cols-5 gap-1.5">
                    {QUICK_COLORS.map((c) => (
                      <button
                        key={c}
                        onClick={() => handleApplyColor(c)}
                        className="h-6 rounded-lg border border-white/10 hover:scale-110 transition-transform flex items-center justify-center"
                        style={{ backgroundColor: c }}
                        title={c}
                      >
                        {customHex.toLowerCase() === c.toLowerCase() && (
                          <Check className="w-3 h-3 text-white drop-shadow" />
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Material Physics: PBT vs ABS */}
                <div className="flex flex-col gap-2 border-t border-white/10 pt-3">
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-300">
                    <span>键帽物理材质与微观触感</span>
                    <span className="text-[10px] text-sky-400 font-mono">PBR 渲染</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => setKeycapMaterial({ type: 'pbt' })}
                      className={`p-2.5 rounded-2xl border text-left flex flex-col gap-1 transition-all ${
                        keycapMaterial.type === 'pbt'
                          ? 'bg-sky-500/20 text-sky-300 border-sky-400 shadow-md'
                          : 'bg-slate-800/60 text-slate-400 border-white/5 hover:text-white'
                      }`}
                    >
                      <span className="text-xs font-bold text-slate-200">PBT 细腻哑光</span>
                      <span className="text-[10px] text-slate-400">
                        粗糙度 0.72 • 耐磨不打油
                      </span>
                    </button>

                    <button
                      onClick={() => setKeycapMaterial({ type: 'abs' })}
                      className={`p-2.5 rounded-2xl border text-left flex flex-col gap-1 transition-all ${
                        keycapMaterial.type === 'abs'
                          ? 'bg-sky-500/20 text-sky-300 border-sky-400 shadow-md'
                          : 'bg-slate-800/60 text-slate-400 border-white/5 hover:text-white'
                      }`}
                    >
                      <span className="text-xs font-bold text-slate-200">ABS 丝滑高光</span>
                      <span className="text-[10px] text-slate-400">
                        粗糙度 0.18 • 清漆 0.85 润泽
                      </span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: CASE & FINISHES */}
            {activeTab === 'case' && (
              <div className="flex flex-col gap-4">
                {/* 0. Polaris 80 Limited Handheld & Hexagram Star Hero Card */}
                <div className="p-3.5 rounded-2xl bg-gradient-to-br from-pink-950/80 via-slate-900 to-purple-950/90 border border-pink-500/30 shadow-lg shadow-pink-500/10 flex flex-col gap-2.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-pink-400 animate-pulse shadow-[0_0_8px_#f472b6]" />
                      <span className="text-xs font-bold text-pink-200">
                        北极星 80 樱花粉复古掌机·六芒星限定版
                      </span>
                    </div>
                    <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-pink-500/20 text-pink-300 border border-pink-400/30">
                      六芒星限定
                    </span>
                  </div>

                  <p className="text-[10px] text-slate-300 leading-relaxed">
                    樱花粉阳极外壳 • 高光钻石倒角镜面银框 • PlayStation 符号金框 • 3D 金属六芒星立体勋章 • 后侧掌机双十字键 • 双侧跑道流光灯条。
                  </p>

                  <div className="flex gap-2">
                    <button
                      onClick={() => applyPolarisTheme()}
                      className="flex-1 py-2 px-3 rounded-xl bg-gradient-to-r from-pink-500 via-purple-500 to-teal-400 hover:from-pink-400 hover:to-teal-300 text-white text-[11px] font-bold shadow-md shadow-pink-500/30 flex items-center justify-center gap-1.5 transition-all"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-yellow-300" />
                      <span>一键换装北极星 80 魔法糖果限定版</span>
                    </button>
                    <button
                      onClick={() => setPolarisEdition(!polarisEdition)}
                      className={`px-3 py-2 rounded-xl text-[11px] font-semibold border transition-all ${
                        polarisEdition
                          ? 'bg-pink-500/20 text-pink-300 border-pink-400'
                          : 'bg-slate-800/80 text-slate-400 border-white/10 hover:text-white'
                      }`}
                      title="单独开启/关闭北极星 80 专属外观特征"
                    >
                      {polarisEdition ? '已开启' : '单独启用'}
                    </button>
                  </div>
                </div>

                {/* 0.1 Gundam RX-78 Limited Mecha Edition Hero Card */}
                <div className="p-3.5 rounded-2xl bg-gradient-to-br from-blue-950/80 via-slate-900 to-indigo-950/90 border border-blue-500/30 shadow-lg shadow-blue-500/10 flex flex-col gap-2.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-pulse shadow-[0_0_8px_#3b82f6]" />
                      <span className="text-xs font-bold text-blue-200">
                        高达 RX-78 深度机甲定制版
                      </span>
                    </div>
                    <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-blue-500/20 text-blue-300 border border-blue-400/30">
                      限定机甲
                    </span>
                  </div>

                  <p className="text-[10px] text-slate-300 leading-relaxed">
                    电光蓝阳极外壳 • 朱红 CNC 倒角包边 • 侧边 4 道散热风道 • 双层立体机甲浮雕背板。
                  </p>

                  <div className="flex gap-2">
                    <button
                      onClick={() => applyRx78GundamTheme()}
                      className="flex-1 py-2 px-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-[11px] font-bold shadow-md shadow-blue-600/30 flex items-center justify-center gap-1.5 transition-all"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-yellow-300" />
                      <span>一键换装 RX-78 机甲全套</span>
                    </button>
                    <button
                      onClick={() => setRx78Edition(!rx78Edition)}
                      className={`px-3 py-2 rounded-xl text-[11px] font-semibold border transition-all ${
                        rx78Edition
                          ? 'bg-blue-500/20 text-blue-300 border-blue-400'
                          : 'bg-slate-800/80 text-slate-400 border-white/10 hover:text-white'
                      }`}
                      title="单独开启/关闭 RX-78 机甲外壳与浮雕背板"
                    >
                      {rx78Edition ? '已开启' : '单独启用'}
                    </button>
                  </div>
                </div>

                {/* 0.5 Connected Luminous Aviator Coiled Cable Controls */}
                <div className="p-3.5 rounded-2xl bg-slate-800/80 border border-white/10 flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span
                        className="w-3 h-3 rounded-full shadow-[0_0_10px_currentColor] transition-colors"
                        style={{ color: cableLedColor, backgroundColor: cableLedColor }}
                      />
                      <div>
                        <span className="text-xs font-bold text-slate-200">
                          客制化金属自锁航插线
                        </span>
                        <span className="block text-[9px] text-slate-400">
                          支持任意型号键盘独立添加/断开
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => setCableVisible(!cableVisible)}
                      className={`px-3 py-1 rounded-xl text-xs font-bold border transition-all ${
                        cableVisible
                          ? 'bg-sky-500/20 text-sky-300 border-sky-400 shadow-md shadow-sky-500/20'
                          : 'bg-slate-700/60 text-slate-400 border-white/10 hover:text-white'
                      }`}
                    >
                      {cableVisible ? '已连接 (点击断开)' : '点击插上航插线'}
                    </button>
                  </div>

                  {cableVisible && (
                    <div className="flex flex-col gap-2.5 pt-2 border-t border-white/10">
                      {/* 款式切换：螺旋弹簧线圈 vs 直出编织线 */}
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-semibold text-slate-300">线缆造型：</span>
                        <div className="flex gap-1">
                          <button
                            onClick={() => setCableStyle('coiled')}
                            className={`px-2 py-0.5 rounded-lg text-[10px] font-medium border transition-colors ${
                              cableStyle === 'coiled'
                                ? 'bg-sky-500/20 text-sky-300 border-sky-400 font-bold'
                                : 'bg-slate-900/60 text-slate-400 border-white/5 hover:text-white'
                            }`}
                          >
                            经典弹簧卷
                          </button>
                          <button
                            onClick={() => setCableStyle('straight')}
                            className={`px-2 py-0.5 rounded-lg text-[10px] font-medium border transition-colors ${
                              cableStyle === 'straight'
                                ? 'bg-sky-500/20 text-sky-300 border-sky-400 font-bold'
                                : 'bg-slate-900/60 text-slate-400 border-white/5 hover:text-white'
                            }`}
                          >
                            极简直出线
                          </button>
                        </div>
                      </div>

                      {/* 线身编织色彩 */}
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-semibold text-slate-300">线身配色：</span>
                        <div className="flex items-center gap-1.5">
                          {[
                            { name: '电光蓝', color: '#2563eb' },
                            { name: '午夜黑', color: '#18181b' },
                            { name: '纯净白', color: '#f8fafc' },
                            { name: '热烈粉', color: '#ec4899' },
                            { name: '赛博黄', color: '#eab308' },
                            { name: '极光绿', color: '#10b981' },
                            { name: '初号紫', color: '#7c3aed' },
                          ].map((c) => (
                            <button
                              key={c.color}
                              onClick={() => setCableColor(c.color)}
                              className={`w-3.5 h-3.5 rounded-full border transition-transform ${
                                cableColor.toLowerCase() === c.color.toLowerCase()
                                  ? 'scale-125 border-white shadow-sm'
                                  : 'border-white/20 hover:scale-110'
                              }`}
                              style={{ backgroundColor: c.color }}
                              title={c.name}
                            />
                          ))}
                        </div>
                      </div>

                      {/* 金属航插头材质 */}
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-semibold text-slate-300">金属接头：</span>
                        <div className="flex gap-1">
                          {[
                            { id: 'chrome' as const, label: '镀铬亮银' },
                            { id: 'matte_black' as const, label: '哑光黑钛' },
                            { id: 'brass_gold' as const, label: '沉金黄铜' },
                          ].map((m) => (
                            <button
                              key={m.id}
                              onClick={() => setCableConnectorMaterial(m.id)}
                              className={`px-1.5 py-0.5 rounded-lg text-[9px] font-medium border transition-colors ${
                                cableConnectorMaterial === m.id
                                  ? 'bg-amber-500/20 text-amber-300 border-amber-400 font-bold'
                                  : 'bg-slate-900/60 text-slate-400 border-white/5 hover:text-white'
                              }`}
                            >
                              {m.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* 光圈霓虹灯效 */}
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-semibold text-slate-300">光圈灯效：</span>
                        <div className="flex items-center gap-1.5">
                          {[
                            { name: '冰海蓝', color: '#38bdf8' },
                            { name: '冷粉', color: '#ec4899' },
                            { name: '警示金', color: '#eab308' },
                            { name: '初号绿', color: '#10b981' },
                            { name: '纯冷白', color: '#f8fafc' },
                          ].map((c) => (
                            <button
                              key={c.color}
                              onClick={() => setCableLedColor(c.color)}
                              className={`w-3.5 h-3.5 rounded-full border transition-transform ${
                                cableLedColor.toLowerCase() === c.color.toLowerCase()
                                  ? 'scale-125 border-white shadow-[0_0_8px_currentColor]'
                                  : 'border-white/20 hover:scale-110'
                              }`}
                              style={{ backgroundColor: c.color, color: c.color }}
                              title={c.name}
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* 1. Case Coating & Finish */}
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-300">外壳工艺与表面处理</span>
                    <span className="text-[10px] text-sky-400 font-mono">PBR Shading</span>
                  </div>
                  <div className="grid grid-cols-3 gap-1.5">
                    <button
                      onClick={() => setCaseColor(caseColor, 'anodized')}
                      className={`p-2 rounded-xl border text-center flex flex-col items-center gap-0.5 transition-all ${
                        caseFinish === 'anodized'
                          ? 'bg-sky-500/20 text-sky-300 border-sky-400 shadow-md'
                          : 'bg-slate-800/60 text-slate-400 border-white/5 hover:text-white'
                      }`}
                    >
                      <span className="text-xs font-bold">阳极氧化</span>
                      <span className="text-[9px] text-slate-400">细喷砂金属</span>
                    </button>
                    <button
                      onClick={() => handleApplyCaseColor('#F4F4F6', 'e_white')}
                      className={`p-2 rounded-xl border text-center flex flex-col items-center gap-0.5 transition-all ${
                        caseFinish === 'e_white'
                          ? 'bg-sky-500/20 text-sky-300 border-sky-400 shadow-md'
                          : 'bg-slate-800/60 text-slate-400 border-white/5 hover:text-white'
                      }`}
                    >
                      <span className="text-xs font-bold">电泳极白</span>
                      <span className="text-[9px] text-slate-400">陶瓷温润感</span>
                    </button>
                    <button
                      onClick={() => handleApplyCaseColor('#D1D5DB', 'raw_alu')}
                      className={`p-2 rounded-xl border text-center flex flex-col items-center gap-0.5 transition-all ${
                        caseFinish === 'raw_alu'
                          ? 'bg-sky-500/20 text-sky-300 border-sky-400 shadow-md'
                          : 'bg-slate-800/60 text-slate-400 border-white/5 hover:text-white'
                      }`}
                    >
                      <span className="text-xs font-bold">原色冷铝</span>
                      <span className="text-[9px] text-slate-400">高反光拉丝</span>
                    </button>
                  </div>
                </div>

                {/* 2. Iconic Case Colors */}
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-300">客制化经典外壳色卡</span>
                    <span className="text-[10px] text-slate-400 font-mono">10 Presets</span>
                  </div>
                  <div className="grid grid-cols-2 gap-1.5">
                    {CASE_COLOR_PRESETS.map((preset) => {
                      const isSelected = caseColor.toLowerCase() === preset.hex.toLowerCase();
                      return (
                        <button
                          key={preset.hex}
                          onClick={() => handleApplyCaseColor(preset.hex, preset.finish)}
                          className={`p-2 rounded-xl border text-left flex items-center gap-2 transition-all ${
                            isSelected
                              ? 'bg-sky-500/20 border-sky-400 shadow-md'
                              : 'bg-slate-800/50 border-white/5 hover:bg-slate-800/80 hover:border-white/15'
                          }`}
                        >
                          <span
                            className="w-4 h-4 rounded-full border border-white/20 shadow-sm flex-shrink-0"
                            style={{ backgroundColor: preset.hex }}
                          />
                          <div className="flex flex-col min-w-0">
                            <span className="text-[11px] font-bold text-slate-200 truncate">
                              {preset.name}
                            </span>
                            <span className="text-[9px] text-slate-400 font-mono">{preset.hex}</span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 3. Custom Hex Case Color */}
                <div className="flex flex-col gap-2">
                  <span className="text-xs font-semibold text-slate-300">自定义外壳取色</span>
                  <div className="flex items-center gap-2 p-2 rounded-2xl bg-slate-800/60 border border-white/5">
                    <div className="relative w-8 h-8 rounded-xl overflow-hidden border border-white/20 shadow-inner flex-shrink-0">
                      <input
                        type="color"
                        value={caseColor}
                        onChange={(e) => handleApplyCaseColor(e.target.value)}
                        className="absolute -top-2 -left-2 w-12 h-12 cursor-pointer border-0 p-0"
                        title="点击选择外壳颜色"
                      />
                    </div>
                    <input
                      type="text"
                      value={customCaseHex}
                      onChange={(e) => {
                        setCustomCaseHex(e.target.value);
                        if (/^#[0-9A-Fa-f]{6}$/.test(e.target.value)) {
                          handleApplyCaseColor(e.target.value);
                        }
                      }}
                      className="flex-1 px-2.5 py-1.5 rounded-xl bg-slate-900 border border-white/10 text-xs font-mono text-white focus:outline-none focus:border-sky-400"
                      placeholder="#C5CCD6"
                    />
                    <button
                      onClick={() => handleApplyCaseColor(customCaseHex)}
                      className="px-3 py-1.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-white text-xs font-semibold shadow-md transition-colors"
                    >
                      应用
                    </button>
                  </div>
                </div>

                {/* 4. Underside Weight Material */}
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-300">底部特色配重工艺</span>
                    <span className="text-[10px] text-amber-400 font-mono">PVD & Brass</span>
                  </div>
                  <div className="grid grid-cols-2 gap-1.5">
                    {WEIGHT_PRESETS.map((weight) => {
                      const isWeightActive = weightMaterial === weight.id;
                      return (
                        <button
                          key={weight.id}
                          onClick={() => setWeightMaterial(weight.id)}
                          className={`p-2 rounded-xl border text-left flex items-center gap-2 transition-all ${
                            isWeightActive
                              ? 'bg-amber-500/20 border-amber-400 shadow-md shadow-amber-500/10'
                              : 'bg-slate-800/50 border-white/5 hover:bg-slate-800/80 hover:border-white/15'
                          }`}
                        >
                          <span
                            className="w-3.5 h-3.5 rounded-full border border-white/20 shadow-sm flex-shrink-0"
                            style={{ backgroundColor: weight.color }}
                          />
                          <div className="flex flex-col min-w-0">
                            <span className="text-[11px] font-bold text-slate-200 truncate">
                              {weight.name}
                            </span>
                            <span className="text-[9px] text-slate-400">{weight.tag}</span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 5. One-Click Iconic Keyboard Combos */}
                <div className="p-3 rounded-2xl bg-gradient-to-br from-slate-800/80 to-slate-900 border border-white/10 flex flex-col gap-2">
                  <span className="text-xs font-semibold text-sky-300">✨ 官方出圈经典搭配推荐</span>
                  <div className="flex flex-col gap-1.5">
                    <button
                      onClick={() => {
                        handleApplyCaseColor('#C5CCD6', 'anodized');
                        setWeightMaterial('brass_pvd');
                      }}
                      className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700/80 text-[11px] text-slate-200 text-left flex justify-between items-center transition-colors"
                    >
                      <span>晚星 75 冰川银 + 镜面金配重</span>
                      <span className="text-[10px] text-sky-400">推荐</span>
                    </button>
                    <button
                      onClick={() => {
                        handleApplyCaseColor('#F4F4F6', 'e_white');
                        setWeightMaterial('mirror_chroma');
                      }}
                      className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700/80 text-[11px] text-slate-200 text-left flex justify-between items-center transition-colors"
                    >
                      <span>Mr. Suit 80 电泳冷白 + 极光炫彩</span>
                      <span className="text-[10px] text-fuchsia-400">经典</span>
                    </button>
                    <button
                      onClick={() => {
                        handleApplyCaseColor('#B8A9C9', 'anodized');
                        setWeightMaterial('brass_pvd');
                      }}
                      className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700/80 text-[11px] text-slate-200 text-left flex justify-between items-center transition-colors"
                    >
                      <span>晚星 75 丁香紫 + 镜面黄铜</span>
                      <span className="text-[10px] text-purple-400">优雅</span>
                    </button>
                    <button
                      onClick={() => {
                        handleApplyCaseColor('#6B212D', 'anodized');
                        setWeightMaterial('brass_pvd');
                      }}
                      className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700/80 text-[11px] text-slate-200 text-left flex justify-between items-center transition-colors"
                    >
                      <span>西装 80 复古酒红 + 镜面金</span>
                      <span className="text-[10px] text-red-400">典雅</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 3: SWITCHES & ACOUSTICS */}
            {activeTab === 'switches' && (
              <div className="flex flex-col gap-3">
                {/* 3D Microscopic Switch Inspector & Disassembly Studio */}
                {(() => {
                  const currentSwitch =
                    SWITCH_MODELS.find((s) => s.id === switchModel) || SWITCH_MODELS[0];
                  return (
                    <SingleSwitchViewer
                      switchModel={switchModel}
                      name={currentSwitch.name}
                      force={currentSwitch.force}
                      type={
                        currentSwitch.type === 'linear'
                          ? '线性轴'
                          : currentSwitch.type === 'clicky'
                          ? '有声段落'
                          : '提前大段落'
                      }
                    />
                  );
                })()}

                <div className="flex items-center justify-between">
                  <div className="text-xs font-semibold text-slate-300">
                    主流机械轴体手感与物理声学
                  </div>
                  <span className="text-[10px] text-sky-400 font-mono">Hi-Fi Audio</span>
                </div>

                {/* Sound Engine Mode Switcher */}
                <div className="flex flex-col gap-1.5 p-2.5 rounded-2xl bg-slate-800/70 border border-white/5">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-semibold text-slate-300">声学校准音源模式</span>
                    <span className="text-[10px] text-emerald-400 font-mono">● 44.1kHz Studio</span>
                  </div>
                  <div className="grid grid-cols-2 gap-1.5 p-1 rounded-xl bg-slate-900/80 border border-white/5">
                    <button
                      onClick={() => setSoundMode('sampled')}
                      className={`py-1.5 px-2 rounded-lg text-[10px] font-semibold flex items-center justify-center gap-1 transition-all ${
                        soundMode === 'sampled'
                          ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/25'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <span>🎙️ 实录原声采样</span>
                      <span className="text-[8px] px-1 rounded bg-black/30 font-mono">推荐</span>
                    </button>
                    <button
                      onClick={() => setSoundMode('synth')}
                      className={`py-1.5 px-2 rounded-lg text-[10px] font-semibold flex items-center justify-center gap-1 transition-all ${
                        soundMode === 'synth'
                          ? 'bg-sky-500 text-white shadow-md shadow-sky-500/25'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <span>⚡ 物理合成模拟</span>
                    </button>
                  </div>
                  <div className="text-[10px] text-slate-400 leading-tight">
                    {soundMode === 'sampled' ? (
                      <span className="text-emerald-300/90">
                        ✨ 采用客制化实录原声采样：含真实触底撞击（Downstroke）、顶盖回弹（Upstroke）与 5 阶轮循防重复机制，并经当前铝合金内胆与消音棉真实声学卷积滤波！
                      </span>
                    ) : (
                      <span className="text-sky-300/90">
                        ⚡ 采用纯 Web Audio 程序化双振荡器 + 1/f 粉红噪声冲激微积分模拟。
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  {SWITCH_MODELS.map((sw) => {
                    const active = switchModel === sw.id;
                    const typeLabel =
                      sw.type === 'linear' ? '线性轴' : sw.type === 'clicky' ? '有声段落' : '提前大段落';
                    return (
                      <button
                        key={sw.id}
                        onClick={() => setSwitchModel(sw.id)}
                        className={`p-3 rounded-2xl border text-left flex flex-col gap-1.5 transition-all ${
                          active
                            ? 'bg-sky-500/15 border-sky-400 shadow-lg shadow-sky-500/20'
                            : 'bg-slate-800/50 border-white/5 hover:bg-slate-800/80 hover:border-white/15'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span
                              className="w-4 h-4 rounded-md shadow"
                              style={{ backgroundColor: sw.stemColor }}
                            />
                            <span className="text-xs font-bold text-slate-200">{sw.name}</span>
                          </div>
                          <span
                            className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-semibold ${
                              sw.type === 'linear'
                                ? 'bg-red-500/20 text-red-300'
                                : sw.type === 'clicky'
                                ? 'bg-blue-500/20 text-blue-300'
                                : 'bg-amber-500/20 text-amber-300'
                            }`}
                          >
                            {typeLabel} • {sw.force}
                          </span>
                        </div>
                        <div className="text-[11px] text-sky-400 font-mono font-medium">
                          🎵 {sw.soundLabel}
                        </div>
                        <p className="text-[10px] text-slate-400">{sw.housingDesc}</p>
                      </button>
                    );
                  })}
                </div>

                <div className="p-3 rounded-2xl bg-slate-800/40 border border-white/5 text-[11px] text-slate-400 flex flex-col gap-1">
                  <span className="font-semibold text-slate-300">✨ 声学架构与物理内胆联动：</span>
                  <span>• 触底与回弹双向物理微录音采样（Down & Up Stroke）</span>
                  <span>• 5 阶 Round-Robin 算法（消除连续打字机关枪单调感）</span>
                  <span>• 真实内胆冲激响应卷积（纯铝空腔共鸣 vs Poron 夹心消音）</span>
                  <span>• 24 通道动态复音限制与 Tanh 软饱和防破音</span>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="pointer-events-auto h-full w-10 flex flex-col items-center justify-center py-4 rounded-2xl bg-slate-900/80 backdrop-blur-xl border border-white/10 text-slate-400">
            <span
              className="text-xs font-bold tracking-widest text-slate-400 [writing-mode:vertical-rl] cursor-pointer hover:text-white"
              onClick={() => setCollapsed(false)}
            >
              键盘定制与配色
            </span>
          </div>
        )}
      </div>
    </aside>
  );
};
