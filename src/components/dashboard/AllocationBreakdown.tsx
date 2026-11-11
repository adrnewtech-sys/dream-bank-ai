import { PieChart } from 'lucide-react';
import { GOAL_COLORS, getGoalIcon } from '@/lib/goalStyles';
import { formatMoney } from '@/lib/format';
import type { GoalAllocation } from '@/lib/finance';
import type { GoalColor } from '@/types';

interface AllocationBreakdownProps {
  allocations: GoalAllocation[];
  goalColors: Record<string, GoalColor>;
}

export function AllocationBreakdown({ allocations, goalColors }: AllocationBreakdownProps) {
  const active = allocations.filter((a) => a.allocatedMonthly > 0 || a.saved > 0);

  return (
    <section className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm">
      <div className="flex items-center gap-2">
        <PieChart className="h-5 w-5 text-blue-600" />
        <h2 className="text-base font-semibold text-slate-900">Smart Goal Allocation</h2>
      </div>
      <p className="mt-1 text-sm text-slate-500">
        AI distributes your monthly savings across goals based on urgency and deadlines.
      </p>

      {active.length === 0 ? (
        <p className="mt-8 py-8 text-center text-sm text-slate-500">
          Create goals and set your budget to see how AI allocates your savings.
        </p>
      ) : (
        <>
          <ul className="mt-5 space-y-4">
            {active.map((alloc) => {
              const color = goalColors[alloc.goalId] ?? 'blue';
              const palette = GOAL_COLORS[color];
              const Icon = getGoalIcon('target');
              return (
                <li key={alloc.goalId}>
                  <div className="flex items-center justify-between gap-3 text-sm">
                    <div className="flex items-center gap-2">
                      <span className={`flex h-7 w-7 items-center justify-center rounded-lg ${palette.soft} ${palette.text}`}>
                        <Icon className="h-3.5 w-3.5" />
                      </span>
                      <span className="font-semibold text-slate-900">{alloc.name}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-semibold text-slate-700">{alloc.percent.toFixed(0)}%</span>
                      <span className="text-xs text-slate-500">{formatMoney(alloc.allocatedMonthly)}/mo</span>
                    </div>
                  </div>
                  <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className={`h-full rounded-full bg-gradient-to-r ${palette.bar} transition-all duration-700`}
                      style={{ width: `${Math.max(3, alloc.percent)}%` }}
                    />
                  </div>
                </li>
              );
            })}
          </ul>
          <p className="mt-4 rounded-xl bg-slate-50 px-4 py-3 text-xs leading-5 text-slate-600">
            <span className="font-semibold text-slate-700">How it works:</span> Goals with earlier deadlines and larger gaps receive a bigger share of your safe monthly savings. The percentages update automatically as goals get funded.
          </p>
        </>
      )}
    </section>
  );
}
