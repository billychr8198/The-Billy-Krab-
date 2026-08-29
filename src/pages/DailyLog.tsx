import { useMemo, useState } from 'react';
import { useApp } from '../lib/store';
import { SLOT_PROMPTS, greetingFor } from '../lib/voice';
import { TOTAL_DAYS, daysUntilNextUnlock } from '../lib/empire';
import { dateForDay } from '../lib/storage';
import type { DrinkEntry, FoodEntry, MealSlot } from '../lib/types';

const SLOTS: { key: MealSlot; label: string; time: string }[] = [
  { key: 'breakfast', label: 'Breakfast', time: 'Early' },
  { key: 'morningSnack', label: 'Morning snack', time: 'Mid-morning' },
  { key: 'lunch', label: 'Lunch', time: 'Midday' },
  { key: 'afternoonSnack', label: 'Afternoon snack', time: 'Afternoon' },
  { key: 'dinner', label: 'Dinner', time: 'Evening' },
  { key: 'lateSnack', label: 'Late-night snack', time: 'Late' },
];

const CATEGORIES = [
  '',
  'Grains & starch',
  'Protein',
  'Vegetables',
  'Fruit',
  'Dairy',
  'Fried',
  'Sweet',
  'Soup',
  'Street food',
  'Home cooked',
  'Takeaway',
  'Leftovers',
];

const UNITS = ['ml', 'l', 'glass', 'cup', 'mug', 'bottle', 'can', 'shot'];

function friendlyDate(iso: string) {
  const d = new Date(iso + 'T12:00:00');
  return d.toLocaleDateString(undefined, {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

/* ---------------------------------------------------------------- food row */

function FoodRow({ food, day }: { food: FoodEntry; day: number }) {
  const { updateFood, removeFood } = useApp();
  const [editing, setEditing] = useState(false);

  if (editing) {
    return (
      <li className="rounded-lg border border-surf/40 bg-abyss/60 p-3">
        <div className="grid gap-2 sm:grid-cols-2">
          <input
            className="field"
            value={food.name}
            aria-label="Food name"
            onChange={(e) => updateFood(day, food.id, { name: e.target.value })}
          />
          <input
            className="field"
            value={food.portion}
            placeholder="Portion or quantity"
            aria-label="Portion"
            onChange={(e) => updateFood(day, food.id, { portion: e.target.value })}
          />
          <select
            className="field"
            value={food.category}
            aria-label="Category"
            onChange={(e) => updateFood(day, food.id, { category: e.target.value })}
          >
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c || 'No category'}
              </option>
            ))}
          </select>
          <input
            className="field"
            value={food.notes}
            placeholder="Notes"
            aria-label="Notes"
            onChange={(e) => updateFood(day, food.id, { notes: e.target.value })}
          />
        </div>
        <div className="mt-2 flex justify-end gap-2">
          <button className="btn-ghost btn-sm" onClick={() => setEditing(false)}>
            Done
          </button>
        </div>
      </li>
    );
  }

  return (
    <li className="group flex items-start gap-3 rounded-lg border border-white/8 bg-abyss/40 px-3 py-2">
      <div className="min-w-0 flex-1">
        <p className="truncate font-bold text-parchment">{food.name}</p>
        <p className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-parchment/55">
          {food.portion && <span className="font-ledger">{food.portion}</span>}
          {food.category && <span className="chip">{food.category}</span>}
          {food.notes && <span className="italic">{food.notes}</span>}
        </p>
      </div>
      <div className="flex shrink-0 gap-1">
        <button
          className="btn-ghost btn-sm"
          onClick={() => setEditing(true)}
          aria-label={`Edit ${food.name}`}
        >
          Edit
        </button>
        <button
          className="btn-sm btn rounded-lg text-parchment/50 hover:bg-claw/20 hover:text-claw"
          onClick={() => removeFood(day, food.id)}
          aria-label={`Remove ${food.name}`}
        >
          Remove
        </button>
      </div>
    </li>
  );
}

/* --------------------------------------------------------------- meal slot */

function SlotCard({ slot, day, locked }: { slot: (typeof SLOTS)[number]; day: number; locked: boolean }) {
  const { logFor, addFood } = useApp();
  const log = logFor(day);
  const foods = log.foods.filter((f) => f.slot === slot.key);
  const [name, setName] = useState('');
  const [portion, setPortion] = useState('');
  const [open, setOpen] = useState(false);

  const submit = () => {
    if (!name.trim()) return;
    addFood(day, slot.key, { name: name.trim(), portion: portion.trim(), category: '', notes: '' });
    setName('');
    setPortion('');
  };

  return (
    <section className="board overflow-hidden">
      <header className="flex items-center justify-between gap-3 border-b border-white/8 bg-white/[.03] px-4 py-3">
        <div>
          <h3 className="font-sign text-sm uppercase tracking-tight text-surf">{slot.label}</h3>
          <p className="text-xs text-parchment/45">{SLOT_PROMPTS[slot.key]}</p>
        </div>
        <span className="chip shrink-0">
          {foods.length} {foods.length === 1 ? 'item' : 'items'}
        </span>
      </header>

      <div className="space-y-2 p-3">
        {foods.length > 0 && (
          <ul className="space-y-2">
            {foods.map((f) => (
              <FoodRow key={f.id} food={f} day={day} />
            ))}
          </ul>
        )}

        {locked ? (
          foods.length === 0 && <p className="px-1 py-2 text-xs text-parchment/40">Nothing logged.</p>
        ) : (
          <div className="flex flex-wrap items-center gap-2">
            <input
              className="field flex-1 basis-40"
              placeholder={`What did you have for ${slot.label.toLowerCase()}?`}
              aria-label={`Add food to ${slot.label}`}
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && submit()}
              onFocus={() => setOpen(true)}
            />
            {open && (
              <input
                className="field w-28 shrink-0"
                placeholder="Portion"
                aria-label={`Portion for ${slot.label}`}
                value={portion}
                onChange={(e) => setPortion(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && submit()}
              />
            )}
            <button className="btn-primary btn-sm shrink-0" onClick={submit} disabled={!name.trim()}>
              Add
            </button>
          </div>
        )}
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ drinks */

function DrinkRow({ drink, day }: { drink: DrinkEntry; day: number }) {
  const { updateDrink, removeDrink } = useApp();
  const [editing, setEditing] = useState(false);

  if (editing) {
    return (
      <li className="rounded-lg border border-surf/40 bg-abyss/60 p-3">
        <div className="grid gap-2 sm:grid-cols-2">
          <input
            className="field"
            value={drink.name}
            aria-label="Drink name"
            onChange={(e) => updateDrink(day, drink.id, { name: e.target.value })}
          />
          <div className="flex gap-2">
            <input
              className="field w-20"
              value={drink.quantity}
              aria-label="Quantity"
              onChange={(e) => updateDrink(day, drink.id, { quantity: e.target.value })}
            />
            <select
              className="field flex-1"
              value={drink.unit}
              aria-label="Unit"
              onChange={(e) => updateDrink(day, drink.id, { unit: e.target.value })}
            >
              {UNITS.map((u) => (
                <option key={u}>{u}</option>
              ))}
            </select>
          </div>
          <input
            className="field sm:col-span-2"
            value={drink.notes}
            placeholder="Notes"
            aria-label="Drink notes"
            onChange={(e) => updateDrink(day, drink.id, { notes: e.target.value })}
          />
        </div>
        <div className="mt-2 flex justify-end">
          <button className="btn-ghost btn-sm" onClick={() => setEditing(false)}>
            Done
          </button>
        </div>
      </li>
    );
  }

  return (
    <li className="flex items-center gap-3 rounded-lg border border-white/8 bg-abyss/40 px-3 py-2">
      <span className="text-lg" aria-hidden>
        🫧
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate font-bold text-parchment">{drink.name}</p>
        <p className="text-xs text-parchment/55">
          <span className="font-ledger">
            {drink.quantity} {drink.unit}
          </span>
          {drink.notes && <span className="ml-2 italic">{drink.notes}</span>}
        </p>
      </div>
      <button className="btn-ghost btn-sm" onClick={() => setEditing(true)} aria-label={`Edit ${drink.name}`}>
        Edit
      </button>
      <button
        className="btn btn-sm rounded-lg text-parchment/50 hover:bg-claw/20 hover:text-claw"
        onClick={() => removeDrink(day, drink.id)}
        aria-label={`Remove ${drink.name}`}
      >
        Remove
      </button>
    </li>
  );
}

function DrinksCard({ day, locked }: { day: number; locked: boolean }) {
  const { logFor, addDrink } = useApp();
  const drinks = logFor(day).drinks;
  const [name, setName] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [unit, setUnit] = useState('glass');

  const submit = () => {
    if (!name.trim()) return;
    addDrink(day, { name: name.trim(), quantity: quantity || '1', unit, notes: '' });
    setName('');
    setQuantity('1');
  };

  return (
    <section className="board overflow-hidden">
      <header className="flex items-center justify-between gap-3 border-b border-white/8 bg-white/[.03] px-4 py-3">
        <div>
          <h3 className="font-sign text-sm uppercase tracking-tight text-foam">Drinks</h3>
          <p className="text-xs text-parchment/45">Everything liquid. Yes, that counts too.</p>
        </div>
        <span className="chip shrink-0">
          {drinks.length} {drinks.length === 1 ? 'drink' : 'drinks'}
        </span>
      </header>

      <div className="space-y-2 p-3">
        {drinks.length > 0 && (
          <ul className="space-y-2">
            {drinks.map((d) => (
              <DrinkRow key={d.id} drink={d} day={day} />
            ))}
          </ul>
        )}
        {locked ? (
          drinks.length === 0 && <p className="px-1 py-2 text-xs text-parchment/40">Nothing logged.</p>
        ) : (
          <div className="flex flex-wrap items-center gap-2">
            <input
              className="field flex-1 basis-40"
              placeholder="Water, coffee, es teh, anything"
              aria-label="Drink name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && submit()}
            />
            <input
              className="field w-16 shrink-0"
              inputMode="decimal"
              aria-label="Quantity"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && submit()}
            />
            <select
              className="field w-24 shrink-0"
              aria-label="Unit"
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
            >
              {UNITS.map((u) => (
                <option key={u}>{u}</option>
              ))}
            </select>
            <button className="btn-primary btn-sm shrink-0" onClick={submit} disabled={!name.trim()}>
              Add
            </button>
          </div>
        )}
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------- page */

export default function DailyLog() {
  const { selectedDay, setSelectedDay, today, logFor, completeDay, reopenDay, setNote, stats, state } =
    useApp();

  const day = selectedDay;
  const log = logFor(day);
  const isFuture = day > today;
  const locked = log.completed;
  const canComplete = !locked && !isFuture && (log.foods.length > 0 || log.drinks.length > 0);
  const untilUnlock = daysUntilNextUnlock(stats.completedDays);

  const greeting = useMemo(() => greetingFor(day), [day]);
  const date = dateForDay(state.startedOn, day);

  return (
    <div className="space-y-5">
      {/* Day navigator */}
      <div className="board flex flex-wrap items-center justify-between gap-3 p-3 sm:p-4">
        <div className="flex items-center gap-2">
          <button
            className="btn-ghost btn-sm"
            onClick={() => setSelectedDay(Math.max(1, day - 1))}
            disabled={day <= 1}
            aria-label="Previous day"
          >
            ←
          </button>
          <div className="px-1 text-center">
            <p className="font-sign text-lg leading-none text-brass">Day {day}</p>
            <p className="mt-1 font-ledger text-[11px] text-parchment/50">{friendlyDate(date)}</p>
          </div>
          <button
            className="btn-ghost btn-sm"
            onClick={() => setSelectedDay(Math.min(TOTAL_DAYS, day + 1))}
            disabled={day >= TOTAL_DAYS}
            aria-label="Next day"
          >
            →
          </button>
          {day !== today && (
            <button className="btn-ghost btn-sm" onClick={() => setSelectedDay(today)}>
              Back to today
            </button>
          )}
        </div>

        <p className="max-w-md text-sm italic text-surf/80">“{greeting}”</p>
      </div>

      {isFuture && (
        <div className="board border-brass/30 bg-brass/8 p-4 text-sm">
          <p className="font-bold text-brass">Day {day} hasn’t happened yet.</p>
          <p className="mt-1 text-parchment/65">
            The kitchen refuses to record meals in advance. Come back on {friendlyDate(date)}.
          </p>
        </div>
      )}

      {locked && (
        <div className="board flex flex-wrap items-center justify-between gap-3 border-foam/30 bg-foam/8 p-4">
          <div>
            <p className="font-bold text-foam">Day {day} is signed off.</p>
            <p className="text-sm text-parchment/65">
              The books are closed. Reopen it if you left something out.
            </p>
          </div>
          <button className="btn-ghost btn-sm" onClick={() => reopenDay(day)}>
            Reopen day
          </button>
        </div>
      )}

      {!isFuture && (
        <>
          <div className="grid gap-4 lg:grid-cols-2">
            {SLOTS.map((s) => (
              <SlotCard key={s.key} slot={s} day={day} locked={locked} />
            ))}
          </div>

          <DrinksCard day={day} locked={locked} />

          <section className="board p-4">
            <label htmlFor="day-note" className="eyebrow">
              Notes on the day
            </label>
            <textarea
              id="day-note"
              className="field mt-2 min-h-[80px] resize-y"
              placeholder="How you felt, where you ate, what you'd change. The chef reads these."
              value={log.note}
              disabled={locked}
              onChange={(e) => setNote(day, e.target.value)}
            />
          </section>

          {/* Sign-off */}
          <section className="board-parchment p-4 sm:p-5">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="min-w-[14rem] flex-1">
                <p className="font-sign text-base uppercase tracking-tight text-plank">
                  {locked ? 'Log filed' : "Complete today's log"}
                </p>
                <p className="mt-1 text-sm text-plank/80">
                  {locked
                    ? 'Head office has the paperwork. Nothing more to do here.'
                    : canComplete
                      ? `Signing off grows every indicator by 1%. ${
                          untilUnlock === 1
                            ? 'This one unlocks a recipe.'
                            : `${untilUnlock} more days until the next recipe.`
                        }`
                      : 'Add at least one food or drink before signing off.'}
                </p>
              </div>
              <button
                className="btn-primary px-6 py-3 text-base"
                onClick={() => completeDay(day)}
                disabled={!canComplete}
              >
                {locked ? 'Already filed' : 'Complete day ' + day}
              </button>
            </div>
          </section>
        </>
      )}
    </div>
  );
}
