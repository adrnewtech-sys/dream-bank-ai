import { useState } from 'react';
import { Plus, Target } from 'lucide-react';
import { AddFundsModal } from '@/components/goals/AddFundsModal';
import { GoalCard } from '@/components/goals/GoalCard';
import { GoalDetailModal } from '@/components/goals/GoalDetailModal';
import { GoalFormModal } from '@/components/goals/GoalFormModal';
import { TransactionHistory } from '@/components/goals/TransactionHistory';
import { formatMoney } from '@/lib/format';
import { MAX_GOAL_FOLDERS } from '@/lib/goalLimits';
import type { GoalInput } from '@/lib/piggyBankApi';
import type { PiggyBankState } from '@/hooks/usePiggyBank';
import type { Goal } from '@/types';

type FormState = { mode: 'create' } | { mode: 'edit'; goal: Goal } | null;

interface GoalsViewProps {
  state: PiggyBankState;
}

export function GoalsView({ state }: GoalsViewProps) {
  const { goals, portfolio, transactions, budget } = state;
  const [form, setForm] = useState<FormState>(null);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [fundingId, setFundingId] = useState<string | null>(null);
  const atFolderLimit = goals.length >= MAX_GOAL_FOLDERS;

  const detailGoal = goals.find((goal) => goal.id === detailId) ?? null;
  const fundingGoal = goals.find((goal) => goal.id === fundingId) ?? null;
  const forecastFor = (goalId: string) => portfolio.goals.find((item) => item.goalId === goalId);

  const handleSave = async (input: GoalInput) => {
    if (form?.mode === 'edit') {
      await state.updateGoal(form.goal.id, input);
    } else {
      await state.createGoal(input);
    }
  };

  return (
    <div className="space-y-8">
      <section className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium text-blue-600">Goals</p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">Your goal folders</h1>
          <p className="mt-2 max-w-xl text-sm text-slate-500">
            Each folder tracks one goal. The AI guide estimates how likely you are to finish on time.
          </p>
          {atFolderLimit && (
            <p className="mt-2 text-sm font-medium text-blue-700">
              You have {MAX_GOAL_FOLDERS} dream folders, the maximum. Delete one to add another.
            </p>
          )}
        </div>
        <button
          type="button"
          onClick={() => setForm({ mode: 'create' })}
          disabled={atFolderLimit}
          className="inline-flex items-center justify-center gap-2 self-start rounded-xl bg-gradient-to-r from-blue-600 to-emerald-500 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-600/20 transition hover:-translate-y-0.5 hover:shadow-xl disabled:cursor-not-allowed disabled:bg-none disabled:bg-slate-200 disabled:text-slate-500 disabled:shadow-none disabled:hover:translate-y-0 sm:self-auto"
        >
          <Plus className="h-4 w-4" />
          New goal
        </button>
      </section>

      {goals.length > 0 && (
        <section className="grid grid-cols-3 gap-3 sm:gap-4">
          <Summary label="Total saved" value={formatMoney(portfolio.totalSaved)} />
          <Summary label="Total target" value={formatMoney(portfolio.totalTarget)} />
          <Summary label="Needed monthly" value={formatMoney(portfolio.totalRequired)} />
        </section>
      )}

      {!budget && goals.length > 0 && (
        <p className="rounded-2xl border border-blue-100 bg-blue-50 px-5 py-4 text-sm text-blue-800">
          Add your monthly income and expenses on the dashboard to unlock accurate completion forecasts.
        </p>
      )}

      {goals.length === 0 ? (
        <div className="flex flex-col items-center rounded-3xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
            <Target className="h-7 w-7" />
          </span>
          <h2 className="mt-5 text-lg font-semibold text-slate-900">No goals yet</h2>
          <p className="mt-2 max-w-sm text-sm text-slate-500">
            Create a goal folder for something you are saving toward, like an emergency fund, a trip or a new car.
          </p>
          <button
            type="button"
            onClick={() => setForm({ mode: 'create' })}
            className="mt-6 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
          >
            Create my first goal
          </button>
        </div>
      ) : (
        <section className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {goals.map((goal) => (
            <GoalCard
              key={goal.id}
              goal={goal}
              forecast={forecastFor(goal.id)}
              onOpen={() => setDetailId(goal.id)}
              onAddMoney={() => setFundingId(goal.id)}
            />
          ))}
        </section>
      )}

      <TransactionHistory transactions={transactions} goals={goals} />

      {form && (
        <GoalFormModal
          initial={form.mode === 'edit' ? form.goal : null}
          onSave={handleSave}
          onClose={() => setForm(null)}
        />
      )}

      {detailGoal && (
        <GoalDetailModal
          goal={detailGoal}
          forecast={forecastFor(detailGoal.id)}
          transactions={transactions.filter((tx) => tx.goalId === detailGoal.id)}
          onAddMoney={() => {
            setDetailId(null);
            setFundingId(detailGoal.id);
          }}
          onEdit={() => {
            setDetailId(null);
            setForm({ mode: 'edit', goal: detailGoal });
          }}
          onDelete={async () => {
            await state.deleteGoal(detailGoal.id);
            setDetailId(null);
          }}
          onClose={() => setDetailId(null)}
        />
      )}

      {fundingGoal && (
        <AddFundsModal
          goal={fundingGoal}
          onDeposit={(amount, note, paymentMethod, paypalOrderId) =>
            state.addTransaction(fundingGoal.id, 'deposit', amount, note, paymentMethod, paypalOrderId)
          }
          onClose={() => setFundingId(null)}
        />
      )}
    </div>
  );
}

function Summary({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm sm:p-5">
      <p className="text-xs font-medium text-slate-500 sm:text-sm">{label}</p>
      <p className="mt-1 text-lg font-bold tracking-tight text-slate-900 sm:text-2xl">{value}</p>
    </div>
  );
}
