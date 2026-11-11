import { useState } from 'react';
import { ArrowRight, CheckCircle2, FlaskConical, Link2, Loader2, Unlink, Wallet } from 'lucide-react';
import { FormError } from '@/components/ui/formPrimitives';
import { connectSandboxDemo, disconnectPayPal } from '@/lib/paypalConnection';
import { formatMoney } from '@/lib/format';
import { getInitials } from '@/lib/profile';
import type { PayPalSettings } from '@/types';

interface PayPalConnectionCardProps {
  settings: PayPalSettings;
  onRefresh: () => Promise<void>;
  onOpenProfile: () => void;
}

export function PayPalConnectionCard({ settings, onRefresh, onOpenProfile }: PayPalConnectionCardProps) {
  const [isBusy, setIsBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleConnect = async () => {
    setError(null);
    setIsBusy(true);
    try {
      await connectSandboxDemo();
      await onRefresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not connect the sandbox demo account.');
    } finally {
      setIsBusy(false);
    }
  };

  const handleDisconnect = async () => {
    setError(null);
    setIsBusy(true);
    try {
      await disconnectPayPal();
      await onRefresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not disconnect PayPal.');
    } finally {
      setIsBusy(false);
    }
  };

  return (
    <section className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-md shadow-blue-600/20">
            <Wallet className="h-5 w-5" />
          </span>
          <div>
            <h2 className="text-base font-semibold text-slate-900">PayPal account</h2>
            <p className="text-sm text-slate-500">
              {settings.connected ? 'Connected and synced' : 'Connect PayPal to protect your goal savings'}
            </p>
          </div>
        </div>
        {settings.connected && (
          <span className="shrink-0 rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">
            <CheckCircle2 className="mr-1 inline h-3.5 w-3.5" />
            Connected
          </span>
        )}
      </div>

      {settings.isSandbox && (
        <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-amber-300 bg-amber-50 px-3 py-1.5 text-xs font-bold text-amber-800">
          <FlaskConical className="h-3.5 w-3.5" />
          PayPal Sandbox Demo Account
        </div>
      )}

      {settings.connected ? (
        <>
          <div className="mt-5 flex items-center gap-4 rounded-2xl border border-slate-100 p-4">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-blue-600 to-emerald-500 text-sm font-bold text-white">
              {settings.avatarUrl ? (
                <img src={settings.avatarUrl} alt="" className="h-full w-full object-cover" />
              ) : (
                getInitials(settings.accountName || settings.accountEmail)
              )}
            </span>
            <div className="min-w-0">
              <p className="truncate font-semibold text-slate-900">{settings.accountName || settings.accountEmail}</p>
              <p className="truncate text-sm text-slate-500">{settings.accountEmail}</p>
            </div>
          </div>

          <div className="mt-3 grid grid-cols-2 gap-3">
            <div className="rounded-2xl border border-slate-100 p-4">
              <p className="text-xs font-medium text-slate-500">PayPal balance</p>
              <p className="mt-1 text-2xl font-bold tracking-tight text-slate-900">
                {settings.balanceAvailable ? formatMoney(settings.paypalBalance) : 'Not shared'}
              </p>
            </div>
            <div className="rounded-2xl border border-slate-100 p-4">
              <p className="text-xs font-medium text-slate-500">Account status</p>
              <p className="mt-1 text-sm font-semibold text-slate-900">{settings.accountStatus || 'Connected'}</p>
            </div>
          </div>

          <div className="mt-3 rounded-2xl border border-slate-100 p-4">
            <p className="text-xs font-medium text-slate-500">PayPal account ID</p>
            <p className="mt-1 font-mono text-sm text-slate-900">{settings.payerId || '--'}</p>
          </div>

          <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
            <button
              type="button"
              onClick={onOpenProfile}
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-blue-700 transition hover:text-blue-800"
            >
              View PayPal profile
              <ArrowRight className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => void handleDisconnect()}
              disabled={isBusy}
              className="inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-semibold text-rose-600 transition hover:bg-rose-50 disabled:opacity-60"
            >
              {isBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Unlink className="h-4 w-4" />}
              Disconnect
            </button>
          </div>
        </>
      ) : (
        <div className="mt-5 space-y-4">
          <div className="rounded-xl border border-amber-200 bg-amber-50/70 px-4 py-3 text-sm text-amber-800">
            <p className="font-semibold">Sandbox demo mode</p>
            <p className="mt-1 text-xs leading-5 text-amber-700">
              No real PayPal sign-in is required. Connecting loads a simulated sandbox demo account with a realistic balance and transaction history for the hackathon.
            </p>
          </div>
          <button
            type="button"
            onClick={() => void handleConnect()}
            disabled={isBusy}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#0070ba] px-5 py-3 text-sm font-semibold text-white shadow-md shadow-blue-900/20 transition hover:bg-[#005ea6] disabled:opacity-60 sm:w-auto"
          >
            {isBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Link2 className="h-4 w-4" />}
            {isBusy ? 'Connecting...' : 'Connect PayPal'}
          </button>
        </div>
      )}

      <FormError message={error} />
    </section>
  );
}
