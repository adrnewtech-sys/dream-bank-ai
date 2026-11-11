import { useCallback, useEffect, useMemo, useState } from 'react';
import { computeAutoPay, withSavedAmounts, type AutoPaySnapshot } from '@/lib/autoPay';
import { addTransaction, createGoal, deleteGoal, EMPTY_AUTOSAVE, EMPTY_PAYPAL, fetchWorkspace, saveAutoSave, type GoalInput, saveBudget, updateGoal, type Workspace } from '@/lib/piggyBankApi';
import type { AutoSaveSettings, Budget, GoalTransaction, GoalWithSaved, PaymentMethod, TransactionKind } from '@/types';

const AUTOPAY_NOTE = 'AI AutoPay dream contribution';

function isPlanStale(plan: AutoSaveSettings, snapshot: AutoPaySnapshot): boolean {
  return plan.goalIds.join(',') !== snapshot.selectedGoalIds.join(',')
    || plan.monthlyAmount !== snapshot.totalMonthly
    || plan.recommendedAmount !== snapshot.totalMonthly
    || plan.safetyBuffer !== snapshot.adaptive.safetyBuffer;
}

export function usePiggyBank(userId: string) {
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    try {
      let nextWorkspace = await fetchWorkspace();
      let snapshot = computeAutoPay(nextWorkspace);
      if (isPlanStale(nextWorkspace.autoSave, snapshot)) {
        await saveAutoSave({
          ...nextWorkspace.autoSave,
          goalIds: snapshot.selectedGoalIds,
          monthlyAmount: snapshot.totalMonthly,
          recommendedAmount: snapshot.totalMonthly,
          safetyBuffer: snapshot.adaptive.safetyBuffer,
          lastRecalculatedAt: new Date().toISOString(),
        });
        nextWorkspace = await fetchWorkspace();
        snapshot = computeAutoPay(nextWorkspace);
      }

      const plan = nextWorkspace.autoSave;
      const scheduledRun = plan.nextRunAt;
      const due = nextWorkspace.paypal.isSandbox
        && plan.autopayEnabled
        && plan.autopayStatus === 'active'
        && snapshot.totalMonthly > 0
        && scheduledRun !== null
        && new Date(scheduledRun).getTime() <= Date.now();
      if (due && scheduledRun) {
        for (const allocation of snapshot.allocations) {
          if (allocation.amount <= 0) continue;
          await addTransaction(allocation.goalId, 'deposit', allocation.amount, AUTOPAY_NOTE, 'paypal', `autosave-${scheduledRun}-${allocation.goalId}`);
        }
        const nextRunAt = new Date(scheduledRun);
        nextRunAt.setMonth(nextRunAt.getMonth() + 1);
        await saveAutoSave({
          ...plan,
          lastTransferAt: new Date().toISOString(),
          nextRunAt: nextRunAt.toISOString(),
          transferCount: plan.transferCount + 1,
        });
        nextWorkspace = await fetchWorkspace();
      }
      setWorkspace(nextWorkspace);
      setLoadError(null);
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : 'Something went wrong while loading your data.');
    } finally { setIsLoading(false); }
  }, [userId]);

  useEffect(() => { void refresh(); }, [refresh]);

  const transactions = useMemo<GoalTransaction[]>(() => workspace?.transactions ?? [], [workspace]);
  const goals = useMemo<GoalWithSaved[]>(() => withSavedAmounts(workspace?.goals ?? [], transactions), [workspace, transactions]);
  const budget: Budget | null = workspace?.budget ?? null;
  const incomeHistory = workspace?.incomeHistory ?? [];
  const paypal = workspace?.paypal ?? EMPTY_PAYPAL;
  const autoPay = useMemo(() => computeAutoPay(workspace), [workspace]);
  const mutate = useCallback(async (action: () => Promise<void>) => { await action(); await refresh(); }, [refresh]);

  return {
    isLoading, loadError, retry: refresh, budget, goals, transactions,
    portfolio: autoPay.portfolio,
    autoPay,
    incomeHistory,
    autoSave: workspace?.autoSave ?? EMPTY_AUTOSAVE,
    paypal,
    saveBudget: (next: Budget) => mutate(() => saveBudget(next)),
    saveAutoSave: (next: AutoSaveSettings) => mutate(() => saveAutoSave(next)),
    createGoal: (input: GoalInput) => mutate(() => createGoal(input)),
    updateGoal: (goalId: string, input: GoalInput) => mutate(() => updateGoal(goalId, input)),
    deleteGoal: (goalId: string) => mutate(() => deleteGoal(goalId)),
    addTransaction: (goalId: string, kind: TransactionKind, amount: number, note: string, paymentMethod: PaymentMethod, paypalOrderId: string | null = null) => mutate(() => addTransaction(goalId, kind, amount, note, paymentMethod, paypalOrderId)),
  };
}

export type PiggyBankState = ReturnType<typeof usePiggyBank>;
