import { formatMoney } from '@/lib/format';
import type { TrendPoint } from '@/lib/aiPredictions';

const WIDTH = 600;
const HEIGHT = 240;
const PAD_X = 24;
const PAD_TOP = 20;
const PAD_BOTTOM = 36;

interface PredictionTrendChartProps {
  points: TrendPoint[];
}

export function PredictionTrendChart({ points }: PredictionTrendChartProps) {
  if (points.length < 2) {
    return <p className="py-12 text-center text-sm text-slate-500">Not enough data to show a trend yet.</p>;
  }

  const max = Math.max(1, ...points.map((p) => p.value));
  const innerWidth = WIDTH - PAD_X * 2;
  const innerHeight = HEIGHT - PAD_TOP - PAD_BOTTOM;

  const coords = points.map((point, index) => ({
    x: PAD_X + (index / (points.length - 1)) * innerWidth,
    y: PAD_TOP + innerHeight - (point.value / max) * innerHeight,
    ...point,
  }));

  const actualPoints = coords.filter((p) => !p.isPredicted);
  const predictedPoints = coords.filter((p) => p.isPredicted);

  const actualPath = actualPoints.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  const actualAreaPath = actualPoints.length > 0
    ? `${actualPath} L ${actualPoints[actualPoints.length - 1].x} ${HEIGHT - PAD_BOTTOM} L ${actualPoints[0].x} ${HEIGHT - PAD_BOTTOM} Z`
    : '';

  const lastActual = actualPoints[actualPoints.length - 1];
  const firstPredicted = predictedPoints[0];
  const dashPath = [lastActual, firstPredicted, ...predictedPoints.slice(1)]
    .filter((p): p is typeof p & { x: number; y: number } => p !== undefined)
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`)
    .join(' ');

  return (
    <div>
      <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className="h-56 w-full" role="img" aria-label="Savings trend: past 3 months, current month, and AI prediction for next month">
        <defs>
          <linearGradient id="pred-fill" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#2563eb" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#2563eb" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="pred-line" x1="0" x2="1" y1="0" y2="0">
            <stop offset="0%" stopColor="#2563eb" />
            <stop offset="100%" stopColor="#10b981" />
          </linearGradient>
        </defs>

        {[0, 0.5, 1].map((step) => {
          const y = PAD_TOP + innerHeight * step;
          return <line key={step} x1={PAD_X} x2={WIDTH - PAD_X} y1={y} y2={y} stroke="#e2e8f0" strokeDasharray="4 6" />;
        })}

        {actualAreaPath && <path d={actualAreaPath} fill="url(#pred-fill)" />}
        {actualPath && <path d={actualPath} fill="none" stroke="url(#pred-line)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />}
        {dashPath && <path d={dashPath} fill="none" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="6 6" />}

        {coords.map((point) => (
          <g key={point.label}>
            <circle
              cx={point.x}
              cy={point.y}
              r="5"
              fill={point.isPredicted ? '#10b981' : '#fff'}
              stroke={point.isPredicted ? '#10b981' : '#2563eb'}
              strokeWidth="2.5"
            >
              <title>{`${point.label}: ${formatMoney(point.value)}${point.isPredicted ? ' (predicted)' : ''}`}</title>
            </circle>
            <text x={point.x} y={HEIGHT - 10} textAnchor="middle" className={`text-[11px] ${point.isPredicted ? 'fill-emerald-600 font-semibold' : 'fill-slate-500'}`}>
              {point.label}
            </text>
          </g>
        ))}
      </svg>
      <div className="mt-3 flex items-center gap-4 text-xs text-slate-500">
        <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded-full border-2 border-blue-600 bg-white" /> Actual</span>
        <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded-full bg-emerald-500" /> Predicted</span>
      </div>
    </div>
  );
}
