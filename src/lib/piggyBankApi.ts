import { supabase } from '@/lib/supabase';
import type { AutoPayStatus, AutoSaveSettings, Budget, DreamType, Goal, GoalColor, GoalTransaction, IncomeSnapshot, PayPalSettings, PaymentMethod, TransactionKind } from '@/types';

interface BudgetRow { monthly_income: number; monthly_expenses: number }
interface GoalRow { id: string; name: string; icon: string; dream_type: DreamType; color: GoalColor; target_amount: number; target_date: string; created_at: string }
interface TransactionRow { id: string; goal_id: string; kind: TransactionKind; amount: number; note: string; payment_method: PaymentMethod; paypal_order_id: string | null; created_at: string }
interface IncomeRow { id: string; month_start: string; monthly_income: number; monthly_expenses: number }
interface AutoSaveRow {
  enabled: boolean;
  monthly_amount: number;
  goal_ids: string[];
  safety_buffer: number;
  recommended_amount: number;
  autopay_enabled: boolean;
  autopay_status: AutoPayStatus;
  next_run_at: string | null;
  last_recalculated_at: string | null;
  last_transfer_at: string | null;
  transfer_count: number;
}
interface PayPalRow { connected: boolean; payer_id: string; account_name: string; account_email: string; avatar_url: string | null; account_status: string; paypal_balance: number; balance_available: boolean; connected_at: string | null }

export interface Workspace {
  budget: Budget | null;
  goals: Goal[];
  transactions: GoalTransaction[];
  incomeHistory: IncomeSnapshot[];
  autoSave: AutoSaveSettings;
  paypal: PayPalSettings;
}

export interface GoalInput { name: string; icon: string; dreamType: DreamType; color: GoalColor; targetAmount: number; targetDate: string }

const toGoal = (row: GoalRow): Goal => ({ id: row.id, name: row.name, icon: row.icon, dreamType: row.dream_type, color: row.color, targetAmount: Number(row.target_amount), targetDate: row.target_date, createdAt: row.created_at });
const toTransaction = (row: TransactionRow): GoalTransaction => ({ id: row.id, goalId: row.goal_id, kind: row.kind, amount: Number(row.amount), note: row.note, paymentMethod: row.payment_method, paypalOrderId: row.paypal_order_id, createdAt: row.created_at });
const toIncome = (row: IncomeRow): IncomeSnapshot => ({ id: row.id, monthStart: row.month_start, monthlyIncome: Number(row.monthly_income), monthlyExpenses: Number(row.monthly_expenses) });
const toPayPal = (row: PayPalRow): PayPalSettings => ({ connected: row.connected, payerId: row.payer_id, accountName: row.account_name, accountEmail: row.account_email, avatarUrl: row.avatar_url, accountStatus: row.account_status, paypalBalance: Number(row.paypal_balance), balanceAvailable: row.balance_available, connectedAt: row.connected_at, isSandbox: row.payer_id.startsWith('SBX') });

export const EMPTY_PAYPAL: PayPalSettings = { connected: false, payerId: '', accountName: '', accountEmail: '', avatarUrl: null, accountStatus: '', paypalBalance: 0, balanceAvailable: false, connectedAt: null, isSandbox: false };

export const EMPTY_AUTOSAVE: AutoSaveSettings = { enabled: false, monthlyAmount: 0, goalIds: [], safetyBuffer: 0, recommendedAmount: 0, autopayEnabled: false, autopayStatus: 'ready', nextRunAt: null, lastRecalculatedAt: null, lastTransferAt: null, transferCount: 0 };

export async function fetchWorkspace(): Promise<Workspace> {
  const [budgetRes, goalsRes, transactionsRes, incomeRes, autoSaveRes, paypalRes] = await Promise.all([
    supabase.from('budget_profiles').select('monthly_income, monthly_expenses').maybeSingle<BudgetRow>(),
    supabase.from('savings_goals').select('id, name, icon, dream_type, color, target_amount, target_date, created_at').order('target_date', { ascending: true }).returns<GoalRow[]>(),
    supabase.from('goal_transactions').select('id, goal_id, kind, amount, note, payment_method, paypal_order_id, created_at').order('created_at', { ascending: false }).returns<TransactionRow[]>(),
    supabase.from('income_history').select('id, month_start, monthly_income, monthly_expenses').order('month_start', { ascending: false }).limit(12).returns<IncomeRow[]>(),
    supabase.from('autosave_settings').select('enabled, monthly_amount, goal_ids, safety_buffer, recommended_amount, autopay_enabled, autopay_status, next_run_at, last_recalculated_at, last_transfer_at, transfer_count').maybeSingle<AutoSaveRow>(),
    supabase.from('paypal_settings').select('connected, payer_id, account_name, account_email, avatar_url, account_status, paypal_balance, balance_available, connected_at').maybeSingle<PayPalRow>(),
  ]);
  for (const response of [budgetRes, goalsRes, transactionsRes, incomeRes, autoSaveRes, paypalRes]) if (response.error) throw response.error;
  return {
    budget: budgetRes.data ? { monthlyIncome: Number(budgetRes.data.monthly_income), monthlyExpenses: Number(budgetRes.data.monthly_expenses) } : null,
    goals: (goalsRes.data ?? []).map(toGoal),
    transactions: (transactionsRes.data ?? []).map(toTransaction),
    incomeHistory: (incomeRes.data ?? []).map(toIncome),
    autoSave: autoSaveRes.data ? {
      enabled: autoSaveRes.data.enabled,
      monthlyAmount: Number(autoSaveRes.data.monthly_amount),
      goalIds: autoSaveRes.data.goal_ids ?? [],
      safetyBuffer: Number(autoSaveRes.data.safety_buffer),
      recommendedAmount: Number(autoSaveRes.data.recommended_amount),
      autopayEnabled: autoSaveRes.data.autopay_enabled,
      autopayStatus: autoSaveRes.data.autopay_status,
      nextRunAt: autoSaveRes.data.next_run_at,
      lastRecalculatedAt: autoSaveRes.data.last_recalculated_at,
      lastTransferAt: autoSaveRes.data.last_transfer_at,
      transferCount: autoSaveRes.data.transfer_count,
    } : { enabled: false, monthlyAmount: 0, goalIds: [], safetyBuffer: 0, recommendedAmount: 0, autopayEnabled: false, autopayStatus: 'ready', nextRunAt: null, lastRecalculatedAt: null, lastTransferAt: null, transferCount: 0 },
    paypal: paypalRes.data ? toPayPal(paypalRes.data) : EMPTY_PAYPAL,
  };
}

export async function saveBudget(budget: Budget): Promise<void> {
  const monthStart = new Date();
  monthStart.setDate(1);
  const month = monthStart.toISOString().slice(0, 10);
  const { error: budgetError } = await supabase.from('budget_profiles').upsert({ monthly_income: budget.monthlyIncome, monthly_expenses: budget.monthlyExpenses, updated_at: new Date().toISOString() }, { onConflict: 'user_id' });
  if (budgetError) throw budgetError;
  const { error: incomeError } = await supabase.from('income_history').upsert({ month_start: month, monthly_income: budget.monthlyIncome, monthly_expenses: budget.monthlyExpenses, updated_at: new Date().toISOString() }, { onConflict: 'user_id,month_start' });
  if (incomeError) throw incomeError;
}

export async function saveAutoSave(settings: AutoSaveSettings): Promise<void> {
  const { error } = await supabase.from('autosave_settings').upsert({
    enabled: settings.enabled,
    monthly_amount: settings.monthlyAmount,
    goal_ids: settings.goalIds,
    safety_buffer: settings.safetyBuffer,
    recommended_amount: settings.recommendedAmount,
    autopay_enabled: settings.autopayEnabled,
    autopay_status: settings.autopayStatus,
    next_run_at: settings.nextRunAt,
    last_recalculated_at: settings.lastRecalculatedAt,
    last_transfer_at: settings.lastTransferAt,
    transfer_count: settings.transferCount,
    updated_at: new Date().toISOString(),
  }, { onConflict: 'user_id' });
  if (error) throw error;
}

export async function createGoal(input: GoalInput): Promise<void> {
  const { error } = await supabase.from('savings_goals').insert({ name: input.name, icon: input.icon, dream_type: input.dreamType, color: input.color, target_amount: input.targetAmount, target_date: input.targetDate });
  if (error) throw error;
}

export async function updateGoal(goalId: string, input: GoalInput): Promise<void> {
  const { error } = await supabase.from('savings_goals').update({ name: input.name, icon: input.icon, dream_type: input.dreamType, color: input.color, target_amount: input.targetAmount, target_date: input.targetDate, updated_at: new Date().toISOString() }).eq('id', goalId);
  if (error) throw error;
}

export async function deleteGoal(goalId: string): Promise<void> {
  const { error } = await supabase.from('savings_goals').delete().eq('id', goalId);
  if (error) throw error;
}

export async function addTransaction(goalId: string, kind: TransactionKind, amount: number, note: string, paymentMethod: PaymentMethod, paypalOrderId: string | null = null): Promise<void> {
  const { error } = await supabase.from('goal_transactions').insert({ goal_id: goalId, kind, amount, note, payment_method: paymentMethod, paypal_order_id: paypalOrderId });
  if (error && !(paypalOrderId && error.code === '23505')) throw error;
}
