import { useEffect, useRef, useState } from 'react';

interface Props {
  value: number;
  format: (n: number) => string;
  /** Milliseconds to travel from the previous value to the new one. */
  duration?: number;
  className?: string;
}

const prefersReducedMotion = () =>
  typeof window !== 'undefined' &&
  window.matchMedia?.('(prefers-reduced-motion: reduce)').matches === true;

/** A number that rolls up to its new value, like the till at closing time. */
export default function Ticker({ value, format, duration = 900, className = '' }: Props) {
  const [shown, setShown] = useState(value);
  const fromRef = useRef(value);
  const frameRef = useRef<number>();

  useEffect(() => {
    const from = fromRef.current;
    if (from === value) return;

    if (prefersReducedMotion()) {
      fromRef.current = value;
      setShown(value);
      return;
    }

    const start = performance.now();
    const step = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      // ease-out-cubic: fast off the mark, gentle landing
      const eased = 1 - Math.pow(1 - t, 3);
      setShown(from + (value - from) * eased);
      if (t < 1) frameRef.current = requestAnimationFrame(step);
      else fromRef.current = value;
    };
    frameRef.current = requestAnimationFrame(step);
    return () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
      fromRef.current = value;
    };
  }, [value, duration]);

  return <span className={`numerals ${className}`}>{format(shown)}</span>;
}
