import type { DayLog, SaveState } from './types';
import { TOTAL_DAYS } from './empire';

const KEY = 'billy-krab:save:v1';
const SAVE_VERSION = 1;

export const emptySave = (): SaveState => ({
  version: SAVE_VERSION,
  startedOn: null,
  onboarded: false,
  logs: {},
  achievements: {},
  unlockedHighWater: 0,
  musicOn: false,
  lastVisit: null,
});

export function todayISO(d = new Date()): string {
  const local = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 10);
}

export function addDays(iso: string, n: number): string {
  const d = new Date(iso + 'T12:00:00');
  d.setDate(d.getDate() + n);
  return todayISO(d);
}

export function daysBetween(from: string, to: string): number {
  const a = new Date(from + 'T12:00:00').getTime();
  const b = new Date(to + 'T12:00:00').getTime();
  return Math.round((b - a) / 86400000);
}

/** Journey day number for a calendar date, clamped to the 365-day window. */
export function dayNumberFor(startedOn: string | null, iso = todayISO()): number {
  if (!startedOn) return 1;
  return Math.min(TOTAL_DAYS, Math.max(1, daysBetween(startedOn, iso) + 1));
}

export function dateForDay(startedOn: string | null, day: number): string {
  if (!startedOn) return todayISO();
  return addDays(startedOn, day - 1);
}

export function load(): SaveState {
  if (typeof localStorage === 'undefined') return emptySave();
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return emptySave();
    const parsed = JSON.parse(raw) as Partial<SaveState>;
    return { ...emptySave(), ...parsed, logs: parsed.logs ?? {} };
  } catch {
    // A corrupt save should never take the whole kitchen down.
    return emptySave();
  }
}

let writeTimer: number | undefined;

export function save(state: SaveState): void {
  if (typeof localStorage === 'undefined') return;
  window.clearTimeout(writeTimer);
  writeTimer = window.setTimeout(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(state));
    } catch {
      /* Quota full or private mode. The session still works, it just won't persist. */
    }
  }, 220);
}

export function blankLog(day: number, date: string): DayLog {
  return { day, date, foods: [], drinks: [], note: '', completed: false };
}

export function exportSave(state: SaveState): string {
  return JSON.stringify(state, null, 2);
}

export function importSave(json: string): SaveState | null {
  try {
    const parsed = JSON.parse(json) as Partial<SaveState>;
    if (typeof parsed !== 'object' || parsed === null || !('logs' in parsed)) return null;
    return { ...emptySave(), ...parsed, logs: parsed.logs ?? {} };
  } catch {
    return null;
  }
}

export function clearSave(): void {
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* nothing to clear */
  }
}
