import { useRef, useState } from 'react';
import { useApp } from '../lib/store';
import { ACHIEVEMENTS, computeStats } from '../lib/achievements';
import { EMPTY_STATES } from '../lib/voice';
import { exportSave, importSave } from '../lib/storage';

export default function Achievements() {
  const { state, stats, replaceState, reset } = useApp();
  const earned = ACHIEVEMENTS.filter((a) => state.achievements[a.id]);
  const pending = ACHIEVEMENTS.filter((a) => !state.achievements[a.id]);
  const fileRef = useRef<HTMLInputElement>(null);
  const [message, setMessage] = useState('');
  const [confirmReset, setConfirmReset] = useState(false);

  const download = () => {
    const blob = new Blob([exportSave(state)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `billy-krab-save-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setMessage('Backup downloaded.');
  };

  const upload = async (file: File) => {
    const next = importSave(await file.text());
    if (!next) {
      setMessage('That file isn’t a Billy Krab backup. Nothing was changed.');
      return;
    }
    replaceState(next);
    const s = computeStats(next);
    setMessage(`Backup restored. ${s.completedDays} days and ${s.unlockedRecipes} recipes are back.`);
  };

  return (
    <div className="space-y-5">
      <header className="board-parchment p-5">
        <p className="font-ledger text-[11px] uppercase tracking-[0.22em] text-plank/70">
          Screwed to the wall by the till
        </p>
        <h1 className="mt-1 font-sign text-xl uppercase leading-tight text-claw sm:text-2xl">
          The Plaque Wall
        </h1>
        <p className="mt-2 text-sm text-plank/80">
          {earned.length} of {ACHIEVEMENTS.length} earned. The rest are still in the box out the back.
        </p>
      </header>

      {earned.length === 0 ? (
        <p className="board p-8 text-center text-sm text-parchment/60">{EMPTY_STATES.achievements}</p>
      ) : (
        <section>
          <h2 className="mb-2 font-sign text-sm uppercase tracking-tight text-brass">Earned</h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {earned.map((a) => (
              <article key={a.id} className="board-parchment flex gap-3 p-4">
                <span className="text-2xl" aria-hidden>
                  {a.icon}
                </span>
                <div>
                  <h3 className="font-sign text-xs uppercase leading-tight text-claw">{a.name}</h3>
                  <p className="mt-1 text-xs leading-snug text-plank/80">{a.blurb}</p>
                  <p className="mt-2 font-ledger text-[10px] text-plank/50">
                    {new Date(state.achievements[a.id]).toLocaleDateString()}
                  </p>
                </div>
              </article>
            ))}
          </div>
        </section>
      )}

      {pending.length > 0 && (
        <section>
          <h2 className="mb-2 font-sign text-sm uppercase tracking-tight text-surf">Still to earn</h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {pending.map((a) => (
              <article key={a.id} className="board flex gap-3 p-4 opacity-70">
                <span className="text-2xl grayscale" aria-hidden>
                  {a.icon}
                </span>
                <div>
                  <h3 className="font-sign text-xs uppercase leading-tight text-parchment/70">{a.name}</h3>
                  <p className="mt-1 font-ledger text-[11px] text-brass/70">{a.requirement}</p>
                </div>
              </article>
            ))}
          </div>
        </section>
      )}

      {/* Save management */}
      <section className="board p-4 sm:p-5">
        <h2 className="font-sign text-sm uppercase tracking-tight text-parchment">Your data</h2>
        <p className="mt-1 max-w-2xl text-sm text-parchment/60">
          Everything lives in this browser and nowhere else. No account, no server. Clearing site data
          wipes it, so take a backup before you switch device.
        </p>
        <dl className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            ['Days filed', stats.completedDays],
            ['Foods', stats.totalFoods],
            ['Drinks', stats.totalDrinks],
            ['Recipes', stats.unlockedRecipes],
          ].map(([label, value]) => (
            <div key={label as string} className="rounded-lg border border-white/8 bg-abyss/40 p-3">
              <dt className="eyebrow">{label}</dt>
              <dd className="mt-1 font-ledger text-lg text-parchment">{value}</dd>
            </div>
          ))}
        </dl>

        <div className="mt-4 flex flex-wrap gap-2">
          <button className="btn-ghost" onClick={download}>
            Download backup
          </button>
          <button className="btn-ghost" onClick={() => fileRef.current?.click()}>
            Restore backup
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="application/json"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) void upload(f);
              e.target.value = '';
            }}
          />
          {confirmReset ? (
            <>
              <button
                className="btn bg-claw text-white shadow-[0_4px_0_#9c2a17] hover:bg-shell"
                onClick={() => {
                  reset();
                  setConfirmReset(false);
                  setMessage('Everything cleared. The restaurant is one shack again.');
                }}
              >
                Yes, erase 365 days
              </button>
              <button className="btn-ghost" onClick={() => setConfirmReset(false)}>
                Keep my data
              </button>
            </>
          ) : (
            <button className="btn-ghost" onClick={() => setConfirmReset(true)}>
              Start over
            </button>
          )}
        </div>

        {message && (
          <p className="mt-3 rounded-lg border border-foam/25 bg-foam/8 px-3 py-2 text-sm text-foam">
            {message}
          </p>
        )}
      </section>
    </div>
  );
}
