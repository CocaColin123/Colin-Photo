import { useEffect, useRef, useState, useCallback } from 'react';

interface FilmStripProps {
  accentColor?: string;
  visible?: boolean;
}

const STRIP_W = 28;
const STRIP_W_HOVER = 32;
const PERF_W = 4;
const PERF_H = 8;
const PERF_R = 1.5;
const PERF_GAP = 6;
const PERF_INSET = 3;
const THUMB_H = 24;

function hexToRgba(hex: string, a: number): string {
  const h = hex.replace('#', '');
  const full = h.length === 3 ? h.split('').map(c => c + c).join('') : h;
  const n = parseInt(full, 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
}

export default function FilmStrip({ accentColor = '#ffffff', visible = true }: FilmStripProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [ratio, setRatio] = useState(0);
  const [hovered, setHovered] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [canScroll, setCanScroll] = useState(false);
  const dragOrigin = useRef({ y: 0, ratio: 0 });

  const sync = useCallback(() => {
    const max = document.documentElement.scrollHeight - window.innerHeight;
    setRatio(max > 0 ? Math.min(1, window.scrollY / max) : 0);
  }, []);

  const measure = useCallback(() => {
    setCanScroll(document.documentElement.scrollHeight > window.innerHeight + 80);
  }, []);

  useEffect(() => {
    sync();
    measure();
    window.addEventListener('scroll', sync, { passive: true });
    window.addEventListener('resize', measure, { passive: true });
    const mo = new MutationObserver(measure);
    mo.observe(document.body, { childList: true, subtree: true });
    return () => {
      window.removeEventListener('scroll', sync);
      window.removeEventListener('resize', measure);
      mo.disconnect();
    };
  }, [sync, measure]);

  // 拖动胶片条时隐藏自定义光标点（系统光标本来就隐藏）
  useEffect(() => {
    const root = document.documentElement;
    if (dragging) root.setAttribute('data-cursor-hidden', '1');
    else root.removeAttribute('data-cursor-hidden');
    return () => root.removeAttribute('data-cursor-hidden');
  }, [dragging]);

  const jumpTo = useCallback((r: number, smooth = false) => {
    const c = Math.max(0, Math.min(1, r));
    const max = document.documentElement.scrollHeight - window.innerHeight;
    window.scrollTo({ top: c * max, behavior: smooth ? 'smooth' : 'instant' as ScrollBehavior });
  }, []);

  const onThumbDown = useCallback((e: React.PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    setDragging(true);
    dragOrigin.current = { y: e.clientY, ratio };
  }, [ratio]);

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    if (!dragging) return;
    const el = containerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const usable = rect.height - THUMB_H;
    if (usable <= 0) return;
    const dy = e.clientY - dragOrigin.current.y;
    jumpTo(dragOrigin.current.ratio + dy / usable);
  }, [dragging, jumpTo]);

  const onPointerUp = useCallback(() => setDragging(false), []);

  const onTrackClick = useCallback((e: React.MouseEvent) => {
    if (dragging) return;
    const el = containerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    jumpTo((e.clientY - rect.top) / rect.height, true);
  }, [dragging, jumpTo]);

  if (typeof window !== 'undefined' && window.matchMedia('(pointer: coarse)').matches) return null;
  if (!canScroll) return null;

  const active = hovered || dragging;
  const w = active ? STRIP_W_HOVER : STRIP_W;

  const perfUnit = PERF_H + PERF_GAP;
  const perfHoleColor = active ? 'rgba(0,0,0,0.55)' : 'rgba(0,0,0,0.45)';
  const perfBg = `repeating-linear-gradient(to bottom,
    transparent 0px, transparent ${PERF_GAP / 2}px,
    ${perfHoleColor} ${PERF_GAP / 2}px,
    ${perfHoleColor} ${PERF_GAP / 2 + PERF_H}px,
    transparent ${PERF_GAP / 2 + PERF_H}px,
    transparent ${perfUnit}px)`;

  const thumbY = ratio * 100;

  return (
    <div
      ref={containerRef}
      data-film-strip
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => { if (!dragging) setHovered(false); }}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      onClick={onTrackClick}
      style={{
        position: 'fixed',
        right: 14,
        top: '50%',
        transform: 'translateY(-50%)',
        height: '62vh',
        width: w,
        zIndex: 45,
        opacity: visible ? 1 : 0,
        pointerEvents: visible ? 'auto' : 'none',
        transition: 'opacity 0.4s ease, width 0.2s ease',
        WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, black 12%, black 88%, transparent 100%)',
        maskImage: 'linear-gradient(to bottom, transparent 0%, black 12%, black 88%, transparent 100%)',
        cursor: 'pointer',
      }}
    >
      {/* 胶片基底 */}
      <div style={{
        position: 'absolute',
        inset: 0,
        borderRadius: 4,
        background: active
          ? 'linear-gradient(180deg, rgba(255,255,255,0.09) 0%, rgba(255,255,255,0.06) 50%, rgba(255,255,255,0.09) 100%)'
          : 'linear-gradient(180deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.035) 50%, rgba(255,255,255,0.06) 100%)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        border: `1px solid rgba(255,255,255,${active ? 0.12 : 0.07})`,
        boxShadow: active
          ? 'inset 0 0 12px rgba(255,255,255,0.03), 0 0 20px rgba(0,0,0,0.3)'
          : 'inset 0 0 8px rgba(255,255,255,0.02)',
        transition: 'all 0.3s ease',
      }} />

      {/* 左齿孔列 */}
      <div style={{
        position: 'absolute',
        left: PERF_INSET,
        top: 0,
        bottom: 0,
        width: PERF_W,
        backgroundImage: perfBg,
        backgroundSize: `${PERF_W}px ${perfUnit}px`,
        borderRadius: PERF_R,
        pointerEvents: 'none',
      }} />

      {/* 右齿孔列 */}
      <div style={{
        position: 'absolute',
        right: PERF_INSET,
        top: 0,
        bottom: 0,
        width: PERF_W,
        backgroundImage: perfBg,
        backgroundSize: `${PERF_W}px ${perfUnit}px`,
        borderRadius: PERF_R,
        pointerEvents: 'none',
      }} />

      {/* 中央分隔线 */}
      <div style={{
        position: 'absolute',
        left: PERF_INSET + PERF_W + 2,
        right: PERF_INSET + PERF_W + 2,
        top: 0,
        bottom: 0,
        borderLeft: '1px solid rgba(255,255,255,0.04)',
        borderRight: '1px solid rgba(255,255,255,0.04)',
        pointerEvents: 'none',
      }} />

      {/* 游标 thumb — 扩大可交互区域 */}
      <div
        onPointerDown={onThumbDown}
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: `calc(${thumbY}% - ${THUMB_H / 2}px)`,
          height: THUMB_H,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: dragging ? 'grabbing' : 'grab',
          touchAction: 'none',
          zIndex: 2,
        }}
      >
        {/* 视觉 thumb */}
        <div style={{
          width: STRIP_W_HOVER - PERF_INSET * 2 - PERF_W * 2 - 2,
          height: 3,
          borderRadius: 2,
          backgroundColor: accentColor,
          opacity: active ? 1 : 0.65,
          boxShadow: `0 0 ${active ? 14 : 8}px ${hexToRgba(accentColor, active ? 0.5 : 0.3)},
                      0 0 2px ${hexToRgba(accentColor, 0.4)}`,
          transition: 'opacity 0.2s ease, box-shadow 0.25s ease',
        }} />
      </div>
    </div>
  );
}
