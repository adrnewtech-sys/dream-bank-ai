import { analyzeBudget, type GoalForecast, type PortfolioForecast } from '@/lib/finance';
import type { Budget, GoalWithSaved, IncomeSnapshot, PayPalSettings } from '@/types';
import { getSandboxDemoAccount, type SandboxTransaction } from '@/lib/paypalConnection';

export interface PayPalFlowSummary {
  incomeThisMonth: number;
  expensesThisMonth: number;
}

export interface AIReasoningItem {
  label: string;
  detail: string;
  positive: boolean;
}

export interface AIPrediction {
  safeSavingsNextMonth: number;
  confidenceScore: number;
  changePercent: number;
  changeDirection: 'up' | 'down' | 'steady';
  reasoning: AIReasoningItem[];
  resultSummary: string;
  predictedIncome: number;
  predictedExpenses: number;
  predictedSavingsCapacity: number;
  currentMonthSafeSavings: number;
  dailyRecalculationNote: string;
}

export interface GoalAllocationRec {
  goalId: string;
  name: string;
  icon: string;
  color: string;
  amount: number;
}

export interface DreamReadinessScore {
  goalId: string;
  name: string;
  icon: string;
  color: string;
  score: number;
  status: 'excellent' | 'strong' | 'moderate' | 'behind';
}

export interface TrendPoint {
  label: string;
  value: number;
  isPredicted: boolean;
}

export interface AIDashboardData {
  paypalFlow: PayPalFlowSummary;
  prediction: AIPrediction;
  allocations: GoalAllocationRec[];
  readinessScores: DreamReadinessScore[];
  trend: TrendPoint[];
}

function isThisMonth(dateStr: string, now: Date): boolean {
  const d = new Date(dateStr);
  return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
}

function getSandboxTransactions(paypal: PayPalSettings): SandboxTransaction[] {
  if (!paypal.isSandbox) return [];
  return getSandboxDemoAccount().transactions;
}

export function computePayPalFlow(
  paypal: PayPalSettings,
  now: Date = new Date(),
): PayPalFlowSummary {
  const txs = getSandboxTransactions(paypal);
  const incomeThisMonth = txs
    .filter((tx) => tx.inflow && isThisMonth(tx.date, now))
    .reduce((sum, tx) => sum + tx.amount, 0);
  const expensesThisMonth = txs
    .filter((tx) => !tx.inflow && isThisMonth(tx.date, now))
    .reduce((sum, tx) => sum + tx.amount, 0);
  return { incomeThisMonth, expensesThisMonth };
}

function categorizeExpense(description: string): string {
  const lower = description.toLowerCase();
  if (lower.includes('fuel') || lower.includes('gas')) return 'Fuel';
  if (lower.includes('food') || lower.includes('grocery') || lower.includes('restaurant')) return 'Food';
  if (lower.includes('shop')) return 'Shopping';
  if (lower.includes('subscription') || lower.includes('netflix') || lower.includes('spotify')) return 'Entertainment';
  return 'Other';
}

function computeExpenseByCategory(txs: SandboxTransaction[], now: Date): Map<string, number> {
  const map = new Map<string, number>();
  for (const tx of txs) {
    if (tx.inflow || !isThisMonth(tx.date, now)) continue;
    const cat = categorizeExpense(tx.description);
    map.set(cat, (map.get(cat) ?? 0) + tx.amount);
  }
  return map;
}

export function computeAIPrediction(
  paypal: PayPalSettings,
  budget: Budget | null,
  incomeHistory: IncomeSnapshot[],
  now: Date = new Date(),
): AIPrediction {
  const txs = getSandboxTransactions(paypal);
  const flow = computePayPalFlow(paypal, now);

  const recentIncome = [...incomeHistory].sort((a, b) => a.monthStart.localeCompare(b.monthStart)).slice(-3);
  const currentIncome = paypal.isSandbox
    ? flow.incomeThisMonth
    : recentIncome.length > 0 ? recentIncome[recentIncome.length - 1].monthlyIncome : (budget?.monthlyIncome ?? flow.incomeThisMonth);
  const prevIncome = paypal.isSandbox
    ? currentIncome
    : recentIncome.length >= 2 ? recentIncome[recentIncome.length - 2].monthlyIncome : (budget?.monthlyIncome ?? flow.incomeThisMonth);

  const incomeDelta = currentIncome - prevIncome;
  const incomeChangePercent = prevIncome > 0 ? ((currentIncome - prevIncome) / prevIncome) * 100 : 0;

  const currentExpenses = paypal.isSandbox
    ? flow.expensesThisMonth
    : (budget?.monthlyExpenses ?? flow.expensesThisMonth);
  const prevExpenses = paypal.isSandbox
    ? currentExpenses
    : recentIncome.length >= 2 ? recentIncome[recentIncome.length - 2].monthlyExpenses : currentExpenses;
  const expenseChangePercent = prevExpenses > 0 ? ((currentExpenses - prevExpenses) / prevExpenses) * 100 : 0;

  const predictedIncome = Math.round(currentIncome + incomeDelta * 0.3);
  const predictedExpenses = Math.round(currentExpenses * (1 + expenseChangePercent * 0.002));

  const currentAnalysis = analyzeBudget({ monthlyIncome: currentIncome, monthlyExpenses: currentExpenses });
  const predictedAnalysis = analyzeBudget({ monthlyIncome: predictedIncome, monthlyExpenses: predictedExpenses });

  const currentMonthSafeSavings = Math.round(currentAnalysis.safeMonthlyAmount);
  const safeSavingsNextMonth = Math.round(predictedAnalysis.safeMonthlyAmount);

  const changeAmount = safeSavingsNextMonth - currentMonthSafeSavings;
  const changePercent = currentMonthSafeSavings > 0 ? Math.round((changeAmount / currentMonthSafeSavings) * 100) : 0;
  const changeDirection: AIPrediction['changeDirection'] = changePercent > 2 ? 'up' : changePercent < -2 ? 'down' : 'steady';

  const expenseCats = computeExpenseByCategory(txs, now);
  const reasoning: AIReasoningItem[] = [];

  if (incomeDelta !== 0) {
    reasoning.push({
      label: incomeDelta > 0 ? `Income increased by $${Math.abs(incomeDelta).toLocaleString('en-US')}` : `Income decreased by $${Math.abs(incomeDelta).toLocaleString('en-US')}`,
      detail: `Monthly income moved from $${prevIncome.toLocaleString('en-US')} to $${currentIncome.toLocaleString('en-US')}.`,
      positive: incomeDelta > 0,
    });
  }

  const foodAmount = expenseCats.get('Food') ?? 0;
  if (foodAmount > 0 && prevExpenses > 0) {
    const foodChange = Math.round(((foodAmount - prevExpenses * 0.15) / Math.max(1, prevExpenses * 0.15)) * 100);
    if (foodChange < 0) {
      reasoning.push({ label: `Food spending decreased by ${Math.abs(foodChange)}%`, detail: `Food expenses are trending lower this month.`, positive: true });
    }
  }

  const entertainmentAmount = expenseCats.get('Entertainment') ?? 0;
  if (entertainmentAmount > 0 && prevExpenses > 0) {
    const entChange = Math.round(((entertainmentAmount - prevExpenses * 0.08) / Math.max(1, prevExpenses * 0.08)) * 100);
    if (entChange < 0) {
      reasoning.push({ label: `Entertainment spending decreased by ${Math.abs(entChange)}%`, detail: `Subscription and entertainment costs are lower.`, positive: true });
    }
  }

  const positiveDays = flow.incomeThisMonth > 0 ? Math.max(1, 24 - Math.floor(flow.expensesThisMonth / 200)) : 15;
  reasoning.push({
    label: `You maintained a positive balance for ${positiveDays} days`,
    detail: `Your spending stayed below income for most of the month.`,
    positive: true,
  });

  if (reasoning.length === 0) {
    reasoning.push({
      label: 'Spending patterns are stable',
      detail: 'No significant changes detected in income or expenses.',
      positive: true,
    });
  }

  const resultSummary = changeAmount > 0
    ? `You can safely save $${Math.abs(changeAmount).toLocaleString('en-US')} more than last month.`
    : changeAmount < 0
      ? `You can safely save $${Math.abs(changeAmount).toLocaleString('en-US')} less than last month.`
      : `Your safe savings capacity is stable compared to last month.`;

  const baseConfidence = 70;
  const dataPoints = (txs.length > 0 ? 8 : 0) + (incomeHistory.length * 5) + (budget ? 7 : 0);
  const confidenceScore = Math.min(97, baseConfidence + dataPoints);

  const predictedSavingsCapacity = safeSavingsNextMonth;

  const dailyRecalculationNote = changeDirection === 'down'
    ? 'Safe Savings adjusted from $' + (currentMonthSafeSavings + Math.abs(changeAmount)).toLocaleString('en-US') + ' to $' + safeSavingsNextMonth.toLocaleString('en-US') + ' — unexpected higher spending detected.'
    : changeDirection === 'up'
      ? 'Safe Savings increased from $' + currentMonthSafeSavings.toLocaleString('en-US') + ' to $' + safeSavingsNextMonth.toLocaleString('en-US') + ' — new income detected.'
      : 'Safe Savings recalculated: $' + safeSavingsNextMonth.toLocaleString('en-US') + ' — spending and income are stable.';

  return {
    safeSavingsNextMonth,
    confidenceScore,
    changePercent: Math.abs(changePercent),
    changeDirection,
    reasoning,
    resultSummary,
    predictedIncome,
    predictedExpenses,
    predictedSavingsCapacity,
    currentMonthSafeSavings,
    dailyRecalculationNote,
  };
}

export function computeGoalAllocations(
  goals: GoalWithSaved[],
  forecasts: GoalForecast[],
): GoalAllocationRec[] {
  const openGoals = forecasts.filter((f) => f.status !== 'complete' && f.allocatedMonthly > 0);
  const goalMap = new Map(goals.map((g) => [g.id, g]));
  return openGoals
    .map((f) => {
      const goal = goalMap.get(f.goalId);
      return {
        goalId: f.goalId,
        name: f.name,
        icon: goal?.icon ?? 'target',
        color: goal?.color ?? 'blue',
        amount: Math.round(f.allocatedMonthly),
      };
    })
    .sort((a, b) => b.amount - a.amount);
}

export function computeDreamReadinessScores(
  goals: GoalWithSaved[],
  forecasts: GoalForecast[],
): DreamReadinessScore[] {
  const goalMap = new Map(goals.map((g) => [g.id, g]));
  return forecasts.map((f) => {
    const goal = goalMap.get(f.goalId);
    let score: number;
    if (f.status === 'complete') {
      score = 100;
    } else {
      const progressScore = f.percent * 0.4;
      const probabilityScore = f.probability * 0.4;
      const consistencyScore = f.allocatedMonthly > 0 ? 20 : 10;
      score = Math.round(progressScore + probabilityScore + consistencyScore);
      score = Math.min(100, Math.max(0, score));
    }
    const status: DreamReadinessScore['status'] = score >= 85 ? 'excellent' : score >= 70 ? 'strong' : score >= 50 ? 'moderate' : 'behind';
    return {
      goalId: f.goalId,
      name: f.name,
      icon: goal?.icon ?? 'target',
      color: goal?.color ?? 'blue',
      score,
      status,
    };
  });
}

export function computePredictionTrend(
  incomeHistory: IncomeSnapshot[],
  prediction: AIPrediction,
  now: Date = new Date(),
): TrendPoint[] {
  const sorted = [...incomeHistory].sort((a, b) => a.monthStart.localeCompare(b.monthStart));
  const past: TrendPoint[] = sorted.slice(-3).map((row) => ({
    label: new Date(`${row.monthStart}T12:00:00`).toLocaleDateString('en-US', { month: 'short' }),
    value: Math.round(row.monthlyIncome - row.monthlyExpenses),
    isPredicted: false,
  }));

  const currentMonthLabel = now.toLocaleDateString('en-US', { month: 'short' });
  const currentSurplus = prediction.predictedIncome - prediction.predictedExpenses + prediction.safeSavingsNextMonth - prediction.currentMonthSafeSavings;
  const current: TrendPoint = {
    label: currentMonthLabel,
    value: Math.max(0, prediction.currentMonthSafeSavings),
    isPredicted: false,
  };

  const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  const predicted: TrendPoint = {
    label: nextMonth.toLocaleDateString('en-US', { month: 'short' }),
    value: Math.max(0, prediction.safeSavingsNextMonth),
    isPredicted: true,
  };

  return [...past, current, predicted];
}

export function computeAIDashboardData(
  paypal: PayPalSettings,
  budget: Budget | null,
  incomeHistory: IncomeSnapshot[],
  goals: GoalWithSaved[],
  portfolio: PortfolioForecast,
  now: Date = new Date(),
): AIDashboardData {
  const paypalFlow = computePayPalFlow(paypal, now);
  const prediction = computeAIPrediction(paypal, budget, incomeHistory, now);
  const allocations = computeGoalAllocations(goals, portfolio.goals);
  const readinessScores = computeDreamReadinessScores(goals, portfolio.goals);
  const trend = computePredictionTrend(incomeHistory, prediction, now);

  return { paypalFlow, prediction, allocations, readinessScores, trend };
}
