import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { assetUrl } from '../utils/asset';

type ClickKind = 'grass' | 'tree' | 'sea' | 'stone';

export interface MusicWidgetProps {
  /** 播放一次点击音效（由外部决定类别与过滤规则） */
  registerSfxApi?: (api: { playClick: (kind: ClickKind) => void }) => void;
  /**
   * 额外音量衰减（dB）。例如进入相册时传 -3，退出传 0。
   * 基准音量已在组件内部统一下调约 -12dB。
   */
  duckDb?: number;
}

const BGM_SRC = assetUrl('/audio/bgm.mp3');
const SFX: Record<ClickKind, string> = {
  grass: assetUrl('/audio/grass.mp3'),
  tree: assetUrl('/audio/tree.mp3'),
  sea: assetUrl('/audio/sea.mp3'),
  stone: assetUrl('/audio/stone.mp3'),
};

function dbToGain(db: number) {
  return Math.pow(10, db / 20);
}

export default function MusicWidget({ registerSfxApi, duckDb = 0 }: MusicWidgetProps) {
  const [playing, setPlaying] = useState(true);
  const [ready, setReady] = useState(false);
  const [blocked, setBlocked] = useState(false);

  const bgmRef = useRef<HTMLAudioElement | null>(null);
  const sfxRef = useRef<Record<ClickKind, HTMLAudioElement> | null>(null);

  // 基准音量：在原先 0.55 的基础上整体下调约 -13dB
  const baseBgmVolume = 0.55 * dbToGain(-13);
  const effectiveBgmVolume = Math.max(0, Math.min(1, baseBgmVolume * dbToGain(duckDb)));

  const playBgm = useCallback(async () => {
    const a = bgmRef.current;
    if (!a) return;
    try {
      await a.play();
      setBlocked(false);
    } catch {
      setBlocked(true);
    }
  }, []);

  const pauseBgm = useCallback(() => {
    const a = bgmRef.current;
    if (!a) return;
    a.pause();
  }, []);

  useEffect(() => {
    const bgm = new Audio(BGM_SRC);
    bgm.loop = true;
    bgm.volume = effectiveBgmVolume;
    bgm.preload = 'auto';
    bgmRef.current = bgm;

    const sfx: Record<ClickKind, HTMLAudioElement> = {
      grass: new Audio(SFX.grass),
      tree: new Audio(SFX.tree),
      sea: new Audio(SFX.sea),
      stone: new Audio(SFX.stone),
    };
    (Object.keys(sfx) as ClickKind[]).forEach((k) => {
      sfx[k].preload = 'auto';
      if (k === 'stone') sfx[k].volume = 0.38 * dbToGain(-10);
      else if (k === 'grass') sfx[k].volume = 0.38 * dbToGain(-10);
      else sfx[k].volume = 0.38;
    });
    sfxRef.current = sfx;

    setReady(true);

    return () => {
      try { bgm.pause(); } catch { /* noop */ }
      bgmRef.current = null;
      sfxRef.current = null;
    };
  }, []);

  // 动态更新 BGM 音量（进入/退出相册时 ducking）
  useEffect(() => {
    const a = bgmRef.current;
    if (!a) return;
    a.volume = effectiveBgmVolume;
  }, [effectiveBgmVolume]);

  const playClick = useCallback((kind: ClickKind) => {
    const bank = sfxRef.current;
    if (!bank) return;
    const a = bank[kind];
    try {
      a.currentTime = 0;
      void a.play();
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    if (registerSfxApi) registerSfxApi({ playClick });
  }, [registerSfxApi, playClick]);

  // 进入网页就尝试播放；若被浏览器策略拦截，则等到第一次用户交互再播放
  useEffect(() => {
    if (!ready) return;
    if (!playing) return;
    void playBgm();
  }, [ready, playing, playBgm]);

  useEffect(() => {
    if (!blocked || !playing) return;
    const unlock = () => {
      void playBgm();
      window.removeEventListener('pointerdown', unlock, true);
      window.removeEventListener('keydown', unlock, true);
    };
    window.addEventListener('pointerdown', unlock, true);
    window.addEventListener('keydown', unlock, true);
    return () => {
      window.removeEventListener('pointerdown', unlock, true);
      window.removeEventListener('keydown', unlock, true);
    };
  }, [blocked, playing, playBgm]);

  const toggle = useCallback(() => {
    setPlaying((p) => {
      const next = !p;
      if (next) void playBgm();
      else pauseBgm();
      return next;
    });
  }, [pauseBgm, playBgm]);

  const note = useMemo(() => (Math.random() > 0.5 ? '♫' : '♬'), []);

  return (
    <button
      type="button"
      data-music-widget
      aria-label={playing ? '暂停背景音乐' : '播放背景音乐'}
      onClick={(e) => { e.stopPropagation(); toggle(); }}
      className="fixed left-6 bottom-6 z-[120] select-none"
      style={{
        width: 60,
        height: 60,
        WebkitTapHighlightColor: 'transparent',
      }}
    >
      <span
        aria-hidden
        className="absolute -top-1 left-1/2 -translate-x-1/2 text-[22px] font-bold pointer-events-none"
        style={{
          opacity: playing ? 0.9 : 0,
          color: '#fff2df',
          textShadow: '0 2px 6px rgba(0,0,0,0.6), 0 0 4px rgba(255,220,150,0.5)',
          animation: playing ? 'mcFloat 2.8s cubic-bezier(0.25, 0.46, 0.45, 0.94) infinite' : 'none',
        }}
      >
        {note}
      </span>

      <span
        aria-hidden
        className="absolute inset-0 rounded-[6px] border-[3px] flex items-center justify-center"
        style={{
          backgroundColor: 'rgba(0,0,0,0.18)',
          borderColor: 'rgba(255,255,255,0.10)',
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)',
          boxShadow: 'inset 0 0 16px rgba(255,255,255,0.02), 0 10px 24px rgba(0,0,0,0.35)',
        }}
      >
        <span
          className="text-[30px] font-bold"
          style={{
            color: 'rgba(255,255,255,0.70)',
            textShadow: '0 2px 10px rgba(0,0,0,0.5)',
            transform: 'translateY(-1px)',
          }}
        >
          ♫
        </span>

        {/* 暂停符号：红圈+斜杠（克制） */}
        <span
          className="absolute w-[40px] h-[40px] rounded-full"
          style={{
            opacity: playing ? 0 : 1,
            border: '2px solid rgba(229,57,53,0.85)',
            background:
              'linear-gradient(to top right, transparent calc(50% - 2px), rgba(229,57,53,0.85) calc(50% - 2px), rgba(229,57,53,0.85) calc(50% + 2px), transparent calc(50% + 2px))',
            boxShadow: '0 0 6px rgba(0,0,0,0.35)',
          }}
        />
      </span>

      {/* keyframes 内联（避免改全局 css） */}
      <style>{`
        @keyframes mcFloat {
          0% { transform: translate(calc(-50% + 0px), 0px) rotate(0deg) scale(0.5); opacity: 0; }
          8% { opacity: 0.95; transform: translate(calc(-50% + 2px), -6px) rotate(2deg) scale(0.65); }
          22% { transform: translate(calc(-50% - 4px), -22px) rotate(-4deg) scale(0.85); }
          38% { transform: translate(calc(-50% + 6px), -40px) rotate(5deg) scale(1); }
          55% { transform: translate(calc(-50% - 3px), -58px) rotate(-3deg) scale(1.02); }
          72% { transform: translate(calc(-50% + 5px), -76px) rotate(4deg) scale(0.98); opacity: 0.9; }
          88% { transform: translate(calc(-50% - 2px), -92px) rotate(-2deg) scale(0.92); opacity: 0.5; }
          100% { transform: translate(calc(-50% + 3px), -108px) rotate(6deg) scale(0.8); opacity: 0; }
        }
      `}</style>
    </button>
  );
}

