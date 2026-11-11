import { useState, type FormEvent } from 'react';
import { ShieldAlert } from 'lucide-react';
import { FormError, inputClassName, labelClassName, SubmitButton, useAsyncAction } from '@/components/ui/formPrimitives';
import { DreamSelect } from '@/components/ui/DreamSelect';
import { WarningList } from '@/components/ui/WarningList';
import { GOAL_COLORS, getGoalIcon } from '@/lib/goalStyles';
import { formatMoney, formatMoneyExact } from '@/lib/format';
import type { PiggyBankState } from '@/hooks/usePiggyBank';
import type { Warning } from '@/lib/finance';

const REASONS = ['Medical bill', 'Job loss or income gap', 'Urgent repair', 'Family emergency', 'Other'];

interface EmergencyViewProps {
  state: PiggyBankState;
}

export function EmergencyView({ state }: EmergencyViewProps) {
  const { goals, portfolio } = state;
  const withdrawable = goals.filter((goal) => goal.saved > 0);
  const [goalId, setGoalId] = useState(withdrawable[0]?.id ?? '');
  const [amountText, setAmountText] = useState('');
  const [reason, setReason] = useState(REASONS[0]);
  const [confirmed, setConfirmed] = useState(false);
  const [validation, setValidation] = useState<string | null>(null);
  const { isBusy, error, run } = useAsyncAction();

  const selected = withdrawable.find((goal) => goal.id === goalId) ?? withdrawable[0] ?? null;

  if (!selected) {
    return (
      <div className="mx-auto max-w-xl rounded-3xl border border-dashed border-slate-300 bg-white p-10 text-center">
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-50 text-rose-600">
          <ShieldAlert className="h-7 w-7" />
        </span>
        <h1 className="mt-5 text-xl font-bold text-slate-900">Nothing to withdraw yet</h1>
        <p className="mt-2 text-sm text-slate-500">Emergency withdrawals come from goals that already have savings. Add money to a goal first.</p>
      </div>
    );
  }

  const amount = Number(amountText);
  const isValidAmount = amountText.trim() !== '' && !Number.isNaN(amount) && amount > 0;
  const forecast = portfolio.goals.find((item) => item.goalId === selected.id);
  const newSaved = selected.saved - (isValidAmount ? amount : 0);
  const newRemaining = Math.max(0, selected.targetAmount - newSaved);
  const wholeMonths = Math.ceil(forecast?.monthsLeft ?? 0);
  const newMonthly = wholeMonths > 0 ? newRemaining / wholeMonths : newRemaining;

  const warnings: Warning[] = [];
  if (isValidAmount && amount > selected.saved * 0.5) {
    warnings.push({ level: 'warning', message: 'This takes more than half of the goal. Make sure you can rebuild it.' });
  }
  if (isValidAmount && wholeMonths > 0 && portfolio.analysis.safeMonthlyAmount > 0 && newMonthly > portfolio.analysis.safeMonthlyAmount) {
    warnings.push({
      level: 'danger',
      message: `To get back on schedule you would need ${formatMoney(newMonthly)} a month, above your safe budget.`,
    });
  }

  const Icon = getGoalIcon(selected.icon);

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (!isValidAmount) {
      setValidation('Enter an amount greater than zero.');
      return;
    }
    if (amount > selected.saved) {
      setValidation(`This goal only has ${formatMoneyExact(selected.saved)} saved.`);
      return;
    }
    if (!confirmed) {
      setValidation('Confirm that you understand this reduces your goal progress.');
      return;
    }
    setValidation(null);
    void run(
      () => state.addTransaction(selected.id, 'emergency', amount, `Emergency: ${reason}`, 'manual'),
      () => {
        setAmountText('');
        setConfirmed(false);
      },
    );
  };

  return (
    <div className="grid gap-6 lg:grid-cols-5">
      <section className="space-y-6 lg:col-span-3">
        <div>
          <p className="text-sm font-medium text-rose-600">Emergency mode</p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">Withdraw from a goal</h1>
          <p className="mt-2 text-sm text-slate-500">
            Use this only for real emergencies. Every withdrawal is logged in the goal's activity so you can track it.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm">
          <div>
            <span className={labelClassName}>Choose a goal</span>
            <DreamSelect
              mode="single"
              options={withdrawable.map((goal) => ({ id: goal.id, label: goal.name, hint: `${formatMoney(goal.saved)} saved` }))}
              selectedIds={[selected.id]}
              onToggle={setGoalId}
              placeholder="Choose a goal"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="emergency-amount" className={labelClassName}>Amount to withdraw</label>
              <div className="relative">
                <span className="pointer-events-none absolute inset-y-0 left-4 flex items-center text-slate-400">$</span>
                <input
                  id="emergency-amount"
                  type="number"
                  min="0"
                  step="0.01"
                  max={selected.saved}
                  inputMode="decimal"
                  value={amountText}
                  onChange={(event) => setAmountText(event.target.value)}
                  placeholder="250"
                  className={`${inputClassName} pl-8`}
                />
              </div>
              <button
                type="button"
                onClick={() => setAmountText(String(selected.saved))}
                className="mt-2 text-xs font-semibold text-blue-600 hover:text-blue-800"
              >
                Withdraw all {formatMoney(selected.saved)}
              </button>
            </div>
            <div>
              <label htmlFor="emergency-reason" className={labelClassName}>Reason</label>
              <select id="emergency-reason" value={reason} onChange={(event) => setReason(event.target.value)} className={inputClassName}>
                {REASONS.map((option) => (
                  <option key={option}>{option}</option>
                ))}
              </select>
            </div>
          </div>

          <label className="flex items-start gap-3 rounded-xl bg-slate-50 p-4 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={confirmed}
              onChange={(event) => setConfirmed(event.target.checked)}
              className="mt-0.5 h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
            />
            I understand this lowers my progress toward this goal.
          </label>

          <FormError message={validation ?? error} />
          <SubmitButton isBusy={isBusy} label="Record emergency withdrawal" busyLabel="Recording..." />
        </form>
      </section>

      <aside className="space-y-6 lg:col-span-2">
        <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <span className={`flex h-10 w-10 items-center justify-center rounded-xl ${GOAL_COLORS[selected.color].soft} ${GOAL_COLORS[selected.color].text}`}>
              <Icon className="h-5 w-5" />
            </span>
            <div>
              <p className="font-semibold text-slate-900">{selected.name}</p>
              <p className="text-xs text-slate-500">Currently {formatMoney(selected.saved)} saved</p>
            </div>
          </div>
          {isValidAmount ? (
            <dl className="mt-5 space-y-3 text-sm">
              <div className="flex justify-between"><dt className="text-slate-500">Saved after withdrawal</dt><dd className="font-semibold text-slate-900">{formatMoneyExact(newSaved)}</dd></div>
              <div className="flex justify-between"><dt className="text-slate-500">Still to save</dt><dd className="font-semibold text-slate-900">{formatMoney(newRemaining)}</dd></div>
              <div className="flex justify-between"><dt className="text-slate-500">New monthly target</dt><dd className="font-semibold text-slate-900">{formatMoney(newMonthly)}</dd></div>
            </dl>
          ) : (
            <p className="mt-5 text-sm text-slate-500">Enter an amount to see how it changes this goal.</p>
          )}
        </div>
        {warnings.length > 0 && <WarningList warnings={warnings} />}
      </aside>
    </div>
  );
}
