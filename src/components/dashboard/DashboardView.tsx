import { ArrowRight, Pencil, Rocket, ShieldCheck, TrendingDown, TrendingUp, Wallet } from 'lucide-react';
import { AIPredictionCenter } from '@/components/dashboard/AIPredictionCenter';
import { DreamReadinessCard } from '@/components/dashboard/DreamReadinessCard';
import { PayPalConnectionCard } from '@/components/dashboard/PayPalConnectionCard';
import { ForecastModeBadge } from '@/components/ui/ForecastModeBadge';
import { BalanceFlowCard } from '@/components/dashboard/BalanceFlowCard';
import { AutoSaveCard } from '@/components/insights/AutoSaveCard';
import { PredictionTrendChart } from '@/components/charts/PredictionTrendChart';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { StatusPill } from '@/components/ui/StatusPill';
import { GOAL_COLORS, getGoalIcon } from '@/lib/goalStyles';
import { calculateProtectedBalance } from '@/lib/finance';
import { ForecastCenter } from '@/components/forecast/ForecastCenter';
import { computeAIDashboardData } from '@/lib/aiPredictions';
import { computeForecastCenter } from '@/lib/forecastEngine';
import { formatMoney, formatPercent } from '@/lib/format';
import { getFirstName, getGreeting } from '@/lib/profile';
import { buildTransactionHistory } from '@/lib/transactionHistory';
import { RecentActivityCard } from '@/components/dashboard/RecentActivityCard';
import type { PiggyBankState } from '@/hooks/usePiggyBank';
import type { AppView, GoalColor } from '@/types';

interface DashboardViewProps {
  state: PiggyBankState;
  fullName: string;
  onEditBudget: () => void;
  onNavigate: (view: AppView) => void;
}

export function DashboardView({ state, fullName, onEditBudget, onNavigate }: DashboardViewProps) {
  const firstName = getFirstName(fullName);
  const { budget, goals, transactions, portfolio, incomeHistory, autoSave, paypal } = state;
  const hasBudget = budget !== null;
  const balance = calculateProtectedBalance(paypal.paypalBalance, portfolio.totalSaved);
  const aiData = computeAIDashboardData(paypal, budget, incomeHistory, goals, portfolio);
  const forecast = computeForecastCenter(paypal, budget, balance.spendableBalance);
  const monthlyIncome = paypal.isSandbox ? aiData.paypalFlow.incomeThisMonth : (hasBudget ? budget.monthlyIncome : null);
  const monthlyExpenses = paypal.isSandbox ? aiData.paypalFlow.expensesThisMonth : (hasBudget ? budget.monthlyExpenses : null);
  const netCashFlow = monthlyIncome !== null && monthlyExpenses !== null ? monthlyIncome - monthlyExpenses : null;
  const topGoals = goals.slice(0, 4);
  const recentActivity = buildTransactionHistory(goals, transactions, incomeHistory).slice(0, 4);
  const goalColorMap = new Map<string, GoalColor>(goals.map((g) => [g.id, g.color]));

  return (
    <div className="space-y-6">
      <section>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">{getGreeting(new Date())}, {firstName} 👋</h1>
        <p className="mt-1 text-sm text-slate-500">Welcome back, {firstName}.</p>
      </section>

      <section className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="inline-flex items-center gap-2 text-sm font-medium text-blue-600">
            <Rocket className="h-4 w-4" />
            DreamBank AI
          </p>
          <h2 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">Your Dream Forecast</h2>
          <p className="mt-1 max-w-xl text-sm leading-6 text-slate-500">Based on your spending habits and income patterns, DreamBank AI predicts how much you can safely save for your dreams.</p>
          <ForecastModeBadge connected={paypal.connected} className="mt-3" />
        </div>
        {!paypal.connected && (
          <button
            type="button"
            onClick={onEditBudget}
            className="inline-flex items-center justify-center gap-2 self-start rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-blue-300 hover:text-blue-700 sm:self-auto"
          >
            <Pencil className="h-4 w-4" />
            Edit budget
          </button>
        )}
      </section>

      {!paypal.connected && !hasBudget && (
        <section className="flex flex-col gap-5 overflow-hidden rounded-3xl border border-blue-100 bg-gradient-to-br from-blue-50 via-white to-emerald-50 p-6 sm:flex-row sm:items-center sm:justify-between sm:p-8">
          <div className="max-w-xl">
            <h2 className="text-xl font-bold text-slate-900">Start with your monthly numbers</h2>
            <p className="mt-2 text-sm text-slate-600">
              Tell us your income and expenses. DreamBank AI will calculate a safe savings rate and forecast when your dreams can be reached.
            </p>
          </div>
          <button
            type="button"
            onClick={onEditBudget}
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-emerald-500 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-600/20 transition hover:-translate-y-0.5 hover:shadow-xl"
          >
            Set up my budget
          </button>
        </section>
      )}

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <FlowCard
          label="Total Bank Balance"
          sublabel="Connected PayPal balance"
          value={paypal.connected && paypal.balanceAvailable ? formatMoney(balance.totalBalance) : '--'}
          icon={Wallet}
          tone="blue"
        />
        <FlowCard
          label="Goal Protected Savings"
          sublabel="Reserved for active dream goals"
          value={paypal.connected ? formatMoney(balance.protectedBalance) : '--'}
          icon={ShieldCheck}
          tone="amber"
        />
        <FlowCard
          label="Spendable Balance"
          sublabel="Total bank balance - protected savings"
          value={paypal.connected && paypal.balanceAvailable ? formatMoney(balance.spendableBalance) : '--'}
          icon={Wallet}
          tone="emerald"
        />
      </section>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <FlowCard
          label="Total Income This Month"
          sublabel="Money received this month"
          value={monthlyIncome !== null ? formatMoney(monthlyIncome) : '--'}
          icon={TrendingUp}
          tone="emerald"
        />
        <FlowCard
          label="Total Expenses This Month"
          sublabel="Money spent this month"
          value={monthlyExpenses !== null ? formatMoney(monthlyExpenses) : '--'}
          icon={TrendingDown}
          tone="rose"
        />
        <FlowCard
          label="Net Cash Flow This Month"
          sublabel="Income minus expenses"
          value={netCashFlow !== null ? formatMoney(netCashFlow) : '--'}
          icon={Wallet}
          tone="blue"
        />
      </section>

      <AIPredictionCenter prediction={aiData.prediction} allocations={aiData.allocations} />

      <ForecastCenter data={forecast} />

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm">
          <h2 className="text-base font-semibold text-slate-900">Savings trend & prediction</h2>
          <p className="mb-6 text-sm text-slate-500">Past 3 months, current month, and AI prediction for next month.</p>
          <PredictionTrendChart points={aiData.trend} />
        </div>
        <div className="space-y-6">
          <BalanceFlowCard balance={balance} />
          <PayPalConnectionCard settings={paypal} onRefresh={state.retry} onOpenProfile={() => onNavigate('profile')} />
        </div>
      </section>

      <DreamReadinessCard scores={aiData.readinessScores} />

      <AutoSaveCard settings={autoSave} autoPay={state.autoPay} connected={paypal.connected} goals={goals} onChange={state.saveAutoSave} />

      <RecentActivityCard entries={recentActivity} onViewAll={() => onNavigate('history')} />

      <section className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm">
        <div className="mb-5 flex items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-semibold text-slate-900">Goal progress</h2>
            <p className="text-sm text-slate-500">Closest deadlines first.</p>
          </div>
          <button
            type="button"
            onClick={() => onNavigate('goals')}
            className="inline-flex items-center gap-1 text-sm font-semibold text-blue-600 transition hover:text-blue-800"
          >
            View all goals
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>

        {topGoals.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 p-8 text-center">
            <p className="text-sm text-slate-600">No goal folders yet. Create your first one to start tracking progress.</p>
            <button
              type="button"
              onClick={() => onNavigate('goals')}
              className="mt-4 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
            >
              Create a goal
            </button>
          </div>
        ) : (
          <ul className="grid gap-4 md:grid-cols-2">
            {topGoals.map((goal) => {
              const forecast = portfolio.goals.find((item) => item.goalId === goal.id);
              const Icon = getGoalIcon(goal.icon);
              const percent = goal.targetAmount > 0 ? (goal.saved / goal.targetAmount) * 100 : 0;
              return (
                <li key={goal.id} className="rounded-2xl border border-slate-100 bg-slate-50/60 p-5 transition hover:border-blue-200 hover:bg-white hover:shadow-md">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${GOAL_COLORS[goal.color].soft} ${GOAL_COLORS[goal.color].text}`}>
                        <Icon className="h-5 w-5" />
                      </span>
                      <div className="min-w-0">
                        <p className="truncate font-semibold text-slate-900">{goal.name}</p>
                        <p className="text-xs text-slate-500">
                          {formatMoney(goal.saved)} of {formatMoney(goal.targetAmount)}
                        </p>
                      </div>
                    </div>
                    {forecast && <StatusPill status={forecast.status} />}
                  </div>
                  <div className="mt-4">
                    <ProgressBar percent={percent} color={goal.color} label={`${goal.name} progress`} />
                  </div>
                  <div className="mt-2 flex justify-between text-xs text-slate-500">
                    <span>{formatPercent(percent)} complete</span>
                    {forecast && <span>{forecast.probability}% chance to finish on time</span>}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}

interface FlowCardProps {
  label: string;
  sublabel: string;
  value: string;
  icon: typeof Wallet;
  tone: 'emerald' | 'rose' | 'blue' | 'amber';
}

const TONE_STYLES: Record<FlowCardProps['tone'], string> = {
  emerald: 'bg-emerald-50 text-emerald-600',
  rose: 'bg-rose-50 text-rose-600',
  blue: 'bg-blue-50 text-blue-600',
  amber: 'bg-amber-50 text-amber-600',
};

function FlowCard({ label, sublabel, value, icon: Icon, tone }: FlowCardProps) {
  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <span className={`flex h-9 w-9 items-center justify-center rounded-xl ${TONE_STYLES[tone]}`}>
        <Icon className="h-4 w-4" />
      </span>
      <p className="mt-4 text-sm font-semibold text-slate-900">{label}</p>
      <p className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">{value}</p>
      <p className="mt-1 text-xs text-slate-400">{sublabel}</p>
    </div>
  );
}
