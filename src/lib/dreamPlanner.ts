import type { Budget, DreamType, GoalTransaction, GoalWithSaved, IncomeSnapshot, PayPalSettings } from '@/types';
import { calculateProtectedBalance, type GoalForecast } from '@/lib/finance';
import { getSandboxDemoAccount, type SandboxTransaction } from '@/lib/paypalConnection';
import type { MarketCatalog } from '@/lib/marketCatalog';
import { formatMoney } from '@/lib/format';

const DAYS_PER_MONTH = 30.44;
const MS_PER_DAY = 86_400_000;
const STRETCH_LIMIT = 6;
const LABEL_DATE = { month: 'short', year: 'numeric' } as const;

export type OptionBucket = 'affordable_now' | 'affordable_by_target' | 'stretch';
export type DreamStatus = 'on_track' | 'building_momentum' | 'at_risk';

export interface DreamOption {
  key: string;
  name: string;
  detail: string;
  priceInr: number;
  bucket: OptionBucket;
  expectedDate: Date | null;
  monthsToAfford: number | null;
  monthlyRequired: number;
  readinessScore: number;
}

export interface DreamPlan {
  goalId: string;
  goalName: string;
  dreamType: DreamType;
  targetDate: string;
  targetAmount: number;
  currentSaved: number;
  monthlySavingsRate: number | null;
  monthsUntilTarget: number;
  projectedSavingsByTargetDate: number | null;
  recommendedMonthlySaving: number;
  readinessScore: number | null;
  status: DreamStatus | null;
  affordabilityDate: Date | null;
  insight: string | null;
  recommendedActions: string[];
  options: DreamOption[];
  stretchTotal: number;
}

export interface DreamPlanInput {
  goal: GoalWithSaved;
  allGoals: GoalWithSaved[];
  forecast: GoalForecast | undefined;
  transactions: GoalTransaction[];
  budget: Budget | null;
  incomeHistory: IncomeSnapshot[];
  paypal: PayPalSettings;
  catalog: MarketCatalog;
  now?: Date;
}

interface MonthlyBaseline {
  income: number;
  expenses: number;
  nets: number[];
  topExpense: string | null;
  monthsObserved: number;
}

function average(values: number[]): number {
  return values.length > 0 ? values.reduce((sum, value) => sum + value, 0) / values.length : 0;
}

function clamp(value: number, low: number, high: number): number {
  return Math.min(high, Math.max(low, value));
}

function coefficientOfVariation(values: number[]): number {
  const mean = average(values);
  if (mean === 0) return 1;
  const deviation = Math.sqrt(average(values.map((value) => (value - mean) ** 2)));
  return deviation / Math.abs(mean);
}

function monthsBetween(from: Date, to: Date): number {
  return Math.max(0, (to.getTime() - from.getTime()) / (DAYS_PER_MONTH * MS_PER_DAY));
}

function addMonths(from: Date, months: number): Date {
  return new Date(from.getTime() + months * DAYS_PER_MONTH * MS_PER_DAY);
}

function baselineFromTransactions(transactions: SandboxTransaction[]): MonthlyBaseline | null {
  if (transactions.length === 0) return null;
  const months = new Map<string, { income: number; expenses: number }>();
  const spendByLabel = new Map<string, number>();
  for (const tx of transactions) {
    const key = tx.date.slice(0, 7);
    const row = months.get(key) ?? { income: 0, expenses: 0 };
    if (tx.inflow) {
      row.income += tx.amount;
    } else {
      row.expenses += tx.amount;
      spendByLabel.set(tx.description, (spendByLabel.get(tx.description) ?? 0) + tx.amount);
    }
    months.set(key, row);
  }
  const rows = [...months.values()];
  const topExpense = [...spendByLabel.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;
  return {
    income: average(rows.map((row) => row.income)),
    expenses: average(rows.map((row) => row.expenses)),
    nets: rows.map((row) => row.income - row.expenses),
    topExpense,
    monthsObserved: rows.length,
  };
}

function baselineFromBudget(budget: Budget | null, incomeHistory: IncomeSnapshot[]): MonthlyBaseline | null {
  if (budget && budget.monthlyIncome > 0) {
    return {
      income: budget.monthlyIncome,
      expenses: budget.monthlyExpenses,
      nets: [budget.monthlyIncome - budget.monthlyExpenses],
      topExpense: null,
      monthsObserved: 1,
    };
  }
  const recent = [...incomeHistory].sort((a, b) => a.monthStart.localeCompare(b.monthStart)).slice(-3);
  if (recent.length === 0) return null;
  return {
    income: average(recent.map((row) => row.monthlyIncome)),
    expenses: average(recent.map((row) => row.monthlyExpenses)),
    nets: recent.map((row) => row.monthlyIncome - row.monthlyExpenses),
    topExpense: null,
    monthsObserved: recent.length,
  };
}

function resolveBaseline(paypal: PayPalSettings, budget: Budget | null, incomeHistory: IncomeSnapshot[]): MonthlyBaseline | null {
  const fromTransactions = paypal.isSandbox ? baselineFromTransactions(getSandboxDemoAccount().transactions) : null;
  return fromTransactions ?? baselineFromBudget(budget, incomeHistory);
}

function monthlyDreamDeposits(transactions: GoalTransaction[], monthsObserved: number): number {
  const net = transactions.reduce((sum, tx) => sum + (tx.kind === 'deposit' ? tx.amount : -tx.amount), 0);
  return Math.max(0, net / Math.max(1, monthsObserved));
}

function predictedTotalSavings(baseline: MonthlyBaseline, dreamDeposits: number): number {
  const stability = baseline.nets.length >= 2 ? clamp(1 - coefficientOfVariation(baseline.nets), 0.5, 1) : 0.85;
  const capacity = Math.max(0, baseline.income - baseline.expenses) * 0.8 * stability;
  return Math.round(Math.max(dreamDeposits, capacity));
}

interface ReadinessInput {
  saved: number;
  targetAmount: number;
  remaining: number;
  requiredMonthly: number;
  rate: number;
  balance: number;
}

function computeReadiness(baseline: MonthlyBaseline, input: ReadinessInput): number {
  const progress = clamp(input.saved / Math.max(1, input.targetAmount), 0, 1) * 35;
  const pace = input.remaining <= 0 ? 30 : clamp(input.rate / Math.max(1, input.requiredMonthly), 0, 1) * 30;
  const stability = baseline.nets.length >= 2 ? clamp(1 - coefficientOfVariation(baseline.nets), 0, 1) * 15 : 10;
  const spending = baseline.income > 0 ? clamp(1 - baseline.expenses / baseline.income, 0, 1) * 10 : 0;
  const liquidity = input.remaining <= 0 ? 10 : clamp(input.balance / input.remaining, 0, 1) * 10;
  return Math.round(clamp(progress + pace + stability + spending + liquidity, 0, 100));
}

function statusFor(score: number, remaining: number): DreamStatus {
  if (remaining <= 0 || score >= 75) return 'on_track';
  if (score >= 45) return 'building_momentum';
  return 'at_risk';
}

function recommendActions(status: DreamStatus | null, rate: number, required: number, topExpense: string | null): string[] {
  if (status === null) {
    return ['Connect your PayPal transaction history to unlock a personalised monthly plan.'];
  }
  if (status === 'on_track') {
    return [
      'Keep your current monthly contributions steady.',
      'Turn on AutoPay so this dream is funded automatically each month.',
    ];
  }
  return [
    `Save an extra ${formatMoney(Math.max(0, required - rate))} per month to bring your affordability date closer.`,
    topExpense
      ? `Trim spending on ${topExpense} to free up more room for this dream.`
      : 'Review your monthly spending to find extra room for savings.',
    'Turn on AutoPay so a set amount moves to this dream every month.',
  ];
}

function buildInsight(status: DreamStatus | null, rate: number, required: number, affordability: Date | null, targetLabel: string): string | null {
  if (status === null) return null;
  const dateSentence = affordability
    ? ` Your projected affordability date is ${affordability.toLocaleDateString('en-US', LABEL_DATE)}.`
    : '';
  const opening = `Based on your recent activity, you can realistically save about ${formatMoney(rate)} per month toward this dream.`;
  if (status === 'on_track') {
    return `${opening} You are on track to reach it by ${targetLabel}.${dateSentence}`;
  }
  if (status === 'building_momentum') {
    return `${opening} You are building momentum. Saving ${formatMoney(required)} each month keeps you on schedule for ${targetLabel}.${dateSentence}`;
  }
  return `${opening} Every contribution moves you closer. Saving ${formatMoney(required)} each month would bring ${targetLabel} within reach.${dateSentence}`;
}

function candidatesFor(dreamType: DreamType, catalog: MarketCatalog): Candidate[] {
  if (dreamType === 'car') {
    return catalog.vehicles
      .filter((v) => v.kind === 'car')
      .map((v) => ({ key: v.id, name: `${v.brand} ${v.model}`, detail: 'Car', priceInr: v.priceInr }));
  }
  if (dreamType === 'bike') {
    return catalog.vehicles
      .filter((v) => v.kind === 'bike' || v.kind === 'scooter')
      .map((v) => ({ key: v.id, name: `${v.brand} ${v.model}`, detail: v.kind === 'bike' ? 'Motorbike' : 'Scooter', priceInr: v.priceInr }));
  }
  if (dreamType === 'travel') {
    return catalog.destinations.map((d) => ({ key: d.id, name: `${d.name}, ${d.country}`, detail: d.highlight, priceInr: d.tripCostInr }));
  }
  return [];
}

interface Candidate {
  key: string;
  name: string;
  detail: string;
  priceInr: number;
}

function computeReadinessScoreForOption(currentSaved: number, targetAmount: number, monthlyRate: number, monthsLeft: number): number {
  if (targetAmount <= 0) return 100;
  const progressScore = Math.min(100, (currentSaved / targetAmount) * 100) * 0.4;
  const neededMonthly = (targetAmount - currentSaved) / Math.max(1, monthsLeft);
  const capacityRatio = monthlyRate > 0 ? Math.min(1, monthlyRate / Math.max(1, neededMonthly)) : 0;
  const probabilityScore = capacityRatio * 100 * 0.4;
  const consistencyScore = monthlyRate > 0 ? 20 : 10;
  return Math.min(100, Math.max(0, Math.round(progressScore + probabilityScore + consistencyScore)));
}

function buildOption(
  candidate: Candidate,
  currentSaved: number,
  monthlyRate: number,
  monthsUntilTarget: number,
  now: Date,
): DreamOption {
  const remaining = candidate.priceInr - currentSaved;

  if (remaining <= 0) {
    return {
      key: candidate.key,
      name: candidate.name,
      detail: candidate.detail,
      priceInr: candidate.priceInr,
      bucket: 'affordable_now',
      expectedDate: now,
      monthsToAfford: 0,
      monthlyRequired: 0,
      readinessScore: 100,
    };
  }

  const monthsToAfford = monthlyRate > 0 ? remaining / monthlyRate : null;
  const expectedDate = monthsToAfford !== null ? addMonths(now, monthsToAfford) : null;
  const byTarget = monthsToAfford !== null && monthsToAfford <= monthsUntilTarget;
  const monthlyRequired = monthsUntilTarget > 0 ? Math.ceil(remaining / monthsUntilTarget) : remaining;

  return {
    key: candidate.key,
    name: candidate.name,
    detail: candidate.detail,
    priceInr: candidate.priceInr,
    bucket: byTarget ? 'affordable_by_target' : 'stretch',
    expectedDate,
    monthsToAfford,
    monthlyRequired,
    readinessScore: computeReadinessScoreForOption(currentSaved, candidate.priceInr, monthlyRate, monthsToAfford ?? monthsUntilTarget),
  };
}

const BUCKET_ORDER: Record<OptionBucket, number> = { affordable_now: 0, affordable_by_target: 1, stretch: 2 };

function compareOptions(a: DreamOption, b: DreamOption): number {
  const bucketDiff = BUCKET_ORDER[a.bucket] - BUCKET_ORDER[b.bucket];
  if (bucketDiff !== 0) return bucketDiff;
  const dateA = a.expectedDate?.getTime() ?? Number.POSITIVE_INFINITY;
  const dateB = b.expectedDate?.getTime() ?? Number.POSITIVE_INFINITY;
  if (dateA !== dateB) return dateA - dateB;
  return a.priceInr - b.priceInr;
}

export function computeDreamPlan({
  goal,
  allGoals,
  forecast,
  transactions,
  budget,
  incomeHistory,
  paypal,
  catalog,
  now = new Date(),
}: DreamPlanInput): DreamPlan {
  const baseline = resolveBaseline(paypal, budget, incomeHistory);
  const monthsUntilTarget = monthsBetween(now, new Date(`${goal.targetDate}T23:59:59`));
  const remaining = goal.targetAmount - goal.saved;
  const requiredMonthly = remaining <= 0
    ? 0
    : monthsUntilTarget > 0 ? Math.ceil(remaining / monthsUntilTarget) : remaining;

  const predictedTotal = baseline ? predictedTotalSavings(baseline, monthlyDreamDeposits(transactions, baseline.monthsObserved)) : null;
  const totalRemaining = allGoals.reduce((sum, item) => sum + Math.max(0, item.targetAmount - item.saved), 0);
  const share = totalRemaining > 0 ? Math.max(0, remaining) / totalRemaining : 0;
  const allocated = forecast?.allocatedMonthly ?? 0;
  const monthlySavingsRate = predictedTotal === null
    ? null
    : Math.round(allocated > 0 ? Math.min(allocated, predictedTotal) : predictedTotal * share);

  const readinessScore = baseline && monthlySavingsRate !== null
    ? computeReadiness(baseline, {
      saved: goal.saved,
      targetAmount: goal.targetAmount,
      remaining,
      requiredMonthly,
      rate: monthlySavingsRate,
      balance: calculateProtectedBalance(paypal.paypalBalance, allGoals.reduce((sum, item) => sum + item.saved, 0)).spendableBalance,
    })
    : null;
  const status = readinessScore === null ? null : statusFor(readinessScore, remaining);

  const affordability = monthlySavingsRate === null
    ? null
    : remaining <= 0 ? now : monthlySavingsRate > 0 ? addMonths(now, remaining / monthlySavingsRate) : null;

  const targetLabel = new Date(goal.targetDate).toLocaleDateString('en-US', LABEL_DATE);
  const rateForOptions = monthlySavingsRate ?? 0;
  const options = candidatesFor(goal.dreamType, catalog)
    .map((candidate) => buildOption(candidate, goal.saved, rateForOptions, monthsUntilTarget, now))
    .sort(compareOptions);

  const stretchOptions = options.filter((option) => option.bucket === 'stretch');
  const shownOptions = options.filter((option) => option.bucket !== 'stretch')
    .concat(stretchOptions.slice(0, STRETCH_LIMIT));

  return {
    goalId: goal.id,
    goalName: goal.name,
    dreamType: goal.dreamType,
    targetDate: goal.targetDate,
    targetAmount: goal.targetAmount,
    currentSaved: goal.saved,
    monthlySavingsRate,
    monthsUntilTarget,
    projectedSavingsByTargetDate: monthlySavingsRate === null
      ? null
      : Math.round(goal.saved + monthlySavingsRate * monthsUntilTarget),
    recommendedMonthlySaving: requiredMonthly,
    readinessScore,
    status,
    affordabilityDate: affordability,
    insight: buildInsight(status, monthlySavingsRate ?? 0, requiredMonthly, affordability, targetLabel),
    recommendedActions: recommendActions(status, monthlySavingsRate ?? 0, requiredMonthly, baseline?.topExpense ?? null),
    options: shownOptions.sort(compareOptions),
    stretchTotal: stretchOptions.length,
  };
}
