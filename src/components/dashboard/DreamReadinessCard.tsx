import { Rocket } from 'lucide-react';
import { GOAL_COLORS, getGoalIcon } from '@/lib/goalStyles';
import type { DreamReadinessScore } from '@/lib/aiPredictions';

interface DreamReadinessCardProps {
  scores: DreamReadinessScore[];
}

const STATUS_LABELS: Record<DreamReadinessScore['status'], string> = {
  excellent: 'Excellent',
  strong: 'Strong',
  moderate: 'On Track',
  behind: 'Needs Focus',
};

const STATUS_BAR_COLORS: Record<DreamReadinessScore['status'], string> = {
  excellent: 'from-emerald-500 to-green-400',
  strong: 'from-blue-500 to-sky-400',
  moderate: 'from-amber-500 to-yellow-400',
  behind: 'from-rose-500 to-orange-400',
};

export function DreamReadinessCard({ scores }: DreamReadinessCardProps) {
  const avgScore = scores.length > 0 ? Math.round(scores.reduce((sum, s) => sum + s.score, 0) / scores.length) : 0;

  return (
    <section className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-emerald-500 text-white">
            <Rocket className="h-5 w-5" />
          </span>
          <div>
            <h2 className="text-base font-semibold text-slate-900">Dream Readiness Score</h2>
            <p className="text-sm text-slate-500">AI assessment of how ready each goal is</p>
          </div>
        </div>
        {scores.length > 0 && (
          <div className="text-right">
            <p className="text-2xl font-bold text-slate-900">{avgScore}<span className="text-sm font-medium text-slate-400">/100</span></p>
            <p className="text-xs text-slate-500">Average</p>
          </div>
        )}
      </div>

      {scores.length === 0 ? (
        <p className="mt-5 rounded-2xl border border-dashed border-slate-300 p-6 text-center text-sm text-slate-500">
          Create a goal vault to see your Dream Readiness Scores.
        </p>
      ) : (
        <ul className="mt-5 space-y-4">
          {scores.map((score) => {
            const Icon = getGoalIcon(score.icon);
            const colorStyle = GOAL_COLORS[score.color as keyof typeof GOAL_COLORS] ?? GOAL_COLORS.blue;
            const barGradient = STATUS_BAR_COLORS[score.status];
            return (
              <li key={score.goalId}>
                <div className="flex items-center justify-between gap-3">
                  <span className="flex items-center gap-2.5">
                    <span className={`flex h-8 w-8 items-center justify-center rounded-lg ${colorStyle.soft} ${colorStyle.text}`}>
                      <Icon className="h-4 w-4" />
                    </span>
                    <span className="text-sm font-semibold text-slate-900">{score.name}</span>
                  </span>
                  <span className="flex items-center gap-2">
                    <span className="text-xs font-medium text-slate-500">{STATUS_LABELS[score.status]}</span>
                    <span className="text-lg font-bold text-slate-900">{score.score}<span className="text-xs text-slate-400">/100</span></span>
                  </span>
                </div>
                <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className={`h-full rounded-full bg-gradient-to-r ${barGradient} transition-all duration-700`}
                    style={{ width: `${score.score}%` }}
                  />
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
