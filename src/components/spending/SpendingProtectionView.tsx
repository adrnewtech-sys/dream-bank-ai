import { useState, type FormEvent } from 'react';
import { AlertTriangle, CheckCircle2, ShieldAlert, ShieldCheck, ShoppingCart } from 'lucide-react';
import { FormError, inputClassName, labelClassName } from '@/components/ui/formPrimitives';
import { ForecastModeBadge } from '@/components/ui/ForecastModeBadge';
import { GOAL_COLORS, getGoalIcon } from '@/lib/goalStyles';
import { formatDate, formatMoney, formatMoneyExact } from '@/lib/format';
import { calculateSpendingImpact } from '@/lib/finance';
import type { GoalWithSaved } from '@/types';
import type { GoalForecast, ProtectedBalance } from '@/lib/finance';

interface SpendingProtectionViewProps {
  goals: GoalWithSaved[];
  forecasts: GoalForecast[];
  balance: ProtectedBalance;
  connected: boolean;
}

const QUICK_AMOUNTS = [50, 200, 500, 1000];

export function SpendingProtectionView({ goals, forecasts, balance, connected }: SpendingProtectionViewProps) {
  const [amountText, setAmountText] = useState('');
  const [description, setDescription] = useState('');
  const amount = Number(amountText);
  const isValidAmount = amountText.trim() !== '' && !Number.isNaN(amount) && amount > 0;

  const impact = isValidAmount
    ? calculateSpendingImpact(amount, balance.spendableBalance, goals, forecasts)
    : null;

  return (
    <div className="space-y-8">
      <section>
        <p className="text-sm font-medium text-blue-600">Spending Protection</p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">Check before you spend</h1>
        <ForecastModeBadge connected={connected} className="mt-3" />
        <p className="mt-2 max-w-xl text-sm text-slate-500">
          Thinking about a big purchase? The AI checks whether it would dip into your protected goal vaults and shows you the impact before you commit.
        </p>
      </section>

      <section className="grid gap-6 lg:grid-cols-5">
        <form
          onSubmit={(e: FormEvent) => e.preventDefault()}
          className="space-y-5 rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm lg:col-span-2"
        >
          <div>
            <label htmlFor="purchase-amount" className={labelClassName}>Purchase amount</label>
            <div className="relative">
              <span className="pointer-events-none absolute inset-y-0 left-4 flex items-center text-slate-400">$</span>
              <input
                id="purchase-amount"
                type="number"
                min="0"
                step="0.01"
                inputMode="decimal"
                value={amountText}
                onChange={(e) => setAmountText(e.target.value)}
                placeholder="500"
                className={`${inputClassName} pl-8`}
              />
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {QUICK_AMOUNTS.map((quick) => (
                <button
                  key={quick}
                  type="button"
                  onClick={() => setAmountText(String(quick))}
                  className="rounded-full border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:border-blue-400 hover:text-blue-700"
                >
                  {formatMoney(quick)}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label htmlFor="purchase-desc" className={labelClassName}>What is it for? (optional)</label>
            <input
              id="purchase-desc"
              type="text"
              maxLength={120}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="New phone, concert tickets, dinner out"
              className={inputClassName}
            />
          </div>

          <div className="rounded-2xl bg-slate-50 p-4 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-500">Spendable Balance</span>
              <span className="font-semibold text-slate-900">{formatMoney(balance.spendableBalance)}</span>
            </div>
            <div className="mt-2 flex justify-between">
              <span className="text-slate-500">Protected Goal Savings</span>
              <span className="font-semibold text-blue-700">{formatMoney(balance.protectedBalance)}</span>
            </div>
          </div>

          {!isValidAmount && (
            <p className="text-xs text-slate-500">Enter an amount above zero to run the spending check.</p>
          )}
        </form>

        <div className="lg:col-span-3">
          {impact ? (
            <ImpactResult impact={impact} description={description} isValidAmount={isValidAmount} amount={amount} />
          ) : (
            <div className="flex h-full flex-col items-center justify-center rounded-3xl border border-dashed border-slate-300 bg-white p-10 text-center">
              <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                <ShoppingCart className="h-7 w-7" />
              </span>
              <h2 className="mt-5 text-lg font-semibold text-slate-900">Ready when you are</h2>
              <p className="mt-2 max-w-sm text-sm text-slate-500">
                Enter a purchase amount to see whether it is safe to spend or if it would affect your goals.
              </p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

interface ImpactResultProps {
  impact: ReturnType<typeof calculateSpendingImpact>;
  description: string;
  isValidAmount: boolean;
  amount: number;
}

function ImpactResult({ impact, description, amount }: ImpactResultProps) {
  if (!impact.wouldBorrowFromGoals) {
    return (
      <div className="flex h-full flex-col rounded-3xl border border-emerald-200 bg-gradient-to-br from-emerald-50 via-white to-white p-6 shadow-sm">
        <div className="flex items-center gap-3">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600">
            <CheckCircle2 className="h-6 w-6" />
          </span>
          <div>
            <h2 className="text-lg font-bold text-slate-900">Safe to spend</h2>
            <p className="text-sm text-slate-600">Your goal vaults are not affected.</p>
          </div>
        </div>
        <dl className="mt-6 space-y-3 text-sm">
          <div className="flex justify-between">
            <dt className="text-slate-500">Purchase amount</dt>
            <dd className="font-semibold text-slate-900">{formatMoneyExact(amount)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-slate-500">Spendable balance after</dt>
            <dd className="font-semibold text-emerald-700">{formatMoney(impact.spendableAfter)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-slate-500">Goals affected</dt>
            <dd className="font-semibold text-slate-900">None</dd>
          </div>
        </dl>
        <p className="mt-auto pt-6 text-sm text-slate-600">
          {impact.recommendedAction}
        </p>
      </div>
    );
  }

  const severityStyle = impact.severity === 'danger'
    ? { border: 'border-rose-200', bg: 'from-rose-50 via-white to-white', icon: 'bg-rose-100 text-rose-600', label: 'High impact' }
    : { border: 'border-amber-200', bg: 'from-amber-50 via-white to-white', icon: 'bg-amber-100 text-amber-600', label: 'Moderate impact' };

  return (
    <div className={`flex h-full flex-col rounded-3xl border ${severityStyle.border} bg-gradient-to-br ${severityStyle.bg} p-6 shadow-sm`}>
      <div className="flex items-center gap-3">
        <span className={`flex h-12 w-12 items-center justify-center rounded-2xl ${severityStyle.icon}`}>
          <ShieldAlert className="h-6 w-6" />
        </span>
        <div>
          <h2 className="text-lg font-bold text-slate-900">{severityStyle.label}</h2>
          <p className="text-sm text-slate-600">
            {description ? `"${description}" would` : 'This purchase would'} dip into your protected goals.
          </p>
        </div>
      </div>

      <dl className="mt-6 space-y-3 text-sm">
        <div className="flex justify-between">
          <dt className="text-slate-500">Purchase amount</dt>
          <dd className="font-semibold text-slate-900">{formatMoneyExact(amount)}</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-slate-500">Spendable balance</dt>
          <dd className="font-semibold text-slate-900">{formatMoney(Math.max(0, impact.spendableAfter + amount))}</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-slate-500">Shortfall covered from goals</dt>
          <dd className="font-semibold text-rose-600">{formatMoney(Math.abs(impact.spendableAfter))}</dd>
        </div>
      </dl>

      <div className="mt-6">
        <h3 className="text-sm font-semibold text-slate-900">Goal impact</h3>
        <ul className="mt-3 space-y-3">
          {impact.affectedGoals.map((goal) => {
            return (
              <li key={goal.goalId} className="rounded-2xl border border-slate-200 bg-white p-4">
                <div className="flex items-center justify-between gap-3">
                  <span className="font-semibold text-slate-900">{goal.name}</span>
                  {goal.delayMonths > 0 && (
                    <span className="rounded-full bg-rose-50 px-2.5 py-1 text-xs font-bold text-rose-700">
                      Delayed {goal.delayMonths} {goal.delayMonths === 1 ? 'month' : 'months'}
                    </span>
                  )}
                </div>
                <dl className="mt-3 grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <dt className="text-slate-500">Current saved</dt>
                    <dd className="font-semibold text-slate-900">{formatMoney(goal.currentSaved)}</dd>
                  </div>
                  <div>
                    <dt className="text-slate-500">After this purchase</dt>
                    <dd className="font-semibold text-rose-600">{formatMoney(goal.newSaved)}</dd>
                  </div>
                  {goal.newProjectedDate && (
                    <div className="col-span-2">
                      <dt className="text-slate-500">New completion date</dt>
                      <dd className="font-semibold text-slate-900">{formatDate(goal.newProjectedDate)}</dd>
                    </div>
                  )}
                </dl>
              </li>
            );
          })}
        </ul>
      </div>

      <div className={`mt-auto rounded-2xl border ${severityStyle.border} bg-white/80 p-4`}>
        <div className="flex items-start gap-2">
          <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-blue-600" />
          <p className="text-sm leading-6 text-slate-700">{impact.recommendedAction}</p>
        </div>
      </div>
    </div>
  );
}
