import { useState } from 'react';
import { journey, recipes, useApp } from '../lib/store';
import { DAYS_PER_UNLOCK, TOTAL_RECIPES } from '../lib/empire';
import { RecipeDetail } from './Recipes';
import type { JourneyLeg, Recipe } from '../lib/types';

const W = 900;
const H = 320;
const PAD_X = 90;
const PAD_Y = 58;

export default function Journey() {
  const { stats } = useApp();
  const [open, setOpen] = useState<Recipe | null>(null);
  const legs = journey as JourneyLeg[];

  // A route diagram, not a map. Ports sit evenly along the x-axis in journey
  // order so the sequence reads left to right and no two labels ever collide;
  // latitude still drives the y-axis, so the shape stays roughly geographic.
  const lats = legs.map((l) => l.coords[0]);
  const [minLat, maxLat] = [Math.min(...lats), Math.max(...lats)];

  const points = legs.map((leg, i) => ({
    leg,
    x: PAD_X + (i / (legs.length - 1)) * (W - PAD_X * 2),
    y: PAD_Y + ((maxLat - leg.coords[0]) / (maxLat - minLat || 1)) * (H - PAD_Y * 2),
    // Alternate the label side so long names have room to breathe.
    above: i % 2 === 0,
  }));

  const route = points.map((p, i) => `${i ? 'L' : 'M'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join('');
  const reachedIndex = points.findIndex((p) => stats.unlockedRecipes < p.leg.lastUnlock);
  const currentLeg = reachedIndex === -1 ? points.length - 1 : reachedIndex;

  return (
    <div className="space-y-5">
      <header className="board-parchment p-5">
        <p className="font-ledger text-[11px] uppercase tracking-[0.22em] text-plank/70">
          Expansion plan, drawn on a napkin
        </p>
        <h1 className="mt-1 font-sign text-xl uppercase leading-tight text-claw sm:text-2xl">
          The Culinary Journey
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-plank/80">
          Eight cuisines, west to east, {TOTAL_RECIPES} recipes. Every three completed logs moves the
          boat along by one dish. It starts in Africa and it finishes in Indonesia.
        </p>
      </header>

      {/* The chart */}
      <section className="board overflow-hidden p-3 sm:p-5">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="w-full"
          role="img"
          aria-label={`Route map. Currently in leg ${currentLeg + 1} of ${legs.length}, ${
            points[currentLeg].leg.cuisine
          }.`}
        >
          <defs>
            <pattern id="waves" width="34" height="18" patternUnits="userSpaceOnUse">
              <path
                d="M0 12 Q 8.5 4 17 12 T 34 12"
                fill="none"
                stroke="#3FBEDD"
                strokeOpacity="0.13"
                strokeWidth="1.4"
              />
            </pattern>
            <linearGradient id="routeGrad" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#E8452B" />
              <stop offset="55%" stopColor="#F7CE3E" />
              <stop offset="100%" stopColor="#5FE3C0" />
            </linearGradient>
          </defs>

          <rect width={W} height={H} fill="url(#waves)" rx="14" />

          {/* Latitude guides, doubling as a nautical chart grid */}
          {[0.25, 0.5, 0.75].map((f) => (
            <line
              key={f}
              x1="0"
              x2={W}
              y1={H * f}
              y2={H * f}
              stroke="#F7E9CE"
              strokeOpacity="0.07"
              strokeDasharray="2 8"
            />
          ))}

          {/* The full planned route, faint */}
          <path d={route} fill="none" stroke="#F7E9CE" strokeOpacity="0.18" strokeWidth="2.5" strokeDasharray="6 7" />
          {/* Progress so far */}
          <path
            d={points
              .slice(0, currentLeg + 1)
              .map((p, i) => `${i ? 'L' : 'M'}${p.x.toFixed(1)},${p.y.toFixed(1)}`)
              .join('')}
            fill="none"
            stroke="url(#routeGrad)"
            strokeWidth="4"
            strokeLinecap="round"
          />

          {points.map((p, i) => {
            const started = stats.unlockedRecipes >= p.leg.firstUnlock;
            const done = stats.unlockedRecipes >= p.leg.lastUnlock;
            const here = i === currentLeg;
            return (
              <g key={p.leg.cuisine}>
                {here && (
                  <circle cx={p.x} cy={p.y} r="17" fill="#F7CE3E" opacity="0.16">
                    <animate attributeName="r" values="13;22;13" dur="2.8s" repeatCount="indefinite" />
                  </circle>
                )}
                <circle
                  cx={p.x}
                  cy={p.y}
                  r={here ? 8 : 6}
                  fill={done ? '#5FE3C0' : started ? '#F7CE3E' : '#0A3348'}
                  stroke={started ? '#041B29' : '#F7E9CE'}
                  strokeOpacity={started ? 1 : 0.35}
                  strokeWidth="2"
                />
                <text
                  x={p.x}
                  y={p.above ? p.y - 20 : p.y + 26}
                  textAnchor="middle"
                  className="font-ledger"
                  fontSize="12"
                  fill="#F7E9CE"
                  fillOpacity={started ? 0.92 : 0.42}
                >
                  {p.leg.cuisine.replace(' & Levant', '').replace('Latin & North American', 'Americas')}
                </text>
                <text
                  x={p.x}
                  y={p.above ? p.y - 34 : p.y + 40}
                  textAnchor="middle"
                  className="font-ledger"
                  fontSize="10"
                  fill="#5FE3C0"
                  fillOpacity={started ? 0.85 : 0.32}
                >
                  {Math.max(0, Math.min(p.leg.count, stats.unlockedRecipes - p.leg.firstUnlock + 1))}/
                  {p.leg.count}
                </text>
              </g>
            );
          })}
        </svg>
      </section>

      {/* Legs */}
      <div className="space-y-3">
        {legs.map((leg, i) => {
          const got = Math.max(0, Math.min(leg.count, stats.unlockedRecipes - leg.firstUnlock + 1));
          const legRecipes = recipes.filter((r) => r.cuisine === leg.cuisine);
          const started = got > 0;
          return (
            <section
              key={leg.cuisine}
              className={`board overflow-hidden ${started ? '' : 'opacity-70'}`}
            >
              <header className="flex flex-wrap items-center gap-x-4 gap-y-2 border-b border-white/8 px-4 py-3">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-white/15 font-sign text-xs text-brass">
                  {i + 1}
                </span>
                <div className="min-w-[10rem] flex-1">
                  <h2 className="font-sign text-sm uppercase tracking-tight text-brass">{leg.cuisine}</h2>
                  <p className="text-xs text-parchment/50">{leg.blurb}</p>
                </div>
                <div className="text-right">
                  <p className="font-ledger text-sm text-foam">
                    {got}/{leg.count}
                  </p>
                  <p className="font-ledger text-[10px] text-parchment/40">
                    days {leg.firstUnlock * DAYS_PER_UNLOCK}–
                    {leg.lastUnlock > 120 ? 365 : leg.lastUnlock * DAYS_PER_UNLOCK}
                  </p>
                </div>
              </header>
              <div className="flex gap-2 overflow-x-auto p-3 no-scrollbar">
                {legRecipes.map((r) => {
                  const unlocked = r.unlockOrder <= stats.unlockedRecipes;
                  return unlocked ? (
                    <button
                      key={r.id}
                      onClick={() => setOpen(r)}
                      title={r.title}
                      className="group relative h-16 w-20 shrink-0 overflow-hidden rounded-lg border border-white/10 hover:border-brass"
                    >
                      {r.image ? (
                        <img
                          src={`./${r.image}`}
                          alt={r.title}
                          loading="lazy"
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <span className="flex h-full w-full items-center justify-center bg-plank/40 text-lg">
                          🍽️
                        </span>
                      )}
                    </button>
                  ) : (
                    <div
                      key={r.id}
                      title={`Unlocks on day ${r.unlockOrder > 120 ? 365 : r.unlockOrder * DAYS_PER_UNLOCK}`}
                      className="flex h-16 w-20 shrink-0 items-center justify-center rounded-lg border border-dashed border-white/12 bg-abyss/40 text-sm text-parchment/25"
                    >
                      🔒
                    </div>
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>

      {open && <RecipeDetail recipe={open} onClose={() => setOpen(null)} />}
    </div>
  );
}
