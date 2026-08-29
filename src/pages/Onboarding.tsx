import { useState } from 'react';
import { useApp } from '../lib/store';
import { TOTAL_DAYS, TOTAL_RECIPES } from '../lib/empire';

const PANELS = [
  {
    eyebrow: 'Under new management',
    title: 'Welcome to The Billy Krab',
    body: 'One shack on the sea floor, ten customers a day, and a chef who has never once explained the business model.',
  },
  {
    eyebrow: 'Your job',
    title: 'Eat food. Drink beverages. Write it down.',
    body: 'Breakfast through to the snack you had standing up at midnight. Portions if you want them, notes if you feel like it. That is the whole task.',
  },
  {
    eyebrow: 'The part nobody can explain',
    title: 'Every completed log grows the restaurant',
    body: 'Customers, fans, popularity, net income and branches all compound by one percent per filed day. The accountants have stopped asking questions.',
  },
  {
    eyebrow: 'What you get out of it',
    title: `${TOTAL_RECIPES} recipes, three days at a time`,
    body: `Every three completed days the chef parts with one real recipe. The journey runs Africa, Arabia, the Americas, Italy, France, Japan, Thailand, and finishes in Indonesia. Day ${TOTAL_DAYS} drops two at once.`,
  },
];

export default function Onboarding() {
  const { begin } = useApp();
  const [step, setStep] = useState(0);
  const panel = PANELS[step];
  const last = step === PANELS.length - 1;

  return (
    <div className="flex min-h-[100svh] items-center justify-center p-4">
      <div className="w-full max-w-3xl">
        <img
          src="./billy-krab-logo.png"
          alt="The Billy Krab"
          className="mx-auto w-full max-w-sm animate-sway drop-shadow-2xl"
        />

        <div className="board-parchment mt-6 overflow-hidden sm:flex">
          <img
            src="./billy-krab-crew.jpg"
            alt="The head chef and the Billy Krab mascot"
            className="h-48 w-full object-cover object-top sm:h-auto sm:w-48 sm:shrink-0"
          />

          <div className="flex flex-1 flex-col p-5 sm:p-6">
            <p className="font-ledger text-[11px] uppercase tracking-[0.22em] text-plank/70">
              {panel.eyebrow}
            </p>
            <h1 className="mt-1 font-sign text-lg uppercase leading-tight text-claw sm:text-xl">
              {panel.title}
            </h1>
            <p className="mt-3 text-sm leading-relaxed text-plank/85">{panel.body}</p>

            <div className="mt-auto flex items-center justify-between gap-3 pt-6">
              <div className="flex gap-1.5" role="tablist" aria-label="Onboarding progress">
                {PANELS.map((p, i) => (
                  <button
                    key={p.title}
                    role="tab"
                    aria-selected={i === step}
                    aria-label={`Step ${i + 1}`}
                    onClick={() => setStep(i)}
                    className={`h-2 rounded-full transition-all ${
                      i === step ? 'w-6 bg-claw' : 'w-2 bg-plank/30 hover:bg-plank/50'
                    }`}
                  />
                ))}
              </div>

              <div className="flex gap-2">
                {step > 0 && (
                  <button
                    className="btn rounded-xl border border-plank/30 px-4 py-2.5 text-plank hover:bg-plank/10"
                    onClick={() => setStep(step - 1)}
                  >
                    Back
                  </button>
                )}
                {last ? (
                  <button className="btn-primary px-6 py-3 text-base" onClick={begin}>
                    Start day 1
                  </button>
                ) : (
                  <button className="btn-gold px-5 py-2.5" onClick={() => setStep(step + 1)}>
                    Next
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        <p className="mt-4 text-center text-xs text-parchment/40">
          Everything saves in this browser. No account, no sign-up, nothing leaves your device.
        </p>
      </div>
    </div>
  );
}
