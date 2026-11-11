import { ArrowDown, Lock, ShieldCheck, Wallet } from 'lucide-react';
import { InfoTooltip } from '@/components/ui/InfoTooltip';
import { formatMoney } from '@/lib/format';
import type { ProtectedBalance } from '@/lib/finance';

const SPENDABLE_HELP =
  'DreamBank AI protects a portion of your PayPal balance for active goals. Spendable Balance shows how much is currently available after reserved savings.';

interface BalanceFlowCardProps {
  balance: ProtectedBalance;
}

export function BalanceFlowCard({ balance }: BalanceFlowCardProps) {
  const { totalBalance, protectedBalance, spendableBalance } = balance;
  const protectedPercent = totalBalance > 0 ? (protectedBalance / totalBalance) * 100 : 0;

  return (
    <section className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm">
      <div className="flex items-center gap-2">
        <ShieldCheck className="h-5 w-5 text-blue-600" />
        <h2 className="text-base font-semibold text-slate-900">Balance flow</h2>
      </div>
      <p className="mt-1 text-sm text-slate-500">How your PayPal money becomes spendable.</p>

      <div className="mt-5 flex flex-col gap-2">
        <FlowStep
          icon={Wallet}
          label="PayPal Balance"
          value={formatMoney(totalBalance)}
          tone="bg-slate-100 text-slate-700"
        />
        <FlowConnector />
        <FlowStep
          icon={Lock}
          label="Protected Goal Savings"
          value={`- ${formatMoney(protectedBalance)}`}
          tone="bg-blue-50 text-blue-700"
        />
        <FlowConnector />
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50/70 p-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700">
                <ShieldCheck className="h-4 w-4" />
              </span>
              <div>
                <p className="text-xs font-medium text-emerald-800">Spendable Balance</p>
                <p className="text-xs text-slate-500">PayPal Balance - Protected Savings</p>
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <p className="text-xl font-bold tracking-tight text-slate-900">{formatMoney(spendableBalance)}</p>
              <InfoTooltip text={SPENDABLE_HELP} label="About Spendable Balance" />
            </div>
          </div>
        </div>
      </div>

      <div className="mt-5">
        <div className="mb-2 flex justify-between text-xs font-medium text-slate-500">
          <span>Protected {protectedPercent.toFixed(0)}%</span>
          <span>Spendable {(100 - protectedPercent).toFixed(0)}%</span>
        </div>
        <div className="flex h-3 overflow-hidden rounded-full bg-slate-100">
          <div className="bg-gradient-to-r from-blue-600 to-blue-500 transition-all duration-700" style={{ width: `${protectedPercent}%` }} />
          <div className="bg-gradient-to-r from-emerald-500 to-emerald-400 transition-all duration-700" style={{ width: `${100 - protectedPercent}%` }} />
        </div>
      </div>

      <p className="mt-4 rounded-xl bg-blue-50/60 px-4 py-3 text-xs leading-5 text-slate-600">
        <span className="font-semibold text-blue-700">PayPal Balance - Protected Savings = Spendable Balance.</span>{' '}
        Goal savings stay locked for your dreams. Only emergency withdrawals can unlock them.
      </p>
    </section>
  );
}

function FlowStep({ icon: Icon, label, value, tone }: { icon: typeof Wallet; label: string; value: string; tone: string }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-2xl border border-slate-100 p-4">
      <div className="flex items-center gap-3">
        <span className={`flex h-8 w-8 items-center justify-center rounded-lg ${tone}`}>
          <Icon className="h-4 w-4" />
        </span>
        <p className="text-xs font-medium text-slate-600">{label}</p>
      </div>
      <p className="text-base font-bold tracking-tight text-slate-900">{value}</p>
    </div>
  );
}

function FlowConnector() {
  return (
    <div className="flex justify-start pl-7">
      <ArrowDown className="h-4 w-4 text-slate-300" />
    </div>
  );
}
