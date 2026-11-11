import { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, Bike, Calendar, CheckCircle2, Car, CircleDot, Clock, Loader2, Plane, Rocket, Sparkles, Target, TrendingUp } from 'lucide-react';
import { computeDreamPlan, type DreamOption, type DreamPlan, type DreamStatus, type OptionBucket } from '@/lib/dreamPlanner';
import { fetchMarketCatalog, type MarketCatalog } from '@/lib/marketCatalog';
import { formatMoney } from '@/lib/format';
import { ForecastModeBadge } from '@/components/ui/ForecastModeBadge';
import type { PiggyBankState } from '@/hooks/usePiggyBank';
import type { DreamType } from '@/types';

interface DreamPlannerViewProps {
  state: PiggyBankState;
}

const SHORT_DATE = { month: 'short', year: 'numeric' } as const;

const DREAM_TYPE_META: Record<DreamType, { label: string; Icon: typeof Car }> = {
  car: { label: 'Car', Icon: Car },
  bike: { label: 'Bike and scooter', Icon: Bike },
  travel: { label: 'Travel', Icon: Plane },
  other: { label: 'Other', Icon: Target },
};

const BUCKET_META: Record<OptionBucket, { title: string; description: string; tone: string }> = {
  affordable_now: {
    title: 'Ready Now',
    description: 'Your saved money already covers these.',
    tone: 'text-emerald-700',
  },
  affordable_by_target: {
    title: 'Within Your Target Date',
    description: 'Your projected savings reach these before your target date.',
    tone: 'text-blue-700',
  },
  stretch: {
    title: 'Future Possibilities',
    description: 'Great next steps as your savings keep growing.',
    tone: 'text-amber-700',
  },
};

type StatusKey = DreamStatus | 'pending';

const STATUS_META: Record<StatusKey, { label: string; text: string; dot: string; accent?: 'emerald' | 'amber'; Icon: typeof CheckCircle2 }> = {
  on_track: { label: 'On Track', text: 'text-emerald-700', dot: 'bg-emerald-500', accent: 'emerald', Icon: CheckCircle2 },
  building_momentum: { label: 'Building Momentum', text: 'text-amber-700', dot: 'bg-amber-500', accent: 'amber', Icon: CircleDot },
  at_risk: { label: 'At Risk', text: 'text-rose-700', dot: 'bg-rose-500', accent: 'amber', Icon: AlertTriangle },
  pending: { label: 'Forecast Pending', text: 'text-slate-500', dot: 'bg-slate-300', Icon: Clock },
};

const HEADLINE_BY_STATUS: Record<StatusKey, string> = {
  on_track: 'You are on track. Keep going!',
  building_momentum: "You're Making Progress",
  at_risk: 'Keep Going, Your Savings Are Growing',
  pending: 'Building Towards This Dream',
};

function savingsRateLabel(rate: number | null): string {
  if (rate === null) return 'Connect transaction history to receive forecast';
  if (rate <= 0) return 'Forecast Pending';
  return `${formatMoney(rate)}/mo`;
}

export function DreamPlannerView({ state }: DreamPlannerViewProps) {
  const { goals, portfolio, budget, incomeHistory, paypal, transactions } = state;
  const [catalog, setCatalog] = useState<MarketCatalog | null>(null);
  const [catalogError, setCatalogError] = useState<string | null>(null);
  const [selectedGoalId, setSelectedGoalId] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    fetchMarketCatalog()
      .then((data) => {
        if (active) setCatalog(data);
      })
      .catch(() => {
        if (active) setCatalogError('Market prices could not be loaded. Refresh the page to try again.');
      });
    return () => {
      active = false;
    };
  }, []);

  const selectedGoal = goals.find((goal) => goal.id === selectedGoalId) ?? goals[0] ?? null;

  const plan = useMemo<DreamPlan | null>(() => {
    if (!selectedGoal || !catalog) return null;
    const forecast = portfolio.goals.find((f) => f.goalId === selectedGoal.id);
    return computeDreamPlan({
      goal: selectedGoal,
      allGoals: goals,
      forecast,
      transactions,
      budget,
      incomeHistory,
      paypal,
      catalog,
    });
  }, [selectedGoal, goals, catalog, portfolio.goals, transactions, budget, incomeHistory, paypal]);

  if (goals.length === 0) {
    return (
      <div className="flex flex-col items-center rounded-3xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
        <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
          <Rocket className="h-7 w-7" />
        </span>
        <h2 className="mt-5 text-lg font-semibold text-slate-900">Your first dream is one step away</h2>
        <p className="mt-2 max-w-sm text-sm text-slate-500">
          Create a dream on the Dreams page, choose Car, Bike or Travel, and DreamBank AI will map out how to get there.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <section className="space-y-2">
        <p className="inline-flex items-center gap-2 text-sm font-medium text-blue-600">
          <Rocket className="h-4 w-4" />
          Dream Planner
        </p>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">Your path to every dream, step by step</h1>
        <ForecastModeBadge connected={state.paypal.connected} className="mt-3" />
        <p className="max-w-xl text-sm leading-6 text-slate-500">
          DreamBank AI learns from your real income and spending to predict how much you can save each month and when each dream is within reach.
        </p>
      </section>

      <div role="tablist" aria-label="Choose a dream" className="flex gap-2 overflow-x-auto pb-1">
        {goals.map((goal) => {
          const active = selectedGoal?.id === goal.id;
          const { Icon } = DREAM_TYPE_META[goal.dreamType];
          return (
            <button
              key={goal.id}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => setSelectedGoalId(goal.id)}
              className={`flex shrink-0 items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition ${
                active
                  ? 'border-blue-600 bg-blue-600 text-white shadow-sm'
                  : 'border-slate-200 bg-white text-slate-600 hover:border-blue-300 hover:text-blue-700'
              }`}
            >
              <Icon className="h-4 w-4" />
              {goal.name}
            </button>
          );
        })}
      </div>

      {catalogError && (
        <p className="rounded-2xl bg-rose-50 px-5 py-4 text-sm text-rose-700">{catalogError}</p>
      )}

      {!catalog && !catalogError && (
        <div className="flex items-center gap-3 rounded-3xl border border-slate-200 bg-white p-6 text-sm text-slate-500">
          <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
          Calculating your personalised plan...
        </div>
      )}

      {plan && <PlanDetails plan={plan} />}
    </div>
  );
}

function PlanDetails({ plan }: { plan: DreamPlan }) {
  const targetLabel = new Date(plan.targetDate).toLocaleDateString('en-US', SHORT_DATE);
  const isSupported = plan.dreamType !== 'other';
  const { Icon } = DREAM_TYPE_META[plan.dreamType];
  const statusKey: StatusKey = plan.status ?? 'pending';
  const status = STATUS_META[statusKey];
  const StatusIcon = status.Icon;
  const goalReached = plan.currentSaved >= plan.targetAmount;

  return (
    <div className="space-y-6">
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="Saved So Far" value={formatMoney(plan.currentSaved)} />
        <Stat label="Predicted Monthly Savings" value={savingsRateLabel(plan.monthlySavingsRate)} />
        <Stat
          label={`Projected by ${targetLabel}`}
          value={plan.projectedSavingsByTargetDate === null ? 'Forecast Pending' : formatMoney(plan.projectedSavingsByTargetDate)}
          accent={plan.projectedSavingsByTargetDate === null ? undefined : plan.projectedSavingsByTargetDate >= plan.targetAmount ? 'emerald' : 'amber'}
        />
        <Stat
          label="Dream Readiness"
          value={plan.readinessScore === null ? 'Forecast Pending' : `${plan.readinessScore}/100`}
          accent={status.accent}
        />
      </section>

      <section className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
            <Icon className="h-5 w-5" />
          </span>
          <div className="min-w-0 flex-1">
            <h2 className="text-base font-semibold text-slate-900">{plan.goalName}</h2>
            <p className="text-sm text-slate-500">
              Target {formatMoney(plan.targetAmount)} by {targetLabel}, {plan.monthsUntilTarget > 0 ? `${Math.round(plan.monthsUntilTarget)} months to go` : 'due now'}.
            </p>
          </div>
          <span className={`inline-flex items-center gap-2 rounded-full bg-slate-50 px-3 py-1.5 text-sm font-semibold ${status.text}`}>
            <span className={`h-2.5 w-2.5 rounded-full ${status.dot}`} />
            {status.label}
          </span>
        </div>

        <p className="mt-5 text-sm leading-6 text-slate-700">
          {plan.status === null
            ? 'Connect your PayPal transaction history to receive your personalised forecast.'
            : goalReached
              ? 'You have reached this dream amount. Enjoy the milestone and keep building on it.'
              : `You need to save ${formatMoney(plan.recommendedMonthlySaving)}/month to achieve this dream by ${targetLabel}.`}
        </p>

        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <div className="rounded-2xl bg-slate-50 p-5">
            <p className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-slate-500">
              <Rocket className="h-3.5 w-3.5 text-blue-600" />
              Projected Affordability Date
            </p>
            <p className="mt-2 text-lg font-bold text-slate-900">
              {plan.affordabilityDate
                ? plan.affordabilityDate.toLocaleDateString('en-US', SHORT_DATE)
                : 'Building Towards This Dream'}
            </p>
            <p className="mt-1 text-xs text-slate-500">Based on your predicted monthly savings.</p>
          </div>
          <div className="rounded-2xl bg-slate-50 p-5">
            <p className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-slate-500">
              <Target className="h-3.5 w-3.5 text-emerald-600" />
              Recommended Monthly Saving
            </p>
            <p className="mt-2 text-lg font-bold text-slate-900">
              {goalReached ? 'Goal Reached' : `${formatMoney(plan.recommendedMonthlySaving)}/mo`}
            </p>
            <p className="mt-1 text-xs text-slate-500">Keeps you on schedule for {targetLabel}.</p>
          </div>
        </div>
      </section>

      <section className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-blue-600" />
          <h2 className="text-base font-semibold text-slate-900">AI Insight</h2>
        </div>
        <p className={`mt-4 flex items-center gap-2 text-sm font-semibold ${status.text}`}>
          <StatusIcon className="h-4 w-4" />
          {HEADLINE_BY_STATUS[statusKey]}
        </p>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          {plan.insight ?? 'Connect your PayPal transaction history and your personalised monthly plan will appear here.'}
        </p>
        <p className="mt-5 text-sm font-semibold text-slate-900">Ways to get there faster</p>
        <ul className="mt-3 space-y-2">
          {plan.recommendedActions.map((action) => (
            <li key={action} className="flex items-start gap-3 text-sm leading-6 text-slate-600">
              <TrendingUp className="mt-1 h-4 w-4 shrink-0 text-blue-600" />
              {action}
            </li>
          ))}
        </ul>
      </section>

      {!isSupported ? (
        <div className="flex items-center gap-3 rounded-3xl border border-dashed border-slate-300 bg-white p-6 text-sm text-slate-600">
          <Clock className="h-5 w-5 shrink-0 text-slate-400" />
          Set this dream's type to Car, Bike or Travel (in Dreams) to explore matching options and timelines.
        </div>
      ) : plan.options.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-6 text-sm text-slate-600">
          No market options are available for this dream type yet.
        </div>
      ) : (
        (['affordable_now', 'affordable_by_target', 'stretch'] as OptionBucket[]).map((bucket) => {
          const options = plan.options.filter((option) => option.bucket === bucket);
          if (options.length === 0) return null;
          const meta = BUCKET_META[bucket];
          return (
            <section key={bucket} className="space-y-4">
              <div>
                <h2 className={`text-lg font-bold ${meta.tone}`}>
                  {meta.title} <span className="text-sm font-medium text-slate-400">({options.length})</span>
                </h2>
                <p className="text-sm text-slate-500">{meta.description}</p>
              </div>
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {options.map((option) => (
                  <OptionCard key={option.key} option={option} bucket={bucket} targetLabel={targetLabel} />
                ))}
              </div>
              {bucket === 'stretch' && plan.stretchTotal > options.length && (
                <p className="text-xs text-slate-500">Showing {options.length} of {plan.stretchTotal} future options.</p>
              )}
            </section>
          );
        })
      )}

      <section className="rounded-3xl border border-blue-100 bg-gradient-to-br from-blue-50 via-white to-emerald-50 p-6 sm:p-8">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-blue-600" />
          <h2 className="text-base font-semibold text-slate-900">How your plan is calculated</h2>
        </div>
        <ul className="mt-4 space-y-3 text-sm leading-6 text-slate-600">
          <li className="flex items-start gap-3"><TrendingUp className="mt-0.5 h-4 w-4 shrink-0 text-blue-600" /> Your predicted savings come from your average income and spending, adjusted for how steady your recent months have been.</li>
          <li className="flex items-start gap-3"><Target className="mt-0.5 h-4 w-4 shrink-0 text-blue-600" /> Dream Readiness blends your progress, savings pace, income stability, spending habits, current balance, and time left.</li>
          <li className="flex items-start gap-3"><Calendar className="mt-0.5 h-4 w-4 shrink-0 text-blue-600" /> Options are sorted by the earliest date you can reach them.</li>
          <li className="flex items-start gap-3"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-blue-600" /> Prices are market estimates and can change. Check dealers or travel sites before you buy.</li>
        </ul>
      </section>
    </div>
  );
}

function OptionCard({ option, bucket, targetLabel }: { option: DreamOption; bucket: OptionBucket; targetLabel: string }) {
  const dateLabel = option.expectedDate ? option.expectedDate.toLocaleDateString('en-US', SHORT_DATE) : 'Building Towards This Dream';
  const isNow = bucket === 'affordable_now';
  return (
    <article className={`rounded-2xl border p-5 transition hover:shadow-md ${isNow ? 'border-emerald-200 bg-emerald-50/40' : 'border-slate-200 bg-white'}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate font-bold text-slate-900">{option.name}</p>
          <p className="truncate text-xs text-slate-500">{option.detail}</p>
        </div>
        <span className="shrink-0 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-700">{formatMoney(option.priceInr)}</span>
      </div>

      <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
        <div>
          <dt className="text-xs text-slate-500">Projected Ownership Date</dt>
          <dd className="font-semibold text-slate-900">{dateLabel}</dd>
        </div>
        <div>
          <dt className="text-xs text-slate-500">Recommended monthly saving</dt>
          <dd className="font-semibold text-slate-900">{option.monthlyRequired > 0 ? `${formatMoney(option.monthlyRequired)}/mo` : 'Ready now'}</dd>
        </div>
        <div className="col-span-2">
          <dt className="text-xs text-slate-500">Readiness for {targetLabel}</dt>
          <dd className="mt-1 flex items-center gap-2">
            <span className="font-bold text-slate-900">{option.readinessScore}/100</span>
            <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-100">
              <span
                className={`block h-full rounded-full ${option.readinessScore >= 70 ? 'bg-emerald-500' : option.readinessScore >= 50 ? 'bg-amber-500' : 'bg-rose-500'}`}
                style={{ width: `${option.readinessScore}%` }}
              />
            </span>
          </dd>
        </div>
      </dl>
    </article>
  );
}

function Stat({ label, value, accent }: { label: string; value: string; accent?: 'emerald' | 'amber' }) {
  const color = accent === 'emerald' ? 'text-emerald-700' : accent === 'amber' ? 'text-amber-700' : 'text-slate-900';
  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
      <p className="text-xs text-slate-500">{label}</p>
      <p className={`mt-1 text-lg font-bold ${color}`}>{value}</p>
    </div>
  );
}
