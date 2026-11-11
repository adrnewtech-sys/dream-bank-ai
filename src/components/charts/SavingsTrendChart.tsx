import { useMemo } from 'react';
import { formatMonth, formatMoney } from '@/lib/format';
import type { GoalTransaction } from '@/types';

const WIDTH = 600;
const HEIGHT = 220;
const PAD_X = 16;
const PAD_TOP = 20;
const PAD_BOTTOM = 32;
const MONTHS = 6;

interface SavingsTrendChartProps {
  transactions: GoalTransaction[];
  now?: Date;
}

interface Point {
  x: number;
  y: number;
  value: number;
  label: string;
}

function buildMonthlyNetSavings(transactions: GoalTransaction[], now: Date) {
  const months: Array<{ label: string; end: Date }> = [];
  for (let i = MONTHS - 1; i >= 0; i -= 1) {
    const end = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59);
    months.push({ label: formatMonth(end), end });
  }

  return months.map((month) => {
    const value = transactions.reduce((sum, tx) => {
      if (new Date(tx.createdAt) > month.end) return sum;
      return sum + (tx.kind === 'deposit' ? tx.amount : -tx.amount);
    }, 0);
    return { label: month.label, value: Math.max(0, value) };
  });
}

export function SavingsTrendChart({ transactions, now }: SavingsTrendChartProps) {
  const series = useMemo(
    () => buildMonthlyNetSavings(transactions, now ?? new Date()),
    [transactions, now],
  );

  const max = Math.max(1, ...series.map((point) => point.value));
  const innerWidth = WIDTH - PAD_X * 2;
  const innerHeight = HEIGHT - PAD_TOP - PAD_BOTTOM;

  const points: Point[] = series.map((point, index) => ({
    x: PAD_X + (index / (series.length - 1)) * innerWidth,
    y: PAD_TOP + innerHeight - (point.value / max) * innerHeight,
    value: point.value,
    label: point.label,
  }));

  const linePath = points.map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`).join(' ');
  const areaPath = `${linePath} L ${points[points.length - 1].x} ${HEIGHT - PAD_BOTTOM} L ${points[0].x} ${HEIGHT - PAD_BOTTOM} Z`;

  return (
    <div>
      <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className="h-56 w-full" role="img" aria-label="Cumulative savings over the last six months">
        <defs>
          <linearGradient id="trend-fill" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#10b981" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="trend-line" x1="0" x2="1" y1="0" y2="0">
            <stop offset="0%" stopColor="#2563eb" />
            <stop offset="100%" stopColor="#10b981" />
          </linearGradient>
        </defs>
        {[0, 0.5, 1].map((step) => {
          const y = PAD_TOP + innerHeight * step;
          return <line key={step} x1={PAD_X} x2={WIDTH - PAD_X} y1={y} y2={y} stroke="#e2e8f0" strokeDasharray="4 6" />;
        })}
        <path d={areaPath} fill="url(#trend-fill)" />
        <path d={linePath} fill="none" stroke="url(#trend-line)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        {points.map((point) => (
          <g key={point.label}>
            <circle cx={point.x} cy={point.y} r="5" fill="#fff" stroke="#10b981" strokeWidth="2.5">
              <title>{`${point.label}: ${formatMoney(point.value)}`}</title>
            </circle>
            <text x={point.x} y={HEIGHT - 8} textAnchor="middle" className="fill-slate-500 text-[11px]">
              {point.label.split(' ')[0]}
            </text>
          </g>
        ))}
      </svg>
      <p className="mt-2 text-sm text-slate-500">
        Total saved right now: <span className="font-semibold text-slate-900">{formatMoney(series[series.length - 1].value)}</span>
      </p>
    </div>
  );
}
