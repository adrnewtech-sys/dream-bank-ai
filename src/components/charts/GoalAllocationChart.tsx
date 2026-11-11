import { GOAL_COLORS } from '@/lib/goalStyles';
import { formatMoney } from '@/lib/format';
import type { GoalWithSaved } from '@/types';

const RADIUS = 56;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

interface GoalAllocationChartProps {
  goals: GoalWithSaved[];
}

export function GoalAllocationChart({ goals }: GoalAllocationChartProps) {
  const funded = goals.filter((goal) => goal.saved > 0);
  const total = funded.reduce((sum, goal) => sum + goal.saved, 0);

  let offset = 0;
  const segments = funded.map((goal) => {
    const length = total > 0 ? (goal.saved / total) * CIRCUMFERENCE : 0;
    const segment = { goal, length, offset };
    offset += length;
    return segment;
  });

  return (
    <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-center">
      <div className="relative h-40 w-40 shrink-0">
        <svg viewBox="0 0 140 140" className="h-full w-full -rotate-90" role="img" aria-label="Savings split across goals">
          <circle cx="70" cy="70" r={RADIUS} fill="none" stroke="#f1f5f9" strokeWidth="16" />
          {segments.map(({ goal, length, offset: segmentOffset }) => (
            <circle
              key={goal.id}
              cx="70"
              cy="70"
              r={RADIUS}
              fill="none"
              stroke={GOAL_COLORS[goal.color].hex}
              strokeWidth="16"
              strokeLinecap="butt"
              strokeDasharray={`${length} ${CIRCUMFERENCE}`}
              strokeDashoffset={-segmentOffset}
              className="transition-all duration-700"
            />
          ))}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-xs font-medium text-slate-500">Saved</span>
          <span className="text-lg font-bold text-slate-900">{formatMoney(total)}</span>
        </div>
      </div>

      <ul className="w-full space-y-2.5">
        {funded.length === 0 && <li className="text-sm text-slate-500">Add money to a goal to see how your savings are split.</li>}
        {funded.map((goal) => (
          <li key={goal.id} className="flex items-center justify-between gap-3 text-sm">
            <span className="flex min-w-0 items-center gap-2">
              <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${GOAL_COLORS[goal.color].swatch}`} />
              <span className="truncate font-medium text-slate-700">{goal.name}</span>
            </span>
            <span className="shrink-0 tabular-nums text-slate-500">
              {total > 0 ? Math.round((goal.saved / total) * 100) : 0}%
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
