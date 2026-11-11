import { computePayPalFlow } from '@/lib/aiPredictions';
import { analyzeBudget, buildPortfolio, calculateAdaptiveAutoSave, calculateProtectedBalance, type AdaptiveAutoSave, type PortfolioForecast } from '@/lib/finance';
import { EMPTY_PAYPAL, type Workspace } from '@/lib/piggyBankApi';
import type { Budget, Goal, GoalTransaction, GoalWithSaved } from '@/types';

export interface AutoPayAllocation {
  goalId: string;
  name: string;
  amount: number;
}

export interface AutoPaySnapshot {
  adaptive: AdaptiveAutoSave;
  portfolio: PortfolioForecast;
  selectedGoalIds: string[];
  allocations: AutoPayAllocation[];
  totalMonthly: number;
}

export function withSavedAmounts(goals: Goal[], transactions: GoalTransaction[]): GoalWithSaved[] {
  const savedByGoal = new Map<string, number>();
  for (const tx of transactions) savedByGoal.set(tx.goalId, (savedByGoal.get(tx.goalId) ?? 0) + (tx.kind === 'deposit' ? tx.amount : -tx.amount));
  return goals.map((goal) => ({ ...goal, saved: Math.max(0, savedByGoal.get(goal.id) ?? 0) }));
}

export function computeAutoPay(workspace: Workspace | null, now: Date = new Date()): AutoPaySnapshot {
  const paypal = workspace?.paypal ?? EMPTY_PAYPAL;
  const goals = withSavedAmounts(workspace?.goals ?? [], workspace?.transactions ?? []);
  const protectedSavings = goals.reduce((sum, goal) => sum + goal.saved, 0);
  const flow = paypal.isSandbox ? computePayPalFlow(paypal, now) : null;
  const spendableBalance = calculateProtectedBalance(paypal.paypalBalance, protectedSavings).spendableBalance;
  const budget: Budget = flow
    ? { monthlyIncome: flow.incomeThisMonth, monthlyExpenses: flow.expensesThisMonth }
    : (workspace?.budget ?? { monthlyIncome: 0, monthlyExpenses: 0 });
  const adaptive = calculateAdaptiveAutoSave(budget, workspace?.incomeHistory ?? []);
  const safeCapacity = flow
    ? (spendableBalance > 0 ? adaptive.amount : 0)
    : analyzeBudget(budget).safeMonthlyAmount;
  const selectedGoalIds = (workspace?.autoSave.goalIds ?? []).filter((id) => goals.some((goal) => goal.id === id));
  const portfolio = buildPortfolio(budget, goals, now, safeCapacity, selectedGoalIds);

  const allocations = selectedGoalIds.map((goalId) => ({
    goalId,
    name: goals.find((goal) => goal.id === goalId)?.name ?? '',
    amount: portfolio.goals.find((forecast) => forecast.goalId === goalId)?.allocatedMonthly ?? 0,
  }));

  return {
    adaptive,
    portfolio,
    selectedGoalIds,
    allocations,
    totalMonthly: allocations.reduce((sum, allocation) => sum + allocation.amount, 0),
  };
}
