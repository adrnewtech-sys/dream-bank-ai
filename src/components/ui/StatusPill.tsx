import type { GoalStatus } from '@/lib/finance';

const STATUS_STYLES: Record<GoalStatus, { label: string; className: string }> = {
  complete: { label: 'Completed', className: 'bg-emerald-100 text-emerald-700' },
  overdue: { label: 'Overdue', className: 'bg-rose-100 text-rose-700' },
  'on-track': { label: 'On track', className: 'bg-emerald-100 text-emerald-700' },
  'at-risk': { label: 'At risk', className: 'bg-amber-100 text-amber-800' },
  'off-track': { label: 'Off track', className: 'bg-rose-100 text-rose-700' },
};

export function StatusPill({ status }: { status: GoalStatus }) {
  const style = STATUS_STYLES[status];
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${style.className}`}>
      {style.label}
    </span>
  );
}
