import { useMemo, useState } from 'react';
import { useApp } from '../lib/store';
import { DAYS_PER_UNLOCK, LAST_SCHEDULED_DAY, TOTAL_DAYS } from '../lib/empire';
import { dateForDay } from '../lib/storage';
import type { Page } from '../App';

type Status = 'completed' | 'today' | 'missed' | 'partial' | 'future';

const LEGEND: { status: Status; label: string; swatch: string }[] = [
  { status: 'completed', label: 'Filed', swatch: 'bg-foam' },
  { status: 'partial', label: 'Started', swatch: 'bg-brass' },
  { status: 'today', label: 'Today', swatch: 'bg-claw' },
  { status: 'missed', label: 'Skipped', swatch: 'bg-white/15' },
  { status: 'future', label: 'Not yet', swatch: 'bg-abyss border border-white/12' },
];

/** Days that hand over a recipe: every third, plus the day 365 double drop. */
const isRewardDay = (d: number) =>
  d === TOTAL_DAYS || (d % DAYS_PER_UNLOCK === 0 && d <= LAST_SCHEDULED_DAY);

export default function Calendar({ go }: { go: (p: Page) => void }) {
  const { state, today, stats, setSelectedDay } = useApp();
  const [hover, setHover] = useState<number | null>(null);

  const statuses = useMemo(() => {
    const out: Status[] = [];
    for (let d = 1; d <= TOTAL_DAYS; d += 1) {
      const log = state.logs[d];
      if (log?.completed) out.push('completed');
      else if (d === today) out.push('today');
      else if (d > today) out.push('future');
      else if (log && (log.foods.length || log.drinks.length)) out.push('partial');
      else out.push('missed');
    }
    return out;
  }, [state.logs, today]);

  const open = (d: number) => {
    if (d > today) return;
    setSelectedDay(d);
    go('log');
  };

  const hoveredLog = hover ? state.logs[hover] : undefined;

  return (
    <div className="space-y-5">
      <header className="board-parchment p-5">
        <p className="font-ledger text-[11px] uppercase tracking-[0.22em] text-plank/70">
          Pinned above the pass
        </p>
        <h1 className="mt-1 font-sign text-xl uppercase leading-tight text-claw sm:text-2xl">
          The 365-Day Rota
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-plank/80">
          One tile per day. Ringed tiles hand over a recipe. Tap any past day to review or edit what
          you logged.
        </p>
      </header>

      <div className="board flex flex-wrap items-center gap-x-5 gap-y-2 p-3">
        {LEGEND.map((l) => (
          <span key={l.status} className="flex items-center gap-2 text-xs text-parchment/65">
            <span className={`h-3 w-3 rounded-[4px] ${l.swatch}`} />
            {l.label}
          </span>
        ))}
        <span className="flex items-center gap-2 text-xs text-parchment/65">
          <span className="h-3 w-3 rounded-[4px] bg-abyss ring-2 ring-brass" />
          Recipe day
        </span>
      </div>

      {/* The rota. 365 tiles, chunked into months of the journey. */}
      <section className="board p-3 sm:p-5">
        <div className="space-y-5">
          {Array.from({ length: 13 }, (_, block) => {
            const start = block * 28 + 1;
            if (start > TOTAL_DAYS) return null;
            const end = Math.min(start + 27, TOTAL_DAYS);
            const filed = statuses.slice(start - 1, end).filter((s) => s === 'completed').length;
            return (
              <div key={block}>
                <div className="mb-2 flex items-baseline justify-between">
                  <p className="eyebrow">
                    Days {start}–{end}
                  </p>
                  <p className="font-ledger text-[10px] text-parchment/40">
                    {filed}/{end - start + 1} filed
                  </p>
                </div>
                <div className="grid grid-cols-7 gap-1.5 sm:grid-cols-14">
                  {Array.from({ length: end - start + 1 }, (_, i) => {
                    const d = start + i;
                    const s = statuses[d - 1];
                    const reward = isRewardDay(d);
                    const base =
                      s === 'completed'
                        ? 'bg-foam text-abyss'
                        : s === 'today'
                          ? 'bg-claw text-white'
                          : s === 'partial'
                            ? 'bg-brass text-abyss'
                            : s === 'missed'
                              ? 'bg-white/12 text-parchment/60'
                              : 'bg-abyss/60 text-parchment/25 border border-white/8';
                    return (
                      <button
                        key={d}
                        onClick={() => open(d)}
                        onMouseEnter={() => setHover(d)}
                        onMouseLeave={() => setHover(null)}
                        onFocus={() => setHover(d)}
                        onBlur={() => setHover(null)}
                        disabled={d > today}
                        title={`Day ${d} · ${dateForDay(state.startedOn, d)}`}
                        aria-label={`Day ${d}, ${s}${reward ? ', recipe day' : ''}`}
                        className={`relative aspect-square rounded-[5px] font-ledger text-[9px] font-semibold transition
                          ${base}
                          ${reward ? (d <= today ? 'ring-2 ring-brass/80' : 'ring-1 ring-brass/30') : ''}
                          ${d <= today ? 'hover:scale-110 hover:z-10' : 'cursor-not-allowed'}`}
                      >
                        {d}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Hover readout */}
      <div className="board min-h-[86px] p-4">
        {hover ? (
          <div>
            <p className="font-sign text-sm text-brass">
              Day {hover}
              <span className="ml-2 font-body text-xs font-normal text-parchment/50">
                {dateForDay(state.startedOn, hover)}
              </span>
            </p>
            <p className="mt-1 text-sm text-parchment/70">
              {hoveredLog?.completed
                ? `Filed · ${hoveredLog.foods.length} foods, ${hoveredLog.drinks.length} drinks`
                : hoveredLog && (hoveredLog.foods.length || hoveredLog.drinks.length)
                  ? `Started but not signed off · ${hoveredLog.foods.length} foods, ${hoveredLog.drinks.length} drinks`
                  : hover > today
                    ? 'Hasn’t happened yet.'
                    : 'Nothing logged. The books show a quiet day.'}
            </p>
            {isRewardDay(hover) && (
              <p className="mt-1 font-ledger text-[11px] text-brass/80">
                {hover === TOTAL_DAYS
                  ? 'Final service. Two recipes at once.'
                  : `Hands over recipe ${hover / DAYS_PER_UNLOCK}.`}
              </p>
            )}
          </div>
        ) : (
          <p className="text-sm text-parchment/45">
            {stats.completedDays} of {TOTAL_DAYS} days filed. Hover or focus a tile for the detail.
          </p>
        )}
      </div>
    </div>
  );
}
