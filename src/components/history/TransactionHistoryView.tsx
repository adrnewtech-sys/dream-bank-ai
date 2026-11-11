import { useMemo, useState } from 'react';
import { formatMoney } from '@/lib/format';
import { ForecastModeBadge } from '@/components/ui/ForecastModeBadge';
import { buildTransactionHistory, filterHistory, HISTORY_CATEGORY_LABELS, type HistoryFilter } from '@/lib/transactionHistory';
import type { PiggyBankState } from '@/hooks/usePiggyBank';

const FILTERS: Array<{ value: HistoryFilter; label: string }> = [
  { value: 'all', label: 'All' },
  { value: 'income', label: 'Income' },
  { value: 'expense', label: 'Expenses' },
  { value: 'goal_deposit', label: 'Goal deposits' },
  { value: 'goal_withdrawal', label: 'Goal withdrawals' },
  { value: 'paypal', label: 'PayPal' },
];

interface TransactionHistoryViewProps {
  state: PiggyBankState;
}

export function TransactionHistoryView({ state }: TransactionHistoryViewProps) {
  const [filter, setFilter] = useState<HistoryFilter>('all');
  const { goals, transactions, incomeHistory } = state;
  const entries = useMemo(
    () => buildTransactionHistory(goals, transactions, incomeHistory),
    [goals, transactions, incomeHistory],
  );
  const visible = filterHistory(entries, filter);

  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium text-blue-600">Transaction history</p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">Everything that moved your money</h1>
          <ForecastModeBadge connected={state.paypal.connected} className="mt-3" />
        </div>
      </section>

      <div role="tablist" aria-label="Filter transactions" className="flex gap-2 overflow-x-auto pb-1">
        {FILTERS.map(({ value, label }) => {
          const active = value === filter;
          return (
            <button
              key={value}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => setFilter(value)}
              className={`shrink-0 rounded-xl px-4 py-2 text-sm font-semibold transition ${active ? 'bg-slate-900 text-white shadow-sm' : 'border border-slate-200 bg-white text-slate-600 hover:border-blue-300 hover:text-blue-700'}`}
            >
              {label}
            </button>
          );
        })}
      </div>

      <div className="overflow-x-auto rounded-3xl border border-slate-200/80 bg-white shadow-sm">
        <table className="w-full min-w-[680px] text-left text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
            <tr>
              <th scope="col" className="px-5 py-3">Date</th>
              <th scope="col" className="px-5 py-3">Description</th>
              <th scope="col" className="px-5 py-3">Type</th>
              <th scope="col" className="px-5 py-3">Status</th>
              <th scope="col" className="px-5 py-3 text-right">Amount</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {visible.map((entry) => (
              <tr key={entry.id} className="transition hover:bg-slate-50/70">
                <td className="whitespace-nowrap px-5 py-4 text-slate-600">
                  {new Date(entry.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </td>
                <td className="px-5 py-4 font-medium text-slate-900">
                  {entry.description}
                  {entry.viaPayPal && <span className="ml-2 rounded-md bg-blue-50 px-2 py-0.5 text-xs font-semibold text-blue-700">PayPal</span>}
                </td>
                <td className="px-5 py-4 text-slate-600">{HISTORY_CATEGORY_LABELS[entry.category]}</td>
                <td className="px-5 py-4">
                  <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">{entry.status}</span>
                </td>
                <td className={`px-5 py-4 text-right font-semibold ${entry.inflow ? 'text-emerald-700' : 'text-slate-900'}`}>
                  {entry.inflow ? '+' : '-'}{formatMoney(entry.amount)}
                </td>
              </tr>
            ))}
            {visible.length === 0 && (
              <tr>
                <td colSpan={5} className="px-5 py-12 text-center text-sm text-slate-500">
                  No transactions in this category yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
