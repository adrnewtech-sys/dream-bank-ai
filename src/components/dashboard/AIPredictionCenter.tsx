import { ArrowDown, ArrowUp, CheckCircle2, Minus, Rocket, Sparkles, TrendingUp } from 'lucide-react';
import { formatMoney } from '@/lib/format';
import type { AIPrediction, GoalAllocationRec } from '@/lib/aiPredictions';
import { GOAL_COLORS, getGoalIcon } from '@/lib/goalStyles';

interface AIPredictionCenterProps {
  prediction: AIPrediction;
  allocations: GoalAllocationRec[];
}

export function AIPredictionCenter({ prediction, allocations }: AIPredictionCenterProps) {
  const ChangeIcon = prediction.changeDirection === 'up' ? ArrowUp : prediction.changeDirection === 'down' ? ArrowDown : Minus;
  const changeColor = prediction.changeDirection === 'up' ? 'text-emerald-400' : prediction.changeDirection === 'down' ? 'text-rose-400' : 'text-slate-400';
  const changeText = prediction.changeDirection === 'up'
    ? `${prediction.changePercent}% higher than this month`
    : prediction.changeDirection === 'down'
      ? `${prediction.changePercent}% lower than this month`
      : 'Stable vs this month';

  return (
    <section className="overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-slate-800 to-blue-950 p-7 text-white shadow-2xl shadow-blue-950/30 sm:p-9">
      <div className="flex items-center gap-3">
        <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-600 shadow-lg shadow-blue-600/30">
          <Rocket className="h-6 w-6" />
        </span>
        <div>
          <h2 className="text-xl font-bold tracking-tight sm:text-2xl">Next Month Dream Forecast</h2>
          <p className="text-xs text-slate-400">Based on your PayPal transaction history and spending behaviour</p>
        </div>
      </div>

      <div className="mt-7 grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <div>
          <p className="text-sm text-slate-400">Available For Dreams next month</p>
          <div className="mt-2 flex items-end gap-3">
            <span className="text-5xl font-bold tracking-tight text-white sm:text-6xl">
              {formatMoney(prediction.safeSavingsNextMonth)}
            </span>
            <span className={`mb-2 inline-flex items-center gap-1 text-sm font-semibold ${changeColor}`}>
              <ChangeIcon className="h-4 w-4" />
              {changeText}
            </span>
          </div>

          <div className="mt-5 flex items-center gap-3">
            <div className="flex-1 rounded-2xl bg-white/5 p-4 backdrop-blur">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-400">Confidence Score</span>
                <Sparkles className="h-3.5 w-3.5 text-blue-400" />
              </div>
              <p className="mt-1 text-3xl font-bold text-white">{prediction.confidenceScore}%</p>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/10">
                <div className="h-full rounded-full bg-gradient-to-r from-blue-500 to-emerald-400 transition-all duration-700" style={{ width: `${prediction.confidenceScore}%` }} />
              </div>
            </div>
            <div className="flex-1 rounded-2xl bg-white/5 p-4 backdrop-blur">
              <span className="text-xs font-medium text-slate-400">Daily Recalculation</span>
              <p className="mt-1 text-sm leading-5 text-slate-300">{prediction.dailyRecalculationNote}</p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl bg-white/5 p-5 backdrop-blur">
          <span className="inline-flex items-center gap-2 text-sm font-semibold text-blue-300">
            <TrendingUp className="h-4 w-4" />
            AI Reasoning
          </span>
          <ul className="mt-3 space-y-2.5">
            {prediction.reasoning.map((item, index) => (
              <li key={index} className="flex items-start gap-2 text-sm">
                <span className={`mt-0.5 shrink-0 ${item.positive ? 'text-emerald-400' : 'text-amber-400'}`}>
                  {item.positive ? <CheckCircle2 className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />}
                </span>
                <div>
                  <p className="font-medium text-white">{item.label}</p>
                  <p className="text-xs text-slate-400">{item.detail}</p>
                </div>
              </li>
            ))}
          </ul>
          <div className="mt-4 rounded-xl border border-blue-500/20 bg-blue-500/10 px-4 py-3">
            <p className="text-xs font-semibold text-blue-200">Result</p>
            <p className="mt-1 text-sm text-white">{prediction.resultSummary}</p>
          </div>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-3 gap-3">
        <PredictionStat label="Predicted Income" value={formatMoney(prediction.predictedIncome)} />
        <PredictionStat label="Predicted Expenses" value={formatMoney(prediction.predictedExpenses)} />
        <PredictionStat label="Available For Dreams" value={formatMoney(prediction.predictedSavingsCapacity)} accent />
      </div>

      {allocations.length > 0 && (
        <div className="mt-6 rounded-2xl bg-white/5 p-5 backdrop-blur">
          <p className="text-sm font-semibold text-slate-300">Recommended allocation next month</p>
          <ul className="mt-3 grid gap-2 sm:grid-cols-2">
            {allocations.map((alloc) => {
              const Icon = getGoalIcon(alloc.icon);
              const colorStyle = GOAL_COLORS[alloc.color as keyof typeof GOAL_COLORS] ?? GOAL_COLORS.blue;
              return (
                <li key={alloc.goalId} className="flex items-center justify-between rounded-xl bg-white/5 px-4 py-2.5">
                  <span className="flex items-center gap-2 text-sm font-medium text-white">
                    <span className={`flex h-7 w-7 items-center justify-center rounded-lg ${colorStyle.soft} ${colorStyle.text}`}>
                      <Icon className="h-4 w-4" />
                    </span>
                    {alloc.name}
                  </span>
                  <span className="text-sm font-bold text-white">{formatMoney(alloc.amount)}</span>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </section>
  );
}

function PredictionStat({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className={`rounded-2xl p-4 ${accent ? 'bg-emerald-500/15 border border-emerald-400/20' : 'bg-white/5'}`}>
      <p className="text-xs font-medium text-slate-400">{label}</p>
      <p className={`mt-1 text-lg font-bold ${accent ? 'text-emerald-300' : 'text-white'} sm:text-xl`}>{value}</p>
    </div>
  );
}
