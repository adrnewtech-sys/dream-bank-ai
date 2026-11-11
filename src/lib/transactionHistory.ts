import type { Goal, GoalTransaction, IncomeSnapshot } from '@/types';

export type HistoryCategory = 'income' | 'expense' | 'goal_deposit' | 'goal_withdrawal';
export type HistoryFilter = 'all' | HistoryCategory | 'paypal';

export interface HistoryEntry {
  id: string;
  date: string;
  description: string;
  amount: number;
  category: HistoryCategory;
  inflow: boolean;
  viaPayPal: boolean;
  status: 'Recorded' | 'Completed';
}

export const HISTORY_CATEGORY_LABELS: Record<HistoryCategory, string> = {
  income: 'Income',
  expense: 'Expense',
  goal_deposit: 'Goal deposit',
  goal_withdrawal: 'Goal withdrawal',
};

export function buildTransactionHistory(
  goals: Goal[],
  transactions: GoalTransaction[],
  incomeHistory: IncomeSnapshot[],
): HistoryEntry[] {
  const goalNames = new Map(goals.map((goal) => [goal.id, goal.name]));

  const monthlyEntries = incomeHistory.flatMap((row): HistoryEntry[] => {
    const month = new Date(`${row.monthStart}T12:00:00`).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    return [
      {
        id: `income-${row.id}`,
        date: `${row.monthStart}T12:00:00`,
        description: `Monthly income for ${month}`,
        amount: row.monthlyIncome,
        category: 'income',
        inflow: true,
        viaPayPal: false,
        status: 'Recorded',
      },
      {
        id: `expense-${row.id}`,
        date: `${row.monthStart}T12:00:00`,
        description: `Monthly expenses for ${month}`,
        amount: row.monthlyExpenses,
        category: 'expense',
        inflow: false,
        viaPayPal: false,
        status: 'Recorded',
      },
    ];
  });

  const goalEntries = transactions.map((tx): HistoryEntry => {
    const goalName = goalNames.get(tx.goalId) ?? 'Removed goal';
    const isDeposit = tx.kind === 'deposit';
    return {
      id: tx.id,
      date: tx.createdAt,
      description: tx.note ? `${goalName} · ${tx.note}` : goalName,
      amount: tx.amount,
      category: isDeposit ? 'goal_deposit' : 'goal_withdrawal',
      inflow: isDeposit,
      viaPayPal: tx.paymentMethod === 'paypal',
      status: 'Completed',
    };
  });

  return [...monthlyEntries, ...goalEntries].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
  );
}

export function filterHistory(entries: HistoryEntry[], filter: HistoryFilter): HistoryEntry[] {
  if (filter === 'all') return entries;
  if (filter === 'paypal') return entries.filter((entry) => entry.viaPayPal);
  return entries.filter((entry) => entry.category === filter);
}
