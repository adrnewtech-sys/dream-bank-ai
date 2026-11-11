import type { AssistantContext } from '@/lib/assistantEngine';
import { supabase } from '@/lib/supabase';
import { ASSUMED_ANNUAL_INFLATION } from '@/lib/forecastEngine';

export interface AdvisorTurn {
  role: 'user' | 'assistant';
  content: string;
}

export type AdvisorResult =
  | { ok: true; answer: string }
  | { ok: false; reason: 'not_configured' | 'failed' };

export interface AdvisorSnapshot {
  today: string;
  timeZone: string;
  balances: { totalBankBalance: number; protectedSavings: number; spendableBalance: number };
  monthlyPlan: {
    income: number;
    regularExpenses: number;
    irregularExpenses: number;
    seasonalReservePerMonth: number;
    inflationImpactPerMonth: number;
    assumedAnnualInflationPercent: number;
    predictedSavingsThisMonth: number;
  };
  spendingThisMonth: {
    weekdays: number;
    weekends: number;
    hasTransactionHistory: boolean;
    categories: { label: string; nature: string; amount: number }[];
  };
  upcomingEvents: { name: string; daysAway: number; estimatedSpend: number; monthlySetAside: number }[];
  goals: { name: string; targetAmount: number; saved: number; remaining: number; targetDate: string }[];
}

export function buildAdvisorSnapshot(ctx: AssistantContext): AdvisorSnapshot {
  const f = ctx.forecast.formula;
  const s = ctx.forecast.spending;
  return {
    today: ctx.now.toISOString().slice(0, 10),
    timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    balances: {
      totalBankBalance: ctx.spendableBalance + ctx.protectedSavings,
      protectedSavings: ctx.protectedSavings,
      spendableBalance: ctx.spendableBalance,
    },
    monthlyPlan: {
      income: f.income,
      regularExpenses: f.regularExpenses,
      irregularExpenses: f.irregularAllowance,
      seasonalReservePerMonth: f.seasonalExpenses,
      inflationImpactPerMonth: f.inflationImpact,
      assumedAnnualInflationPercent: Math.round(ASSUMED_ANNUAL_INFLATION * 100),
      predictedSavingsThisMonth: f.predictedSavings,
    },
    spendingThisMonth: {
      weekdays: s.weekdayTotal,
      weekends: s.weekendTotal,
      hasTransactionHistory: s.categories.length > 0,
      categories: s.categories.map((c) => ({ label: c.label, nature: c.nature, amount: c.amount })),
    },
    upcomingEvents: ctx.forecast.upcomingEvents.map((item) => ({
      name: item.event.name,
      daysAway: item.daysAway,
      estimatedSpend: item.estimatedSpend,
      monthlySetAside: item.monthlySetAside,
    })),
    goals: ctx.goals.map((goal) => ({
      name: goal.name,
      targetAmount: goal.targetAmount,
      saved: goal.saved,
      remaining: Math.max(0, goal.targetAmount - goal.saved),
      targetDate: goal.targetDate,
    })),
  };
}

export async function askFinancialAdvisor(turns: AdvisorTurn[], snapshot: AdvisorSnapshot): Promise<AdvisorResult> {
  const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
  try {
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token ?? anonKey;
    const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/financial-advisor`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        apikey: anonKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ messages: turns, snapshot }),
    });
    if (response.status === 503) return { ok: false, reason: 'not_configured' };
    const body = (await response.json().catch(() => null)) as { answer?: unknown } | null;
    if (!response.ok || typeof body?.answer !== 'string') return { ok: false, reason: 'failed' };
    return { ok: true, answer: body.answer };
  } catch {
    return { ok: false, reason: 'failed' };
  }
}
