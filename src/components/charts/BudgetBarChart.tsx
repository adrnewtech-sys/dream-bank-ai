import { formatMoney } from '@/lib/format';

interface BudgetBarChartProps {
  income: number;
  expenses: number;
  safeSavings: number;
}

interface Column {
  label: string;
  value: number;
  bar: string;
}

export function BudgetBarChart({ income, expenses, safeSavings }: BudgetBarChartProps) {
  const buffer = Math.max(0, income - expenses - safeSavings);
  const columns: Column[] = [
    { label: 'Income', value: income, bar: 'bg-gradient-to-t from-blue-600 to-sky-400' },
    { label: 'Expenses', value: expenses, bar: 'bg-gradient-to-t from-slate-500 to-slate-300' },
    { label: 'Safe savings', value: safeSavings, bar: 'bg-gradient-to-t from-emerald-600 to-green-400' },
    { label: 'Buffer', value: buffer, bar: 'bg-gradient-to-t from-sky-500 to-cyan-300' },
  ];
  const max = Math.max(1, ...columns.map((column) => column.value));

  return (
    <div className="flex h-64 items-end justify-between gap-4 sm:gap-8" role="img" aria-label="Monthly cash flow bar chart">
      {columns.map((column) => {
        const height = (column.value / max) * 100;
        return (
          <div key={column.label} className="flex h-full flex-1 flex-col items-center justify-end gap-2">
            <span className="text-xs font-semibold text-slate-700">{formatMoney(column.value)}</span>
            <div className="flex h-full w-full items-end">
              <div
                className={`w-full rounded-t-xl ${column.bar} transition-all duration-700 ease-out`}
                style={{ height: `${Math.max(height, 2)}%` }}
              />
            </div>
            <span className="text-xs font-medium text-slate-500">{column.label}</span>
          </div>
        );
      })}
    </div>
  );
}
