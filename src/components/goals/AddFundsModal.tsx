import { useState, type FormEvent } from 'react';
import { CheckCircle2, RotateCw } from 'lucide-react';
import { PayPalFundingButtons } from '@/components/funding/PayPalFundingButtons';
import { FormError, inputClassName, labelClassName, SubmitButton, useAsyncAction } from '@/components/ui/formPrimitives';
import { Modal } from '@/components/ui/Modal';
import { formatMoney, formatMoneyExact } from '@/lib/format';
import type { GoalWithSaved } from '@/types';

const QUICK_AMOUNTS = [25, 100, 250, 500];

interface AddFundsModalProps {
  goal: GoalWithSaved;
  onDeposit: (amount: number, note: string, paymentMethod: 'manual' | 'paypal', paypalOrderId: string | null) => Promise<void>;
  onClose: () => void;
}

export function AddFundsModal({ goal, onDeposit, onClose }: AddFundsModalProps) {
  const [amountText, setAmountText] = useState('');
  const [note, setNote] = useState('');
  const [validation, setValidation] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [approvedPayment, setApprovedPayment] = useState<{ amount: number; orderId: string } | null>(null);
  const [isSavingPayment, setIsSavingPayment] = useState(false);
  const { isBusy, error, run } = useAsyncAction();
  const amount = Number(amountText);
  const isValidAmount = amountText.trim() !== '' && !Number.isNaN(amount) && amount > 0;
  const remaining = Math.max(0, goal.targetAmount - goal.saved);

  const handleManualSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (!isValidAmount) {
      setValidation('Enter an amount greater than zero.');
      return;
    }
    setValidation(null);
    void run(() => onDeposit(amount, note.trim(), 'manual', null), onClose);
  };

  const savePayPalPayment = async (payment: { amount: number; orderId: string }) => {
    setPaymentError(null);
    setIsSavingPayment(true);
    try {
      await onDeposit(payment.amount, note.trim(), 'paypal', payment.orderId);
      setApprovedPayment(null);
      setSuccessMessage(`${formatMoneyExact(payment.amount)} added to ${goal.name} via PayPal.`);
    } catch (caught) {
      setPaymentError(
        `PayPal accepted your payment, but we could not save it to ${goal.name} yet. Do not pay again. Press Save payment to retry.${caught instanceof Error ? ` ${caught.message}` : ''}`,
      );
    } finally {
      setIsSavingPayment(false);
    }
  };

  if (successMessage) {
    return (
      <Modal title="Payment complete" onClose={onClose}>
        <div className="flex flex-col items-center gap-4 py-4 text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
            <CheckCircle2 className="h-8 w-8" />
          </span>
          <p className="text-base font-semibold text-slate-900">{successMessage}</p>
          <p className="text-sm text-slate-500">Your goal progress and dashboard are already updated.</p>
          <button
            type="button"
            onClick={onClose}
            className="mt-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
          >
            Done
          </button>
        </div>
      </Modal>
    );
  }

  return (
    <Modal
      title={`Fund ${goal.name}`}
      description={`${formatMoney(remaining)} left to reach your target.`}
      onClose={onClose}
    >
      <div className="space-y-6">
        <div>
          <label htmlFor="deposit-amount" className={labelClassName}>Amount</label>
          <div className="relative">
            <span className="pointer-events-none absolute inset-y-0 left-4 flex items-center text-slate-400">$</span>
            <input
              id="deposit-amount"
              type="number"
              min="0"
              step="0.01"
              inputMode="decimal"
              value={amountText}
              onChange={(event) => setAmountText(event.target.value)}
              placeholder="100"
              className={`${inputClassName} pl-8`}
            />
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {QUICK_AMOUNTS.map((quick) => (
              <button
                key={quick}
                type="button"
                onClick={() => setAmountText(String(quick))}
                className="rounded-full border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:border-emerald-400 hover:text-emerald-700"
              >
                {formatMoney(quick)}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label htmlFor="deposit-note" className={labelClassName}>Note (optional)</label>
          <input
            id="deposit-note"
            type="text"
            maxLength={120}
            value={note}
            onChange={(event) => setNote(event.target.value)}
            placeholder="Bonus, side project, birthday gift"
            className={inputClassName}
          />
        </div>

        <section className="space-y-3 rounded-2xl border border-blue-100 bg-blue-50/50 p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="text-sm font-semibold text-slate-900">Pay with PayPal</h3>
              <p className="text-xs text-slate-500">Simulated checkout for this demo. No real money is charged — the app records the deposit and updates your goal progress.</p>
            </div>
            <span className="shrink-0 rounded-full bg-amber-100 px-2.5 py-1 text-[10px] font-bold tracking-wide text-amber-700">DEMO</span>
          </div>
          <PayPalFundingButtons
            amount={isValidAmount ? amount : 0}
            description={`Savings for ${goal.name}`}
            onApproved={async (paidAmount, orderId) => {
              const payment = { amount: paidAmount, orderId };
              setApprovedPayment(payment);
              await savePayPalPayment(payment);
            }}
          />
          <FormError message={paymentError} />
          {approvedPayment && (
            <button
              type="button"
              onClick={() => void savePayPalPayment(approvedPayment)}
              disabled={isSavingPayment}
              className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <RotateCw className={`h-4 w-4 ${isSavingPayment ? 'animate-spin' : ''}`} />
              {isSavingPayment ? 'Saving...' : 'Save payment'}
            </button>
          )}
        </section>

        <details className="group rounded-xl border border-slate-200 p-4">
          <summary className="cursor-pointer text-sm font-semibold text-slate-600 transition hover:text-slate-900">
            I already saved this money elsewhere
          </summary>
          <form onSubmit={handleManualSubmit} className="mt-4 space-y-4">
            <FormError message={validation ?? error} />
            <SubmitButton isBusy={isBusy} label="Record savings" busyLabel="Saving..." disabled={!isValidAmount} />
          </form>
        </details>
      </div>
    </Modal>
  );
}
