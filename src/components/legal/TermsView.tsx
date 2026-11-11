import { AlertTriangle, ArrowRight, CheckCircle2, CircleDollarSign, FileText, LockKeyhole, ShieldCheck, WalletCards } from 'lucide-react';

const sections = [
  {
    icon: CircleDollarSign,
    title: '1. Set your money plan',
    text: 'Add your monthly income and expenses so DreamBank AI can estimate a safe amount to save. These estimates are planning tools, not financial advice or a promise that you can afford a specific purchase.',
  },
  {
    icon: LockKeyhole,
    title: '2. Create goal vaults',
    text: 'Create goals with a name, target amount, and target date. Money added to a goal is shown as protected savings and is included in your progress, forecasts, and spending-protection calculations.',
  },
  {
    icon: ShieldCheck,
    title: '3. Protect your progress',
    text: 'The spendable balance is calculated as your connected balance minus protected goal savings. Before a large purchase, use Protect to see whether it could reduce a goal or delay its projected completion date.',
  },
  {
    icon: WalletCards,
    title: '4. Add or remove money',
    text: 'Record deposits, withdrawals, and emergency withdrawals accurately. A withdrawal reduces the selected goal balance. Emergency withdrawals are for genuine urgent needs and may change your forecasts.',
  },
];

const rules = [
  'Keep your income, expenses, goal amounts, and target dates up to date.',
  'Review the dashboard before relying on a projected completion date.',
  'Only connect an account you own or are authorized to use.',
  'Do not enter passwords, card numbers, or other sensitive payment details into notes or goal names.',
  'Check all amounts before confirming a deposit or withdrawal.',
  'Contact your financial institution for account, payment, or transfer disputes.',
];

export function TermsView() {
  return (
    <div className="space-y-8">
      <section className="overflow-hidden rounded-3xl bg-slate-900 p-7 text-white shadow-xl shadow-slate-900/10 sm:p-10">
        <div className="max-w-3xl">
          <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-blue-200">
            <FileText className="h-3.5 w-3.5" /> User guide & terms
          </span>
          <h1 className="mt-5 text-3xl font-bold tracking-tight sm:text-4xl">A simple plan for protecting your dreams.</h1>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-300 sm:text-base">
            DreamBank AI helps you organize goals, understand your available balance, and make more informed saving decisions. Read this guide before using the app.
          </p>
          <p className="mt-6 text-xs text-slate-400">Last updated: November 9, 2026</p>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2">
        {sections.map(({ icon: Icon, title, text }) => (
          <article key={title} className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
              <Icon className="h-5 w-5" />
            </span>
            <h2 className="mt-5 text-base font-bold text-slate-900">{title}</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">{text}</p>
          </article>
        ))}
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <article className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm sm:p-8">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="h-5 w-5 text-emerald-600" />
            <h2 className="text-xl font-bold text-slate-900">How to use DreamBank AI well</h2>
          </div>
          <ul className="mt-6 space-y-4">
            {rules.map((rule) => (
              <li key={rule} className="flex gap-3 text-sm leading-6 text-slate-600">
                <ArrowRight className="mt-1 h-4 w-4 shrink-0 text-emerald-600" />
                <span>{rule}</span>
              </li>
            ))}
          </ul>
        </article>

        <article className="rounded-3xl border border-amber-200 bg-amber-50/70 p-6 shadow-sm sm:p-8">
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-700" />
            <h2 className="text-xl font-bold text-slate-900">Important limits</h2>
          </div>
          <div className="mt-5 space-y-4 text-sm leading-6 text-slate-700">
            <p>This app is an organizational and educational tool. It is not a bank, payment provider, investment service, lender, or financial adviser.</p>
            <p>Balances and projections depend on the information you enter and may not reflect pending transactions, fees, interest, exchange rates, or changes made outside the app.</p>
            <p>A connected PayPal balance is used to demonstrate the protection experience. Always confirm the actual balance and transaction status with PayPal.</p>
            <p>You are responsible for deciding whether to save, spend, transfer, or withdraw money.</p>
          </div>
        </article>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-slate-100 p-6 text-sm leading-6 text-slate-600 sm:p-8">
        <h2 className="text-base font-bold text-slate-900">Using the service means you understand</h2>
        <p className="mt-2">By continuing to use DreamBank AI, you agree to provide accurate information, keep your login secure, use the app lawfully, and review important decisions independently. These terms explain how the current experience works and may be updated as the product changes.</p>
      </section>
    </div>
  );
}
