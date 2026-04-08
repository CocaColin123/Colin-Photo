import { useEffect, useRef, useState } from 'react';

const INTERACTIVE_SELECTOR =
  'a[href],button,input,textarea,select,summary,[role="button"],[role="link"],label,img,.magnetic-target,[data-cursor-hover],[data-film-strip]';

function isInteractiveTarget(node: Element | null): boolean {
  if (!node || !(node instanceof Element)) return false;
  if (node.matches(INTERACTIVE_SELECTOR)) return true;
  return !!node.closest(INTERACTIVE_SELECTOR);
}

export default function CustomCursor() {
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [hovering, setHovering] = useState(false);
  const rafRef = useRef<number | null>(null);
  const pendingRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (window.matchMedia('(pointer: coarse)').matches) return;

    const flush = () => {
      rafRef.current = null;
      const { x, y } = pendingRef.current;
      setPos({ x, y });
      const top = document.elementFromPoint(x, y);
      setHovering(isInteractiveTarget(top));
    };

    const onMove = (e: MouseEvent) => {
      pendingRef.current = { x: e.clientX, y: e.clientY };
      if (rafRef.current == null) {
        rafRef.current = window.requestAnimationFrame(flush);
      }
    };

    window.addEventListener('mousemove', onMove, { passive: true, capture: true });
    return () => {
      window.removeEventListener('mousemove', onMove, { capture: true });
      if (rafRef.current != null) {
        window.cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
  }, []);

  if (typeof window !== 'undefined' && window.matchMedia('(pointer: coarse)').matches) {
    return null;
  }

  const forceHidden =
    typeof document !== 'undefined' &&
    document.documentElement.getAttribute('data-cursor-hidden') === '1';

  const scale = hovering ? 2.5 : 1;
  const opacity = forceHidden ? 0 : (hovering ? 0.8 : 1);

  return (
    <div
      aria-hidden
      className="custom-cursor-dot pointer-events-none mix-blend-difference z-[1000] rounded-full bg-white"
      style={{
        position: 'fixed',
        left: pos.x,
        top: pos.y,
        width: 16,
        height: 16,
        transform: `translate(-50%, -50%) scale(${scale})`,
        opacity,
        transition: 'transform 0.22s ease-out, opacity 0.22s ease-out',
        willChange: 'left, top, transform, opacity',
      }}
    />
  );
}
