import { useState } from 'react';
import { CreditCard, PenLine } from 'lucide-react';
import { formatDate, formatMoneyExact } from '@/lib/format';
import type { GoalTransaction, GoalWithSaved, PaymentMethod } from '@/types';

const KIND_LABELS: Record<GoalTransaction['kind'], string> = {
  deposit: 'Funded',
  withdrawal: 'Withdrawn',
  emergency: 'Emergency withdrawal',
};

type PaymentFilter = 'all' | PaymentMethod;

const FILTERS: Array<{ value: PaymentFilter; label: string }> = [
  { value: 'all', label: 'All' },
  { value: 'paypal', label: 'PayPal' },
  { value: 'manual', label: 'Manual' },
];

interface TransactionHistoryProps {
  transactions: GoalTransaction[];
  goals: GoalWithSaved[];
}

export function TransactionHistory({ transactions, goals }: TransactionHistoryProps) {
  const [filter, setFilter] = useState<PaymentFilter>('all');
  const goalNames = new Map(goals.map((goal) => [goal.id, goal.name]));
  const visible = filter === 'all' ? transactions : transactions.filter((tx) => tx.paymentMethod === filter);
  const paypalTotal = transactions
    .filter((tx) => tx.paymentMethod === 'paypal' && tx.kind === 'deposit')
    .reduce((sum, tx) => sum + tx.amount, 0);
  const paypalCount = transactions.filter((tx) => tx.paymentMethod === 'paypal').length;

  return (
    <section className="rounded-3xl border border-slate-200/80 bg-white shadow-sm">
      <header className="flex flex-col gap-4 border-b border-slate-100 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Transaction history</h2>
          <p className="mt-1 text-sm text-slate-500">
            {paypalCount > 0
              ? `${paypalCount} PayPal ${paypalCount === 1 ? 'payment' : 'payments'} totalling ${formatMoneyExact(paypalTotal)} across your goals.`
              : 'Every contribution and withdrawal across your goals.'}
          </p>
        </div>
        <div role="tablist" aria-label="Filter by payment method" className="inline-flex rounded-xl bg-slate-100 p-1">
          {FILTERS.map((option) => (
            <button
              key={option.value}
              type="button"
              role="tab"
              aria-selected={filter === option.value}
              onClick={() => setFilter(option.value)}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                filter === option.value ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </header>

      {visible.length === 0 ? (
        <p className="px-6 py-10 text-center text-sm text-slate-500">
          {transactions.length === 0
            ? 'No transactions yet. Fund a goal to see it here.'
            : 'No transactions match this filter.'}
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th scope="col" className="px-6 py-3 font-semibold">Date</th>
                <th scope="col" className="px-6 py-3 font-semibold">Goal</th>
                <th scope="col" className="px-6 py-3 font-semibold">Type</th>
                <th scope="col" className="px-6 py-3 font-semibold">Payment</th>
                <th scope="col" className="px-6 py-3 font-semibold">PayPal order</th>
                <th scope="col" className="px-6 py-3 text-right font-semibold">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {visible.map((tx) => {
                const isPayPal = tx.paymentMethod === 'paypal';
                const isInflow = tx.kind === 'deposit';
                return (
                  <tr key={tx.id} className="transition hover:bg-blue-50/40">
                    <td className="whitespace-nowrap px-6 py-4 text-slate-600">{formatDate(new Date(tx.createdAt))}</td>
                    <td className="px-6 py-4 font-medium text-slate-900">{goalNames.get(tx.goalId) ?? 'Deleted goal'}</td>
                    <td className="px-6 py-4 text-slate-600">{KIND_LABELS[tx.kind]}</td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${
                          isPayPal ? 'bg-blue-50 text-blue-700' : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {isPayPal ? <CreditCard className="h-3.5 w-3.5" /> : <PenLine className="h-3.5 w-3.5" />}
                        {isPayPal ? 'PayPal' : 'Manual'}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-mono text-xs text-slate-500">{tx.paypalOrderId ?? '-'}</td>
                    <td
                      className={`whitespace-nowrap px-6 py-4 text-right font-semibold tabular-nums ${
                        isInflow ? 'text-emerald-700' : 'text-rose-600'
                      }`}
                    >
                      {isInflow ? '+' : '-'}
                      {formatMoneyExact(tx.amount)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
