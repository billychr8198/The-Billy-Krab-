/**
 * The house voice. Every line here is picked deterministically from the day
 * number, so the same day always says the same thing and the jokes never
 * reshuffle underneath the reader mid-session.
 */

function pick<T>(list: T[], seed: number): T {
  return list[Math.abs(Math.floor(seed)) % list.length];
}

export const DAILY_GREETINGS = [
  'Captain, what entered your stomach today?',
  'The kitchen records show suspicious levels of deliciousness.',
  'Another meal successfully investigated.',
  "Billy Krab's accountants are calculating the economic consequences of that burger.",
  'The chef would like a full account of your morning. In writing.',
  'Nothing leaves this kitchen unlogged. Not even the snack you are pretending did not happen.',
  'Front of house is ready. Back of house is nervous. Standard.',
  'Today the ledger is empty and the sea is patient.',
  'Report to the kitchen. Bring evidence.',
  'The health inspector is not coming. Log it anyway.',
  'Every plate tells a story. Most of them are short.',
  'The dishwasher has requested a status update on your lunch.',
  'Somewhere a fish is very curious about your breakfast.',
  'Business is fine. Business would be better with a log.',
  'The chef has stopped asking why this works. Please continue.',
];

export const COMPLETION_LINES = [
  'BUSINESS REPORT: The Billy Krab is expanding. Nobody knows how, but the accountants approve.',
  "Log filed. Head office has released a statement, and it's mostly exclamation marks.",
  'The books balance. The books have never balanced. Something is happening.',
  'Another day recorded. Another queue forming outside.',
  'Filed, stamped, and slid under the manager’s door.',
  'The kitchen is pleased. The kitchen is rarely pleased.',
  'Numbers went up. The chef is taking full credit.',
  'The accountants have stopped asking questions. They just smile now.',
];

export const MISSED_DAY_LINES = [
  'You missed yesterday? No problem. Even legendary chefs occasionally lose track of time.',
  'A gap in the ledger. The restaurant is still standing. Carry on.',
  'Days get away from people. The kitchen has seen worse and served it anyway.',
  'No log yesterday. No lecture today. Pick it back up whenever.',
];

export const LOCKED_RECIPE_LINE = 'Keep eating. Keep logging. The chef is hiding this recipe.';

export const EMPTY_STATES = {
  foods: 'Nothing on the pass yet. Add the first thing you ate.',
  drinks: 'The glass rack is full and untouched. Add a drink.',
  achievements: 'No plaques on the wall yet. Complete a day and the first one goes up.',
  search: 'No recipe by that name. The chef suggests checking the spelling, then the filters.',
};

export const SLOT_PROMPTS: Record<string, string> = {
  breakfast: 'The first shift of the day.',
  morningSnack: 'The bit between shifts nobody admits to.',
  lunch: 'Peak service.',
  afternoonSnack: 'The three o’clock incident.',
  dinner: 'The main event.',
  lateSnack: 'The kitchen is closed. This never happened.',
};

export const greetingFor = (day: number) => pick(DAILY_GREETINGS, day * 7);
export const completionFor = (day: number) => pick(COMPLETION_LINES, day * 13);
export const missedLineFor = (day: number) => pick(MISSED_DAY_LINES, day * 5);

/** A one-line business bulletin scaled to how big the empire has become. */
export function bulletinFor(branches: number, day: number): string {
  const early = [
    'One branch, one chef, one very loud opinion about salt.',
    'The sign outside is still hand-painted. It is charming, apparently.',
    'Head office is a crate behind the kitchen.',
  ];
  const mid = [
    'A second location opened and immediately started a rivalry with the first.',
    'Regional managers now exist. They have lanyards and everything.',
    'Somebody printed menus. Actual printed menus.',
  ];
  const large = [
    'Franchise applications are arriving faster than they can be ignored.',
    'A rival chain has begun copying the sign. Legal is delighted.',
    'The supply chain now includes a boat.',
  ];
  const huge = [
    'International expansion continues. Nobody has visited most of these branches.',
    'The chef appeared on television and refused to explain the business model.',
    'Analysts have downgraded their understanding of what is happening here.',
  ];
  const pool = branches >= 60 ? huge : branches >= 12 ? large : branches >= 2 ? mid : early;
  return pick(pool, day * 3);
}
