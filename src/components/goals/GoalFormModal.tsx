import { useState, type FormEvent } from 'react';
import { FormError, inputClassName, labelClassName, SubmitButton, useAsyncAction } from '@/components/ui/formPrimitives';
import { Modal } from '@/components/ui/Modal';
import { GOAL_COLOR_KEYS, GOAL_COLORS, GOAL_ICONS } from '@/lib/goalStyles';
import { toDateInputValue } from '@/lib/format';
import type { GoalInput } from '@/lib/piggyBankApi';
import type { DreamType, Goal } from '@/types';

const DREAM_TYPE_OPTIONS: { value: DreamType; label: string }[] = [
  { value: 'car', label: 'Car' },
  { value: 'bike', label: 'Bike' },
  { value: 'travel', label: 'Travel' },
  { value: 'other', label: 'Other' },
];

function defaultTargetDate(): string {
  const date = new Date();
  date.setFullYear(date.getFullYear() + 1);
  return toDateInputValue(date);
}

interface GoalFormModalProps {
  initial: Goal | null;
  onSave: (input: GoalInput) => Promise<void>;
  onClose: () => void;
}

export function GoalFormModal({ initial, onSave, onClose }: GoalFormModalProps) {
  const [name, setName] = useState(initial?.name ?? '');
  const [icon, setIcon] = useState(initial?.icon ?? 'target');
  const [color, setColor] = useState(initial?.color ?? 'blue');
  const [dreamType, setDreamType] = useState<DreamType>(initial?.dreamType ?? 'other');
  const [targetAmount, setTargetAmount] = useState(initial ? String(initial.targetAmount) : '');
  const [targetDate, setTargetDate] = useState(initial?.targetDate ?? defaultTargetDate());
  const [validation, setValidation] = useState<string | null>(null);
  const { isBusy, error, run } = useAsyncAction();
  const today = toDateInputValue(new Date());

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    const amount = Number(targetAmount);
    if (name.trim().length === 0) {
      setValidation('Give your goal a name.');
      return;
    }
    if (Number.isNaN(amount) || amount <= 0) {
      setValidation('Enter a target amount greater than zero.');
      return;
    }
    if (!targetDate) {
      setValidation('Choose a target date.');
      return;
    }
    if (!initial && targetDate < today) {
      setValidation('The target date needs to be in the future.');
      return;
    }
    setValidation(null);
    void run(
      () => onSave({ name: name.trim(), icon, dreamType, color, targetAmount: amount, targetDate }),
      onClose,
    );
  };

  return (
    <Modal
      title={initial ? 'Edit goal folder' : 'New goal folder'}
      description="Name the goal, pick a look, then set how much and by when."
      onClose={onClose}
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label htmlFor="goal-name" className={labelClassName}>Goal name</label>
          <input
            id="goal-name"
            type="text"
            maxLength={80}
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Emergency fund, Japan trip, New laptop"
            className={inputClassName}
          />
        </div>

        <div>
          <span className={labelClassName}>Dream type</span>
          <div className="grid grid-cols-4 gap-2">
            {DREAM_TYPE_OPTIONS.map(({ value, label }) => (
              <button
                key={value}
                type="button"
                aria-pressed={dreamType === value}
                onClick={() => setDreamType(value)}
                className={`rounded-xl border px-3 py-2 text-sm font-semibold transition ${
                  dreamType === value
                    ? 'border-blue-500 bg-blue-50 text-blue-700 ring-4 ring-blue-500/15'
                    : 'border-slate-200 text-slate-500 hover:border-blue-300 hover:text-blue-600'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
          <p className="mt-2 text-xs text-slate-500">Dream Planner uses this to match real car, bike, or travel options.</p>
        </div>

        <div>
          <span className={labelClassName}>Icon</span>
          <div className="grid grid-cols-5 gap-2">
            {Object.entries(GOAL_ICONS).map(([key, { label, Icon }]) => (
              <button
                key={key}
                type="button"
                aria-label={label}
                aria-pressed={icon === key}
                onClick={() => setIcon(key)}
                className={`flex aspect-square items-center justify-center rounded-xl border transition ${
                  icon === key
                    ? 'border-blue-500 bg-blue-50 text-blue-700 ring-4 ring-blue-500/15'
                    : 'border-slate-200 text-slate-500 hover:border-blue-300 hover:text-blue-600'
                }`}
              >
                <Icon className="h-5 w-5" />
              </button>
            ))}
          </div>
        </div>

        <div>
          <span className={labelClassName}>Color</span>
          <div className="flex flex-wrap gap-3">
            {GOAL_COLOR_KEYS.map((key) => (
              <button
                key={key}
                type="button"
                aria-label={GOAL_COLORS[key].label}
                aria-pressed={color === key}
                onClick={() => setColor(key)}
                className={`h-9 w-9 rounded-full ${GOAL_COLORS[key].swatch} transition ${
                  color === key ? 'ring-4 ring-offset-2 ring-slate-300 scale-110' : 'hover:scale-105'
                }`}
              />
            ))}
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="goal-target" className={labelClassName}>Target amount</label>
            <div className="relative">
              <span className="pointer-events-none absolute inset-y-0 left-4 flex items-center text-slate-400">$</span>
              <input
                id="goal-target"
                type="number"
                min="1"
                step="0.01"
                inputMode="decimal"
                value={targetAmount}
                onChange={(event) => setTargetAmount(event.target.value)}
                placeholder="10,000"
                className={`${inputClassName} pl-8`}
              />
            </div>
          </div>
          <div>
            <label htmlFor="goal-date" className={labelClassName}>Target date</label>
            <input
              id="goal-date"
              type="date"
              min={initial ? undefined : today}
              value={targetDate}
              onChange={(event) => setTargetDate(event.target.value)}
              className={inputClassName}
            />
          </div>
        </div>

        <FormError message={validation ?? error} />
        <SubmitButton isBusy={isBusy} label={initial ? 'Save changes' : 'Create goal'} busyLabel="Saving..." />
      </form>
    </Modal>
  );
}
