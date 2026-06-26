import { useEffect, useMemo, useState } from 'react';

function prefersReducedMotion(): boolean {
  return typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export function CountUp({
  value,
  duration = 720,
  suffix = ''
}: {
  value: number;
  duration?: number;
  suffix?: string;
}) {
  const target = useMemo(() => (Number.isFinite(value) ? value : 0), [value]);
  const [current, setCurrent] = useState(() => (prefersReducedMotion() ? target : 0));

  useEffect(() => {
    if (prefersReducedMotion()) {
      setCurrent(target);
      return;
    }

    let frame = 0;
    const startedAt = performance.now();
    const start = current;
    const delta = target - start;

    function tick(now: number) {
      const progress = Math.min(1, (now - startedAt) / duration);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCurrent(start + delta * eased);
      if (progress < 1) frame = requestAnimationFrame(tick);
    }

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [duration, target]);

  return <>{Math.round(current).toLocaleString('es-MX')}{suffix}</>;
}
