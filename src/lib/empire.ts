import type { EmpireSnapshot } from './types';

export const TOTAL_DAYS = 365;
export const TOTAL_RECIPES = 122;

/** One recipe for every three completed days... */
export const DAYS_PER_UNLOCK = 3;
/** ...up to this many. The rest arrive as the day 365 finale. */
export const SCHEDULED_UNLOCKS = 120;
/** Day 365 drops two at once: 120 + 2 = 122. */
export const FINALE_UNLOCKS = 2;

/** The day the last scheduled every-three-days unlock lands. */
export const LAST_SCHEDULED_DAY = SCHEDULED_UNLOCKS * DAYS_PER_UNLOCK; // 360

/** Where the empire stands before a single log is filed. */
export const OPENING_DAY: Omit<EmpireSnapshot, 'day'> = {
  customers: 10,
  fans: 25,
  popularity: 1,
  income: 100,
  branches: 1,
};

/** The sacred one percent. Every completed daily log compounds it. */
export const DAILY_RATE = 0.01;

/** Profit per customer. Unchanged since opening night. Nobody has adjusted for inflation. */
export const PROFIT_PER_CUSTOMER = 10;

/** Share of customers who become regulars and never leave. */
export const FAN_CONVERSION = 0.35;

/**
 * How many recipes are unlocked after `completedDays` completed logs.
 * Guaranteed to land on exactly 122 at day 365 and never exceed it.
 */
export function unlockedRecipeCount(completedDays: number): number {
  const scheduled = Math.min(Math.floor(completedDays / DAYS_PER_UNLOCK), SCHEDULED_UNLOCKS);
  const finale = completedDays >= TOTAL_DAYS ? FINALE_UNLOCKS : 0;
  return Math.min(scheduled + finale, TOTAL_RECIPES);
}

/** Completed days still needed before the next recipe unlocks. 0 when none are left. */
export function daysUntilNextUnlock(completedDays: number): number {
  if (completedDays >= TOTAL_DAYS) return 0;
  if (completedDays >= LAST_SCHEDULED_DAY) return TOTAL_DAYS - completedDays;
  return DAYS_PER_UNLOCK - (completedDays % DAYS_PER_UNLOCK);
}

const cache = new Map<number, EmpireSnapshot>();

/**
 * The books, as of `completedDays` completed logs.
 *
 * Reach compounds at exactly 1% per completed day. Branch count and customers
 * per branch both ride that curve, so the headline figures — customers served
 * and net income — compound against themselves and the chart bends sharply
 * upward in the final months. That is the intended shape.
 */
export function empireAt(completedDays: number): EmpireSnapshot {
  const d = Math.max(0, Math.min(Math.floor(completedDays), TOTAL_DAYS));
  const hit = cache.get(d);
  if (hit) return hit;

  let fans = OPENING_DAY.fans;
  let snapshot: EmpireSnapshot = { day: 0, ...OPENING_DAY };

  for (let k = 0; k <= d; k += 1) {
    const reach = Math.pow(1 + DAILY_RATE, k);
    const branches = Math.pow(reach, 1.5);
    const customers = OPENING_DAY.customers * reach * branches;
    const income = customers * PROFIT_PER_CUSTOMER;
    const popularity = Math.min(99.9, OPENING_DAY.popularity * Math.pow(reach, 1.26));

    // A third of everyone who eats here becomes a regular and never leaves.
    if (k > 0) fans += customers * FAN_CONVERSION;

    snapshot = { day: k, customers, fans, popularity, income, branches };
  }

  cache.set(d, snapshot);
  return snapshot;
}

/** What one more completed day is worth, for the "+N" readouts. */
export function empireDelta(completedDays: number) {
  const before = empireAt(Math.max(0, completedDays - 1));
  const after = empireAt(completedDays);
  return {
    customers: after.customers - before.customers,
    fans: after.fans - before.fans,
    popularity: after.popularity - before.popularity,
    income: after.income - before.income,
    branches: after.branches - before.branches,
  };
}

export function formatCount(n: number): string {
  const v = Math.floor(n);
  if (v >= 1_000_000) return (v / 1_000_000).toFixed(v >= 10_000_000 ? 0 : 2) + 'M';
  if (v >= 10_000) return (v / 1000).toFixed(v >= 100_000 ? 0 : 1) + 'k';
  return v.toLocaleString('en-US');
}

export function formatMoney(n: number): string {
  const v = Math.floor(n);
  if (v >= 1_000_000) return '$' + (v / 1_000_000).toFixed(v >= 10_000_000 ? 1 : 2) + 'M';
  if (v >= 10_000) return '$' + (v / 1000).toFixed(1) + 'k';
  return '$' + v.toLocaleString('en-US');
}

/** Small daily gains matter early on, so don't floor them into nothing. */
export function formatDelta(n: number, kind: 'count' | 'money' | 'percent' = 'count'): string {
  if (kind === 'percent') return n.toFixed(2) + ' pts';
  const prefix = kind === 'money' ? '$' : '';
  if (n < 10) return prefix + n.toFixed(n < 1 ? 2 : 1);
  return kind === 'money' ? formatMoney(n) : formatCount(n);
}

export function formatPercent(n: number): string {
  return (n < 10 ? n.toFixed(2) : n.toFixed(1)) + '%';
}
