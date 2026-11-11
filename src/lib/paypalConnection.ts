import { supabase } from '@/lib/supabase';
import type { PayPalSettings } from '@/types';

export interface SandboxDemoAccount {
  payerId: string;
  avatarUrl: string | null;
  accountStatus: string;
  paypalBalance: number;
  balanceAvailable: boolean;
  isSandbox: true;
  transactions: SandboxTransaction[];
}

export interface SandboxTransaction {
  id: string;
  description: string;
  amount: number;
  inflow: boolean;
  date: string;
}

const SANDBOX_DEMO: SandboxDemoAccount = {
  payerId: 'SBXRAHUL0001',
  avatarUrl: null,
  accountStatus: 'Verified',
  paypalBalance: 52450,
  balanceAvailable: true,
  isSandbox: true,
  transactions: [
    { id: 'sbx-salary', description: 'Salary Credit', amount: 50000, inflow: true, date: '2026-11-01T09:00:00' },
    { id: 'sbx-fuel', description: 'Fuel', amount: 800, inflow: false, date: '2026-11-03T18:30:00' },
    { id: 'sbx-food', description: 'Food', amount: 450, inflow: false, date: '2026-11-04T13:15:00' },
    { id: 'sbx-shopping', description: 'Shopping', amount: 1200, inflow: false, date: '2026-11-05T20:00:00' },
    { id: 'sbx-subscription', description: 'Subscription', amount: 299, inflow: false, date: '2026-11-06T11:45:00' },
  ],
};

export function getSandboxDemoAccount(): SandboxDemoAccount {
  return SANDBOX_DEMO;
}

export async function connectSandboxDemo(): Promise<void> {
  const demo = SANDBOX_DEMO;
  const { data, error: userError } = await supabase.auth.getUser();
  const authEmail = data.user?.email;
  if (userError || !authEmail) throw new Error('Sign in again to connect the PayPal Sandbox account.');
  const now = new Date().toISOString();
  const { error } = await supabase.from('paypal_settings').upsert(
    {
      connected: true,
      payer_id: demo.payerId,
      account_name: '',
      account_email: authEmail,
      avatar_url: demo.avatarUrl,
      account_status: demo.accountStatus,
      paypal_balance: demo.paypalBalance,
      balance_available: demo.balanceAvailable,
      connected_at: now,
      updated_at: now,
    },
    { onConflict: 'user_id' },
  );
  if (error) throw error;
}

export async function disconnectPayPal(): Promise<void> {
  const now = new Date().toISOString();
  const { error } = await supabase.from('paypal_settings').upsert(
    {
      connected: false,
      payer_id: '',
      account_name: '',
      account_email: '',
      avatar_url: null,
      account_status: '',
      paypal_balance: 0,
      balance_available: false,
      connected_at: null,
      updated_at: now,
    },
    { onConflict: 'user_id' },
  );
  if (error) throw error;
}

export function isSandboxAccount(settings: PayPalSettings): boolean {
  return settings.connected && settings.payerId.startsWith('SBX');
}
