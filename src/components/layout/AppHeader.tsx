import { FileText, History, LayoutDashboard, LogOut, Minus, Rocket, ShieldAlert, ShieldCheck, Target, TrendingDown, TrendingUp } from 'lucide-react';
import { formatMoney } from '@/lib/format';
import type { AIPrediction } from '@/lib/aiPredictions';
import type { AppView } from '@/types';

const NAV_ITEMS: Array<{ view: AppView; label: string; Icon: typeof Target }> = [
  { view: 'dashboard', label: 'Dashboard', Icon: LayoutDashboard },
  { view: 'goals', label: 'Dreams', Icon: Target },
  { view: 'planner', label: 'Planner', Icon: Rocket },
  { view: 'protect', label: 'Protect', Icon: ShieldCheck },
  { view: 'emergency', label: 'Emergency', Icon: ShieldAlert },
  { view: 'history', label: 'History', Icon: History },
  { view: 'terms', label: 'How it works', Icon: FileText },
];

interface AppHeaderProps {
  view: AppView;
  onChange: (view: AppView) => void;
  email: string;
  initials: string;
  onSignOut: () => void;
  prediction: AIPrediction | null;
}

export function AppHeader({ view, onChange, email, initials, onSignOut, prediction }: AppHeaderProps) {
  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/70 bg-white/85 backdrop-blur-xl">
      <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-700 to-emerald-500 text-white shadow-md shadow-blue-600/20">
            <Rocket className="h-5 w-5" />
          </span>
          <div className="flex flex-col leading-tight">
            <span className="text-lg font-bold tracking-tight text-slate-900">DreamBank AI</span>
            <span className="text-[11px] font-medium text-slate-400">Protect today's money for tomorrow's dreams</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <nav aria-label="Main" className="flex gap-1 overflow-x-auto rounded-2xl bg-slate-100 p-1">
            {NAV_ITEMS.map(({ view: target, label, Icon }) => {
              const active = target === view;
              return (
                <button
                  key={target}
                  type="button"
                  onClick={() => onChange(target)}
                  aria-current={active ? 'page' : undefined}
                  className={`inline-flex shrink-0 items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold transition sm:px-4 ${active ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
                >
                  <Icon className="h-4 w-4" />
                  {label}
                </button>
              );
            })}
          </nav>

          {prediction && <DreamForecastWidget prediction={prediction} />}

          <button
            type="button"
            onClick={() => onChange('profile')}
            aria-current={view === 'profile' ? 'page' : undefined}
            title="Your profile"
            className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-700 to-emerald-500 text-sm font-bold text-white shadow-md shadow-blue-600/20 transition hover:scale-105"
          >
            {initials}
          </button>
          <button
            type="button"
            onClick={onSignOut}
            title={`Sign out ${email}`}
            className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 transition hover:border-rose-200 hover:text-rose-600"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </header>
  );
}

function DreamForecastWidget({ prediction }: { prediction: AIPrediction }) {
  const TrendIcon = prediction.changeDirection === 'up' ? TrendingUp : prediction.changeDirection === 'down' ? TrendingDown : Minus;
  const tone = prediction.changeDirection === 'up' ? 'emerald' : prediction.changeDirection === 'down' ? 'rose' : 'amber';
  const toneClasses = {
    emerald: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    rose: 'border-rose-200 bg-rose-50 text-rose-700',
    amber: 'border-amber-200 bg-amber-50 text-amber-700',
  } as const;
  const trendText = prediction.changeDirection === 'up'
    ? `${prediction.changePercent}% from this month`
    : prediction.changeDirection === 'down'
      ? `${prediction.changePercent}% from this month`
      : 'Stable';

  return (
    <div className={`hidden shrink-0 items-center gap-3 rounded-2xl border px-3.5 py-2 xl:flex ${toneClasses[tone]}`}>
      <Rocket className="h-4 w-4 shrink-0" />
      <div className="leading-tight">
        <p className="text-[10px] font-semibold uppercase tracking-wide opacity-70">Dream Forecast</p>
        <p className="text-sm font-bold">{formatMoney(prediction.safeSavingsNextMonth)}</p>
      </div>
      <div className="flex flex-col items-end leading-tight">
        <p className="text-[10px] font-medium opacity-70">Confidence {prediction.confidenceScore}%</p>
        <p className="flex items-center gap-0.5 text-[11px] font-bold">
          <TrendIcon className="h-3 w-3" />
          {trendText}
        </p>
      </div>
    </div>
  );
}
