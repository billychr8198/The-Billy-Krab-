import { useEffect, useState } from 'react';
import { useApp } from './lib/store';
import { TOTAL_DAYS, TOTAL_RECIPES } from './lib/empire';
import Ocean from './components/Ocean';
import Ceremony from './components/Ceremony';
import MusicPlayer from './components/MusicPlayer';
import Onboarding from './pages/Onboarding';
import Home from './pages/Home';
import DailyLog from './pages/DailyLog';
import Empire from './pages/Empire';
import Recipes from './pages/Recipes';
import Journey from './pages/Journey';
import Calendar from './pages/Calendar';
import Achievements from './pages/Achievements';

export type Page = 'home' | 'log' | 'empire' | 'recipes' | 'journey' | 'calendar' | 'plaques';

const NAV: { page: Page; label: string; short: string; icon: string }[] = [
  { page: 'home', label: 'Dashboard', short: 'Home', icon: '🦀' },
  { page: 'log', label: 'Daily log', short: 'Log', icon: '🍔' },
  { page: 'empire', label: 'Head office', short: 'Empire', icon: '📊' },
  { page: 'recipes', label: 'Recipe vault', short: 'Recipes', icon: '🍽️' },
  { page: 'journey', label: 'Culinary journey', short: 'Journey', icon: '🌍' },
  { page: 'calendar', label: 'The rota', short: 'Rota', icon: '📅' },
  { page: 'plaques', label: 'Plaque wall', short: 'Plaques', icon: '🏆' },
];

const isPage = (v: string): v is Page => NAV.some((n) => n.page === v);

export default function App() {
  const { state, stats, today } = useApp();
  const [page, setPage] = useState<Page>(() => {
    const hash = window.location.hash.replace('#', '');
    return isPage(hash) ? hash : 'home';
  });

  // Hash routing, so back/forward and deep links behave.
  useEffect(() => {
    const onHash = () => {
      const hash = window.location.hash.replace('#', '');
      if (isPage(hash)) setPage(hash);
    };
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  const go = (p: Page) => {
    setPage(p);
    window.location.hash = p;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (!state.onboarded) {
    return (
      <>
        <Ocean />
        <Onboarding />
      </>
    );
  }

  return (
    <>
      <Ocean />

      <div className="mx-auto flex min-h-[100svh] max-w-7xl gap-0 lg:gap-6 lg:px-6">
        {/* Side rail, desktop */}
        <aside className="sticky top-0 hidden h-[100svh] w-56 shrink-0 flex-col py-6 lg:flex">
          <button onClick={() => go('home')} className="group text-left">
            <img
              src="./billy-krab-logo.png"
              alt="The Billy Krab"
              className="w-full transition group-hover:scale-[1.02]"
            />
          </button>

          <nav className="mt-6 flex-1 space-y-1" aria-label="Main">
            {NAV.map((n) => (
              <button
                key={n.page}
                onClick={() => go(n.page)}
                aria-current={page === n.page ? 'page' : undefined}
                className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-bold transition ${
                  page === n.page
                    ? 'bg-claw text-white shadow-[0_3px_0_#9c2a17]'
                    : 'text-parchment/70 hover:bg-white/6 hover:text-parchment'
                }`}
              >
                <span aria-hidden className="text-base">
                  {n.icon}
                </span>
                {n.label}
              </button>
            ))}
          </nav>

          <div className="board mt-4 p-3">
            <p className="eyebrow">Progress</p>
            <p className="mt-1 font-ledger text-sm text-parchment">
              Day {today} / {TOTAL_DAYS}
            </p>
            <p className="font-ledger text-[11px] text-foam/80">
              {stats.unlockedRecipes} / {TOTAL_RECIPES} recipes
            </p>
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full rounded-full bg-gradient-to-r from-claw to-brass"
                style={{ width: `${Math.max((stats.completedDays / TOTAL_DAYS) * 100, 1)}%` }}
              />
            </div>
          </div>
        </aside>

        {/* Main column */}
        <div className="min-w-0 flex-1 pb-24 lg:pb-8">
          {/* Top bar */}
          <header className="sticky top-0 z-40 -mx-0 mb-4 border-b border-white/8 bg-abyss/80 px-4 py-2.5 backdrop-blur-md lg:mx-0 lg:rounded-b-2xl lg:px-4">
            <div className="flex items-center gap-3">
              <button onClick={() => go('home')} className="flex items-center gap-2.5 lg:hidden">
                <img
                  src="./billy-krab-icon.png"
                  alt="The Billy Krab"
                  className="h-9 w-9 shrink-0 rounded-full"
                />
                <span className="font-sign text-xs uppercase leading-none text-brass">
                  The Billy Krab
                </span>
              </button>

              <img
                src="./billy-krab-icon.png"
                alt=""
                className="hidden h-9 w-9 shrink-0 rounded-full lg:block"
              />
              <p className="hidden font-ledger text-[11px] text-parchment/50 lg:block">
                Head chef and the Krab, still open, still confused
              </p>

              <div className="ml-auto flex items-center gap-2">
                <span className="chip hidden sm:inline-flex">
                  🔥 {stats.streak} day{stats.streak === 1 ? '' : 's'}
                </span>
                <MusicPlayer />
              </div>
            </div>
          </header>

          <main className="px-4 lg:px-0">
            {page === 'home' && <Home go={go} />}
            {page === 'log' && <DailyLog />}
            {page === 'empire' && <Empire />}
            {page === 'recipes' && <Recipes />}
            {page === 'journey' && <Journey />}
            {page === 'calendar' && <Calendar go={go} />}
            {page === 'plaques' && <Achievements />}
          </main>

          <footer className="mt-10 px-4 pb-4 text-center font-ledger text-[10px] text-parchment/25 lg:px-0">
            The Billy Krab · {TOTAL_RECIPES} recipes · {TOTAL_DAYS} days · saved in this browser only
          </footer>
        </div>
      </div>

      {/* Bottom bar, mobile */}
      <nav
        className="fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-abyss/92 backdrop-blur-md lg:hidden"
        aria-label="Main"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        <div className="flex">
          {NAV.map((n) => (
            <button
              key={n.page}
              onClick={() => go(n.page)}
              aria-current={page === n.page ? 'page' : undefined}
              className={`flex flex-1 flex-col items-center gap-0.5 py-2 text-[9px] font-bold transition ${
                page === n.page ? 'text-brass' : 'text-parchment/45'
              }`}
            >
              <span aria-hidden className="text-base leading-none">
                {n.icon}
              </span>
              {n.short}
            </button>
          ))}
        </div>
      </nav>

      <Ceremony />
    </>
  );
}
