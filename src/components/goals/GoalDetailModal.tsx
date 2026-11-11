import { useState } from 'react';
import { CreditCard, Pencil, Trash2 } from 'lucide-react';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { Modal } from '@/components/ui/Modal';
import { StatusPill } from '@/components/ui/StatusPill';
import { WarningList } from '@/components/ui/WarningList';
import { FormError, useAsyncAction } from '@/components/ui/formPrimitives';
import type { GoalForecast } from '@/lib/finance';
import { GOAL_COLORS, getGoalIcon } from '@/lib/goalStyles';
import { formatDate, formatMoney, formatMoneyExact, formatPercent } from '@/lib/format';
import type { GoalTransaction, GoalWithSaved } from '@/types';

const KIND_LABELS: Record<GoalTransaction['kind'], string> = {
  deposit: 'Added',
  withdrawal: 'Withdrawn',
  emergency: 'Emergency withdrawal',
};

const METHOD_LABELS: Record<GoalTransaction['paymentMethod'], string> = {
  paypal: 'PayPal',
  manual: 'Manual',
};

interface GoalDetailModalProps {
  goal: GoalWithSaved;
  forecast: GoalForecast | undefined;
  transactions: GoalTransaction[];
  onAddMoney: () => void;
  onEdit: () => void;
  onDelete: () => Promise<void>;
  onClose: () => void;
}

export function GoalDetailModal({ goal, forecast, transactions, onAddMoney, onEdit, onDelete, onClose }: GoalDetailModalProps) {
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const { isBusy, error, run } = useAsyncAction();
  const Icon = getGoalIcon(goal.icon);
  const palette = GOAL_COLORS[goal.color];
  const percent = goal.targetAmount > 0 ? (goal.saved / goal.targetAmount) * 100 : 0;

  return (
    <Modal title={goal.name} description={`Target ${formatMoney(goal.targetAmount)} by ${formatDate(goal.targetDate)}`} onClose={onClose}>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <span className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl ${palette.soft} ${palette.text}`}>
            <Icon className="h-7 w-7" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-2xl font-bold text-slate-900">{formatMoney(goal.saved)}</p>
            <p className="text-sm text-slate-500">of {formatMoney(goal.targetAmount)} target</p>
          </div>
          {forecast && <StatusPill status={forecast.status} />}
        </div>

        <div>
          <div className="mb-2 flex items-center justify-between text-sm">
            <span className="text-slate-500">Progress</span>
            <span className="font-semibold text-slate-900">{formatPercent(percent)}</span>
          </div>
          <ProgressBar percent={percent} color={goal.color} label={`${goal.name} progress`} />
        </div>

        <dl className="grid grid-cols-2 gap-3 text-sm">
          <Stat label="Target" value={formatMoney(goal.targetAmount)} />
          <Stat label="Saved" value={formatMoney(goal.saved)} />
          <Stat label="Remaining" value={formatMoney(Math.max(0, goal.targetAmount - goal.saved))} />
        </dl>

        {forecast && (
          <dl className="grid grid-cols-2 gap-3 text-sm">
            <Stat label="Still to save" value={formatMoney(forecast.remaining)} />
            <Stat label="Needed each month" value={forecast.remaining > 0 ? formatMoney(forecast.requiredMonthly) : 'Done'} />
            <Stat label="On-time chance" value={`${forecast.probability}%`} />
            <Stat label="Projected finish" value={forecast.projectedDate ? formatDate(forecast.projectedDate) : 'Not scheduled'} />
          </dl>
        )}

        {forecast && forecast.plans.length > 0 && (
          <section>
            <h3 className="mb-3 text-sm font-semibold text-slate-900">Savings plans</h3>
            <ul className="space-y-2">
              {forecast.plans.map((plan) => (
                <li key={plan.id} className="flex items-center justify-between rounded-xl border border-slate-200 px-4 py-3 text-sm">
                  <span>
                    <span className="font-semibold text-slate-900">{plan.label}</span>
                    {forecast.recommendedPlanId === plan.id && (
                      <span className="ml-2 text-xs font-semibold text-emerald-700">Recommended</span>
                    )}
                    <span className="block text-xs text-slate-500">about {plan.months} months</span>
                  </span>
                  <span className="font-semibold text-slate-900">{formatMoney(plan.monthly)}/mo</span>
                </li>
              ))}
            </ul>
          </section>
        )}

        {forecast && forecast.remaining > 0 && forecast.plans.length === 0 && (
          <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-800">
            {forecast.warnings.some((warning) => warning.message === 'No safe savings capacity detected.')
              ? 'No safe savings capacity detected.'
              : 'Unable to generate savings plan from current financial data.'}
          </p>
        )}

        {forecast && forecast.warnings.length > 0 && <WarningList warnings={forecast.warnings} />}

        <section>
          <h3 className="mb-3 text-sm font-semibold text-slate-900">Recent activity</h3>
          {transactions.length === 0 ? (
            <p className="text-sm text-slate-500">No money has been added yet.</p>
          ) : (
            <ul className="divide-y divide-slate-100 rounded-xl border border-slate-200">
              {transactions.slice(0, 8).map((tx) => (
                <li key={tx.id} className="flex items-center justify-between gap-3 px-4 py-3 text-sm">
                  <span className="min-w-0">
                    <span className="block font-medium text-slate-800">{KIND_LABELS[tx.kind]}</span>
                    <span className="block truncate text-xs text-slate-500">
                      {formatDate(new Date(tx.createdAt))} · {METHOD_LABELS[tx.paymentMethod]}
                      {tx.note && ` · ${tx.note}`}
                    </span>
                  </span>
                  <span className={`shrink-0 font-semibold tabular-nums ${tx.kind === 'deposit' ? 'text-emerald-700' : 'text-rose-600'}`}>
                    {tx.kind === 'deposit' ? '+' : '-'}
                    {formatMoneyExact(tx.amount)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <FormError message={error} />

        <div className="flex flex-col gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:items-center sm:justify-between">
          <button
            type="button"
            onClick={onAddMoney}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-blue-600/20 transition hover:bg-blue-700"
          >
            <CreditCard className="h-4 w-4" />
            Fund with PayPal
          </button>
          <div className="flex items-center gap-2">
            {confirmingDelete ? (
              <>
                <button
                  type="button"
                  disabled={isBusy}
                  onClick={() => void run(onDelete)}
                  className="rounded-xl bg-rose-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-rose-700 disabled:opacity-60"
                >
                  {isBusy ? 'Deleting...' : 'Confirm delete'}
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmingDelete(false)}
                  className="rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-100"
                >
                  Cancel
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => setConfirmingDelete(true)}
                  className="inline-flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-semibold text-rose-600 transition hover:bg-rose-50"
                >
                  <Trash2 className="h-4 w-4" />
                  Delete
                </button>
                <button
                  type="button"
                  onClick={onEdit}
                  className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-blue-300 hover:text-blue-700"
                >
                  <Pencil className="h-4 w-4" />
                  Edit
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-slate-50 p-3">
      <dt className="text-xs text-slate-500">{label}</dt>
      <dd className="mt-0.5 font-semibold text-slate-900">{value}</dd>
    </div>
  );
}
