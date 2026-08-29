import { useMemo } from 'react';
import { useApp, recipes } from '../lib/store';
import {
  TOTAL_DAYS,
  TOTAL_RECIPES,
  daysUntilNextUnlock,
  empireAt,
  empireDelta,
  formatCount,
  formatDelta,
  formatMoney,
  formatPercent,
} from '../lib/empire';
import { bulletinFor, greetingFor, missedLineFor } from '../lib/voice';
import Ticker from '../components/Ticker';
import type { Page } from '../App';

function StatTile({
  label,
  value,
  delta,
  accent,
}: {
  label: string;
  value: string;
  delta: string;
  accent: string;
}) {
  return (
    <div className="board flex flex-col justify-between gap-1 p-3">
      <p className="eyebrow">{label}</p>
      <p className={`font-sign text-lg leading-none ${accent}`}>{value}</p>
      <p className="font-ledger text-[10px] text-foam/70">{delta}</p>
    </div>
  );
}

export default function Home({ go }: { go: (p: Page) => void }) {
  const { stats, today, logFor, state } = useApp();
  const empire = empireAt(stats.completedDays);
  const delta = empireDelta(stats.completedDays);
  const todayLog = logFor(today);
  const untilUnlock = daysUntilNextUnlock(stats.completedDays);

  const pct = (stats.completedDays / TOTAL_DAYS) * 100;
  const nextRecipe = recipes[stats.unlockedRecipes];
  const lastUnlocked = stats.unlockedRecipes > 0 ? recipes[stats.unlockedRecipes - 1] : null;

  const missedYesterday = useMemo(() => {
    if (today <= 1) return false;
    return !state.logs[today - 1]?.completed;
  }, [state.logs, today]);

  return (
    <div className="space-y-5">
      {/* Signature: the day counter, cut like the restaurant's own sign */}
      <section className="board-parchment relative overflow-hidden p-5 sm:p-6">
        <div className="relative flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="font-ledger text-[11px] uppercase tracking-[0.22em] text-plank/70">
              The Billy Krab, day
            </p>
            <p className="font-sign text-5xl leading-none text-claw sm:text-6xl">
              {today}
              <span className="text-2xl text-plank/50"> / {TOTAL_DAYS}</span>
            </p>
            <p className="mt-2 max-w-md text-sm italic text-plank/80">“{greetingFor(today)}”</p>
          </div>
          <button className="btn-primary px-5 py-3 text-base" onClick={() => go('log')}>
            {todayLog.completed ? 'Review today’s log' : 'Log today’s food'}
          </button>
        </div>

        <div className="mt-5">
          <div className="h-3 w-full overflow-hidden rounded-full border border-plank/30 bg-plank/15">
            <div
              className="h-full rounded-full bg-gradient-to-r from-claw via-brass to-foam transition-[width] duration-700"
              style={{ width: `${Math.max(pct, 0.8)}%` }}
            />
          </div>
          <div className="mt-2 flex flex-wrap justify-between gap-x-4 gap-y-1 font-ledger text-[11px] text-plank/75">
            <span>{stats.completedDays} days filed</span>
            <span>{pct.toFixed(1)}% complete</span>
            <span>{TOTAL_DAYS - stats.completedDays} days remaining</span>
          </div>
        </div>
      </section>

      {/* Today's status */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="board p-4">
          <p className="eyebrow">Today’s log</p>
          <p className="mt-1 font-sign text-lg text-parchment">
            {todayLog.completed ? 'Filed' : todayLog.foods.length + todayLog.drinks.length > 0 ? 'In progress' : 'Empty'}
          </p>
          <p className="mt-1 text-xs text-parchment/55">
            {todayLog.foods.length} foods · {todayLog.drinks.length} drinks
          </p>
        </div>
        <div className="board p-4">
          <p className="eyebrow">Current streak</p>
          <p className="mt-1 font-sign text-lg text-brass">
            {stats.streak} {stats.streak === 1 ? 'day' : 'days'}
          </p>
          <p className="mt-1 text-xs text-parchment/55">Best run: {stats.bestStreak}</p>
        </div>
        <div className="board p-4">
          <p className="eyebrow">Recipe vault</p>
          <p className="mt-1 font-sign text-lg text-foam">
            {stats.unlockedRecipes} / {TOTAL_RECIPES}
          </p>
          <p className="mt-1 text-xs text-parchment/55">
            {untilUnlock === 0
              ? 'Every recipe is yours.'
              : `${untilUnlock} more ${untilUnlock === 1 ? 'day' : 'days'} to the next one`}
          </p>
        </div>
      </div>

      {missedYesterday && today > 1 && (
        <div className="board border-surf/25 bg-surf/8 p-4 text-sm">
          <p className="text-parchment/80">{missedLineFor(today)}</p>
        </div>
      )}

      {/* Empire strip */}
      <section>
        <div className="mb-2 flex items-baseline justify-between gap-3">
          <h2 className="font-sign text-sm uppercase tracking-tight text-surf">The books today</h2>
          <button className="text-xs font-bold text-brass hover:underline" onClick={() => go('empire')}>
            Open headquarters →
          </button>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          <StatTile
            label="Customers / day"
            value={formatCount(empire.customers)}
            delta={`+${formatDelta(delta.customers)} on the last log`}
            accent="text-surf"
          />
          <StatTile
            label="Fans"
            value={formatCount(empire.fans)}
            delta={`+${formatDelta(delta.fans)} on the last log`}
            accent="text-shell"
          />
          <StatTile
            label="Popularity"
            value={formatPercent(empire.popularity)}
            delta={`+${formatDelta(delta.popularity, 'percent')}`}
            accent="text-brass"
          />
          <StatTile
            label="Net income / day"
            value={formatMoney(empire.income)}
            delta={`+${formatDelta(delta.income, 'money')}`}
            accent="text-foam"
          />
          <StatTile
            label="Branches"
            value={Math.floor(empire.branches).toLocaleString()}
            delta={
              delta.branches >= 1
                ? `+${Math.floor(delta.branches)} opened`
                : `${(100 - ((empire.branches % 1) * 100)).toFixed(0)}% to the next one`
            }
            accent="text-parchment"
          />
        </div>
        <p className="mt-2 text-xs italic text-parchment/45">{bulletinFor(empire.branches, today)}</p>
      </section>

      {/* Recipe teaser */}
      <section className="grid gap-4 md:grid-cols-2">
        <div className="board overflow-hidden">
          <div className="border-b border-white/8 px-4 py-3">
            <p className="eyebrow">Last unlocked</p>
          </div>
          {lastUnlocked ? (
            <button
              className="flex w-full items-center gap-3 p-3 text-left hover:bg-white/5"
              onClick={() => go('recipes')}
            >
              <img
                src={lastUnlocked.image || './billy-krab-mark.png'}
                alt=""
                loading="lazy"
                className="h-16 w-16 shrink-0 rounded-lg object-cover"
              />
              <div className="min-w-0">
                <p className="truncate font-sign text-sm text-brass">{lastUnlocked.title}</p>
                <p className="text-xs text-parchment/55">
                  {lastUnlocked.country === lastUnlocked.cuisine
                    ? lastUnlocked.country
                    : `${lastUnlocked.country} · ${lastUnlocked.cuisine}`}
                </p>
              </div>
            </button>
          ) : (
            <p className="p-4 text-sm text-parchment/55">
              Nothing yet. Three completed days and the chef parts with the first one.
            </p>
          )}
        </div>

        <div className="board overflow-hidden">
          <div className="border-b border-white/8 px-4 py-3">
            <p className="eyebrow">Next in the vault</p>
          </div>
          {nextRecipe ? (
            <div className="flex items-center gap-3 p-3">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-lg border border-dashed border-white/20 bg-abyss/50 text-2xl">
                🔒
              </div>
              <div className="min-w-0">
                <p className="font-sign text-sm text-parchment/45">Recipe {nextRecipe.unlockOrder}</p>
                <p className="text-xs text-parchment/50">
                  {nextRecipe.cuisine} · unlocks in {untilUnlock} {untilUnlock === 1 ? 'day' : 'days'}
                </p>
              </div>
            </div>
          ) : (
            <p className="p-4 text-sm text-foam">
              All 122 recipes are unlocked. There is nothing left to hide.
            </p>
          )}
        </div>
      </section>

      {/* Totals */}
      <section className="board grid grid-cols-2 divide-x divide-white/8 sm:grid-cols-4">
        {[
          ['Meals logged', stats.totalFoods.toLocaleString()],
          ['Drinks logged', stats.totalDrinks.toLocaleString()],
          ['Different foods', stats.distinctFoodNames.toLocaleString()],
          ['Plaques earned', `${Object.keys(state.achievements).length}`],
        ].map(([label, value]) => (
          <div key={label} className="p-4">
            <p className="eyebrow">{label}</p>
            <p className="mt-1 font-ledger text-xl font-semibold text-parchment">
              <Ticker value={Number(String(value).replace(/,/g, ''))} format={(n) => Math.round(n).toLocaleString()} />
            </p>
          </div>
        ))}
      </section>
    </div>
  );
}
