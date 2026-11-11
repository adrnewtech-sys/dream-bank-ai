import type { GoalColor } from '@/types';
import { GOAL_COLORS } from '@/lib/goalStyles';

interface ProgressBarProps {
  percent: number;
  color?: GoalColor;
  label?: string;
}

export function ProgressBar({ percent, color = 'blue', label }: ProgressBarProps) {
  const clamped = Math.min(100, Math.max(0, percent));
  return (
    <div
      role="progressbar"
      aria-label={label ?? 'Progress'}
      aria-valuenow={Math.round(clamped)}
      aria-valuemin={0}
      aria-valuemax={100}
      className="h-3 w-full overflow-hidden rounded-full bg-slate-100"
    >
      <div
        className={`h-full rounded-full bg-gradient-to-r ${GOAL_COLORS[color].bar} transition-all duration-700 ease-out`}
        style={{ width: `${clamped}%` }}
      />
    </div>
  );
}
