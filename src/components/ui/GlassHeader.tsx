import React, { useState, useRef } from 'react';
import { useKeyboardStore } from '../../store/useKeyboardStore';
import { CameraPreset, KeyboardModelId } from '../../types/keyboard';
import {
  Sparkles,
  Camera,
  RotateCw,
  Volume2,
  VolumeX,
  Download,
  Upload,
  RotateCcw,
  Sliders,
  Layers,
  Waves,
} from 'lucide-react';

export const GlassHeader: React.FC = () => {
  const model = useKeyboardStore((s) => s.model);
  const setModel = useKeyboardStore((s) => s.setModel);
  const cameraPreset = useKeyboardStore((s) => s.cameraPreset);
  const setCameraPreset = useKeyboardStore((s) => s.setCameraPreset);
  const autoRotate = useKeyboardStore((s) => s.autoRotate);
  const toggleAutoRotate = useKeyboardStore((s) => s.toggleAutoRotate);
  const volume = useKeyboardStore((s) => s.volume);
  const setVolume = useKeyboardStore((s) => s.setVolume);
  const muted = useKeyboardStore((s) => s.muted);
  const setMuted = useKeyboardStore((s) => s.setMuted);
  const foamDamping = useKeyboardStore((s) => s.foamDamping);
  const setFoamDamping = useKeyboardStore((s) => s.setFoamDamping);
  const exportConfiguration = useKeyboardStore((s) => s.exportConfiguration);
  const importConfiguration = useKeyboardStore((s) => s.importConfiguration);
  const resetDefaults = useKeyboardStore((s) => s.resetDefaults);
  const cableVisible = useKeyboardStore((s) => s.cableVisible);
  const setCableVisible = useKeyboardStore((s) => s.setCableVisible);
  const cableLedColor = useKeyboardStore((s) => s.cableLedColor);
  const polarisNumpad = useKeyboardStore((s) => s.polarisNumpad);
  const setPolarisNumpad = useKeyboardStore((s) => s.setPolarisNumpad);

  const [audioMenuOpen, setAudioMenuOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExport = () => {
    const config = exportConfiguration();
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(config, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `${config.name}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        const success = importConfiguration(json);
        if (!success) {
          alert('配置导入失败：配置文件格式错误或版本不兼容。');
        }
      } catch (err) {
        alert('无效的 JSON 配置文件。');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const models: { id: KeyboardModelId; name: string; tag: string }[] = [
    { id: 'eveningstar75', name: '晚星 75', tag: '75% • 82 键' },
    { id: 'mrsuit80', name: '北极星 80', tag: '80% • 六芒星限定' },
    { id: 'bakeneko65', name: '化猫 65', tag: '65% • O-Ring开山之作' },
    { id: 'tofu60', name: '豆腐 60', tag: '60% • 61 键' },
  ];

  const cameraPresets: { id: CameraPreset; label: string }[] = [
    { id: 'default', label: '透视视角' },
    { id: 'top', label: '垂直俯视' },
    { id: 'back', label: 'PVD配重' },
    { id: 'side', label: '侧边腰线' },
    { id: 'front', label: '正面下巴' },
    { id: 'iso', label: '等轴测图' },
  ];

  return (
    <header className="absolute top-4 left-6 right-6 z-30 flex items-center justify-between pointer-events-none select-none">
      {/* Brand Identity Badge */}
      <div className="pointer-events-auto flex items-center gap-3 px-4 py-2.5 rounded-2xl bg-slate-900/80 backdrop-blur-xl border border-white/10 shadow-[0_10px_30px_rgba(0,0,0,0.5)]">
        <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-sky-500 via-indigo-500 to-fuchsia-500 flex items-center justify-center text-white shadow-lg shadow-sky-500/30">
          <Sparkles className="w-4 h-4 animate-pulse" />
        </div>
        <div>
          <div className="flex items-center gap-1.5">
            <h1 className="text-sm font-bold tracking-wider text-white">客制化 3D 键盘工坊</h1>
            <span className="text-[9px] px-1.5 py-0.5 rounded bg-sky-500/20 text-sky-400 font-mono font-semibold border border-sky-500/30">
              M2 Hi-Fi
            </span>
          </div>
          <p className="text-[10px] text-slate-400 font-mono tracking-tight">
            CYBERKEY 3D • 机械键盘定制系统
          </p>
        </div>
      </div>

      {/* Model Switcher Tabs (EveningStar 75, Mr. Suit 80, Tofu 60) */}
      <div className="pointer-events-auto flex items-center p-1 rounded-2xl bg-slate-900/80 backdrop-blur-xl border border-white/10 shadow-[0_10px_30px_rgba(0,0,0,0.5)]">
        {models.map((m) => {
          const active = model === m.id;
          return (
            <button
              key={m.id}
              onClick={() => setModel(m.id)}
              className={`flex flex-col items-center px-4 py-1.5 rounded-xl transition-all duration-200 ${
                active
                  ? 'bg-sky-500 text-white font-medium shadow-md shadow-sky-500/30 scale-[1.02]'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
              }`}
            >
              <span className="text-xs font-semibold">{m.name}</span>
              <span className={`text-[10px] ${active ? 'text-sky-100' : 'text-slate-500'}`}>
                {m.tag}
              </span>
            </button>
          );
        })}
      </div>

      {/* Quick Action Toolbar */}
      <div className="pointer-events-auto flex items-center gap-1.5 p-1.5 rounded-2xl bg-slate-900/80 backdrop-blur-xl border border-white/10 shadow-[0_10px_30px_rgba(0,0,0,0.5)]">
        {/* Camera Views Menu */}
        <div className="flex items-center gap-1 pr-1 border-r border-white/10">
          {cameraPresets.slice(0, 4).map((p) => (
            <button
              key={p.id}
              onClick={() => setCameraPreset(p.id)}
              className={`px-2.5 py-1.5 rounded-xl text-xs font-medium transition-all ${
                cameraPreset === p.id
                  ? 'bg-white/15 text-sky-400 border border-sky-500/30'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
              title={`相机视角: ${p.label}`}
            >
              {p.label}
            </button>
          ))}
        </div>

        {/* Aviator Cable Quick Toggle Button */}
        <button
          onClick={() => setCableVisible(!cableVisible)}
          className={`px-2.5 py-1.5 rounded-xl text-xs font-medium transition-all flex items-center gap-1.5 ${
            cableVisible
              ? 'bg-sky-500/20 text-sky-400 border border-sky-500/30 shadow-sm shadow-sky-500/10'
              : 'text-slate-400 hover:text-white hover:bg-white/5'
          }`}
          title={cableVisible ? '已连接金属航插线 (点击断开)' : '点击插上定制金属发光航插线'}
        >
          <span
            className="w-2 h-2 rounded-full shadow-[0_0_6px_currentColor]"
            style={{ color: cableLedColor, backgroundColor: cableLedColor }}
          />
          <span className="font-semibold">{cableVisible ? '航插线: 已接' : '航插线: 断开'}</span>
        </button>

        {/* Companion Numpad Quick Toggle Button */}
        <button
          onClick={() => setPolarisNumpad(!polarisNumpad)}
          className={`px-2.5 py-1.5 rounded-xl text-xs font-medium transition-all flex items-center gap-1.5 ${
            polarisNumpad
              ? 'bg-pink-500/20 text-pink-300 border border-pink-400/30 shadow-sm shadow-pink-500/10'
              : 'text-slate-400 hover:text-white hover:bg-white/5'
          }`}
          title={polarisNumpad ? '隐藏 17-Key 伴侣小键盘' : '显示配套 17-Key 伴侣小键盘'}
        >
          <span className="text-[11px]">🎮</span>
          <span className="font-semibold">{polarisNumpad ? '伴侣小键盘: 开' : '小键盘: 关'}</span>
        </button>

        {/* Audio Acoustics Control Popover */}
        <div className="relative">
          <button
            onClick={() => setAudioMenuOpen(!audioMenuOpen)}
            className={`p-2 rounded-xl transition-all flex items-center gap-1.5 text-xs ${
              audioMenuOpen || !muted
                ? 'bg-sky-500/20 text-sky-400 border border-sky-500/30'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
            title="轴体声学与音量控制"
          >
            {muted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4" />}
            <span className="hidden sm:inline font-mono">{Math.round(volume * 100)}%</span>
          </button>

          {audioMenuOpen && (
            <div className="absolute right-0 top-12 w-64 p-3.5 rounded-2xl bg-slate-900/95 backdrop-blur-2xl border border-white/15 shadow-[0_20px_50px_rgba(0,0,0,0.7)] flex flex-col gap-3 z-50">
              <div className="flex items-center justify-between pb-2 border-b border-white/10">
                <div className="flex items-center gap-1.5 text-xs font-bold text-sky-400">
                  <Waves className="w-3.5 h-3.5" />
                  <span>程序化声学引擎</span>
                </div>
                <button
                  onClick={() => setMuted(!muted)}
                  className={`text-[10px] px-2 py-0.5 rounded font-mono font-medium ${
                    muted ? 'bg-rose-500/20 text-rose-300' : 'bg-sky-500/20 text-sky-300'
                  }`}
                >
                  {muted ? '已静音' : '声学已开启'}
                </button>
              </div>

              {/* Volume Slider */}
              <div className="flex flex-col gap-1.5">
                <div className="flex justify-between text-[11px] text-slate-400">
                  <span>合成器主音量</span>
                  <span className="font-mono text-sky-300">{Math.round(volume * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={volume}
                  onChange={(e) => setVolume(parseFloat(e.target.value))}
                  className="w-full accent-sky-400 cursor-pointer h-1.5 bg-slate-800 rounded-lg appearance-none"
                />
              </div>

              {/* Poron Foam Damping Toggle */}
              <div className="flex items-center justify-between p-2 rounded-xl bg-slate-800/60 border border-white/5 text-xs">
                <div className="flex flex-col">
                  <span className="font-medium text-slate-200">Poron 夹心棉与消音垫</span>
                  <span className="text-[10px] text-slate-400">
                    {foamDamping ? '闷润麻将音 (深层消音吸震)' : '纯粹铝坨坨空腔音 (清脆击底)'}
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={foamDamping}
                  onChange={(e) => setFoamDamping(e.target.checked)}
                  className="w-4 h-4 accent-sky-400 rounded cursor-pointer"
                />
              </div>

              <div className="text-[10px] text-slate-500 font-mono text-center">
                100% Web Audio API 物理建模 • 24 复音并发
              </div>
            </div>
          )}
        </div>

        {/* Auto-Rotate Toggle */}
        <button
          onClick={toggleAutoRotate}
          className={`p-2 rounded-xl transition-all ${
            autoRotate
              ? 'bg-sky-500/20 text-sky-400 border border-sky-500/30'
              : 'text-slate-400 hover:text-white hover:bg-white/5'
          }`}
          title="开启/关闭 3D 自动旋转"
        >
          <RotateCw className={`w-4 h-4 ${autoRotate ? 'animate-spin' : ''}`} />
        </button>

        {/* Export JSON Config */}
        <button
          onClick={handleExport}
          className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-all"
          title="导出键盘配置方案 (JSON)"
        >
          <Download className="w-4 h-4" />
        </button>

        {/* Import JSON Config */}
        <button
          onClick={() => fileInputRef.current?.click()}
          className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-all"
          title="导入键盘配置方案 (JSON)"
        >
          <Upload className="w-4 h-4" />
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".json"
          onChange={handleFileChange}
          className="hidden"
        />

        {/* Reset Defaults */}
        <button
          onClick={resetDefaults}
          className="p-2 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-white/5 transition-all"
          title="重置为出厂默认配置"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};
