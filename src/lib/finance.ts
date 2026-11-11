import type { Budget, GoalTransaction, GoalWithSaved, IncomeSnapshot } from '@/types';
import { allocateMonthlyContributions, monthsUntil, scoreGoals, type GoalScore } from '@/lib/goalAllocation';

const SAFE_CUSHION = 0.8;
const MAX_SAVINGS_RATE = 0.35;
const AGGRESSIVE_SHARE_OF_SURPLUS = 0.6;
const DAYS_PER_MONTH = 30.44;
const MS_PER_DAY = 86_400_000;

export type BudgetHealth = 'incomplete' | 'deficit' | 'tight' | 'steady' | 'strong';
export type GoalStatus = 'complete' | 'overdue' | 'on-track' | 'at-risk' | 'off-track';
export type HealthGrade = 'on-track' | 'needs-attention' | 'at-risk';

export interface Warning {
  level: 'info' | 'warning' | 'danger';
  message: string;
}

export interface GoalHealthScore {
  score: number;
  grade: HealthGrade;
  label: string;
  savingsConsistency: number;
  incomeStability: number;
  goalProgress: number;
  recommendations: string[];
}

export interface BudgetAnalysis {
  health: BudgetHealth;
  surplus: number;
  expenseRatio: number;
  safeRate: number;
  safeMonthlyAmount: number;
}

export interface SavingsPlan {
  id: 'conservative' | 'balanced' | 'stretch';
  label: string;
  monthly: number;
  months: number;
  meetsDeadline: boolean;
}

export interface GoalForecast {
  goalId: string;
  name: string;
  saved: number;
  remaining: number;
  percent: number;
  monthsLeft: number;
  requiredMonthly: number;
  allocatedMonthly: number;
  priorityScore: number;
  urgencyScore: number;
  probability: number;
  status: GoalStatus;
  projectedDate: Date | null;
  plans: SavingsPlan[];
  recommendedPlanId: SavingsPlan['id'] | null;
  warnings: Warning[];
}

export interface PortfolioForecast {
  analysis: BudgetAnalysis;
  goals: GoalForecast[];
  totalTarget: number;
  totalSaved: number;
  totalRequired: number;
  totalAllocated: number;
  warnings: Warning[];
}

export interface ProtectedBalance {
  totalBalance: number;
  protectedBalance: number;
  spendableBalance: number;
}

export function calculateProtectedBalance(paypalBalance: number, totalSaved: number): ProtectedBalance {
  const totalBalance = paypalBalance;
  const protectedBalance = Math.min(totalSaved, totalBalance);
  const spendableBalance = Math.max(0, totalBalance - protectedBalance);
  return { totalBalance, protectedBalance, spendableBalance };
}

export interface SpendingImpactResult {
  affectedGoals: Array<{
    goalId: string;
    name: string;
    currentSaved: number;
    newSaved: number;
    delayMonths: number;
    newProjectedDate: Date | null;
  }>;
  spendableAfter: number;
  wouldBorrowFromGoals: boolean;
  severity: 'safe' | 'warning' | 'danger';
  recommendedAction: string;
}

export function calculateSpendingImpact(
  purchaseAmount: number,
  spendableBalance: number,
  goals: GoalWithSaved[],
  forecasts: GoalForecast[],
  now: Date = new Date(),
): SpendingImpactResult {
  const spendableAfter = spendableBalance - purchaseAmount;
  const wouldBorrowFromGoals = spendableAfter < 0;

  if (!wouldBorrowFromGoals) {
    return {
      affectedGoals: [],
      spendableAfter,
      wouldBorrowFromGoals: false,
      severity: 'safe',
      recommendedAction: 'This purchase fits within your spendable balance. Your goal vaults are safe.',
    };
  }

  const shortfall = Math.abs(spendableAfter);
  const sortedGoals = [...goals].sort((a, b) => b.saved - a.saved);
  let remainingShortfall = shortfall;
  const affectedGoals: SpendingImpactResult['affectedGoals'] = [];

  for (const goal of sortedGoals) {
    if (remainingShortfall <= 0) break;
    if (goal.saved <= 0) continue;
    const take = Math.min(remainingShortfall, goal.saved);
    const newSaved = goal.saved - take;
    remainingShortfall -= take;

    const forecast = forecasts.find((f) => f.goalId === goal.id);
    const oldProjected = forecast?.projectedDate ?? null;
    const remaining = Math.max(0, goal.targetAmount - newSaved);
    const allocated = forecast?.allocatedMonthly ?? 0;
    const newProjected = allocated > 0 && remaining > 0 ? addMonths(now, remaining / allocated) : null;

    const oldMonths = oldProjected ? Math.ceil((oldProjected.getTime() - now.getTime()) / (DAYS_PER_MONTH * MS_PER_DAY)) : 0;
    const newMonths = newProjected ? Math.ceil((newProjected.getTime() - now.getTime()) / (DAYS_PER_MONTH * MS_PER_DAY)) : 0;
    const delayMonths = Math.max(0, newMonths - oldMonths);

    affectedGoals.push({
      goalId: goal.id,
      name: goal.name,
      currentSaved: goal.saved,
      newSaved,
      delayMonths,
      newProjectedDate: newProjected,
    });
  }

  const maxDelay = Math.max(...affectedGoals.map((g) => g.delayMonths), 0);
  const severity: SpendingImpactResult['severity'] = maxDelay >= 3 ? 'danger' : 'warning';

  const goalNames = affectedGoals.map((g) => g.name).join(', ');
  const recommendedAction = maxDelay >= 3
    ? `This purchase would delay ${goalNames} by ${maxDelay} months. Consider waiting or saving separately for this purchase.`
    : `This purchase will dip into your protected goals. ${goalNames} will be delayed by up to ${maxDelay} month${maxDelay === 1 ? '' : 's'}.`;

  return { affectedGoals, spendableAfter, wouldBorrowFromGoals, severity, recommendedAction };
}

export interface GoalAllocation {
  goalId: string;
  name: string;
  percent: number;
  allocatedMonthly: number;
  saved: number;
}

export function calculateAllocations(goals: GoalWithSaved[], forecasts: GoalForecast[]): GoalAllocation[] {
  const totalAllocated = forecasts.reduce((sum, f) => sum + f.allocatedMonthly, 0);
  return goals.map((goal) => {
    const forecast = forecasts.find((f) => f.goalId === goal.id);
    const allocated = forecast?.allocatedMonthly ?? 0;
    const percent = totalAllocated > 0 ? (allocated / totalAllocated) * 100 : 0;
    return {
      goalId: goal.id,
      name: goal.name,
      percent,
      allocatedMonthly: allocated,
      saved: goal.saved,
    };
  }).sort((a, b) => b.percent - a.percent);
}

export function analyzeBudget({ monthlyIncome, monthlyExpenses }: Budget): BudgetAnalysis {
  const surplus = monthlyIncome - monthlyExpenses;
  const expenseRatio = monthlyIncome > 0 ? monthlyExpenses / monthlyIncome : 1;
  const safeRate =
    monthlyIncome > 0 ? Math.min(Math.max(0, surplus * SAFE_CUSHION) / monthlyIncome, MAX_SAVINGS_RATE) : 0;

  return {
    health: getBudgetHealth(monthlyIncome, expenseRatio),
    surplus,
    expenseRatio,
    safeRate,
    safeMonthlyAmount: monthlyIncome * safeRate,
  };
}

function getBudgetHealth(income: number, expenseRatio: number): BudgetHealth {
  if (income <= 0) return 'incomplete';
  if (expenseRatio >= 1) return 'deficit';
  if (expenseRatio >= 0.9) return 'tight';
  if (expenseRatio >= 0.7) return 'steady';
  return 'strong';
}

function addMonths(now: Date, months: number): Date {
  return new Date(now.getTime() + months * DAYS_PER_MONTH * MS_PER_DAY);
}

export function completionProbability(remaining: number, months: number, monthlyBudget: number): number {
  if (remaining <= 0) return 100;
  if (months <= 0 || monthlyBudget <= 0) return 1;
  const ratio = (monthlyBudget * months) / remaining;
  const score = 100 / (1 + Math.exp(-6 * (ratio - 0.8)));
  return Math.min(98, Math.max(1, Math.round(score)));
}

const PLAN_RATE_FACTORS: Array<Pick<SavingsPlan, 'id' | 'label'> & { factor: number }> = [
  { id: 'conservative', label: 'Conservative', factor: 0.75 },
  { id: 'balanced', label: 'Balanced', factor: 1 },
  { id: 'stretch', label: 'Stretch', factor: 1.25 },
];

function buildPlans(remaining: number, monthsLeft: number, analysis: BudgetAnalysis): SavingsPlan[] {
  if (remaining <= 0 || monthsLeft <= 0 || analysis.safeMonthlyAmount <= 0) return [];

  const requiredMonthly = remaining / monthsLeft;
  const deadlineMonths = Math.ceil(monthsLeft);

  return PLAN_RATE_FACTORS.map(({ id, label, factor }) => {
    const monthly = requiredMonthly * factor;
    const months = Math.ceil(remaining / monthly);
    return { id, label, monthly, months, meetsDeadline: months <= deadlineMonths };
  });
}

function pickRecommendedPlan(plans: SavingsPlan[]): SavingsPlan['id'] | null {
  const onTime = plans.filter((plan) => plan.meetsDeadline);
  if (onTime.length === 0) return null;
  return onTime.reduce((lowest, plan) => (plan.monthly < lowest.monthly ? plan : lowest)).id;
}

function forecastGoal(
  goal: GoalWithSaved,
  allocated: number,
  analysis: BudgetAnalysis,
  now: Date,
  score?: GoalScore,
): GoalForecast {
  const remaining = Math.max(0, goal.targetAmount - goal.saved);
  const percent = goal.targetAmount > 0 ? Math.min(100, (goal.saved / goal.targetAmount) * 100) : 0;
  const monthsLeft = monthsUntil(goal.targetDate, now);
  const wholeMonths = Math.ceil(monthsLeft);
  const requiredMonthly = remaining === 0 ? 0 : wholeMonths > 0 ? remaining / wholeMonths : remaining;
  const probability = completionProbability(remaining, wholeMonths, allocated);
  const plans = buildPlans(remaining, monthsLeft, analysis);

  let status: GoalStatus;
  if (remaining === 0) status = 'complete';
  else if (wholeMonths === 0) status = 'overdue';
  else if (probability >= 70) status = 'on-track';
  else if (probability >= 40) status = 'at-risk';
  else status = 'off-track';

  const warnings: Warning[] = [];
  if (status === 'overdue') {
    warnings.push({ level: 'danger', message: `The target date has passed with ${formatShort(remaining)} still to save.` });
  } else if (remaining > 0) {
    if (analysis.safeMonthlyAmount <= 0) {
      warnings.push({ level: 'warning', message: 'No safe savings capacity detected.' });
    } else if (requiredMonthly > analysis.safeMonthlyAmount) {
      warnings.push({
        level: 'warning',
        message: `Needs ${formatShort(requiredMonthly)} a month, above your safe budget of ${formatShort(analysis.safeMonthlyAmount)}. Consider a later date.`,
      });
    }
    if (analysis.surplus > 0 && requiredMonthly > analysis.surplus * AGGRESSIVE_SHARE_OF_SURPLUS) {
      warnings.push({
        level: 'danger',
        message: 'This goal would use more than 60% of your monthly surplus. That is aggressive.',
      });
    }
  }

  return {
    goalId: goal.id,
    name: goal.name,
    saved: goal.saved,
    remaining,
    percent,
    monthsLeft,
    requiredMonthly,
    allocatedMonthly: allocated,
    priorityScore: score?.priorityScore ?? 0,
    urgencyScore: score?.urgencyScore ?? 0,
    probability,
    status,
    projectedDate: allocated > 0 && remaining > 0 ? addMonths(now, remaining / allocated) : null,
    plans,
    recommendedPlanId: pickRecommendedPlan(plans),
    warnings,
  };
}

export function buildPortfolio(
  budget: Budget,
  goals: GoalWithSaved[],
  now: Date,
  safeCapacity: number,
  selectedGoalIds: string[],
): PortfolioForecast {
  const baseAnalysis = analyzeBudget(budget);
  const analysis: BudgetAnalysis = {
    ...baseAnalysis,
    safeMonthlyAmount: Math.max(0, Math.round(safeCapacity)),
    safeRate: budget.monthlyIncome > 0 ? Math.max(0, Math.round(safeCapacity)) / budget.monthlyIncome : 0,
  };
  const scores = scoreGoals(goals, now);
  const allocation = allocateMonthlyContributions(scores, selectedGoalIds, analysis.safeMonthlyAmount);
  const forecasts = goals.map((goal) => forecastGoal(goal, allocation.get(goal.id) ?? 0, analysis, now, scores.get(goal.id)));

  const totalRequired = forecasts.reduce((sum, goal) => sum + goal.requiredMonthly, 0);
  const warnings: Warning[] = [];

  if (analysis.health === 'deficit') {
    warnings.push({ level: 'danger', message: 'Your monthly expenses are higher than your income. Saving is not safe until this changes.' });
  } else if (analysis.health === 'tight') {
    warnings.push({ level: 'warning', message: 'Expenses take up 90% or more of your income, which leaves little room for emergencies.' });
  }

  if (analysis.safeMonthlyAmount <= 0 && goals.some((goal) => goal.targetAmount > goal.saved)) {
    warnings.push({
      level: 'warning',
      message: analysis.health === 'incomplete' ? 'Unable to generate savings plan from current financial data.' : 'No safe savings capacity detected.',
    });
  }

  if (totalRequired > analysis.safeMonthlyAmount && analysis.safeMonthlyAmount > 0) {
    warnings.push({
      level: 'warning',
      message: `Your goals together need ${formatShort(totalRequired)} a month, more than your safe budget of ${formatShort(analysis.safeMonthlyAmount)}.`,
    });
  }
  if (analysis.surplus > 0 && totalRequired > analysis.surplus * AGGRESSIVE_SHARE_OF_SURPLUS) {
    warnings.push({
      level: 'danger',
      message: 'Your combined goals would consume more than 60% of your surplus. Consider extending some target dates.',
    });
  }

  return {
    analysis,
    goals: forecasts,
    totalTarget: goals.reduce((sum, goal) => sum + goal.targetAmount, 0),
    totalSaved: goals.reduce((sum, goal) => sum + goal.saved, 0),
    totalRequired,
    totalAllocated: [...allocation.values()].reduce((sum, value) => sum + value, 0),
    warnings,
  };
}

export interface AdaptiveAutoSave {
  amount: number;
  safetyBuffer: number;
  baseAmount: number;
  trendAdjustment: number;
  reason: string;
  trend: 'up' | 'down' | 'steady';
}

export function calculateAdaptiveAutoSave(
  currentBudget: Budget | null,
  incomeHistory: IncomeSnapshot[],
): AdaptiveAutoSave {
  if (!currentBudget || currentBudget.monthlyIncome <= 0) {
    return { amount: 0, safetyBuffer: 0, baseAmount: 0, trendAdjustment: 0, reason: 'Connect PayPal to analyze your income and spending and calculate an AutoPay contribution.', trend: 'steady' };
  }

  const baseAnalysis = analyzeBudget(currentBudget);
  const safetyBuffer = Math.max(500, Math.round(currentBudget.monthlyIncome * 0.1));
  const baseAmount = Math.min(
    Math.max(0, baseAnalysis.surplus - safetyBuffer),
    currentBudget.monthlyIncome * MAX_SAVINGS_RATE,
  );

  const sorted = [...incomeHistory].sort((a, b) => a.monthStart.localeCompare(b.monthStart));
  const recent = sorted.slice(-6);

  if (recent.length < 2) {
    return {
      amount: Math.round(baseAmount),
      safetyBuffer,
      baseAmount: Math.round(baseAmount),
      trendAdjustment: 0,
      reason: `After reserving ${formatShort(safetyBuffer)} as a safety buffer, AI recommends ${formatShort(baseAmount)} for your dream.`,
      trend: 'steady',
    };
  }

  const avgIncome = recent.reduce((sum, row) => sum + row.monthlyIncome, 0) / recent.length;
  const avgExpenses = recent.reduce((sum, row) => sum + row.monthlyExpenses, 0) / recent.length;
  const avgSurplus = avgIncome - avgExpenses;

  const prevIncome = recent[recent.length - 2].monthlyIncome;
  const latestIncome = currentBudget.monthlyIncome;
  const incomeChange = ((latestIncome - prevIncome) / Math.max(prevIncome, 1)) * 100;

  const prevExpenses = recent[recent.length - 2].monthlyExpenses;
  const latestExpenses = currentBudget.monthlyExpenses;
  const expenseChange = ((latestExpenses - prevExpenses) / Math.max(prevExpenses, 1)) * 100;

  const avgSafeAmount = Math.min(avgSurplus * SAFE_CUSHION, avgIncome * MAX_SAVINGS_RATE);
  const blendedBase = baseAmount * 0.6 + Math.max(0, avgSafeAmount) * 0.4;

  let adjustment = 0;
  let reason = '';
  let trend: AdaptiveAutoSave['trend'] = 'steady';

  if (incomeChange <= -10) {
    adjustment = -blendedBase * 0.25;
    trend = 'down';
    reason = `Income dropped ${Math.abs(Math.round(incomeChange))}% from last month. AutoSave reduced to protect your budget.`;
  } else if (expenseChange >= 15) {
    adjustment = -blendedBase * 0.2;
    trend = 'down';
    reason = `Expenses rose ${Math.round(expenseChange)}% from last month. AutoSave lowered to avoid financial stress.`;
  } else if (incomeChange >= 5 && expenseChange <= 5) {
    adjustment = blendedBase * 0.15;
    trend = 'up';
    reason = `Income is up ${Math.round(incomeChange)}% while expenses stayed steady. AutoSave increased safely.`;
  } else if (avgSurplus > baseAnalysis.surplus * 1.1) {
    adjustment = blendedBase * 0.1;
    trend = 'up';
    reason = `Your average monthly surplus is higher than this month's. AutoSave nudged up based on your 6-month trend.`;
  } else {
    reason = `Your income and expenses are stable. ${formatShort(blendedBase)} keeps a 20% cushion based on your 6-month average.`;
  }

  const rawAmount = blendedBase + adjustment;
  const maxStressFree = currentBudget.monthlyIncome * MAX_SAVINGS_RATE;
  const amount = Math.round(Math.max(0, Math.min(rawAmount, maxStressFree)));

  return {
    amount,
    safetyBuffer,
    baseAmount: Math.round(blendedBase),
    trendAdjustment: Math.round(adjustment),
    reason,
    trend,
  };
}

const HEALTH_NOW = new Date();
const SIX_MONTHS_MS = 182.5 * DAYS_PER_MONTH * MS_PER_DAY;

export function calculateGoalHealthScore(
  portfolio: PortfolioForecast,
  transactions: GoalTransaction[],
  incomeHistory: IncomeSnapshot[],
  hasBudget: boolean,
  now: Date = HEALTH_NOW,
): GoalHealthScore {
  const recommendations: string[] = [];

  const savingsConsistency = (() => {
    const recentDeposits = transactions
      .filter((tx) => tx.kind === 'deposit')
      .filter((tx) => now.getTime() - new Date(tx.createdAt).getTime() <= SIX_MONTHS_MS);
    if (recentDeposits.length === 0) {
      recommendations.push('Add your first contribution to start building a savings streak.');
      return 0;
    }
    const monthKeys = new Set(
      recentDeposits.map((tx) => new Date(tx.createdAt).toISOString().slice(0, 7)),
    );
    const monthsActive = Math.min(6, monthKeys.size);
    const consistencyRatio = monthsActive / 6;

    const totalSaved = recentDeposits.reduce((sum, tx) => sum + tx.amount, 0);
    const avgMonthly = totalSaved / Math.max(1, monthsActive);
    const target = hasBudget ? portfolio.analysis.safeMonthlyAmount : avgMonthly;
    const amountRatio = target > 0 ? Math.min(1, avgMonthly / target) : 0.5;

    const score = Math.round((consistencyRatio * 0.6 + amountRatio * 0.4) * 100);

    if (consistencyRatio < 0.5) {
      recommendations.push('Try to save every month, even a small amount, to build consistency.');
    } else if (consistencyRatio >= 0.8 && amountRatio >= 0.8) {
      recommendations.push('Excellent savings habit — you are contributing regularly and on pace.');
    }
    return score;
  })();

  const incomeStability = (() => {
    if (incomeHistory.length < 2) {
      if (!hasBudget) recommendations.push('Add your monthly income so the AI can assess stability.');
      return hasBudget ? 55 : 0;
    }
    const incomes = [...incomeHistory].reverse().map((row) => row.monthlyIncome).filter((v) => v > 0);
    if (incomes.length < 2) return 50;
    const latest = incomes[incomes.length - 1];
    const previous = incomes[incomes.length - 2];
    const change = ((latest - previous) / Math.max(previous, 1)) * 100;
    const variance = incomes.slice(-6).reduce((acc, val) => acc + Math.abs(val - latest) / Math.max(latest, 1), 0) / Math.min(6, incomes.length);
    const stability = Math.max(0, 1 - variance);
    let score = Math.round(stability * 100);

    if (change <= -10) {
      score = Math.min(score, 45);
      recommendations.push(`Income dropped ${Math.abs(Math.round(change))}% since last month. AutoSave will protect your budget.`);
    } else if (change >= 5) {
      recommendations.push(`Income rose ${Math.round(change)}% — consider increasing your monthly savings.`);
    }
    return Math.min(100, Math.max(0, score));
  })();

  const goalProgress = (() => {
    if (portfolio.goals.length === 0) {
      recommendations.push('Create a goal so the AI can track your progress over time.');
      return 0;
    }
    const forecasts = portfolio.goals;
    const avgPercent = forecasts.reduce((sum, g) => sum + g.percent, 0) / forecasts.length;
    const onTrack = forecasts.filter((g) => g.status === 'on-track' || g.status === 'complete').length;
    const atRisk = forecasts.filter((g) => g.status === 'off-track' || g.status === 'overdue').length;
    const progressRatio = avgPercent / 100;
    const statusRatio = onTrack / forecasts.length;
    const riskPenalty = (atRisk / forecasts.length) * 0.3;
    const score = Math.round(Math.max(0, (progressRatio * 0.5 + statusRatio * 0.5 - riskPenalty)) * 100);

    const focusGoal = forecasts.find((g) => g.status !== 'complete');
    if (focusGoal) {
      if (focusGoal.status === 'off-track' || focusGoal.status === 'overdue') {
        recommendations.push(`At your current rate, ${focusGoal.name} may not finish on time. Consider increasing contributions or extending the target date.`);
      } else if (focusGoal.projectedDate && focusGoal.allocatedMonthly > 0) {
        const months = Math.ceil((focusGoal.projectedDate.getTime() - now.getTime()) / (DAYS_PER_MONTH * MS_PER_DAY));
        recommendations.push(`At your current rate, you will reach ${focusGoal.name} in about ${Math.max(1, months)} months.`);
      }
    }
    const complete = forecasts.filter((g) => g.status === 'complete').length;
    if (complete === forecasts.length && forecasts.length > 0) {
      recommendations.push('All goals are complete. Set a new target to keep your momentum.');
    }
    return Math.min(100, Math.max(0, score));
  })();

  const rawScore = Math.round(savingsConsistency * 0.35 + incomeStability * 0.3 + goalProgress * 0.35);
  const score = Math.min(100, Math.max(0, rawScore));

  let grade: HealthGrade;
  let label: string;
  if (score >= 70) {
    grade = 'on-track';
    label = 'On Track';
  } else if (score >= 40) {
    grade = 'needs-attention';
    label = 'Needs Attention';
  } else {
    grade = 'at-risk';
    label = 'At Risk';
  }

  if (hasBudget && portfolio.analysis.surplus > 0 && score >= 70) {
    recommendations.push(`You can safely save ${formatShort(portfolio.analysis.safeMonthlyAmount)} this month without financial stress.`);
  }

  return {
    score,
    grade,
    label,
    savingsConsistency,
    incomeStability,
    goalProgress,
    recommendations: recommendations.length > 0 ? recommendations : ['Keep up your savings rhythm and review your goals regularly.'],
  };
}

function formatShort(value: number): string {
  return `$${Math.round(value).toLocaleString('en-US')}`;
}
