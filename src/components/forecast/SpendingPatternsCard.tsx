import { Activity, Moon, Sun } from 'lucide-react';
import type { SpendingSummary } from '@/lib/spendingIntelligence';
import { formatMoney } from '@/lib/format';

interface SpendingPatternsCardProps {
  spending: SpendingSummary;
}

export function SpendingPatternsCard({ spending }: SpendingPatternsCardProps) {
  const spent = spending.weekdayTotal + spending.weekendTotal;
  const weekendShare = spent > 0 ? (spending.weekendTotal / spent) * 100 : 0;
  const irregularShare = spending.regularTotal + spending.irregularTotal > 0
    ? (spending.irregularTotal / (spending.regularTotal + spending.irregularTotal)) * 100
    : 0;

  return (
    <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm">
      <div className="flex items-center gap-2">
        <Activity className="h-5 w-5 text-blue-600" />
        <h3 className="text-base font-semibold text-slate-900">Spending Intelligence</h3>
      </div>
      <p className="mt-1 text-sm text-slate-500">How your spending splits across the week and between regular and irregular costs.</p>

      <div className="mt-5 grid grid-cols-2 gap-3">
        <div className="rounded-2xl bg-slate-50 p-4">
          <Sun className="h-4 w-4 text-amber-500" />
          <p className="mt-2 text-xs font-medium text-slate-500">Weekdays</p>
          <p className="text-lg font-bold text-slate-900">{formatMoney(spending.weekdayTotal)}</p>
        </div>
        <div className="rounded-2xl bg-slate-50 p-4">
          <Moon className="h-4 w-4 text-slate-500" />
          <p className="mt-2 text-xs font-medium text-slate-500">Weekends</p>
          <p className="text-lg font-bold text-slate-900">{formatMoney(spending.weekendTotal)}</p>
        </div>
      </div>

      <div className="mt-5">
        <div className="mb-2 flex justify-between text-xs font-medium text-slate-500">
          <span>Regular {formatMoney(spending.regularTotal)}</span>
          <span>Irregular {formatMoney(spending.irregularTotal)}</span>
        </div>
        <div className="flex h-3 overflow-hidden rounded-full bg-slate-100">
          <div className="bg-blue-500 transition-all duration-700" style={{ width: `${100 - irregularShare}%` }} />
          <div className="bg-amber-400 transition-all duration-700" style={{ width: `${irregularShare}%` }} />
        </div>
      </div>

      <ul className="mt-5 divide-y divide-slate-100">
        {spending.categories.map((category) => (
          <li key={category.label} className="flex items-center justify-between py-2.5 text-sm">
            <span className="text-slate-600">
              {category.label}
              <span className="ml-2 text-xs text-slate-400">{category.nature === 'regular' ? 'Regular' : 'Irregular'}</span>
            </span>
            <span className="font-semibold text-slate-900">{formatMoney(category.amount)}</span>
          </li>
        ))}
      </ul>

      {spent > 0 && (
        <p className="mt-4 text-xs text-slate-400">{Math.round(weekendShare)}% of this month&apos;s spending happened on weekends.</p>
      )}
    </div>
  );
}
