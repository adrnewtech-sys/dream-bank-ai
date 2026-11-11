import { AlertTriangle, CheckCircle2, Info, OctagonAlert } from 'lucide-react';
import type { Warning } from '@/lib/finance';

const LEVEL_STYLES: Record<Warning['level'], { box: string; Icon: typeof Info }> = {
  info: { box: 'border-sky-200 bg-sky-50 text-sky-800', Icon: Info },
  warning: { box: 'border-amber-200 bg-amber-50 text-amber-900', Icon: AlertTriangle },
  danger: { box: 'border-rose-200 bg-rose-50 text-rose-800', Icon: OctagonAlert },
};

interface WarningListProps {
  warnings: Warning[];
  emptyMessage?: string;
}

export function WarningList({ warnings, emptyMessage }: WarningListProps) {
  if (warnings.length === 0) {
    return emptyMessage ? (
      <div className="flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
        <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" />
        <p>{emptyMessage}</p>
      </div>
    ) : null;
  }

  return (
    <ul className="space-y-2">
      {warnings.map((warning) => {
        const { box, Icon } = LEVEL_STYLES[warning.level];
        return (
          <li key={warning.message} className={`flex items-start gap-3 rounded-2xl border p-4 text-sm ${box}`}>
            <Icon className="mt-0.5 h-5 w-5 shrink-0" />
            <p>{warning.message}</p>
          </li>
        );
      })}
    </ul>
  );
}
