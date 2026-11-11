import { Pencil, ShieldCheck } from 'lucide-react';

interface ForecastModeBadgeProps {
  connected: boolean;
  className?: string;
}

export function ForecastModeBadge({ connected, className = '' }: ForecastModeBadgeProps) {
  if (connected) {
    return (
      <span className={`inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700 ${className}`}>
        <ShieldCheck className="h-3.5 w-3.5" />
        Powered by PayPal transaction history
      </span>
    );
  }
  return (
    <span className={`inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-bold text-amber-800 ${className}`}>
      <Pencil className="h-3.5 w-3.5" />
      Forecast based on manually entered budget
    </span>
  );
}
