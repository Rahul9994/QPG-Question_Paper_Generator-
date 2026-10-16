import { useEffect, useRef } from 'react';

const INTERACTIVE = 'a, button, input, textarea, select, label, [role="button"], [data-cursor]';

// Gold dot + trailing ring. Only on precise pointers and when motion is allowed.
export default function Cursor() {
  const dotRef = useRef(null);
  const ringRef = useRef(null);

  useEffect(() => {
    const fine = window.matchMedia('(pointer: fine)').matches;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!fine || reduce) return undefined;

    const html = document.documentElement;
    html.classList.add('has-cursor');
    const dot = dotRef.current;
    const ring = ringRef.current;
    const pos = { x: -100, y: -100 };
    const lag = { x: -100, y: -100 };
    let raf = 0;
    let visible = false;

    const loop = () => {
      lag.x += (pos.x - lag.x) * 0.17;
      lag.y += (pos.y - lag.y) * 0.17;
      dot.style.transform = `translate3d(${pos.x}px, ${pos.y}px, 0)`;
      ring.style.transform = `translate3d(${lag.x}px, ${lag.y}px, 0)`;
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    const onMove = (e) => {
      pos.x = e.clientX; pos.y = e.clientY;
      if (!visible) { visible = true; dot.style.opacity = 1; ring.style.opacity = ''; }
    };
    const onOver = (e) => ring.classList.toggle('hover', Boolean(e.target.closest?.(INTERACTIVE)));
    const onDown = () => ring.classList.add('press');
    const onUp = () => ring.classList.remove('press');
    const onLeave = () => { visible = false; dot.style.opacity = 0; ring.style.opacity = 0; };

    window.addEventListener('pointermove', onMove, { passive: true });
    window.addEventListener('pointerover', onOver, { passive: true });
    window.addEventListener('pointerdown', onDown);
    window.addEventListener('pointerup', onUp);
    document.documentElement.addEventListener('pointerleave', onLeave);

    return () => {
      cancelAnimationFrame(raf);
      html.classList.remove('has-cursor');
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerover', onOver);
      window.removeEventListener('pointerdown', onDown);
      window.removeEventListener('pointerup', onUp);
      document.documentElement.removeEventListener('pointerleave', onLeave);
    };
  }, []);

  return (
    <>
      <div ref={ringRef} className="cursor-ring" style={{ opacity: 0 }} aria-hidden="true" />
      <div ref={dotRef} className="cursor-dot" style={{ opacity: 0 }} aria-hidden="true" />
    </>
  );
}
