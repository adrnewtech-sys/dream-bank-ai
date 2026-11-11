import { AlertTriangle, Bell, Bot, CheckCircle2, TrendingDown, TrendingUp } from 'lucide-react';
import { calculateAdaptiveAutoSave } from '@/lib/finance';
import { formatMoney } from '@/lib/format';
import type { Budget, IncomeSnapshot } from '@/types';
import type { GoalForecast, PortfolioForecast } from '@/lib/finance';

interface AIInsightsPanelProps {
  portfolio: PortfolioForecast;
  budget: Budget | null;
  incomeHistory: IncomeSnapshot[];
  goals: Array<{ name: string; saved: number; targetAmount: number }>;
  forecasts: GoalForecast[];
  protectedAmount: number;
}

interface Insight {
  icon: typeof Bot;
  tone: 'positive' | 'warning' | 'danger' | 'info';
  message: string;
}

export function AIInsightsPanel({
  portfolio, budget, incomeHistory, goals, forecasts, protectedAmount,
}: AIInsightsPanelProps) {
  const adaptive = calculateAdaptiveAutoSave(budget, incomeHistory);
  const insights: Insight[] = [];

  if (budget && budget.monthlyIncome > 0) {
    insights.push({
      icon: Bot,
      tone: 'positive',
      message: `You can safely save ${formatMoney(adaptive.amount)} this month.`,
    });
  }

  if (incomeHistory.length >= 2) {
    const prev = incomeHistory[1];
    const incomeChange = budget ? ((budget.monthlyIncome - prev.monthlyIncome) / Math.max(prev.monthlyIncome, 1)) * 100 : 0;
    const expenseChange = budget ? ((budget.monthlyExpenses - prev.monthlyExpenses) / Math.max(prev.monthlyExpenses, 1)) * 100 : 0;

    if (incomeChange <= -10) {
      insights.push({
        icon: TrendingDown,
        tone: 'warning',
        message: `Income decreased by ${Math.abs(Math.round(incomeChange))}%. AutoSave adjusted to protect your budget.`,
      });
    }
    if (expenseChange >= 15) {
      insights.push({
        icon: AlertTriangle,
        tone: 'warning',
        message: `Expenses increased by ${Math.round(expenseChange)}%. Consider reviewing your spending.`,
      });
    }
  }

  const aheadGoals = forecasts.filter((f) => f.status === 'on-track' || f.status === 'complete');
  if (aheadGoals.length > 0) {
    const goal = aheadGoals[0];
    if (goal.status === 'complete') {
      insights.push({
        icon: CheckCircle2,
        tone: 'positive',
        message: `You have already reached your ${goal.name} goal. Great work!`,
      });
    } else if (goal.projectedDate) {
      const months = Math.ceil((goal.projectedDate.getTime() - Date.now()) / (30.44 * 86_400_000));
      insights.push({
        icon: CheckCircle2,
        tone: 'positive',
        message: `You will achieve your ${goal.name} goal in about ${Math.max(1, months)} months.`,
      });
    }
  }

  const atRisk = forecasts.find((f) => f.status === 'off-track' || f.status === 'overdue');
  if (atRisk) {
    insights.push({
      icon: AlertTriangle,
      tone: 'danger',
      message: `Your ${atRisk.name} goal is at risk. Consider increasing contributions or extending the target date.`,
    });
  }

  if (protectedAmount > 0) {
    insights.push({
      icon: CheckCircle2,
      tone: 'info',
      message: `${formatMoney(protectedAmount)} is protected across your goal vaults. This money is safe from everyday spending.`,
    });
  }

  if (portfolio.warnings.length > 0) {
    insights.push({
      icon: AlertTriangle,
      tone: 'warning',
      message: portfolio.warnings[0].message,
    });
  }

  if (insights.length === 0) {
    insights.push({
      icon: Bell,
      tone: 'info',
      message: 'Set up your budget and create goals to unlock personalized AI insights.',
    });
  }

  return (
    <section className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm">
      <div className="flex items-center gap-2">
        <Bot className="h-5 w-5 text-blue-600" />
        <h2 className="text-base font-semibold text-slate-900">AI Insights</h2>
      </div>
      <p className="mt-1 text-sm text-slate-500">Personalized recommendations based on your financial patterns.</p>

      <ul className="mt-5 space-y-3">
        {insights.map((insight, i) => (
          <li key={i} className={`flex items-start gap-3 rounded-2xl border p-4 text-sm leading-6 ${TONE_STYLES[insight.tone].border} ${TONE_STYLES[insight.tone].bg}`}>
            <insight.icon className={`mt-0.5 h-4 w-4 shrink-0 ${TONE_STYLES[insight.tone].icon}`} />
            <span className={TONE_STYLES[insight.tone].text}>{insight.message}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

const TONE_STYLES: Record<Insight['tone'], { border: string; bg: string; icon: string; text: string }> = {
  positive: { border: 'border-emerald-200', bg: 'bg-emerald-50/60', icon: 'text-emerald-600', text: 'text-emerald-800' },
  warning: { border: 'border-amber-200', bg: 'bg-amber-50/60', icon: 'text-amber-600', text: 'text-amber-800' },
  danger: { border: 'border-rose-200', bg: 'bg-rose-50/60', icon: 'text-rose-600', text: 'text-rose-800' },
  info: { border: 'border-blue-200', bg: 'bg-blue-50/60', icon: 'text-blue-600', text: 'text-blue-800' },
};
