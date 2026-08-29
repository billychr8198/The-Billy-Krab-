import { useMemo } from 'react';

/** Slow ambient bubbles. Purely decorative, hidden from assistive tech. */
export default function Ocean() {
  const bubbles = useMemo(
    () =>
      Array.from({ length: 26 }, (_, i) => {
        const size = 4 + ((i * 37) % 26);
        return {
          size,
          left: ((i * 61) % 100) + Math.sin(i) * 2,
          duration: 16 + ((i * 13) % 22),
          delay: -((i * 7) % 30),
          opacity: 0.06 + ((i * 11) % 18) / 100,
        };
      }),
    []
  );

  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      {/* Light shafts from the surface */}
      <div
        className="absolute inset-x-0 top-0 h-[55vh] opacity-40"
        style={{
          background:
            'repeating-linear-gradient(101deg, rgba(120,220,255,.09) 0px, rgba(120,220,255,.09) 26px, transparent 26px, transparent 96px)',
          maskImage: 'linear-gradient(180deg, rgba(0,0,0,.9), transparent)',
          WebkitMaskImage: 'linear-gradient(180deg, rgba(0,0,0,.9), transparent)',
        }}
      />
      {bubbles.map((b, i) => (
        <span
          key={i}
          className="absolute bottom-[-8vh] animate-drift rounded-full border border-white/25"
          style={{
            width: b.size,
            height: b.size,
            left: `${b.left}%`,
            background:
              'radial-gradient(circle at 32% 28%, rgba(255,255,255,.65), rgba(255,255,255,.05) 62%)',
            animationDuration: `${b.duration}s`,
            animationDelay: `${b.delay}s`,
            opacity: b.opacity,
          }}
        />
      ))}
      {/* Sea floor haze */}
      <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-black/40 to-transparent" />
    </div>
  );
}
