import { ArrowDownLeft, ArrowRight, ArrowUpRight, CheckCircle2, FlaskConical, Lock, Mail, ShieldCheck, Target, Wallet, Wand2 } from 'lucide-react';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { GOAL_COLORS, getGoalIcon } from '@/lib/goalStyles';
import { calculateProtectedBalance } from '@/lib/finance';
import { formatMoney, formatPercent } from '@/lib/format';
import { getInitials } from '@/lib/profile';
import { buildTransactionHistory, filterHistory } from '@/lib/transactionHistory';
import { getSandboxDemoAccount } from '@/lib/paypalConnection';
import type { PiggyBankState } from '@/hooks/usePiggyBank';
import type { AppView } from '@/types';

interface ProfileViewProps {
  state: PiggyBankState;
  fullName: string;
  email: string;
  memberSince: string;
  onNavigate: (view: AppView) => void;
}

const SHORT_DATE = { month: 'short', day: 'numeric', year: 'numeric' } as const;

export function ProfileView({ state, fullName, email, memberSince, onNavigate }: ProfileViewProps) {
  const { paypal, goals, portfolio, transactions, incomeHistory } = state;
  const isConnected = paypal.connected;
  const balance = calculateProtectedBalance(paypal.paypalBalance, portfolio.totalSaved);
  const paypalHistory = filterHistory(buildTransactionHistory(goals, transactions, incomeHistory), 'paypal').slice(0, 6);
  const sandboxTx = paypal.isSandbox ? getSandboxDemoAccount().transactions : [];

  return (
    <div className="space-y-6">
      <section className="flex flex-col items-start gap-5 rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm sm:flex-row sm:items-center sm:p-8">
        <span className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br from-blue-600 to-emerald-500 text-2xl font-bold text-white shadow-lg shadow-blue-600/20">
          {getInitials(fullName)}
        </span>
        <div className="min-w-0">
          <p className="text-sm font-medium text-blue-600">Your profile</p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">{fullName}</h1>
          <p className="mt-1 flex items-center gap-2 text-sm text-slate-500">
            <Mail className="h-4 w-4 shrink-0" />
            <span className="truncate">{email}</span>
          </p>
        </div>
        <span className={`sm:ml-auto inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold ${isConnected ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>
          {isConnected && <CheckCircle2 className="h-3.5 w-3.5" />}
          {isConnected ? `PayPal ${paypal.accountStatus || 'connected'}` : 'PayPal not connected'}
        </span>
      </section>

      {paypal.isSandbox && (
        <div className="inline-flex items-center gap-2 rounded-full border border-amber-300 bg-amber-50 px-3 py-1.5 text-xs font-bold text-amber-800">
          <FlaskConical className="h-3.5 w-3.5" />
          PayPal Sandbox Demo Account
        </div>
      )}

      {!isConnected && (
        <section className="flex flex-col gap-4 rounded-3xl border border-blue-100 bg-blue-50/60 p-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-slate-700">Connect your PayPal account from the dashboard to see your balance, protected savings and spendable money here.</p>
          <button
            type="button"
            onClick={() => onNavigate('dashboard')}
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
          >
            Go to dashboard
            <ArrowRight className="h-4 w-4" />
          </button>
        </section>
      )}

      <section className="grid gap-4 sm:grid-cols-3">
        <BalanceCard label="PayPal Balance" value={isConnected && paypal.balanceAvailable ? formatMoney(balance.totalBalance) : 'Not shared'} icon={Wallet} tone="blue" />
        <BalanceCard label="Protected Goal Savings" value={formatMoney(balance.protectedBalance)} icon={ShieldCheck} tone="emerald" />
        <BalanceCard label="Spendable Balance" value={formatMoney(balance.spendableBalance)} icon={Lock} tone="slate" />
      </section>

      <section className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm">
        <h2 className="text-base font-semibold text-slate-900">Account details</h2>
        <p className="mb-5 text-sm text-slate-500">Your DreamBank AI sign-in information.</p>
        <dl className="divide-y divide-slate-100">
          <InfoRow label="Full name" value={fullName} />
          <InfoRow label="Email" value={email} />
          <InfoRow label="Member since" value={new Date(memberSince).toLocaleDateString('en-US', SHORT_DATE)} />
        </dl>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm">
          <h2 className="text-base font-semibold text-slate-900">Connected PayPal account</h2>
          <p className="mb-5 text-sm text-slate-500">Details shared by PayPal when you connected.</p>
          <dl className="divide-y divide-slate-100">
            <InfoRow label="Connected account" value={isConnected ? paypal.accountEmail : 'None'} />
            <InfoRow label="PayPal account ID" value={isConnected && paypal.payerId ? paypal.payerId : '--'} />
            <InfoRow label="Account status" value={isConnected ? paypal.accountStatus || 'Connected' : 'Not connected'} />
            <InfoRow label="Connected on" value={isConnected && paypal.connectedAt ? new Date(paypal.connectedAt).toLocaleDateString('en-US', SHORT_DATE) : '--'} />
          </dl>
        </div>

        <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm">
          <h2 className="text-base font-semibold text-slate-900">Protected savings</h2>
          <p className="mb-5 text-sm text-slate-500">Money in your goal vaults is held back from spending.</p>
          <div className="space-y-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-600">Goal vaults total</span>
              <span className="font-semibold text-slate-900">{formatMoney(portfolio.totalSaved)}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-600">Protected Goal Savings</span>
              <span className="font-semibold text-emerald-700">{formatMoney(balance.protectedBalance)}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-600">Spendable Balance</span>
              <span className="font-semibold text-slate-900">{formatMoney(balance.spendableBalance)}</span>
            </div>
          </div>
        </div>
      </section>

      <section className="flex flex-col gap-4 rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
            <Wand2 className="h-5 w-5" />
          </span>
          <div>
            <h2 className="text-base font-semibold text-slate-900">AI AutoSave</h2>
            <p className="text-sm text-slate-500">
              {state.autoSave.enabled
                ? `Set to save ${formatMoney(state.autoSave.monthlyAmount)} each month.`
                : 'Turned off. Goal vaults only change when you add funds.'}
            </p>
          </div>
        </div>
        <span className={`inline-flex shrink-0 rounded-full px-3 py-1 text-xs font-bold ${state.autoSave.enabled ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>
          {state.autoSave.enabled ? 'Active' : 'Off'}
        </span>
      </section>

      <section className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm">
        <div className="mb-5 flex items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-semibold text-slate-900">Goal vaults</h2>
            <p className="text-sm text-slate-500">Each goal folder and how far along it is.</p>
          </div>
          <Target className="h-5 w-5 text-slate-400" />
        </div>
        {goals.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-slate-300 p-6 text-center text-sm text-slate-600">No goal vaults yet.</p>
        ) : (
          <ul className="grid gap-4 md:grid-cols-2">
            {goals.map((goal) => {
              const Icon = getGoalIcon(goal.icon);
              const percent = goal.targetAmount > 0 ? (goal.saved / goal.targetAmount) * 100 : 0;
              return (
                <li key={goal.id} className="rounded-2xl border border-slate-100 bg-slate-50/60 p-5">
                  <div className="flex items-center gap-3">
                    <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${GOAL_COLORS[goal.color].soft} ${GOAL_COLORS[goal.color].text}`}>
                      <Icon className="h-5 w-5" />
                    </span>
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-slate-900">{goal.name}</p>
                      <p className="text-xs text-slate-500">
                        {formatMoney(goal.saved)} of {formatMoney(goal.targetAmount)}
                      </p>
                    </div>
                  </div>
                  <div className="mt-4">
                    <ProgressBar percent={percent} color={goal.color} label={`${goal.name} progress`} />
                  </div>
                  <p className="mt-2 text-xs text-slate-500">{formatPercent(percent)} complete</p>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm">
        <div className="mb-5 flex items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-semibold text-slate-900">PayPal transactions</h2>
            <p className="text-sm text-slate-500">
              {paypal.isSandbox ? 'Recent activity from your sandbox demo account.' : 'Recent savings moved through PayPal.'}
            </p>
          </div>
          {!paypal.isSandbox && (
            <button
              type="button"
              onClick={() => onNavigate('history')}
              className="inline-flex items-center gap-1 text-sm font-semibold text-blue-600 transition hover:text-blue-800"
            >
              Full history
              <ArrowRight className="h-4 w-4" />
            </button>
          )}
        </div>
        {paypal.isSandbox && sandboxTx.length > 0 ? (
          <ul className="divide-y divide-slate-100">
            {sandboxTx.map((entry) => (
              <li key={entry.id} className="flex items-center justify-between gap-4 py-3">
                <div className="flex min-w-0 items-center gap-3">
                  <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${entry.inflow ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-600'}`}>
                    {entry.inflow ? <ArrowDownLeft className="h-4 w-4" /> : <ArrowUpRight className="h-4 w-4" />}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-slate-900">{entry.description}</p>
                    <p className="text-xs text-slate-500">{new Date(entry.date).toLocaleDateString('en-US', SHORT_DATE)}</p>
                  </div>
                </div>
                <p className={`shrink-0 text-sm font-semibold ${entry.inflow ? 'text-emerald-700' : 'text-slate-900'}`}>
                  {entry.inflow ? '+' : '-'}
                  {formatMoney(entry.amount)}
                </p>
              </li>
            ))}
          </ul>
        ) : paypalHistory.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-slate-300 p-6 text-center text-sm text-slate-600">No PayPal transactions yet.</p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {paypalHistory.map((entry) => (
              <li key={entry.id} className="flex items-center justify-between gap-4 py-3">
                <div className="flex min-w-0 items-center gap-3">
                  <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${entry.inflow ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-600'}`}>
                    {entry.inflow ? <ArrowDownLeft className="h-4 w-4" /> : <ArrowUpRight className="h-4 w-4" />}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-slate-900">{entry.description}</p>
                    <p className="text-xs text-slate-500">{new Date(entry.date).toLocaleDateString('en-US', SHORT_DATE)}</p>
                  </div>
                </div>
                <p className={`shrink-0 text-sm font-semibold ${entry.inflow ? 'text-emerald-700' : 'text-slate-900'}`}>
                  {entry.inflow ? '+' : '-'}
                  {formatMoney(entry.amount)}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

interface BalanceCardProps {
  label: string;
  value: string;
  icon: typeof Wallet;
  tone: 'blue' | 'emerald' | 'slate';
}

const TONE_STYLES: Record<BalanceCardProps['tone'], string> = {
  blue: 'bg-blue-50 text-blue-600',
  emerald: 'bg-emerald-50 text-emerald-600',
  slate: 'bg-slate-100 text-slate-600',
};

function BalanceCard({ label, value, icon: Icon, tone }: BalanceCardProps) {
  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <span className={`flex h-9 w-9 items-center justify-center rounded-xl ${TONE_STYLES[tone]}`}>
        <Icon className="h-4 w-4" />
      </span>
      <p className="mt-4 text-sm text-slate-500">{label}</p>
      <p className="mt-1 text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">{value}</p>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 py-3">
      <dt className="text-sm text-slate-500">{label}</dt>
      <dd className="min-w-0 truncate text-right text-sm font-medium text-slate-900">{value}</dd>
    </div>
  );
}
