# Project memory

## Product intent & audience

- Savings goal-tracking app: users create goals and deposit money toward them.
- PayPal is integrated as the payment method for making deposits.
- Currently in development/testing phase; payments are simulated via PayPal sandbox (`client-id=sb`).
- Audience likely individual savers wanting visual goal progress with real payment intent.

## Brand personality & voice

- Helpful, transparent, explanatory tone — assistant clarifies how money flow works honestly.
- User-facing copy should be clear about what is real vs. simulated to avoid confusion.

## Visual design & UX direction

- Vite + React + JSX with Tailwind CSS classes; Lucide React for icons.
- UI surfaces include goal lists, savings totals, and PayPal payment buttons.
- Imports use `@/` path alias mapping to `src/`.
- No additional UI/icon packages beyond what the template provides.

## Decisions, constraints & rationale

- PayPal sandbox (`client-id=sb`) is used for development — no real money moves.
- Deposits are recorded in the app database as transactions toward goals; the app is a tracker, not a funds holder.
- To go live: replace sandbox client ID with a real PayPal Business account client ID and connect a real settlement account (bank/savings).
- The app does not custody money; it logs payment approvals and updates progress.

## Open questions & assumptions

- Whether to implement real PayPal payments vs. an alternative approach (e.g., direct bank transfers).
- Database schema and backend stack are not yet documented — need confirmation.
- Unclear if goals support multiple contributors, recurring deposits, or refund handling.
- Assumption: user wants to eventually move real money, but may prefer a different integration path.