import type { SandboxTransaction } from '@/lib/paypalConnection';

export type ExpenseNature = 'regular' | 'irregular';

export interface CategoryTotal {
  label: string;
  nature: ExpenseNature;
  amount: number;
}

export interface SpendingSummary {
  weekdayTotal: number;
  weekendTotal: number;
  regularTotal: number;
  irregularTotal: number;
  categories: CategoryTotal[];
}

interface ExpenseRule {
  label: string;
  nature: ExpenseNature;
  keywords: string[];
}

const RULES: ExpenseRule[] = [
  { label: 'Rent & utilities', nature: 'regular', keywords: ['rent', 'utilit', 'electric', 'water bill', 'internet'] },
  { label: 'Groceries', nature: 'regular', keywords: ['food', 'grocer'] },
  { label: 'Transportation', nature: 'regular', keywords: ['fuel', 'gas', 'transit', 'metro', 'bus'] },
  { label: 'Subscriptions', nature: 'regular', keywords: ['subscription', 'netflix', 'spotify'] },
  { label: 'Shopping', nature: 'irregular', keywords: ['shop'] },
  { label: 'Entertainment', nature: 'irregular', keywords: ['movie', 'entertain', 'restaurant', 'dining'] },
  { label: 'Travel', nature: 'irregular', keywords: ['travel', 'flight', 'hotel'] },
  { label: 'Emergencies', nature: 'irregular', keywords: ['emergency', 'medical', 'repair'] },
];

const OTHER_RULE: ExpenseRule = { label: 'Other', nature: 'irregular', keywords: [] };

export function classifyExpense(description: string): ExpenseRule {
  const lower = description.toLowerCase();
  return RULES.find((rule) => rule.keywords.some((keyword) => lower.includes(keyword))) ?? OTHER_RULE;
}

export function summarizeSpending(transactions: SandboxTransaction[], now: Date): SpendingSummary {
  const totals = { weekdayTotal: 0, weekendTotal: 0, regularTotal: 0, irregularTotal: 0 };
  const byLabel = new Map<string, CategoryTotal>();

  for (const tx of transactions) {
    if (tx.inflow) continue;
    const date = new Date(tx.date);
    if (date.getFullYear() !== now.getFullYear() || date.getMonth() !== now.getMonth()) continue;

    const rule = classifyExpense(tx.description);
    const isWeekend = date.getDay() === 0 || date.getDay() === 6;
    if (isWeekend) totals.weekendTotal += tx.amount;
    else totals.weekdayTotal += tx.amount;

    if (rule.nature === 'regular') totals.regularTotal += tx.amount;
    else totals.irregularTotal += tx.amount;

    const entry = byLabel.get(rule.label) ?? { label: rule.label, nature: rule.nature, amount: 0 };
    entry.amount += tx.amount;
    byLabel.set(rule.label, entry);
  }

  return {
    ...totals,
    categories: [...byLabel.values()].sort((a, b) => b.amount - a.amount),
  };
}
