import { useEffect, useState } from 'react';
import { useApp } from '../lib/store';
import { completionFor } from '../lib/voice';
import { TOTAL_RECIPES, empireDelta, formatDelta } from '../lib/empire';
import Confetti from './Confetti';

export default function Ceremony() {
  const { ceremony, dismissCeremony, stats } = useApp();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    if (!ceremony) return;
    setMounted(true);
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && dismissCeremony();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [ceremony, dismissCeremony]);

  if (!ceremony) return null;

  const finale = ceremony.kind === 'finale';
  const delta = empireDelta(stats.completedDays);

  return (
    <>
      {(finale || ceremony.recipes.length > 0) && <Confetti pieces={finale ? 160 : 70} />}
      <div
        className="fixed inset-0 z-[65] flex items-center justify-center overflow-y-auto bg-abyss/88 p-4 backdrop-blur-sm"
        role="dialog"
        aria-modal="true"
        aria-label={finale ? '365 days complete' : 'Daily log filed'}
        onClick={dismissCeremony}
      >
        <div
          className={`board-parchment my-auto w-full max-w-lg overflow-hidden ${mounted ? 'animate-pop' : ''}`}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="bg-gradient-to-r from-claw via-shell to-brass px-5 py-4 text-center">
            <p className="font-ledger text-[10px] uppercase tracking-[0.24em] text-white/85">
              Business report · day {ceremony.day}
            </p>
            <h2 className="mt-1 font-sign text-lg uppercase leading-tight text-white sm:text-xl">
              {finale ? '365 days complete' : 'Log filed'}
            </h2>
          </div>

          <div className="p-5 sm:p-6">
            <p className="text-sm italic leading-relaxed text-plank/85">
              {finale
                ? 'The Billy Krab has officially survived your appetite. Final recipe drop: two recipes, because one would simply be financially irresponsible.'
                : completionFor(ceremony.day)}
            </p>

            {/* What the log bought */}
            <div className="mt-4 grid grid-cols-3 gap-2 text-center">
              {[
                ['Customers', `+${formatDelta(delta.customers)}`],
                ['Fans', `+${formatDelta(delta.fans)}`],
                ['Income', `+${formatDelta(delta.income, 'money')}`],
              ].map(([label, value]) => (
                <div key={label} className="rounded-lg border border-plank/25 bg-plank/8 px-2 py-2">
                  <p className="font-ledger text-[9px] uppercase tracking-wider text-plank/60">{label}</p>
                  <p className="mt-0.5 font-sign text-xs text-claw">{value}</p>
                </div>
              ))}
            </div>

            {ceremony.recipes.length > 0 && (
              <div className="mt-5">
                <p className="font-ledger text-[10px] uppercase tracking-[0.2em] text-plank/60">
                  {ceremony.recipes.length > 1 ? 'Recipes unlocked' : 'Recipe unlocked'}
                </p>
                <div className="mt-2 grid gap-3 sm:grid-cols-2">
                  {ceremony.recipes.map((r, i) => (
                    <article
                      key={r.id}
                      className="animate-pop overflow-hidden rounded-xl border-2 border-brass bg-white/50"
                      style={{ animationDelay: `${180 + i * 160}ms` }}
                    >
                      {r.image && (
                        <img src={`./${r.image}`} alt={r.title} className="h-28 w-full object-cover" />
                      )}
                      <div className="p-3">
                        <p className="font-ledger text-[10px] uppercase tracking-wider text-plank/60">
                          {r.country} · {r.unlockOrder} of {TOTAL_RECIPES}
                        </p>
                        <h3 className="mt-0.5 font-sign text-[13px] uppercase leading-tight text-claw">
                          {r.title}
                        </h3>
                      </div>
                    </article>
                  ))}
                </div>
              </div>
            )}

            {ceremony.achievements.length > 0 && (
              <div className="mt-5">
                <p className="font-ledger text-[10px] uppercase tracking-[0.2em] text-plank/60">
                  {ceremony.achievements.length > 1 ? 'Plaques earned' : 'Plaque earned'}
                </p>
                <ul className="mt-2 space-y-2">
                  {ceremony.achievements.map((a) => (
                    <li
                      key={a.id}
                      className="flex animate-pop items-start gap-3 rounded-lg border border-brass/50 bg-brass/15 p-3"
                    >
                      <span className="text-xl" aria-hidden>
                        {a.icon}
                      </span>
                      <div>
                        <p className="font-sign text-[11px] uppercase text-claw">{a.name}</p>
                        <p className="text-xs leading-snug text-plank/80">{a.blurb}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <button className="btn-primary mt-6 w-full py-3" onClick={dismissCeremony}>
              {finale ? 'Take a bow' : 'Back to work'}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
