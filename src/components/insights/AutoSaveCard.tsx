import { Bot } from 'lucide-react';
import { formatMoney } from '@/lib/format';
import type { AutoPaySnapshot } from '@/lib/autoPay';
import type { AutoSaveSettings, GoalWithSaved } from '@/types';
import { ForecastModeBadge } from '@/components/ui/ForecastModeBadge';
import { DreamSelect } from '@/components/ui/DreamSelect';

interface AutoSaveCardProps {
  settings: AutoSaveSettings;
  autoPay: AutoPaySnapshot;
  connected: boolean;
  goals: GoalWithSaved[];
  onChange: (next: AutoSaveSettings) => Promise<void> | void;
}

export function AutoSaveCard({ settings, autoPay, connected, goals, onChange }: AutoSaveCardProps) {
  const dreamGoals = goals.filter((goal) => goal.targetAmount - goal.saved > 0);
  const allocationFor = (goalId: string) => autoPay.allocations.find((item) => item.goalId === goalId)?.amount ?? 0;
  const selectedGoals = dreamGoals.filter((goal) => settings.goalIds.includes(goal.id));

  const toggleGoal = (goalId: string) => {
    const goalIds = settings.goalIds.includes(goalId)
      ? settings.goalIds.filter((id) => id !== goalId)
      : [...settings.goalIds, goalId];
    void onChange({ ...settings, goalIds });
  };

  const options = dreamGoals.map((goal) => ({
    id: goal.id,
    label: goal.name,
    hint: settings.goalIds.includes(goal.id) ? `${formatMoney(allocationFor(goal.id))}/mo` : 'Not funded',
  }));

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <header className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700">
            <Bot className="h-5 w-5" />
          </span>
          <div>
            <h3 className="text-base font-semibold text-slate-900">AI AutoPay</h3>
            <p className="text-sm text-slate-500">Choose which dreams AutoPay funds each month.</p>
          </div>
        </div>
        <ForecastModeBadge connected={connected} />
      </header>

      {!connected && (
        <p className="mt-4 rounded-2xl bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Connect PayPal to let AI calculate AutoPay contributions for your dreams.
        </p>
      )}

      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        <div className="rounded-2xl bg-slate-50 p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Available for dreams</p>
          <p className="mt-1 text-xl font-bold text-slate-900">{formatMoney(autoPay.adaptive.amount)}</p>
        </div>
        <div className="rounded-2xl bg-slate-50 p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">AutoPay per month</p>
          <p className="mt-1 text-xl font-bold text-emerald-700">{formatMoney(autoPay.totalMonthly)}</p>
        </div>
        <div className="rounded-2xl bg-slate-50 p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Safety buffer</p>
          <p className="mt-1 text-xl font-bold text-slate-900">{formatMoney(autoPay.adaptive.safetyBuffer)}</p>
        </div>
      </div>

      <div className="mt-6">
        <p className="mb-2 text-sm font-medium text-slate-700">Dreams to fund</p>
        <DreamSelect
          mode="multiple"
          options={options}
          selectedIds={settings.goalIds}
          onToggle={toggleGoal}
          placeholder={dreamGoals.length === 0 ? 'Add a dream folder to start AutoPay' : 'Select dreams'}
        />
      </div>

      {selectedGoals.length > 0 && (
        <ul className="mt-4 divide-y divide-slate-100 rounded-2xl border border-slate-200">
          {selectedGoals.map((goal) => (
            <li key={goal.id} className="flex items-center justify-between gap-4 px-4 py-3">
              <span className="truncate text-sm font-medium text-slate-900">{goal.name}</span>
              <span className="shrink-0 text-sm font-semibold text-emerald-700">{formatMoney(allocationFor(goal.id))}/mo</span>
            </li>
          ))}
        </ul>
      )}

      <p className="mt-4 text-sm text-slate-600">
        {selectedGoals.length === 0
          ? 'Select at least one dream to start AutoPay.'
          : `AutoPay will contribute ${formatMoney(autoPay.totalMonthly)} across ${selectedGoals.length} ${selectedGoals.length === 1 ? 'dream' : 'dreams'} each month.`}
      </p>
    </section>
  );
}
