import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import type { DayLog, DrinkEntry, FoodEntry, MealSlot, Recipe, SaveState } from './types';
import * as store from './storage';
import { TOTAL_DAYS, unlockedRecipeCount } from './empire';
import { computeStats, newlyEarned, type Achievement, type Stats } from './achievements';
import recipeData from '../data/recipes.json';

export const recipes = recipeData.recipes as Recipe[];
export const journey = recipeData.journey;

export interface Ceremony {
  kind: 'unlock' | 'achievement' | 'finale';
  recipes: Recipe[];
  achievements: Achievement[];
  day: number;
}

interface Ctx {
  state: SaveState;
  stats: Stats;
  today: number;
  selectedDay: number;
  setSelectedDay: (d: number) => void;
  logFor: (day: number) => DayLog;
  ceremony: Ceremony | null;
  dismissCeremony: () => void;
  begin: () => void;
  addFood: (day: number, slot: MealSlot, entry: Omit<FoodEntry, 'id' | 'slot'>) => void;
  updateFood: (day: number, id: string, patch: Partial<FoodEntry>) => void;
  removeFood: (day: number, id: string) => void;
  addDrink: (day: number, entry: Omit<DrinkEntry, 'id'>) => void;
  updateDrink: (day: number, id: string, patch: Partial<DrinkEntry>) => void;
  removeDrink: (day: number, id: string) => void;
  setNote: (day: number, note: string) => void;
  completeDay: (day: number) => void;
  reopenDay: (day: number) => void;
  toggleMusic: () => void;
  replaceState: (next: SaveState) => void;
  reset: () => void;
}

const AppCtx = createContext<Ctx | null>(null);
const newId = () => Math.random().toString(36).slice(2, 10);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<SaveState>(() => store.load());
  const [selectedDay, setSelectedDay] = useState(1);
  const [ceremony, setCeremony] = useState<Ceremony | null>(null);

  // Always-current snapshot, so completeDay can decide rewards outside a reducer.
  const latest = useRef(state);
  latest.current = state;

  const firstRun = useRef(true);

  const today = useMemo(() => store.dayNumberFor(state.startedOn), [state.startedOn]);

  useEffect(() => {
    setSelectedDay(today);
  }, [today]);

  useEffect(() => {
    if (firstRun.current) {
      firstRun.current = false;
      return;
    }
    store.save(state);
  }, [state]);

  const stats = useMemo(() => computeStats(state), [state]);

  const logFor = useCallback(
    (day: number) => state.logs[day] ?? store.blankLog(day, store.dateForDay(state.startedOn, day)),
    [state.logs, state.startedOn]
  );

  const mutateLog = useCallback((day: number, fn: (log: DayLog) => DayLog) => {
    setState((prev) => {
      const existing = prev.logs[day] ?? store.blankLog(day, store.dateForDay(prev.startedOn, day));
      return { ...prev, logs: { ...prev.logs, [day]: fn(existing) } };
    });
  }, []);

  const begin = useCallback(() => {
    setState((prev) => ({
      ...prev,
      onboarded: true,
      startedOn: prev.startedOn ?? store.todayISO(),
      lastVisit: store.todayISO(),
    }));
  }, []);

  const addFood: Ctx['addFood'] = useCallback(
    (day, slot, entry) =>
      mutateLog(day, (l) => ({ ...l, foods: [...l.foods, { ...entry, slot, id: newId() }] })),
    [mutateLog]
  );
  const updateFood: Ctx['updateFood'] = useCallback(
    (day, id, patch) =>
      mutateLog(day, (l) => ({
        ...l,
        foods: l.foods.map((f) => (f.id === id ? { ...f, ...patch } : f)),
      })),
    [mutateLog]
  );
  const removeFood: Ctx['removeFood'] = useCallback(
    (day, id) => mutateLog(day, (l) => ({ ...l, foods: l.foods.filter((f) => f.id !== id) })),
    [mutateLog]
  );
  const addDrink: Ctx['addDrink'] = useCallback(
    (day, entry) =>
      mutateLog(day, (l) => ({ ...l, drinks: [...l.drinks, { ...entry, id: newId() }] })),
    [mutateLog]
  );
  const updateDrink: Ctx['updateDrink'] = useCallback(
    (day, id, patch) =>
      mutateLog(day, (l) => ({
        ...l,
        drinks: l.drinks.map((d) => (d.id === id ? { ...d, ...patch } : d)),
      })),
    [mutateLog]
  );
  const removeDrink: Ctx['removeDrink'] = useCallback(
    (day, id) => mutateLog(day, (l) => ({ ...l, drinks: l.drinks.filter((d) => d.id !== id) })),
    [mutateLog]
  );
  const setNote: Ctx['setNote'] = useCallback(
    (day, note) => mutateLog(day, (l) => ({ ...l, note })),
    [mutateLog]
  );

  const reopenDay = useCallback((day: number) => {
    setState((prev) => {
      const log = prev.logs[day];
      if (!log?.completed) return prev;
      return {
        ...prev,
        logs: { ...prev.logs, [day]: { ...log, completed: false, completedAt: undefined } },
      };
    });
  }, []);

  /**
   * Sign off a day. The only place the empire grows or recipes unlock.
   * Refuses to run twice on an already-completed day, so a refresh, a
   * double-click, or a re-render can never pay out twice.
   */
  const completeDay = useCallback((day: number) => {
    const prev = latest.current;
    const existing = prev.logs[day] ?? store.blankLog(day, store.dateForDay(prev.startedOn, day));
    if (existing.completed) return;
    if (existing.foods.length === 0 && existing.drinks.length === 0) return;

    const log: DayLog = { ...existing, completed: true, completedAt: new Date().toISOString() };
    const logs = { ...prev.logs, [day]: log };
    const completedCount = Object.values(logs).filter((l) => l.completed).length;

    const before = prev.unlockedHighWater;
    const after = Math.max(before, unlockedRecipeCount(completedCount));
    const freshRecipes = recipes.filter((r) => r.unlockOrder > before && r.unlockOrder <= after);

    const next: SaveState = {
      ...prev,
      logs,
      unlockedHighWater: after,
      lastVisit: store.todayISO(),
    };

    const freshAchievements = newlyEarned(next, computeStats(next));
    if (freshAchievements.length) {
      const stamped = { ...next.achievements };
      for (const a of freshAchievements) stamped[a.id] = new Date().toISOString();
      next.achievements = stamped;
    }

    latest.current = next;
    setState(next);

    if (freshRecipes.length || freshAchievements.length) {
      setCeremony({
        kind:
          completedCount >= TOTAL_DAYS
            ? 'finale'
            : freshRecipes.length
              ? 'unlock'
              : 'achievement',
        recipes: freshRecipes,
        achievements: freshAchievements,
        day,
      });
    }
  }, []);

  const toggleMusic = useCallback(() => setState((p) => ({ ...p, musicOn: !p.musicOn })), []);
  const replaceState = useCallback((next: SaveState) => setState(next), []);
  const reset = useCallback(() => {
    store.clearSave();
    setState(store.emptySave());
    setCeremony(null);
  }, []);

  const value: Ctx = {
    state,
    stats,
    today,
    selectedDay,
    setSelectedDay,
    logFor,
    ceremony,
    dismissCeremony: () => setCeremony(null),
    begin,
    addFood,
    updateFood,
    removeFood,
    addDrink,
    updateDrink,
    removeDrink,
    setNote,
    completeDay,
    reopenDay,
    toggleMusic,
    replaceState,
    reset,
  };

  return <AppCtx.Provider value={value}>{children}</AppCtx.Provider>;
}

export function useApp(): Ctx {
  const ctx = useContext(AppCtx);
  if (!ctx) throw new Error('useApp must be used inside <StoreProvider>');
  return ctx;
}
