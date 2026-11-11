import { useState } from 'react';
import { Loader2 } from 'lucide-react';

export function useAsyncAction() {
  const [isBusy, setIsBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const run = async (action: () => Promise<void>, onDone?: () => void) => {
    setIsBusy(true);
    setError(null);
    try {
      await action();
      onDone?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
    } finally {
      setIsBusy(false);
    }
  };

  return { isBusy, error, run };
}

export function FormError({ message }: { message: string | null }) {
  if (!message) return null;
  return <p className="rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{message}</p>;
}

export function SubmitButton({ isBusy, label, busyLabel, disabled }: {
  isBusy: boolean;
  label: string;
  busyLabel: string;
  disabled?: boolean;
}) {
  return (
    <button
      type="submit"
      disabled={isBusy || disabled}
      className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-emerald-500 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-600/20 transition hover:shadow-xl hover:shadow-blue-600/30 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {isBusy && <Loader2 className="h-4 w-4 animate-spin" />}
      {isBusy ? busyLabel : label}
    </button>
  );
}

export const inputClassName =
  'w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/15';

export const labelClassName = 'mb-1.5 block text-sm font-medium text-slate-700';
