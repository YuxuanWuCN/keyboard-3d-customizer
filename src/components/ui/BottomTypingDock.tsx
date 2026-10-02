import React, { useRef, useEffect } from 'react';
import { useKeyboardStore } from '../../store/useKeyboardStore';
import {
  Keyboard,
  Gauge,
  Target,
  RefreshCw,
  ChevronUp,
  ChevronDown,
  Sparkles,
  Zap,
  Volume2,
} from 'lucide-react';

export const BottomTypingDock: React.FC = () => {
  const sandboxOpen = useKeyboardStore((s) => s.sandboxOpen);
  const setSandboxOpen = useKeyboardStore((s) => s.setSandboxOpen);
  const sampleText = useKeyboardStore((s) => s.sampleText);
  const typedText = useKeyboardStore((s) => s.typedText);
  const telemetry = useKeyboardStore((s) => s.telemetry);
  const keystrokeHistory = useKeyboardStore((s) => s.keystrokeHistory);
  const handleTypingInput = useKeyboardStore((s) => s.handleTypingInput);
  const resetTypingSession = useKeyboardStore((s) => s.resetTypingSession);
  const nextSamplePrompt = useKeyboardStore((s) => s.nextSamplePrompt);
  const switchType = useKeyboardStore((s) => s.switchType);
  const switchModel = useKeyboardStore((s) => s.switchModel);

  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-focus input when sandbox is open
  useEffect(() => {
    if (sandboxOpen) {
      inputRef.current?.focus();
    }
  }, [sandboxOpen]);

  const handleContainerClick = () => {
    inputRef.current?.focus();
  };

  return (
    <footer className="absolute bottom-4 left-1/2 -translate-x-1/2 z-30 pointer-events-none select-none max-w-4xl w-[calc(100%-3rem)] flex flex-col items-center">
      {/* Hidden input to capture physical keyboard input accurately */}
      <input
        ref={inputRef}
        type="text"
        value={typedText}
        onChange={(e) => handleTypingInput(e.target.value)}
        className="opacity-0 absolute -top-10 pointer-events-none"
        tabIndex={-1}
        autoComplete="off"
        autoCapitalize="off"
        spellCheck="false"
      />

      {!sandboxOpen ? (
        /* Collapsed Mini HUD Bar */
        <div className="pointer-events-auto flex items-center gap-5 px-6 py-2.5 rounded-2xl bg-slate-900/85 backdrop-blur-xl border border-white/10 shadow-[0_10px_35px_rgba(0,0,0,0.5)] text-xs text-slate-300">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span className="font-semibold text-white">打字测试沙盒</span>
          </div>

          <div className="h-4 w-px bg-white/10" />

          {/* Telemetry Preview */}
          <div className="flex items-center gap-4 font-mono">
            <div className="flex items-center gap-1.5">
              <Gauge className="w-3.5 h-3.5 text-sky-400" />
              <span className="text-slate-400">速度:</span>
              <span className="font-bold text-sky-300">{telemetry.wpm} WPM</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Target className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-slate-400">准确率:</span>
              <span className="font-bold text-emerald-300">{telemetry.accuracy}%</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Volume2 className="w-3.5 h-3.5 text-amber-400" />
              <span className="text-slate-400">轴体:</span>
              <span className="font-bold text-amber-300">
                {switchType === 'linear' ? '线性轴' : switchType === 'clicky' ? '有声段落' : '提前大段落'}
              </span>
            </div>
          </div>

          <div className="h-4 w-px bg-white/10" />

          <button
            onClick={() => setSandboxOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-sky-500 hover:bg-sky-400 text-white font-semibold shadow-md shadow-sky-500/25 transition-all"
          >
            <span>展开沙盒</span>
            <ChevronUp className="w-3.5 h-3.5" />
          </button>
        </div>
      ) : (
        /* Expanded Typing Sandbox Console */
        <div
          onClick={handleContainerClick}
          className="pointer-events-auto w-full p-5 rounded-3xl bg-slate-900/90 backdrop-blur-2xl border border-white/15 shadow-[0_25px_60px_rgba(0,0,0,0.8)] flex flex-col gap-4 cursor-text"
        >
          {/* Top Bar: Telemetry Stats & Action Controls */}
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <div className="flex items-center gap-6">
              {/* Live WPM Speedometer */}
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400">
                  <Gauge className="w-5 h-5" />
                </div>
                <div className="flex flex-col">
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-black font-mono tracking-tight text-white">
                      {telemetry.wpm}
                    </span>
                    <span className="text-[10px] font-mono text-sky-400 font-bold">净速度 (NET WPM)</span>
                  </div>
                  <span className="text-[10px] font-mono text-slate-400">
                    原始速度: {telemetry.rawWpm} WPM
                  </span>
                </div>
              </div>

              {/* Accuracy Meter */}
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                  <Target className="w-5 h-5" />
                </div>
                <div className="flex flex-col">
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-black font-mono tracking-tight text-emerald-300">
                      {telemetry.accuracy}%
                    </span>
                    <span className="text-[10px] font-mono text-emerald-400 font-bold">准确率 (ACCURACY)</span>
                  </div>
                  <span className="text-[10px] font-mono text-slate-400">
                    正确: {telemetry.correctKeystrokes} / 共 {telemetry.totalKeystrokes} 键
                  </span>
                </div>
              </div>

              {/* Keystrokes & Errors */}
              <div className="hidden sm:flex flex-col justify-center text-xs font-mono text-slate-400 border-l border-white/10 pl-5">
                <div>错误按键: <span className="text-rose-400 font-bold">{telemetry.errorCount}</span></div>
                <div>已耗时: <span className="text-slate-200">{telemetry.elapsedSeconds}秒</span></div>
              </div>
            </div>

            {/* Right Buttons: Next Prompt, Reset, Minimize */}
            <div className="flex items-center gap-2">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  nextSamplePrompt();
                }}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 flex items-center gap-1.5 transition-colors"
                title="更换随机打字测试句子"
              >
                <Sparkles className="w-3.5 h-3.5 text-sky-400" />
                <span>换一句</span>
              </button>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  resetTypingSession();
                }}
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                title="重新开始打字测试"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setSandboxOpen(false);
                }}
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                title="收起打字面板"
              >
                <ChevronDown className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Prompt Sentence with Live Character Feedback */}
          <div className="p-4 rounded-2xl bg-slate-950/60 border border-white/5 font-mono text-base tracking-wide leading-relaxed min-h-[4.5rem] flex flex-wrap items-center">
            {sampleText.split('').map((char, idx) => {
              let charClass = 'text-slate-500';
              const isCursor = idx === typedText.length;

              if (idx < typedText.length) {
                if (typedText[idx] === char) {
                  charClass = 'text-emerald-400 font-bold';
                } else {
                  charClass = 'text-rose-400 bg-rose-500/20 font-bold underline decoration-rose-500';
                }
              }

              return (
                <span key={idx} className={`relative ${charClass}`}>
                  {isCursor && (
                    <span className="absolute -left-[1px] top-0 bottom-0 w-[2px] bg-sky-400 animate-pulse" />
                  )}
                  {char === ' ' ? '\u00A0' : char}
                </span>
              );
            })}
          </div>

          {/* Keystroke Visualizer Trail */}
          <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
            <div className="flex items-center gap-1.5 overflow-hidden">
              <span className="text-[11px] text-slate-500 flex items-center gap-1">
                <Zap className="w-3 h-3 text-amber-400" />
                最近按键:
              </span>
              <div className="flex items-center gap-1">
                {keystrokeHistory.slice(-14).map((k, i) => (
                  <span
                    key={`${k.timestamp}-${i}`}
                    className={`px-1.5 py-0.5 rounded text-[10px] font-bold border transition-all ${
                      k.correct
                        ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                        : 'bg-rose-500/10 text-rose-300 border-rose-500/30'
                    }`}
                  >
                    {k.key === ' ' ? '␣' : k.key}
                  </span>
                ))}
              </div>
            </div>

            <span className="text-[11px] text-slate-500">
              💡 敲击键盘任意按键，即刻触发 3.8mm 3D 物理行程与对应轴体拟真声学
            </span>
          </div>
        </div>
      )}
    </footer>
  );
};
