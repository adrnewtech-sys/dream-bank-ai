import type { GoalWithSaved } from '@/types';

const DAYS_PER_MONTH = 30.44;
const MS_PER_DAY = 86_400_000;
const URGENCY_HORIZON_MONTHS = 12;

export interface GoalScore {
  remaining: number;
  monthsRemaining: number;
  requiredMonthly: number;
  priorityScore: number;
  urgencyScore: number;
}

export function monthsUntil(targetDate: string, now: Date): number {
  const target = new Date(`${targetDate}T23:59:59`);
  const days = (target.getTime() - now.getTime()) / MS_PER_DAY;
  return Math.max(0, days / DAYS_PER_MONTH);
}

export function scoreGoals(goals: GoalWithSaved[], now: Date): Map<string, GoalScore> {
  const remainingById = new Map(goals.map((goal) => [goal.id, Math.max(0, goal.targetAmount - goal.saved)]));
  const totalRemaining = [...remainingById.values()].reduce((sum, value) => sum + value, 0);

  const scores = new Map<string, GoalScore>();
  for (const goal of goals) {
    const remaining = remainingById.get(goal.id) ?? 0;
    const monthsRemaining = Math.max(1, Math.ceil(monthsUntil(goal.targetDate, now)));
    scores.set(goal.id, {
      remaining,
      monthsRemaining,
      requiredMonthly: remaining / monthsRemaining,
      priorityScore: totalRemaining > 0 ? Math.round((remaining / totalRemaining) * 100) : 0,
      urgencyScore: Math.round(Math.min(1, URGENCY_HORIZON_MONTHS / monthsRemaining) * 100),
    });
  }
  return scores;
}

export function allocateMonthlyContributions(
  scores: Map<string, GoalScore>,
  selectedGoalIds: string[],
  pool: number,
): Map<string, number> {
  const selected = selectedGoalIds
    .map((id) => ({ id, score: scores.get(id) }))
    .filter((entry): entry is { id: string; score: GoalScore } => entry.score !== undefined && entry.score.remaining > 0);

  const allocation = new Map<string, number>();
  if (selected.length === 0 || pool <= 0) return allocation;

  const totalRequired = selected.reduce((sum, { score }) => sum + score.requiredMonthly, 0);
  const totalRemaining = selected.reduce((sum, { score }) => sum + score.remaining, 0);
  const surplus = Math.max(0, pool - totalRequired);

  for (const { id, score } of selected) {
    const raw = totalRequired <= pool
      ? score.requiredMonthly + surplus * (score.remaining / totalRemaining)
      : pool * (score.requiredMonthly / totalRequired);
    allocation.set(id, Math.min(score.remaining, Math.round(raw)));
  }
  return allocation;
}
