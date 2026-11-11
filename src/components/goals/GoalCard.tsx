import { ArrowUpRight, CalendarDays, CreditCard, Lock } from 'lucide-react';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { StatusPill } from '@/components/ui/StatusPill';
import type { GoalForecast } from '@/lib/finance';
import { GOAL_COLORS, getGoalIcon } from '@/lib/goalStyles';
import { formatDate, formatMoney, formatPercent } from '@/lib/format';
import type { GoalWithSaved } from '@/types';

interface GoalCardProps {
  goal: GoalWithSaved;
  forecast: GoalForecast | undefined;
  onOpen: () => void;
  onAddMoney: () => void;
}

export function GoalCard({ goal, forecast, onOpen, onAddMoney }: GoalCardProps) {
  const Icon = getGoalIcon(goal.icon);
  const palette = GOAL_COLORS[goal.color];
  const percent = goal.targetAmount > 0 ? (goal.saved / goal.targetAmount) * 100 : 0;

  return (
    <article className="group relative flex flex-col overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:border-blue-200 hover:shadow-xl">
      <button
        type="button"
        onClick={onOpen}
        className="flex flex-1 flex-col p-6 text-left"
        aria-label={`Open details for ${goal.name}`}
      >
        <div className="flex items-start justify-between gap-3">
          <span className={`flex h-12 w-12 items-center justify-center rounded-2xl ${palette.soft} ${palette.text}`}>
            <Icon className="h-6 w-6" />
          </span>
          {forecast && <StatusPill status={forecast.status} />}
        </div>

        <h3 className="mt-5 truncate text-lg font-semibold text-slate-900">{goal.name}</h3>
        <p className="mt-1 flex items-center gap-1.5 text-sm text-slate-500">
          <CalendarDays className="h-4 w-4" />
          Target {formatDate(goal.targetDate)}
        </p>
        <p className="mt-0.5 flex items-center gap-1.5 text-xs text-slate-400">
          <Lock className="h-3 w-3" />
          Unlocks {formatDate(goal.targetDate)}
        </p>

        <div className="mt-6">
          <div className="mb-2 flex items-end justify-between">
            <span className="text-2xl font-bold tracking-tight text-slate-900">{formatMoney(goal.saved)}</span>
            <span className="text-sm font-semibold text-slate-500">{formatPercent(percent)}</span>
          </div>
          <ProgressBar percent={percent} color={goal.color} label={`${goal.name} progress`} />
          <p className="mt-2 text-xs text-slate-500">of {formatMoney(goal.targetAmount)}</p>
        </div>

        {forecast && forecast.remaining > 0 && (
          <dl className="mt-5 grid grid-cols-2 gap-3 rounded-2xl bg-slate-50 p-4 text-sm">
            <div>
              <dt className="text-xs text-slate-500">Monthly needed</dt>
              <dd className="font-semibold text-slate-900">{formatMoney(forecast.requiredMonthly)}</dd>
            </div>
            <div>
              <dt className="text-xs text-slate-500">On-time chance</dt>
              <dd className="font-semibold text-slate-900">{forecast.probability}%</dd>
            </div>
          </dl>
        )}
      </button>

      <div className="flex items-center justify-between border-t border-slate-100 px-6 py-3">
        <button
          type="button"
          onClick={onOpen}
          className="inline-flex items-center gap-1 text-sm font-semibold text-slate-600 transition hover:text-blue-700"
        >
          View details
          <ArrowUpRight className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={onAddMoney}
          className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-3.5 py-2 text-sm font-semibold text-white shadow-md shadow-blue-600/20 transition hover:bg-blue-700"
        >
          <CreditCard className="h-4 w-4" />
          Fund with PayPal
        </button>
      </div>
    </article>
  );
}
