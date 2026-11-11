import { Sparkles } from 'lucide-react';
import { WarningList } from '@/components/ui/WarningList';
import { StatusPill } from '@/components/ui/StatusPill';
import { formatDate, formatMoney, formatPercent } from '@/lib/format';
import type { BudgetAnalysis, GoalForecast, Warning } from '@/lib/finance';

const HEALTH_LABELS: Record<BudgetAnalysis['health'], string> = {
  incomplete: 'Add your numbers',
  deficit: 'Spending exceeds income',
  tight: 'Tight budget',
  steady: 'Steady budget',
  strong: 'Strong budget',
};

const PLAN_CHIP_STYLES: Record<'conservative' | 'balanced' | 'stretch', string> = {
  conservative: 'border-sky-200 bg-sky-50',
  balanced: 'border-emerald-200 bg-emerald-50',
  stretch: 'border-amber-200 bg-amber-50',
};

interface SafeSavingsCardProps {
  analysis: BudgetAnalysis;
  warnings: Warning[];
  focusGoal: GoalForecast | null;
}

export function SafeSavingsCard({ analysis, warnings, focusGoal }: SafeSavingsCardProps) {
  const hasBudget = analysis.health !== 'incomplete';
  const plans = focusGoal?.plans ?? [];

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-sm">
      <div className="bg-gradient-to-br from-blue-700 via-blue-600 to-emerald-500 p-6 text-white">
        <div className="flex items-center justify-between gap-3">
          <span className="inline-flex items-center gap-2 text-sm font-semibold">
            <Sparkles className="h-4 w-4" />
            AI savings guide
          </span>
          <span className="rounded-full bg-white/20 px-3 py-1 text-xs font-semibold">{HEALTH_LABELS[analysis.health]}</span>
        </div>
        <p className="mt-5 text-sm text-white/80">Safe savings rate</p>
        <p className="mt-1 text-4xl font-bold tracking-tight">
          {hasBudget ? formatPercent(analysis.safeRate * 100) : '--'}
          <span className="ml-2 text-base font-medium text-white/80">of income</span>
        </p>
        <p className="mt-3 text-sm text-white/90">
          {hasBudget
            ? `Save about ${formatMoney(analysis.safeMonthlyAmount)} a month. This keeps a 20% cushion of your surplus untouched.`
            : 'Enter your income and expenses to get a safe savings target.'}
        </p>
      </div>

      <div className="flex flex-1 flex-col gap-6 p-6">
        {hasBudget && (
          <div>
            <div className="mb-2 flex justify-between text-xs font-medium text-slate-500">
              <span>Expenses use {formatPercent(analysis.expenseRatio * 100)} of income</span>
              <span>Surplus {formatMoney(analysis.surplus)}</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-slate-100">
              <div
                className={`h-full rounded-full transition-all duration-700 ${analysis.expenseRatio >= 0.9 ? 'bg-rose-500' : 'bg-emerald-500'}`}
                style={{ width: `${Math.min(100, analysis.expenseRatio * 100)}%` }}
              />
            </div>
          </div>
        )}

        {focusGoal && plans.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold text-slate-900">Plans for {focusGoal.name}</h3>
            <ul className="mt-3 space-y-2">
              {plans.map((plan) => (
                <li
                  key={plan.id}
                  className={`flex items-center justify-between gap-3 rounded-2xl border p-3 text-sm ${PLAN_CHIP_STYLES[plan.id]} ${focusGoal.recommendedPlanId === plan.id ? 'ring-2 ring-emerald-500/40' : ''}`}
                >
                  <div>
                    <p className="font-semibold text-slate-900">
                      {plan.label}
                      {focusGoal.recommendedPlanId === plan.id && (
                        <span className="ml-2 text-xs font-semibold text-emerald-700">Recommended</span>
                      )}
                    </p>
                    <p className="text-xs text-slate-500">
                      Done in about {plan.months} {plan.months === 1 ? 'month' : 'months'}
                      {!plan.meetsDeadline && ' (after target date)'}
                    </p>
                  </div>
                  <p className="shrink-0 font-semibold text-slate-900">{formatMoney(plan.monthly)}/mo</p>
                </li>
              ))}
            </ul>
            <p className="mt-2 text-xs text-slate-500">
              Projected completion at the current pace: {focusGoal.projectedDate ? formatDate(focusGoal.projectedDate) : 'not scheduled yet'}.
            </p>
          </div>
        )}

        {focusGoal && focusGoal.remaining > 0 && plans.length === 0 && (
          <p className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-800">
            {analysis.safeMonthlyAmount > 0 ? 'Unable to generate savings plan from current financial data.' : 'No safe savings capacity detected.'}
          </p>
        )}

        <div className="mt-auto space-y-3">
          <WarningList
            warnings={warnings}
            emptyMessage={hasBudget ? 'Your savings plan looks sustainable. Keep it up.' : undefined}
          />
          {focusGoal && <StatusPill status={focusGoal.status} />}
        </div>
      </div>
    </div>
  );
}
