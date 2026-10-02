import React, { useState } from 'react';
import { useKeyboardStore } from '../../store/useKeyboardStore';
import { GasketLayerId } from '../../types/keyboard';
import {
  Sliders,
  Layers,
  Palette,
  Check,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Shield,
} from 'lucide-react';

const CASE_COLOR_SWATCHES = [
  { name: '午夜深蓝', hex: '#1e2330' },
  { name: '曜石哑黑', hex: '#12131a' },
  { name: '阳极冰银', hex: '#94a3b8' },
  { name: '深林雅绿', hex: '#2f4838' },
  { name: '复古酒红', hex: '#5c1d24' },
  { name: '初号机紫', hex: '#4f237a' },
  { name: '复古米白', hex: '#eae6df' },
];

const LAYER_CONFIG: { id: GasketLayerId; label: string }[] = [
  { id: 'keycaps', label: '1. 原厂客制化键帽群' },
  { id: 'switches', label: '2. 机械轴体阵列' },
  { id: 'plate', label: '3. Gasket 软弹定位板' },
  { id: 'poron_ixpe', label: '4. Poron夹心棉&轴下垫' },
  { id: 'pcb', label: '5. 开槽沉金 PCB 电路板' },
  { id: 'case_foam', label: '6. 底部声学消音底棉' },
  { id: 'bottom_case_weight', label: '7. CNC 底壳与特色配重' },
];

export const LeftExplodedDrawer: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false);

  const explodedProgress = useKeyboardStore((s) => s.explodedProgress);
  const setExplodedProgress = useKeyboardStore((s) => s.setExplodedProgress);
  const isolatedLayer = useKeyboardStore((s) => s.isolatedLayer);
  const setIsolatedLayer = useKeyboardStore((s) => s.setIsolatedLayer);
  const layerVisibility = useKeyboardStore((s) => s.layerVisibility);
  const toggleLayerVisibility = useKeyboardStore((s) => s.toggleLayerVisibility);
  const setAllLayersVisible = useKeyboardStore((s) => s.setAllLayersVisible);
  const caseColor = useKeyboardStore((s) => s.caseColor);
  const setCaseColor = useKeyboardStore((s) => s.setCaseColor);
  const weightMaterial = useKeyboardStore((s) => s.weightMaterial);
  const setWeightMaterial = useKeyboardStore((s) => s.setWeightMaterial);

  return (
    <aside
      className={`absolute left-6 top-24 bottom-24 z-20 flex transition-all duration-300 pointer-events-none ${
        collapsed ? 'w-10' : 'w-80'
      }`}
    >
      <div className="relative w-full h-full flex">
        {/* Toggle Collapse Button */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="pointer-events-auto absolute -right-3 top-6 z-30 p-1.5 rounded-full bg-slate-800/90 text-slate-300 hover:text-white border border-white/10 shadow-lg backdrop-blur-md transition-transform"
          title={collapsed ? '展开内部结构面板' : '收起内部结构面板'}
        >
          {collapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
        </button>

        {!collapsed ? (
          <div className="pointer-events-auto w-full h-full overflow-y-auto p-4 rounded-3xl bg-slate-900/80 backdrop-blur-xl border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.6)] flex flex-col gap-5 scrollbar-thin scrollbar-thumb-slate-700">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2 text-sky-400">
                <Sliders className="w-4 h-4" />
                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-200">
                  Gasket 内部结构爆炸解构
                </h2>
              </div>
              <span className="text-xs font-mono font-bold text-sky-400 bg-sky-500/10 px-2 py-0.5 rounded-full border border-sky-500/20">
                {Math.round(explodedProgress * 100)}%
              </span>
            </div>

            {/* 0% to 100% Exploded View Slider */}
            <div className="flex flex-col gap-2">
              <div className="flex justify-between text-xs text-slate-400">
                <span>完全组装 (0%)</span>
                <span>爆炸展开 (100%)</span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.005"
                value={explodedProgress}
                onChange={(e) => setExplodedProgress(parseFloat(e.target.value))}
                className="w-full accent-sky-400 cursor-pointer h-1.5 bg-slate-800 rounded-lg appearance-none"
              />
              <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                <button
                  onClick={() => setExplodedProgress(0)}
                  className="hover:text-sky-400"
                >
                  0% 闭合
                </button>
                <button
                  onClick={() => setExplodedProgress(0.5)}
                  className="hover:text-sky-400"
                >
                  50% 半开
                </button>
                <button
                  onClick={() => setExplodedProgress(1)}
                  className="hover:text-sky-400"
                >
                  100% 解构
                </button>
              </div>
            </div>

            {/* Layer Isolation Chips */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-300">分层独立检视</span>
                {isolatedLayer && (
                  <button
                    onClick={() => setIsolatedLayer(null)}
                    className="text-[10px] text-sky-400 hover:underline"
                  >
                    恢复全层
                  </button>
                )}
              </div>
              <div className="flex flex-wrap gap-1.5">
                <button
                  onClick={() => setIsolatedLayer(null)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all ${
                    isolatedLayer === null
                      ? 'bg-sky-500 text-white shadow-md shadow-sky-500/20'
                      : 'bg-slate-800/80 text-slate-400 hover:text-white'
                  }`}
                >
                  全部 (7层)
                </button>
                {LAYER_CONFIG.map((layer) => (
                  <button
                    key={layer.id}
                    onClick={() => setIsolatedLayer(layer.id)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all ${
                      isolatedLayer === layer.id
                        ? 'bg-sky-500 text-white shadow-md shadow-sky-500/20'
                        : 'bg-slate-800/80 text-slate-400 hover:text-white'
                    }`}
                  >
                    {layer.label.split('. ')[1]}
                  </button>
                ))}
              </div>
            </div>

            {/* 7 Gasket Mount Layers Checkboxes */}
            <div className="flex flex-col gap-2 border-t border-white/10 pt-3">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-300">
                <div className="flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-sky-400" />
                  <span>各层构件显隐控制</span>
                </div>
                <button
                  onClick={setAllLayersVisible}
                  className="text-[10px] text-slate-400 hover:text-sky-300"
                >
                  全部显示
                </button>
              </div>
              <div className="flex flex-col gap-1.5">
                {LAYER_CONFIG.map((l) => {
                  const isChecked = layerVisibility[l.id];
                  return (
                    <label
                      key={l.id}
                      className="flex items-center justify-between p-2 rounded-xl bg-slate-800/60 hover:bg-slate-800/90 cursor-pointer text-xs transition-colors"
                    >
                      <span className={isChecked ? 'text-slate-200' : 'text-slate-500 line-through'}>
                        {l.label}
                      </span>
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => toggleLayerVisibility(l.id)}
                        className="w-4 h-4 accent-sky-400 rounded cursor-pointer"
                      />
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Case Color Swatches */}
            <div className="flex flex-col gap-2 border-t border-white/10 pt-3">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-300">
                <Palette className="w-3.5 h-3.5 text-sky-400" />
                <span>阳极铝外壳色彩快捷选色</span>
              </div>
              <div className="grid grid-cols-4 gap-2">
                {CASE_COLOR_SWATCHES.map((swatch) => {
                  const active = caseColor.toLowerCase() === swatch.hex.toLowerCase();
                  return (
                    <button
                      key={swatch.hex}
                      onClick={() => setCaseColor(swatch.hex)}
                      className={`h-8 rounded-xl relative border transition-transform flex items-center justify-center ${
                        active
                          ? 'border-sky-400 scale-105 shadow-md shadow-sky-500/25'
                          : 'border-white/10 hover:border-white/30'
                      }`}
                      style={{ backgroundColor: swatch.hex }}
                      title={swatch.name}
                    >
                      {active && <Check className="w-3.5 h-3.5 text-white drop-shadow" />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Rear PVD Weight Material */}
            <div className="flex flex-col gap-2 border-t border-white/10 pt-3">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-300">
                <Shield className="w-3.5 h-3.5 text-sky-400" />
                <span>背部特色配重材质工艺</span>
              </div>
              <div className="grid grid-cols-2 gap-1.5">
                {(
                  [
                    { id: 'brass_pvd', name: 'PVD 镜面黄铜' },
                    { id: 'mirror_chroma', name: 'PVD 极光炫彩' },
                    { id: 'matte_black', name: '曜石磨砂黑' },
                    { id: 'anodized_gold', name: '阳极喷砂金' },
                  ] as const
                ).map((w) => {
                  const active = weightMaterial === w.id;
                  return (
                    <button
                      key={w.id}
                      onClick={() => setWeightMaterial(w.id)}
                      className={`px-2.5 py-1.5 rounded-xl text-xs font-medium border text-left transition-all ${
                        active
                          ? 'bg-sky-500/20 text-sky-300 border-sky-400'
                          : 'bg-slate-800/60 text-slate-400 border-transparent hover:text-white'
                      }`}
                    >
                      {w.name}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        ) : (
          <div className="pointer-events-auto h-full w-10 flex flex-col items-center justify-center py-4 rounded-2xl bg-slate-900/80 backdrop-blur-xl border border-white/10 text-slate-400">
            <span
              className="text-xs font-bold tracking-widest text-slate-400 [writing-mode:vertical-rl] rotate-180 cursor-pointer hover:text-white"
              onClick={() => setCollapsed(false)}
            >
              Gasket 内部结构爆炸堆叠
            </span>
          </div>
        )}
      </div>
    </aside>
  );
};
