import { Sparkles } from 'lucide-react';
import { formatMoney } from '@/lib/format';
import type { DreamBudget } from '@/lib/dreamBudget';

interface DreamBudgetCardProps {
  dream: DreamBudget | null;
}

export function DreamBudgetCard({ dream }: DreamBudgetCardProps) {
  if (!dream) {
    return (
      <section className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm">
        <h2 className="text-base font-semibold text-slate-900">Dream budget for next month</h2>
        <p className="mt-3 text-sm text-slate-500">Add your monthly income and expenses to see your forecast.</p>
      </section>
    );
  }

  return (
    <section className="rounded-3xl border border-blue-100 bg-gradient-to-br from-blue-50 via-white to-emerald-50 p-6 shadow-sm">
      <span className="inline-flex items-center gap-2 text-sm font-semibold text-blue-700">
        <Sparkles className="h-4 w-4" />
        Dream budget
      </span>
      <h2 className="mt-2 text-base font-semibold text-slate-900">Dream budget for next month</h2>
      <p className="mt-1 text-xs text-slate-500">Forecast weighted toward your most recent months. AutoPay uses this safe amount.</p>

      <div className="mt-5 grid grid-cols-3 gap-3">
        <div className="rounded-2xl bg-white/80 p-3">
          <p className="text-xs font-medium text-slate-500">Predicted income</p>
          <p className="mt-1 text-sm font-bold text-slate-900">{formatMoney(dream.predictedIncome)}</p>
        </div>
        <div className="rounded-2xl bg-white/80 p-3">
          <p className="text-xs font-medium text-slate-500">Predicted expenses</p>
          <p className="mt-1 text-sm font-bold text-slate-900">{formatMoney(dream.predictedExpenses)}</p>
        </div>
        <div className="rounded-2xl bg-white/80 p-3">
          <p className="text-xs font-medium text-slate-500">Safe savings</p>
          <p className="mt-1 text-sm font-bold text-emerald-700">{formatMoney(dream.safeSavings)}</p>
        </div>
      </div>

      <div className="mt-5">
        {dream.goals.length > 0 ? (
          <ul className="space-y-2">
            {dream.goals.map((goal) => (
              <li key={goal.goalId} className="flex items-center justify-between rounded-xl bg-white/80 px-4 py-2.5 text-sm">
                <span className="font-medium text-slate-700">{goal.name}</span>
                <span className="font-semibold text-slate-900">{formatMoney(goal.amount)}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-slate-500">Create a goal to see where next month's savings will go.</p>
        )}
      </div>
    </section>
  );
}
