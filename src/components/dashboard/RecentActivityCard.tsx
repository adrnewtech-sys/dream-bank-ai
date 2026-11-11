import { ArrowRight } from 'lucide-react';
import { formatMoney } from '@/lib/format';
import type { HistoryEntry } from '@/lib/transactionHistory';

interface RecentActivityCardProps {
  entries: HistoryEntry[];
  onViewAll: () => void;
}

export function RecentActivityCard({ entries, onViewAll }: RecentActivityCardProps) {
  return (
    <section className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-base font-semibold text-slate-900">Recent activity</h2>
        <button
          type="button"
          onClick={onViewAll}
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-blue-700 transition hover:text-blue-800"
        >
          View all
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>

      {entries.length === 0 ? (
        <p className="mt-6 text-sm text-slate-500">Your income, expenses, and goal activity will appear here.</p>
      ) : (
        <ul className="mt-5 divide-y divide-slate-100">
          {entries.map((entry) => (
            <li key={entry.id} className="flex items-center justify-between gap-3 py-3 text-sm">
              <span className="min-w-0">
                <span className="block truncate font-medium text-slate-900">{entry.description}</span>
                <span className="block text-xs text-slate-500">
                  {new Date(entry.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </span>
              </span>
              <span className={`shrink-0 font-semibold ${entry.inflow ? 'text-emerald-700' : 'text-slate-900'}`}>
                {entry.inflow ? '+' : '-'}{formatMoney(entry.amount)}
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
