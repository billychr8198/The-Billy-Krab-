export interface Recipe {
  id: number;
  unlockOrder: number;
  slug: string;
  title: string;
  cuisine: string;
  country: string;
  continent: string;
  region: string;
  coords: [number, number];
  image: string;
  description: string;
  yield: string;
  prep: string;
  cook: string;
  difficulty: 'Deckhand' | 'Line Cook' | 'Head Chef' | 'Kraken';
  ingredientGroups: { group: string; items: string[] }[];
  method: string[];
  cooksNote: string;
}

export interface JourneyLeg {
  order: number;
  cuisine: string;
  continent: string;
  region: string;
  blurb: string;
  coords: [number, number];
  count: number;
  firstUnlock: number;
  lastUnlock: number;
}

export type MealSlot =
  | 'breakfast'
  | 'morningSnack'
  | 'lunch'
  | 'afternoonSnack'
  | 'dinner'
  | 'lateSnack';

export interface FoodEntry {
  id: string;
  slot: MealSlot;
  name: string;
  portion: string;
  category: string;
  notes: string;
}

export interface DrinkEntry {
  id: string;
  name: string;
  quantity: string;
  unit: string;
  notes: string;
}

export interface DayLog {
  /** Journey day number, 1–365. */
  day: number;
  /** Calendar date the day was opened, ISO yyyy-mm-dd. */
  date: string;
  foods: FoodEntry[];
  drinks: DrinkEntry[];
  note: string;
  completed: boolean;
  /** ISO timestamp of the moment the log was signed off. */
  completedAt?: string;
}

export interface EmpireSnapshot {
  day: number;
  customers: number;
  fans: number;
  popularity: number;
  income: number;
  branches: number;
}

export interface SaveState {
  version: number;
  /** Set the first time the user presses "Start day 1". */
  startedOn: string | null;
  onboarded: boolean;
  logs: Record<number, DayLog>;
  achievements: Record<string, string>;
  /**
   * Highest recipe unlock count ever reached. Rewards are one-way: reopening a
   * completed day never takes a recipe back off the shelf.
   */
  unlockedHighWater: number;
  musicOn: boolean;
  lastVisit: string | null;
}
