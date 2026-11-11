/*
# Record PayPal order IDs on goal transactions

1. Modified Tables
- `goal_transactions`
  - New column `paypal_order_id` (text, nullable). Stores the PayPal order that funded a deposit. Manual entries leave it empty.

2. Important Notes
- 1. A unique constraint on `paypal_order_id` ensures one PayPal order can only be recorded once, so retrying a save never double-counts a payment.
- 2. Existing rows keep a null `paypal_order_id`; nothing is removed or changed.
- 3. Existing table grants and row level security policies already cover the new column, so no policy changes are needed.
*/

ALTER TABLE goal_transactions ADD COLUMN IF NOT EXISTS paypal_order_id text;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'goal_transactions_paypal_order_id_key'
  ) THEN
    ALTER TABLE goal_transactions
      ADD CONSTRAINT goal_transactions_paypal_order_id_key UNIQUE (paypal_order_id);
  END IF;
END $$;
