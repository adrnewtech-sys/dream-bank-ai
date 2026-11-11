import { CalendarDays, Gift } from 'lucide-react';
import type { EventOutlook } from '@/lib/forecastEngine';
import { formatMoney } from '@/lib/format';

interface SeasonalCalendarCardProps {
  events: EventOutlook[];
  readiness: number | null;
}

export function SeasonalCalendarCard({ events, readiness }: SeasonalCalendarCardProps) {
  const visible = events.slice(0, 4);

  return (
    <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <CalendarDays className="h-5 w-5 text-blue-600" />
          <h3 className="text-base font-semibold text-slate-900">Seasonal Expense Calendar</h3>
        </div>
        {readiness !== null && (
          <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700">Festival readiness {readiness}%</span>
        )}
      </div>
      <p className="mt-1 text-sm text-slate-500">Upcoming events and the monthly amount to set aside before each one.</p>

      {visible.length === 0 ? (
        <p className="mt-5 text-sm text-slate-500">No upcoming events in the calendar.</p>
      ) : (
        <ul className="mt-5 space-y-3">
          {visible.map((item) => (
            <li key={item.event.id} className="flex items-center justify-between gap-4 rounded-2xl border border-slate-100 p-4 transition hover:border-blue-200 hover:bg-blue-50/40">
              <div className="flex min-w-0 items-center gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
                  <Gift className="h-4 w-4" />
                </span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-slate-900">{item.event.name}</p>
                  <p className="truncate text-xs text-slate-500">
                    In {item.daysAway} days · {item.event.focus}
                  </p>
                </div>
              </div>
              <div className="shrink-0 text-right">
                <p className="text-sm font-semibold text-slate-900">{formatMoney(item.monthlySetAside)}/mo</p>
                <p className="text-xs text-slate-500">est. {formatMoney(item.estimatedSpend)}</p>
              </div>
            </li>
          ))}
        </ul>
      )}

      <p className="mt-4 text-xs text-slate-400">Event dates are approximate and spending estimates are planning figures.</p>
    </div>
  );
}
