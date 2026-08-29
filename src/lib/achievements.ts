import type { DayLog, SaveState } from './types';
import { empireAt, unlockedRecipeCount, TOTAL_DAYS } from './empire';
import recipeData from '../data/recipes.json';
import type { Recipe } from './types';

const recipes = recipeData.recipes as Recipe[];

export interface Achievement {
  id: string;
  name: string;
  blurb: string;
  /** What it takes, in the user's words. */
  requirement: string;
  icon: string;
  test: (s: Stats) => boolean;
}

export interface Stats {
  completedDays: number;
  streak: number;
  bestStreak: number;
  totalFoods: number;
  totalDrinks: number;
  unlockedRecipes: number;
  continents: number;
  branches: number;
  fans: number;
  daysWithNotes: number;
  distinctFoodNames: number;
}

export const ACHIEVEMENTS: Achievement[] = [
  {
    id: 'first-customer',
    name: 'First Customer',
    blurb: 'One person walked in, ordered, and left without incident. Historic.',
    requirement: 'Complete day 1',
    icon: '🚪',
    test: (s) => s.completedDays >= 1,
  },
  {
    id: 'three-day-chef',
    name: 'Three-Day Chef',
    blurb: 'Three logs in and the chef has decided you can be trusted with a recipe.',
    requirement: 'Complete 3 days',
    icon: '🔑',
    test: (s) => s.completedDays >= 3,
  },
  {
    id: 'hydration-officer',
    name: 'Hydration Officer',
    blurb: 'Fifty drinks logged. Somewhere, a kidney is writing you a thank-you note.',
    requirement: 'Log 50 drinks',
    icon: '🥤',
    test: (s) => s.totalDrinks >= 50,
  },
  {
    id: 'the-regular',
    name: 'The Regular',
    blurb: 'Thirty days. Staff have started saving your table without being asked.',
    requirement: 'Complete 30 days',
    icon: '🪑',
    test: (s) => s.completedDays >= 30,
  },
  {
    id: 'week-of-service',
    name: 'Seven-Day Service',
    blurb: 'A full week without a single missed shift. The kitchen is stunned.',
    requirement: 'Reach a 7-day streak',
    icon: '🔥',
    test: (s) => s.bestStreak >= 7,
  },
  {
    id: 'international-appetite',
    name: 'International Appetite',
    blurb: 'Recipes from three continents in the vault. Your passport is jealous.',
    requirement: 'Unlock recipes from 3 continents',
    icon: '🌍',
    test: (s) => s.continents >= 3,
  },
  {
    id: 'pantry-raider',
    name: 'Pantry Raider',
    blurb: 'A hundred different things eaten. Variety, allegedly, is something.',
    requirement: 'Log 100 different food items',
    icon: '🧺',
    test: (s) => s.distinctFoodNames >= 100,
  },
  {
    id: 'chain-reaction',
    name: 'Chain Reaction',
    blurb: 'Ten branches. Head office is now a real room with a real door.',
    requirement: 'Reach 10 branches',
    icon: '🏬',
    test: (s) => s.branches >= 10,
  },
  {
    id: 'restaurant-mogul',
    name: 'Restaurant Mogul',
    blurb: 'A hundred thousand fans. The accountants have hired their own accountants.',
    requirement: 'Reach 100,000 fans',
    icon: '💼',
    test: (s) => s.fans >= 100_000,
  },
  {
    id: 'half-way-hero',
    name: 'Halfway Hero',
    blurb: 'Day 183. The exact middle. Statistically, the hardest place to quit from.',
    requirement: 'Complete 183 days',
    icon: '⚖️',
    test: (s) => s.completedDays >= 183,
  },
  {
    id: 'recipe-hoarder',
    name: 'Recipe Hoarder',
    blurb: 'Sixty-one recipes. Half the book, and the good half is still coming.',
    requirement: 'Unlock 61 recipes',
    icon: '📚',
    test: (s) => s.unlockedRecipes >= 61,
  },
  {
    id: 'note-taker',
    name: 'The Chronicler',
    blurb: 'Fifty days with notes. Future you will find these extremely useful or extremely funny.',
    requirement: 'Add notes on 50 days',
    icon: '✍️',
    test: (s) => s.daysWithNotes >= 50,
  },
  {
    id: 'century',
    name: 'Century Service',
    blurb: 'A hundred days. The kind of number people put on a plaque.',
    requirement: 'Complete 100 days',
    icon: '💯',
    test: (s) => s.completedDays >= 100,
  },
  {
    id: 'legend',
    name: '365-Day Legend',
    blurb: 'You logged an entire year of meals. The Billy Krab survived your appetite.',
    requirement: 'Complete all 365 days',
    icon: '👑',
    test: (s) => s.completedDays >= TOTAL_DAYS,
  },
];

export function computeStats(state: SaveState): Stats {
  const logs = Object.values(state.logs) as DayLog[];
  const completed = logs.filter((l) => l.completed).sort((a, b) => a.day - b.day);
  const completedDays = completed.length;

  // Longest and current run of consecutive completed journey days.
  let best = 0;
  let run = 0;
  let prev = -99;
  for (const l of completed) {
    run = l.day === prev + 1 ? run + 1 : 1;
    best = Math.max(best, run);
    prev = l.day;
  }
  const streak = run;

  const names = new Set<string>();
  let totalFoods = 0;
  let totalDrinks = 0;
  let daysWithNotes = 0;
  for (const l of logs) {
    totalFoods += l.foods.length;
    totalDrinks += l.drinks.length;
    if (l.note.trim()) daysWithNotes += 1;
    for (const f of l.foods) if (f.name.trim()) names.add(f.name.trim().toLowerCase());
  }

  // Rewards are one-way: reopening a day never takes a recipe back.
  const unlockedRecipes = Math.max(unlockedRecipeCount(completedDays), state.unlockedHighWater);
  const continents = new Set(
    recipes.filter((r) => r.unlockOrder <= unlockedRecipes).map((r) => r.continent)
  ).size;
  const empire = empireAt(completedDays);

  return {
    completedDays,
    streak,
    bestStreak: best,
    totalFoods,
    totalDrinks,
    unlockedRecipes,
    continents,
    branches: Math.floor(empire.branches),
    fans: empire.fans,
    daysWithNotes,
    distinctFoodNames: names.size,
  };
}

/** Achievements newly earned since last check, so a refresh can't re-award them. */
export function newlyEarned(state: SaveState, stats: Stats): Achievement[] {
  return ACHIEVEMENTS.filter((a) => !state.achievements[a.id] && a.test(stats));
}
