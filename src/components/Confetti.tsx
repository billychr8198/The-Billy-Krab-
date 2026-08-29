import { useMemo } from 'react';

const COLORS = ['#F7CE3E', '#E8452B', '#5FE3C0', '#3FBEDD', '#F7E9CE', '#FF7A54'];

/** Celebration debris. Cleans itself up when the parent unmounts. */
export default function Confetti({ pieces = 90 }: { pieces?: number }) {
  const bits = useMemo(
    () =>
      Array.from({ length: pieces }, (_, i) => ({
        left: (i * 97) % 100,
        delay: ((i * 53) % 90) / 100,
        duration: 2.6 + ((i * 29) % 22) / 10,
        color: COLORS[i % COLORS.length],
        w: 6 + ((i * 17) % 8),
        h: 9 + ((i * 23) % 12),
        round: i % 5 === 0,
      })),
    [pieces]
  );

  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-[70] overflow-hidden">
      {bits.map((b, i) => (
        <span
          key={i}
          className="absolute top-0 animate-fall"
          style={{
            left: `${b.left}%`,
            width: b.w,
            height: b.round ? b.w : b.h,
            background: b.color,
            borderRadius: b.round ? '999px' : '2px',
            animationDelay: `${b.delay}s`,
            animationDuration: `${b.duration}s`,
          }}
        />
      ))}
    </div>
  );
}
