import { computePayPalFlow } from '@/lib/aiPredictions';
import { formatMoney } from '@/lib/format';
import { getSandboxDemoAccount } from '@/lib/paypalConnection';
import { SEASONAL_EVENTS, type SeasonalEvent } from '@/lib/seasonalCalendar';
import { summarizeSpending, type SpendingSummary } from '@/lib/spendingIntelligence';
import type { Budget, PayPalSettings } from '@/types';

export const ASSUMED_ANNUAL_INFLATION = 0.03;
const SEASONAL_WINDOW_DAYS = 60;
const DAY_MS = 86_400_000;

export interface EventOutlook {
  event: SeasonalEvent;
  daysAway: number;
  estimatedSpend: number;
  monthlySetAside: number;
}

export interface SavingsFormula {
  income: number;
  regularExpenses: number;
  seasonalExpenses: number;
  inflationImpact: number;
  irregularAllowance: number;
  predictedSavings: number;
}

export interface ForecastCenterData {
  hasData: boolean;
  formula: SavingsFormula;
  spending: SpendingSummary;
  upcomingEvents: EventOutlook[];
  festivalReadiness: number | null;
  insights: string[];
}

function daysUntil(dateStr: string, now: Date): number {
  const target = new Date(`${dateStr}T00:00:00`);
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.round((target.getTime() - today.getTime()) / DAY_MS);
}

export function computeForecastCenter(
  paypal: PayPalSettings,
  budget: Budget | null,
  spendableBalance: number,
  now: Date = new Date(),
): ForecastCenterData {
  const transactions = paypal.isSandbox ? getSandboxDemoAccount().transactions : [];
  const spending = summarizeSpending(transactions, now);
  const hasData = paypal.isSandbox ? transactions.length > 0 : budget !== null;

  const income = paypal.isSandbox ? computePayPalFlow(paypal, now).incomeThisMonth : (budget?.monthlyIncome ?? 0);
  const regularExpenses = paypal.isSandbox ? spending.regularTotal : (budget?.monthlyExpenses ?? 0);
  const irregularAllowance = paypal.isSandbox ? spending.irregularTotal : 0;
  const totalExpenses = regularExpenses + irregularAllowance;

  const upcomingEvents: EventOutlook[] = SEASONAL_EVENTS
    .map((event) => ({ event, daysAway: daysUntil(event.date, now) }))
    .filter(({ daysAway }) => daysAway >= 0)
    .sort((a, b) => a.daysAway - b.daysAway)
    .map(({ event, daysAway }) => {
      const estimatedSpend = Math.round(totalExpenses * event.expenseUplift);
      const monthsLeft = Math.max(1, Math.ceil(daysAway / 30));
      return { event, daysAway, estimatedSpend, monthlySetAside: Math.round(estimatedSpend / monthsLeft) };
    });

  const windowEvents = upcomingEvents.filter((item) => item.daysAway <= SEASONAL_WINDOW_DAYS);
  const seasonalExpenses = Math.round(
    windowEvents.reduce((sum, item) => sum + item.estimatedSpend, 0) / (SEASONAL_WINDOW_DAYS / 30),
  );
  const inflationImpact = Math.round((totalExpenses * ASSUMED_ANNUAL_INFLATION) / 12);
  const predictedSavings = Math.max(0, Math.round(income - regularExpenses - seasonalExpenses - inflationImpact - irregularAllowance));

  const formula: SavingsFormula = {
    income,
    regularExpenses,
    seasonalExpenses,
    inflationImpact,
    irregularAllowance,
    predictedSavings,
  };

  const nextEvent = upcomingEvents[0] ?? null;
  const festivalReadiness = nextEvent
    ? nextEvent.estimatedSpend > 0 ? Math.min(100, Math.round((spendableBalance / nextEvent.estimatedSpend) * 100)) : 100
    : null;

  return {
    hasData,
    formula,
    spending,
    upcomingEvents,
    festivalReadiness,
    insights: buildInsights({ formula, spending, nextEvent, totalExpenses }),
  };
}

function buildInsights({
  formula,
  spending,
  nextEvent,
  totalExpenses,
}: {
  formula: SavingsFormula;
  spending: SpendingSummary;
  nextEvent: EventOutlook | null;
  totalExpenses: number;
}): string[] {
  const insights: string[] = [];
  const spentThisMonth = spending.weekdayTotal + spending.weekendTotal;

  if (spentThisMonth > 0) {
    const weekendShare = Math.round((spending.weekendTotal / spentThisMonth) * 100);
    insights.push(
      weekendShare >= 50
        ? `${weekendShare}% of your spending happens on weekends. A weekend spending limit would protect your savings.`
        : `${100 - weekendShare}% of your spending happens on weekdays, so workday purchases are your biggest savings risk.`,
    );
  }

  if (totalExpenses > 0 && spending.irregularTotal > 0) {
    const irregularShare = Math.round((spending.irregularTotal / totalExpenses) * 100);
    insights.push(
      `Irregular spending such as shopping and entertainment is ${irregularShare}% of this month. Your forecast keeps ${formatMoney(spending.irregularTotal)} aside for it.`,
    );
  }

  if (nextEvent) {
    insights.push(
      `${nextEvent.event.name} is in ${nextEvent.daysAway} days. Setting aside ${formatMoney(nextEvent.monthlySetAside)} a month covers an estimated ${formatMoney(nextEvent.estimatedSpend)} of extra spending.`,
    );
  }

  insights.push(
    `At an assumed ${Math.round(ASSUMED_ANNUAL_INFLATION * 100)}% annual inflation, your monthly costs rise by about ${formatMoney(formula.inflationImpact)}, and your forecast already accounts for it.`,
  );
  insights.push(`Based on your current habits, you can safely save ${formatMoney(formula.predictedSavings)} this month.`);

  return insights;
}
