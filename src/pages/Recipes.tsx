import { useMemo, useState } from 'react';
import { recipes, useApp } from '../lib/store';
import { DAYS_PER_UNLOCK, TOTAL_RECIPES } from '../lib/empire';
import { EMPTY_STATES, LOCKED_RECIPE_LINE } from '../lib/voice';
import type { Recipe } from '../lib/types';

const DIFFICULTY_TINT: Record<string, string> = {
  Deckhand: 'text-foam border-foam/40',
  'Line Cook': 'text-surf border-surf/40',
  'Head Chef': 'text-brass border-brass/40',
  Kraken: 'text-shell border-shell/40',
};

function unlockDayFor(order: number) {
  return order > 120 ? 365 : order * DAYS_PER_UNLOCK;
}

/* ------------------------------------------------------------------- card */

function RecipeCard({
  recipe,
  unlocked,
  onOpen,
}: {
  recipe: Recipe;
  unlocked: boolean;
  onOpen: () => void;
}) {
  if (!unlocked) {
    return (
      <div className="board relative flex flex-col overflow-hidden opacity-80">
        <div className="relative flex aspect-[4/3] items-center justify-center bg-gradient-to-br from-trench to-abyss">
          <div className="text-center">
            <span className="text-3xl" aria-hidden>
              🔒
            </span>
            <p className="mt-1 font-sign text-[11px] text-parchment/35">
              Recipe {recipe.unlockOrder}
            </p>
          </div>
        </div>
        <div className="flex flex-1 flex-col gap-1 p-3">
          <p className="font-sign text-xs uppercase text-parchment/35">{recipe.cuisine}</p>
          <p className="text-xs italic leading-snug text-parchment/45">{LOCKED_RECIPE_LINE}</p>
          <p className="mt-auto pt-2 font-ledger text-[10px] text-brass/60">
            Opens on day {unlockDayFor(recipe.unlockOrder)}
          </p>
        </div>
      </div>
    );
  }

  return (
    <button
      onClick={onOpen}
      className="board group flex flex-col overflow-hidden text-left transition hover:-translate-y-0.5 hover:border-brass/50"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-trench">
        {recipe.image ? (
          <img
            src={`./${recipe.image}`}
            alt={recipe.title}
            loading="lazy"
            className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center gap-1 bg-gradient-to-br from-plank/60 to-abyss text-center">
            <span className="text-3xl" aria-hidden>
              🍽️
            </span>
            <p className="px-3 font-ledger text-[10px] text-parchment/50">No photo in the archive</p>
          </div>
        )}
        <span className="absolute left-2 top-2 rounded-md bg-abyss/80 px-1.5 py-0.5 font-ledger text-[10px] text-brass backdrop-blur">
          #{recipe.unlockOrder}
        </span>
        <span
          className={`absolute right-2 top-2 rounded-md border bg-abyss/80 px-1.5 py-0.5 font-ledger text-[10px] backdrop-blur ${
            DIFFICULTY_TINT[recipe.difficulty]
          }`}
        >
          {recipe.difficulty}
        </span>
      </div>
      <div className="flex flex-1 flex-col p-3">
        <p className="eyebrow">{recipe.country}</p>
        <h3 className="mt-0.5 font-sign text-[13px] uppercase leading-tight text-brass">
          {recipe.title}
        </h3>
        <p className="mt-1 line-clamp-2 text-xs leading-snug text-parchment/60">
          {recipe.description}
        </p>
        <p className="mt-auto pt-2 font-ledger text-[10px] text-parchment/40">
          {recipe.yield} · Prep {recipe.prep} · Cook {recipe.cook}
        </p>
      </div>
    </button>
  );
}

/* ----------------------------------------------------------------- detail */

export function RecipeDetail({ recipe, onClose }: { recipe: Recipe; onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-[60] flex items-start justify-center overflow-y-auto bg-abyss/85 p-3 backdrop-blur-sm sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-label={recipe.title}
      onClick={onClose}
    >
      <div
        className="board-parchment my-auto w-full max-w-2xl animate-pop overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {recipe.image && (
          <img src={`./${recipe.image}`} alt={recipe.title} className="h-52 w-full object-cover sm:h-64" />
        )}
        <div className="p-5 sm:p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="font-ledger text-[11px] uppercase tracking-[0.2em] text-plank/70">
                {recipe.country === recipe.cuisine
                  ? recipe.country
                  : `${recipe.country} · ${recipe.cuisine}`}{' '}
                · Recipe {recipe.unlockOrder} of {TOTAL_RECIPES}
              </p>
              <h2 className="mt-1 font-sign text-xl uppercase leading-tight text-claw sm:text-2xl">
                {recipe.title}
              </h2>
            </div>
            <button
              className="btn rounded-lg border border-plank/30 px-3 py-1.5 text-plank hover:bg-plank/10"
              onClick={onClose}
              aria-label="Close recipe"
            >
              Close
            </button>
          </div>

          <p className="mt-3 text-sm leading-relaxed text-plank/85">{recipe.description}</p>

          <div className="mt-4 flex flex-wrap gap-2 font-ledger text-[11px]">
            {[recipe.yield, `Prep ${recipe.prep}`, `Cook ${recipe.cook}`, recipe.difficulty].map((b) => (
              <span key={b} className="rounded-full border border-plank/30 bg-plank/10 px-2.5 py-1 text-plank">
                {b}
              </span>
            ))}
          </div>

          <div className="mt-6 grid gap-6 sm:grid-cols-[minmax(0,1fr)_minmax(0,1.25fr)]">
            <div>
              <h3 className="font-sign text-xs uppercase tracking-tight text-plank">Ingredients</h3>
              {recipe.ingredientGroups.map((g, i) => (
                <div key={i} className="mt-3">
                  {g.group && (
                    <p className="font-ledger text-[10px] uppercase tracking-wider text-claw">{g.group}</p>
                  )}
                  <ul className="mt-1 space-y-1">
                    {g.items.map((it, j) => (
                      <li key={j} className="flex gap-2 text-sm leading-snug text-plank/85">
                        <span aria-hidden className="mt-[7px] h-1 w-1 shrink-0 rounded-full bg-claw/70" />
                        {it}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>

            <div>
              <h3 className="font-sign text-xs uppercase tracking-tight text-plank">Method</h3>
              <ol className="mt-3 space-y-3">
                {recipe.method.map((step, i) => (
                  <li key={i} className="flex gap-3 text-sm leading-relaxed text-plank/85">
                    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-claw font-ledger text-[10px] font-semibold text-white">
                      {i + 1}
                    </span>
                    <span>{step}</span>
                  </li>
                ))}
              </ol>
            </div>
          </div>

          {recipe.cooksNote && (
            <div className="mt-6 rounded-xl border-l-4 border-brass bg-brass/15 p-4">
              <p className="font-ledger text-[10px] uppercase tracking-wider text-plank/70">Cook’s note</p>
              <p className="mt-1 text-sm leading-relaxed text-plank/90">{recipe.cooksNote}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------- page */

export default function Recipes() {
  const { stats } = useApp();
  const [query, setQuery] = useState('');
  const [continent, setContinent] = useState('All');
  const [cuisine, setCuisine] = useState('All');
  const [country, setCountry] = useState('All');
  const [status, setStatus] = useState<'all' | 'unlocked' | 'locked'>('all');
  const [open, setOpen] = useState<Recipe | null>(null);

  const continents = useMemo(() => ['All', ...new Set(recipes.map((r) => r.continent))], []);
  const cuisines = useMemo(
    () => [
      'All',
      ...new Set(recipes.filter((r) => continent === 'All' || r.continent === continent).map((r) => r.cuisine)),
    ],
    [continent]
  );
  const countries = useMemo(
    () => [
      'All',
      ...new Set(
        recipes
          .filter((r) => (continent === 'All' || r.continent === continent) && (cuisine === 'All' || r.cuisine === cuisine))
          .map((r) => r.country)
      ).values(),
    ].sort((a, b) => (a === 'All' ? -1 : b === 'All' ? 1 : a.localeCompare(b))),
    [continent, cuisine]
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return recipes.filter((r) => {
      const unlocked = r.unlockOrder <= stats.unlockedRecipes;
      if (status === 'unlocked' && !unlocked) return false;
      if (status === 'locked' && unlocked) return false;
      if (continent !== 'All' && r.continent !== continent) return false;
      if (cuisine !== 'All' && r.cuisine !== cuisine) return false;
      if (country !== 'All' && r.country !== country) return false;
      if (!q) return true;
      // Locked recipes stay hidden from search; that's the point of locking them.
      if (!unlocked) return r.cuisine.toLowerCase().includes(q);
      return (
        r.title.toLowerCase().includes(q) ||
        r.description.toLowerCase().includes(q) ||
        r.country.toLowerCase().includes(q) ||
        r.cuisine.toLowerCase().includes(q) ||
        r.ingredientGroups.some((g) => g.items.some((i) => i.toLowerCase().includes(q)))
      );
    });
  }, [query, continent, cuisine, country, status, stats.unlockedRecipes]);

  const pct = (stats.unlockedRecipes / TOTAL_RECIPES) * 100;

  return (
    <div className="space-y-5">
      <header className="board-parchment p-5">
        <p className="font-ledger text-[11px] uppercase tracking-[0.22em] text-plank/70">
          Kept in the safe behind the walk-in
        </p>
        <h1 className="mt-1 font-sign text-xl uppercase leading-tight text-claw sm:text-2xl">
          The Billy Krab International Recipe Collection
        </h1>
        <div className="mt-4">
          <div className="h-2.5 w-full overflow-hidden rounded-full border border-plank/25 bg-plank/15">
            <div
              className="h-full rounded-full bg-gradient-to-r from-claw to-brass transition-[width] duration-700"
              style={{ width: `${Math.max(pct, 0.8)}%` }}
            />
          </div>
          <p className="mt-2 font-ledger text-[11px] text-plank/75">
            {stats.unlockedRecipes} of {TOTAL_RECIPES} unlocked · one recipe every{' '}
            {DAYS_PER_UNLOCK} completed days, then two on day 365
          </p>
        </div>
      </header>

      {/* Filters */}
      <div className="board space-y-3 p-4">
        <input
          className="field"
          type="search"
          placeholder="Search unlocked recipes by name, country, or ingredient"
          aria-label="Search recipes"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <div className="grid gap-2 sm:grid-cols-4">
          <select
            className="field"
            aria-label="Filter by continent"
            value={continent}
            onChange={(e) => {
              setContinent(e.target.value);
              setCuisine('All');
              setCountry('All');
            }}
          >
            {continents.map((c) => (
              <option key={c}>{c === 'All' ? 'All continents' : c}</option>
            ))}
          </select>
          <select
            className="field"
            aria-label="Filter by cuisine"
            value={cuisine}
            onChange={(e) => {
              setCuisine(e.target.value);
              setCountry('All');
            }}
          >
            {cuisines.map((c) => (
              <option key={c}>{c === 'All' ? 'All cuisines' : c}</option>
            ))}
          </select>
          <select
            className="field"
            aria-label="Filter by country"
            value={country}
            onChange={(e) => setCountry(e.target.value)}
          >
            {countries.map((c) => (
              <option key={c}>{c === 'All' ? 'All countries' : c}</option>
            ))}
          </select>
          <select
            className="field"
            aria-label="Filter by unlock status"
            value={status}
            onChange={(e) => setStatus(e.target.value as typeof status)}
          >
            <option value="all">Locked and unlocked</option>
            <option value="unlocked">Unlocked only</option>
            <option value="locked">Still locked</option>
          </select>
        </div>
        <p className="font-ledger text-[11px] text-parchment/45">
          {filtered.length} {filtered.length === 1 ? 'recipe' : 'recipes'} shown
        </p>
      </div>

      {filtered.length === 0 ? (
        <p className="board p-8 text-center text-sm text-parchment/60">{EMPTY_STATES.search}</p>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {filtered.map((r) => (
            <RecipeCard
              key={r.id}
              recipe={r}
              unlocked={r.unlockOrder <= stats.unlockedRecipes}
              onOpen={() => setOpen(r)}
            />
          ))}
        </div>
      )}

      {open && <RecipeDetail recipe={open} onClose={() => setOpen(null)} />}
    </div>
  );
}
