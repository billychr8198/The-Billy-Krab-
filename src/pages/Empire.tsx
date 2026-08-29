import { useMemo, useState } from 'react';
import { useApp } from '../lib/store';
import {
  DAILY_RATE,
  OPENING_DAY,
  PROFIT_PER_CUSTOMER,
  TOTAL_DAYS,
  empireAt,
  empireDelta,
  formatCount,
  formatDelta,
  formatMoney,
  formatPercent,
} from '../lib/empire';
import { bulletinFor } from '../lib/voice';
import Ticker from '../components/Ticker';

type MetricKey = 'customers' | 'fans' | 'popularity' | 'income' | 'branches';

const METRICS: {
  key: MetricKey;
  label: string;
  note: string;
  color: string;
  text: string;
  format: (n: number) => string;
}[] = [
  {
    key: 'customers',
    label: 'Customers / day',
    note: 'Everyone who walked through a door today, across every branch.',
    color: '#3FBEDD',
    text: 'text-surf',
    format: formatCount,
  },
  {
    key: 'fans',
    label: 'Fans',
    note: 'Regulars who came back. Roughly a third of everyone ever served.',
    color: '#FF7A54',
    text: 'text-shell',
    format: formatCount,
  },
  {
    key: 'popularity',
    label: 'Popularity',
    note: 'Share of the ocean that has heard of us. Caps out just shy of everyone.',
    color: '#F7CE3E',
    text: 'text-brass',
    format: formatPercent,
  },
  {
    key: 'income',
    label: 'Net income / day',
    note: `Customers times $${PROFIT_PER_CUSTOMER}. That margin hasn't moved since opening night.`,
    color: '#5FE3C0',
    text: 'text-foam',
    format: formatMoney,
  },
  {
    key: 'branches',
    label: 'Branches',
    note: 'Locations open. Nobody at head office has visited most of them.',
    color: '#F7E9CE',
    text: 'text-parchment',
    format: (n) => Math.floor(n).toLocaleString(),
  },
];

/** A sparkline of the metric from opening day to now, plus the full projection. */
function GrowthChart({
  metric,
  completedDays,
}: {
  metric: (typeof METRICS)[number];
  completedDays: number;
}) {
  const W = 720;
  const H = 200;

  const { pathFull, pathNow, nowX, nowY, ticks } = useMemo(() => {
    const points: [number, number][] = [];
    for (let d = 0; d <= TOTAL_DAYS; d += 1) points.push([d, empireAt(d)[metric.key]]);

    // Log scale. On a linear axis the first three hundred days are a flat line
    // on the floor, which tells the reader nothing.
    const lo = Math.max(points[0][1], 0.5);
    const hi = points[points.length - 1][1];
    const span = Math.log(hi) - Math.log(lo) || 1;

    const y = (v: number) => H - 10 - ((Math.log(Math.max(v, lo)) - Math.log(lo)) / span) * (H - 26);
    const x = (d: number) => (d / TOTAL_DAYS) * W;

    const toPath = (pts: [number, number][]) =>
      pts.map(([d, v], i) => `${i ? 'L' : 'M'}${x(d).toFixed(1)},${y(v).toFixed(1)}`).join('');

    // Gridlines at each order of magnitude the metric passes through.
    const ticks: { y: number; label: string }[] = [];
    for (let e = Math.ceil(Math.log10(lo)); Math.pow(10, e) <= hi; e += 1) {
      const v = Math.pow(10, e);
      ticks.push({ y: y(v), label: metric.format(v) });
    }

    return {
      pathFull: toPath(points),
      pathNow: toPath(points.slice(0, completedDays + 1)),
      nowX: x(completedDays),
      nowY: y(points[completedDays][1]),
      ticks,
    };
  }, [metric, completedDays]);

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className="h-40 w-full"
      role="img"
      aria-label={`${metric.label} from day 0 to day 365. Currently ${metric.format(
        empireAt(completedDays)[metric.key]
      )}.`}
    >
      <defs>
        <linearGradient id={`fill-${metric.key}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={metric.color} stopOpacity="0.32" />
          <stop offset="100%" stopColor={metric.color} stopOpacity="0" />
        </linearGradient>
      </defs>

      {ticks.map((t) => (
        <g key={t.label}>
          <line
            x1="0"
            x2={W}
            y1={t.y}
            y2={t.y}
            stroke="currentColor"
            strokeOpacity="0.09"
            className="text-parchment"
          />
          <text
            x="4"
            y={t.y - 4}
            fontSize="10"
            className="font-ledger"
            fill="currentColor"
            fillOpacity="0.32"
          >
            {t.label}
          </text>
        </g>
      ))}

      {/* Where the story is heading */}
      <path d={pathFull} fill="none" stroke={metric.color} strokeOpacity="0.22" strokeWidth="2" strokeDasharray="4 5" />
      {/* Where it is now */}
      <path d={`${pathNow}L${nowX.toFixed(1)},${H}L0,${H}Z`} fill={`url(#fill-${metric.key})`} />
      <path d={pathNow} fill="none" stroke={metric.color} strokeWidth="3" strokeLinecap="round" />
      <circle cx={nowX} cy={nowY} r="5" fill={metric.color} />
    </svg>
  );
}

export default function Empire() {
  const { stats, today } = useApp();
  const [active, setActive] = useState<MetricKey>('customers');
  const empire = empireAt(stats.completedDays);
  const delta = empireDelta(stats.completedDays);
  const metric = METRICS.find((m) => m.key === active)!;

  const milestones = [0, 30, 90, 182, 270, 365].map((d) => ({ d, snap: empireAt(d) }));

  return (
    <div className="space-y-5">
      <header className="board-parchment p-5">
        <p className="font-ledger text-[11px] uppercase tracking-[0.22em] text-plank/70">
          Head office · quarterly-ish report
        </p>
        <h1 className="mt-1 font-sign text-2xl uppercase leading-none text-claw sm:text-3xl">
          The Billy Krab Empire
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-plank/80">{bulletinFor(empire.branches, today)}</p>
      </header>

      {/* Five indicators */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {METRICS.map((m) => {
          const isActive = m.key === active;
          return (
            <button
              key={m.key}
              onClick={() => setActive(m.key)}
              aria-pressed={isActive}
              className={`board p-4 text-left transition ${
                isActive ? 'border-brass/60 bg-brass/8' : 'hover:border-white/25'
              }`}
            >
              <p className="eyebrow">{m.label}</p>
              <p className={`mt-1 font-sign text-xl leading-none ${m.text}`}>
                <Ticker value={empire[m.key]} format={m.format} />
              </p>
              <p className="mt-1.5 font-ledger text-[10px] text-foam/75">
                +{formatDelta(delta[m.key], m.key === 'income' ? 'money' : m.key === 'popularity' ? 'percent' : 'count')} on
                the last log
              </p>
            </button>
          );
        })}
      </div>

      {/* Chart */}
      <section className="board p-4 sm:p-5">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className={`font-sign text-base uppercase tracking-tight ${metric.text}`}>{metric.label}</h2>
          <p className="font-ledger text-[11px] text-parchment/45">
            Log scale · solid is filed, dotted is where 365 days takes you
          </p>
        </div>
        <p className="mt-1 max-w-2xl text-sm text-parchment/60">{metric.note}</p>
        <div className="mt-3 text-parchment">
          <GrowthChart metric={metric} completedDays={stats.completedDays} />
        </div>
        <div className="mt-1 flex justify-between font-ledger text-[10px] text-parchment/40">
          <span>Day 0</span>
          <span>Day 182</span>
          <span>Day 365</span>
        </div>
      </section>

      {/* Ledger */}
      <section className="board overflow-hidden">
        <header className="border-b border-white/8 px-4 py-3">
          <h2 className="font-sign text-sm uppercase tracking-tight text-surf">The ledger</h2>
          <p className="text-xs text-parchment/45">
            Opening figures, today’s figures, and the growth in between.
          </p>
        </header>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[540px] text-left font-ledger text-sm">
            <thead>
              <tr className="border-b border-white/8 text-[10px] uppercase tracking-wider text-parchment/40">
                <th className="px-4 py-2 font-medium">Indicator</th>
                <th className="px-4 py-2 font-medium">Opening day</th>
                <th className="px-4 py-2 font-medium">Today</th>
                <th className="px-4 py-2 font-medium">Growth</th>
              </tr>
            </thead>
            <tbody>
              {METRICS.map((m) => {
                const start = OPENING_DAY[m.key];
                const now = empire[m.key];
                const mult = now / start;
                return (
                  <tr key={m.key} className="border-b border-white/5 last:border-0">
                    <td className="px-4 py-2.5 text-parchment/75">{m.label}</td>
                    <td className="px-4 py-2.5 text-parchment/45">{m.format(start)}</td>
                    <td className={`px-4 py-2.5 font-semibold ${m.text}`}>{m.format(now)}</td>
                    <td className="px-4 py-2.5 text-foam/80">×{mult.toFixed(mult < 10 ? 2 : 0)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {/* Milestones */}
      <section className="board p-4 sm:p-5">
        <h2 className="font-sign text-sm uppercase tracking-tight text-brass">Growth history</h2>
        <p className="mt-1 text-xs text-parchment/50">
          Each completed log compounds reach by {(DAILY_RATE * 100).toFixed(0)}%. Branches and
          customers-per-branch both ride that curve, which is why the last three months look like
          that.
        </p>
        <ol className="mt-4 space-y-2">
          {milestones.map(({ d, snap }) => {
            const reached = stats.completedDays >= d;
            return (
              <li
                key={d}
                className={`flex flex-wrap items-center gap-x-4 gap-y-1 rounded-lg border px-3 py-2 text-sm ${
                  reached ? 'border-foam/25 bg-foam/6' : 'border-white/8 bg-abyss/30 opacity-55'
                }`}
              >
                <span className="w-16 shrink-0 font-sign text-xs text-parchment/70">Day {d}</span>
                <span className="font-ledger text-xs text-surf">{formatCount(snap.customers)} cust/day</span>
                <span className="font-ledger text-xs text-shell">{formatCount(snap.fans)} fans</span>
                <span className="font-ledger text-xs text-brass">{formatPercent(snap.popularity)}</span>
                <span className="font-ledger text-xs text-foam">{formatMoney(snap.income)}/day</span>
                <span className="font-ledger text-xs text-parchment/70">
                  {Math.floor(snap.branches)} branches
                </span>
                {reached && <span className="ml-auto text-xs text-foam">reached</span>}
              </li>
            );
          })}
        </ol>
      </section>
    </div>
  );
}
