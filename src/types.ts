export interface Budget {
  monthlyIncome: number;
  monthlyExpenses: number;
}

export interface IncomeSnapshot extends Budget {
  id: string;
  monthStart: string;
}

export type AutoPayStatus = 'ready' | 'active' | 'paused' | 'unavailable';

export interface AutoSaveSettings {
  enabled: boolean;
  monthlyAmount: number;
  goalIds: string[];
  safetyBuffer: number;
  recommendedAmount: number;
  autopayEnabled: boolean;
  autopayStatus: AutoPayStatus;
  nextRunAt: string | null;
  lastRecalculatedAt: string | null;
  lastTransferAt: string | null;
  transferCount: number;
}

export type GoalColor = 'blue' | 'green' | 'teal' | 'sky' | 'amber';

export interface PayPalSettings {
  connected: boolean;
  payerId: string;
  accountName: string;
  accountEmail: string;
  avatarUrl: string | null;
  accountStatus: string;
  paypalBalance: number;
  balanceAvailable: boolean;
  connectedAt: string | null;
  isSandbox: boolean;
}

export type DreamType = 'car' | 'bike' | 'travel' | 'other';

export interface Goal {
  id: string;
  name: string;
  icon: string;
  dreamType: DreamType;
  color: GoalColor;
  targetAmount: number;
  targetDate: string;
  createdAt: string;
}

export type TransactionKind = 'deposit' | 'withdrawal' | 'emergency';
export type PaymentMethod = 'manual' | 'paypal';

export interface GoalTransaction {
  id: string;
  goalId: string;
  kind: TransactionKind;
  amount: number;
  note: string;
  paymentMethod: PaymentMethod;
  paypalOrderId: string | null;
  createdAt: string;
}

export interface GoalWithSaved extends Goal {
  saved: number;
}

export type AppView = 'dashboard' | 'goals' | 'planner' | 'emergency' | 'protect' | 'terms' | 'history' | 'profile';
