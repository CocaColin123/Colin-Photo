import { motion } from 'motion/react';
import { useEffect, useRef, useState } from 'react';
import { assetUrl } from '../utils/asset';

interface LandingPageProps {
  onEnter?: () => void;
  quote?: string[];
  subtitle?: string;
  siteTitle?: string;
}

export default function LandingPage({ onEnter, quote, subtitle, siteTitle }: LandingPageProps) {
  const glassRef = useRef<HTMLDivElement>(null);
  const [loadVideo, setLoadVideo] = useState(false);

  const q = quote ?? [
    '摄影不能改变世界',
    '但能展示世界',
    '尤其是在世界不断变化的时候',
  ];

  useEffect(() => {
    const el = glassRef.current;
    if (!el) return;

    const maxDeg = 5;
    const onMove = (e: PointerEvent) => {
      const rect = el.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const dx = (e.clientX - cx) / (rect.width / 2);
      const dy = (e.clientY - cy) / (rect.height / 2);

      const rotY = Math.max(-1, Math.min(1, dx)) * maxDeg;
      const rotX = Math.max(-1, Math.min(1, -dy)) * maxDeg;
      el.style.setProperty('--tilt-x', `${rotX.toFixed(2)}deg`);
      el.style.setProperty('--tilt-y', `${rotY.toFixed(2)}deg`);
    };

    const onEnter = () => {
      el.style.setProperty('--tilt-active', '1');
    };
    const onLeave = () => {
      el.style.setProperty('--tilt-active', '0');
      el.style.setProperty('--tilt-x', '0deg');
      el.style.setProperty('--tilt-y', '0deg');
    };

    el.addEventListener('pointerenter', onEnter);
    el.addEventListener('pointermove', onMove);
    el.addEventListener('pointerleave', onLeave);
    return () => {
      el.removeEventListener('pointerenter', onEnter);
      el.removeEventListener('pointermove', onMove);
      el.removeEventListener('pointerleave', onLeave);
    };
  }, []);

  // 首屏优先“秒出画面”：先显示 poster/尾帧图，再在浏览器空闲时加载视频资源，避免抢占首屏带宽
  useEffect(() => {
    let cancelled = false;
    const enable = () => { if (!cancelled) setLoadVideo(true); };

    // rIC：空闲时加载；不支持则退化为稍后加载
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const ric = (window as any).requestIdleCallback as undefined | ((cb: () => void, opts?: { timeout?: number }) => number);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const cancelRic = (window as any).cancelIdleCallback as undefined | ((id: number) => void);

    if (ric) {
      const id = ric(enable, { timeout: 1200 });
      return () => { cancelled = true; cancelRic?.(id); };
    }

    const t = window.setTimeout(enable, 250);
    return () => { cancelled = true; window.clearTimeout(t); };
  }, []);

  return (
    <div className="relative h-screen w-full overflow-hidden bg-[#0a0a0f] text-white">
      <style>{`
        @keyframes lpFadeUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0px); }
        }
        .lp-anim { opacity: 0; transform: translateY(20px); animation: lpFadeUp 0.9s cubic-bezier(0.22,1,0.36,1) forwards; }
        .lp-delay-0 { animation-delay: 0.10s; }
        .lp-delay-1 { animation-delay: 0.22s; }
        .lp-delay-2 { animation-delay: 0.40s; }
        .lp-delay-3 { animation-delay: 0.60s; }
        .lp-delay-4 { animation-delay: 0.80s; }
        .lp-delay-5 { animation-delay: 1.00s; }
        .lp-delay-6 { animation-delay: 1.18s; }

        .lp-glass {
          --tilt-active: 0;
          --tilt-x: 0deg;
          --tilt-y: 0deg;
          transform: perspective(900px) rotateX(var(--tilt-x)) rotateY(var(--tilt-y)) translateZ(0);
          transition: transform 220ms ease-out;
          will-change: transform;
        }
        .lp-glass[data-active="1"] {
          transition: transform 40ms linear;
        }
      `}</style>

      {/* 背景底色（非满屏视频，保留大面积留白深色） */}
      <div className="absolute inset-0 bg-[#0a0a0f]" />

      {/* 视频尾帧作为底图：放大 + 模糊（避免背景空） */}
      <div className="pointer-events-none absolute inset-0">
        <img
          src={assetUrl('/images/海边/DSC05666.webp')}
          alt=""
          className="absolute inset-0 h-full w-full object-cover opacity-75"
          style={{ filter: 'saturate(0.82) contrast(1.05) brightness(0.78)', objectPosition: '50% 48%' }}
          draggable={false}
        />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(5,7,10,0.92)_0%,rgba(7,8,13,0.72)_42%,rgba(7,8,13,0.20)_78%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_44%,rgba(8,9,14,0)_0%,rgba(8,9,14,0.48)_62%,rgba(8,9,14,0.82)_100%)]" />
      </div>

      {/* 右侧视频画幅（参考图的排版：右侧横向画框） */}
      <div className="pointer-events-none absolute right-[max(1rem,3vw)] bottom-[max(1rem,5vh)] hidden w-[min(520px,34vw)] md:block">
        <div className="relative w-full aspect-[16/9] overflow-hidden border border-white/12 bg-black/30 shadow-[0_28px_90px_rgba(0,0,0,0.55)]">
          <video
            autoPlay
            loop
            muted
            playsInline
            preload="metadata"
            poster={assetUrl('/videos/7d046f381b9021b7ec551f269401dd7c.png')}
            className="absolute inset-0 h-full w-full object-cover"
            disablePictureInPicture
          >
            {loadVideo && (
              <>
                {/* 如果你之后生成了 webm（体积更小），把文件放到 public/videos/landing.webm，就能自动优先加载 */}
                <source src={assetUrl('/videos/landing.webm')} type="video/webm" />
                <source src={assetUrl('/videos/landing.mp4')} type="video/mp4" />
              </>
            )}
          </video>
          {/* 轻微压暗，和整体暗色调统一 */}
          <div className="absolute inset-0 bg-black/35" />
          <div className="absolute inset-x-4 top-4 flex items-center justify-between text-[10px] tracking-[0.24em] text-white/45">
            <span>MOTION STUDY</span>
            <span>COLIN</span>
          </div>
        </div>
      </div>

      {/* 中间层：微噪点（整体质感） */}
      <div
        className="pointer-events-none absolute inset-0 z-10 opacity-10 mix-blend-overlay"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
          backgroundRepeat: 'repeat',
        }}
      />

      {/* 3. 上层：轻微光晕呼吸 */}
      <div className="hidden">
        <motion.div
          animate={{
            opacity: [0.1, 0.28, 0.1],
            scale: [1, 1.08, 1],
          }}
          transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute top-1/2 left-1/2 h-[40vh] w-[40vw] -translate-x-1/2 -translate-y-1/2 rounded-full mix-blend-screen"
          style={{
            background: 'radial-gradient(circle, rgba(201,169,110,0.4) 0%, transparent 70%)',
            filter: 'blur(60px)',
          }}
        />
      </div>

      {/* 4. UI 层：名言主体 + 下方入口区 */}
      <div className="relative z-20 h-full w-full p-6 md:p-10">
        {/* 名言主体：深色毛玻璃悬浮板 + 跟手 3D tilt */}
        <div className="absolute left-[max(2rem,7vw)] top-[46%] w-[min(720px,calc(100vw-4rem))] -translate-y-1/2">
          <div
            ref={glassRef}
            className="lp-glass relative"
          >
            {/* 极细高光边缘 */}
            <div className="hidden" />
            <div className="hidden" />
            <div className="hidden" />

            <div className="max-w-[46rem]">
              <div className="lp-anim lp-delay-0 text-left">
                <div
                  className="font-huiwen text-2xl md:text-4xl tracking-[0.22em] text-white/78"
                  style={{ textShadow: '0 12px 34px rgba(0,0,0,0.75)' }}
                >
                  {siteTitle ?? 'Colin的世界'}
                </div>
              </div>

              <div className="mt-9 space-y-3 md:space-y-4">
                <div
                  className="lp-anim lp-delay-2 font-serif font-light text-white/68 tracking-[0.06em] leading-[1.28]"
                  style={{ fontSize: 'clamp(1.28rem, 2.3vw, 2.15rem)', textShadow: '0 8px 28px rgba(0,0,0,0.65)' }}
                >
                  {q[0]}
                </div>
                <div
                  className="lp-anim lp-delay-3 font-serif font-semibold text-white tracking-[0.04em] leading-[1.04]"
                  style={{ fontSize: 'clamp(2.3rem, 5vw, 5.1rem)', textShadow: '0 14px 42px rgba(0,0,0,0.78)' }}
                >
                  {q[1]}
                </div>
                <div
                  className="lp-anim lp-delay-4 max-w-[38rem] font-serif font-light text-white/68 tracking-[0.06em] leading-[1.32]"
                  style={{ fontSize: 'clamp(1.18rem, 2.05vw, 2rem)', textShadow: '0 8px 28px rgba(0,0,0,0.65)' }}
                >
                  {q[2]}
                </div>
              </div>

              <div
                className="lp-anim lp-delay-5 mt-8 max-w-[34rem] border-t border-white/18 pt-5 text-xs md:text-sm tracking-[0.2em] text-white/48"
                style={{ textShadow: '0 8px 24px rgba(0,0,0,0.65)' }}
              >
                {subtitle ?? '定格方块间的流光溢彩'}
              </div>

              <div className="lp-anim lp-delay-6 mt-10">
                <button
                  onClick={onEnter}
                  className="group relative inline-flex items-center justify-center overflow-hidden rounded-full border border-white/25 bg-white/[0.07] px-10 py-3.5 backdrop-blur-sm transition-all duration-300 ease-out hover:border-white/50 hover:bg-white/[0.12] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white/70"
                  style={{
                    boxShadow: '0 14px 48px rgba(0,0,0,0.36)',
                  }}
                >
                  <span className="relative text-base md:text-lg tracking-[0.22em] text-white/92">
                    探索
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

