import { Lightbulb, Sparkles } from 'lucide-react';
import { SeasonalCalendarCard } from '@/components/forecast/SeasonalCalendarCard';
import { SpendingPatternsCard } from '@/components/forecast/SpendingPatternsCard';
import { formatMoney } from '@/lib/format';
import { ASSUMED_ANNUAL_INFLATION, type ForecastCenterData } from '@/lib/forecastEngine';

interface ForecastCenterProps {
  data: ForecastCenterData;
}

export function ForecastCenter({ data }: ForecastCenterProps) {
  if (!data.hasData) {
    return (
      <section className="rounded-3xl border border-dashed border-slate-300 bg-white p-8 text-center">
        <Sparkles className="mx-auto h-6 w-6 text-blue-600" />
        <h2 className="mt-3 text-base font-semibold text-slate-900">Financial Forecast Center</h2>
        <p className="mt-1 text-sm text-slate-500">Connect your PayPal account or set up your budget to see your forecast.</p>
      </section>
    );
  }

  const { formula, insights, upcomingEvents, festivalReadiness, spending } = data;
  const rows = [
    { label: 'Income', value: formula.income, sign: '+', tone: 'text-emerald-700' },
    { label: 'Regular expenses', value: formula.regularExpenses, sign: '-', tone: 'text-slate-700' },
    { label: 'Predicted seasonal expenses', value: formula.seasonalExpenses, sign: '-', tone: 'text-slate-700' },
    { label: `Inflation impact (${Math.round(ASSUMED_ANNUAL_INFLATION * 100)}% assumed)`, value: formula.inflationImpact, sign: '-', tone: 'text-slate-700' },
    { label: 'Irregular spending allowance', value: formula.irregularAllowance, sign: '-', tone: 'text-slate-700' },
  ];

  return (
    <div className="space-y-6">
      <section className="grid gap-6 lg:grid-cols-5">
        <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm lg:col-span-3">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-blue-600" />
            <h2 className="text-base font-semibold text-slate-900">Financial Forecast Center</h2>
          </div>
          <p className="mt-1 text-sm text-slate-500">Recalculated every day from your habits, seasonal events and inflation.</p>

          <dl className="mt-5 divide-y divide-slate-100">
            {rows.map((row) => (
              <div key={row.label} className="flex items-center justify-between py-3 text-sm">
                <dt className="text-slate-600">{row.label}</dt>
                <dd className={`font-semibold ${row.tone}`}>
                  {row.sign} {formatMoney(row.value)}
                </dd>
              </div>
            ))}
          </dl>

          <div className="mt-2 flex items-center justify-between rounded-2xl bg-emerald-50 px-4 py-4">
            <span className="text-sm font-semibold text-emerald-900">Predicted savings this month</span>
            <span className="text-xl font-bold tracking-tight text-emerald-800">{formatMoney(formula.predictedSavings)}</span>
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm lg:col-span-2">
          <div className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-amber-500" />
            <h3 className="text-base font-semibold text-slate-900">What DreamBank AI sees</h3>
          </div>
          <ul className="mt-5 space-y-4">
            {insights.map((insight) => (
              <li key={insight} className="text-sm leading-6 text-slate-600">{insight}</li>
            ))}
          </ul>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <SeasonalCalendarCard events={upcomingEvents} readiness={festivalReadiness} />
        <SpendingPatternsCard spending={spending} />
      </section>
    </div>
  );
}
