import { motion } from 'motion/react';
import { useEffect, useRef } from 'react';

interface LandingPageProps {
  onEnter?: () => void;
}

export default function LandingPage({ onEnter }: LandingPageProps) {
  const glassRef = useRef<HTMLDivElement>(null);

  const quote = [
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
          src="/videos/7d046f381b9021b7ec551f269401dd7c.png"
          alt=""
          className="absolute inset-0 h-full w-full object-cover scale-[1.25] opacity-35"
          style={{ filter: 'blur(28px) saturate(1.05) contrast(1.05)' }}
          draggable={false}
        />
        <div className="absolute inset-0 bg-black/45" />
      </div>

      {/* 右侧视频画幅（参考图的排版：右侧横向画框） */}
      <div className="absolute right-[max(0.5rem,2.5vw)] top-1/2 -translate-y-1/2 w-[min(1320px,78vw)]">
        <div className="relative w-full aspect-[16/9] overflow-hidden bg-black/30">
          <video
            autoPlay
            loop
            muted
            playsInline
            preload="auto"
            className="absolute inset-0 h-full w-full object-cover"
          >
            <source src="/videos/landing.mp4" type="video/mp4" />
          </video>
          {/* 轻微压暗，和整体暗色调统一 */}
          <div className="absolute inset-0 bg-black/20" />
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
      <div className="absolute inset-0 z-0 pointer-events-none">
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
        <div className="absolute left-[max(2rem,6vw)] top-[42%] w-[min(760px,calc(100vw-4rem))] -translate-y-1/2">
          <div
            ref={glassRef}
            className="lp-glass relative overflow-hidden rounded-2xl border border-white/10 bg-black/20 backdrop-blur-[15px]"
            style={{ boxShadow: 'inset 0 0 24px rgba(255,255,255,0.02), 0 18px 60px rgba(0,0,0,0.55)' }}
          >
            {/* 极细高光边缘 */}
            <div className="pointer-events-none absolute inset-0 ring-1 ring-white/10" />
            <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
            <div className="pointer-events-none absolute -top-28 -right-28 h-80 w-80 rounded-full bg-white/5 blur-3xl" />

            <div className="px-10 py-10 md:px-12 md:py-12">
              <div className="lp-anim lp-delay-0 text-left">
                <div
                  className="font-huiwen text-2xl md:text-4xl tracking-[0.2em] text-white/80"
                  style={{ textShadow: '0 10px 28px rgba(0,0,0,0.65)' }}
                >
                  Colin的世界
                </div>
              </div>

              <div className="mt-8 space-y-3 md:space-y-4">
                <div
                  className="lp-anim lp-delay-2 font-serif font-light text-white/70 tracking-[0.06em] leading-[1.25]"
                  style={{ fontSize: 'clamp(1.35rem, 2.6vw, 2.25rem)', textShadow: '0 8px 28px rgba(0,0,0,0.55)' }}
                >
                  {quote[0]}
                </div>
                <div
                  className="lp-anim lp-delay-3 font-serif font-semibold text-white tracking-[0.05em] leading-[1.1]"
                  style={{ fontSize: 'clamp(1.9rem, 3.8vw, 3.4rem)', textShadow: '0 12px 36px rgba(0,0,0,0.7)' }}
                >
                  {quote[1]}
                </div>
                <div
                  className="lp-anim lp-delay-4 font-serif font-light text-white/70 tracking-[0.06em] leading-[1.25]"
                  style={{ fontSize: 'clamp(1.35rem, 2.6vw, 2.25rem)', textShadow: '0 8px 28px rgba(0,0,0,0.55)' }}
                >
                  {quote[2]}
                </div>
              </div>

              <div
                className="lp-anim lp-delay-5 mt-8 text-sm md:text-base tracking-[0.22em] text-white/55"
                style={{ textShadow: '0 8px 24px rgba(0,0,0,0.55)' }}
              >
                定格方块间的流光溢彩
              </div>

              <div className="lp-anim lp-delay-6 mt-10">
                <button
                  onClick={onEnter}
                  className="group relative inline-flex items-center justify-center overflow-hidden rounded-full border border-white/20 bg-white/10 px-12 py-4 backdrop-blur-md backdrop-brightness-110 backdrop-saturate-150 transition-all duration-300 ease-out hover:scale-[1.05] hover:border-white/40"
                  style={{
                    boxShadow: '0 0 18px rgba(255,200,50,0.18)',
                  }}
                >
                  <div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 ease-out group-hover:opacity-100" style={{
                    background:
                      'radial-gradient(circle at 30% 30%, rgba(255,200,50,0.22) 0%, transparent 55%), radial-gradient(circle at 70% 70%, rgba(90,160,255,0.18) 0%, transparent 60%)',
                  }} />
                  <span className="relative text-lg md:text-xl tracking-[0.22em] text-white">
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

