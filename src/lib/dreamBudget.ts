import { analyzeBudget, type PortfolioForecast } from '@/lib/finance';
import type { Budget, IncomeSnapshot } from '@/types';

const RECENCY_WEIGHTS = [0.5, 0.3, 0.2];

export interface DreamBudgetGoal {
  goalId: string;
  name: string;
  amount: number;
}

export interface DreamBudget {
  predictedIncome: number;
  predictedExpenses: number;
  safeSavings: number;
  goals: DreamBudgetGoal[];
}

function weightedAverage(values: number[]): number {
  const weights = RECENCY_WEIGHTS.slice(0, values.length);
  const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);
  return values.reduce((sum, value, index) => sum + value * weights[index], 0) / totalWeight;
}

export function calculateDreamBudget(
  budget: Budget | null,
  incomeHistory: IncomeSnapshot[],
  portfolio: PortfolioForecast,
): DreamBudget | null {
  if (!budget || budget.monthlyIncome <= 0) return null;

  const recent = [...incomeHistory]
    .sort((a, b) => b.monthStart.localeCompare(a.monthStart))
    .slice(0, RECENCY_WEIGHTS.length);

  const predictedIncome = recent.length > 0
    ? weightedAverage(recent.map((row) => row.monthlyIncome))
    : budget.monthlyIncome;
  const predictedExpenses = recent.length > 0
    ? weightedAverage(recent.map((row) => row.monthlyExpenses))
    : budget.monthlyExpenses;

  const safeSavings = Math.round(
    analyzeBudget({ monthlyIncome: predictedIncome, monthlyExpenses: predictedExpenses }).safeMonthlyAmount,
  );

  const openGoals = portfolio.goals.filter((goal) => goal.status !== 'complete');
  const totalAllocated = openGoals.reduce((sum, goal) => sum + goal.allocatedMonthly, 0);

  return {
    predictedIncome: Math.round(predictedIncome),
    predictedExpenses: Math.round(predictedExpenses),
    safeSavings,
    goals: openGoals
      .filter((goal) => goal.allocatedMonthly > 0)
      .map((goal) => ({
        goalId: goal.goalId,
        name: goal.name,
        amount: totalAllocated > 0 ? Math.round((safeSavings * goal.allocatedMonthly) / totalAllocated) : 0,
      })),
  };
}
