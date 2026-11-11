import { useState, type FormEvent } from 'react';
import { FormError, inputClassName, labelClassName, SubmitButton, useAsyncAction } from '@/components/ui/formPrimitives';
import { Modal } from '@/components/ui/Modal';
import type { Budget } from '@/types';

interface BudgetModalProps {
  initial: Budget | null;
  onSave: (budget: Budget) => Promise<void>;
  onClose: () => void;
}

export function BudgetModal({ initial, onSave, onClose }: BudgetModalProps) {
  const [income, setIncome] = useState(initial ? String(initial.monthlyIncome) : '');
  const [expenses, setExpenses] = useState(initial ? String(initial.monthlyExpenses) : '');
  const [validation, setValidation] = useState<string | null>(null);
  const { isBusy, error, run } = useAsyncAction();

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    const monthlyIncome = Number(income);
    const monthlyExpenses = Number(expenses);

    if (income.trim() === '' || Number.isNaN(monthlyIncome) || monthlyIncome <= 0) {
      setValidation('Enter your monthly income as an amount greater than zero.');
      return;
    }
    if (expenses.trim() === '' || Number.isNaN(monthlyExpenses) || monthlyExpenses < 0) {
      setValidation('Enter your monthly expenses as zero or more.');
      return;
    }
    setValidation(null);
    void run(() => onSave({ monthlyIncome, monthlyExpenses }), onClose);
  };

  return (
    <Modal
      title="Your monthly budget"
      description="We use these two numbers to calculate how much you can safely save each month."
      onClose={onClose}
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label htmlFor="monthly-income" className={labelClassName}>Monthly income (after tax)</label>
          <div className="relative">
            <span className="pointer-events-none absolute inset-y-0 left-4 flex items-center text-slate-400">$</span>
            <input
              id="monthly-income"
              type="number"
              inputMode="decimal"
              min="0"
              step="0.01"
              value={income}
              onChange={(event) => setIncome(event.target.value)}
              placeholder="5,000"
              className={`${inputClassName} pl-8`}
            />
          </div>
        </div>
        <div>
          <label htmlFor="monthly-expenses" className={labelClassName}>Monthly expenses</label>
          <div className="relative">
            <span className="pointer-events-none absolute inset-y-0 left-4 flex items-center text-slate-400">$</span>
            <input
              id="monthly-expenses"
              type="number"
              inputMode="decimal"
              min="0"
              step="0.01"
              value={expenses}
              onChange={(event) => setExpenses(event.target.value)}
              placeholder="3,200"
              className={`${inputClassName} pl-8`}
            />
          </div>
          <p className="mt-2 text-xs text-slate-500">Include rent, bills, groceries, debt payments and subscriptions.</p>
        </div>
        <FormError message={validation ?? error} />
        <SubmitButton isBusy={isBusy} label="Save budget" busyLabel="Saving..." />
      </form>
    </Modal>
  );
}
