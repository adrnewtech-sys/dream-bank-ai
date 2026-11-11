/*
# Track payment method on goal transactions

1. Modified Tables
- `goal_transactions`: new column `payment_method` (text, not null, default 'manual').
  - Allowed values: 'manual' (money recorded by hand) and 'paypal' (money funded through PayPal Checkout).
  - Existing rows are backfilled to 'manual' by the default.

2. Security
- No change to row level security or grants; existing policies still apply.

3. Important notes
- The check constraint only accepts the two allowed values, so bad data cannot be stored.
- The column is added only if it does not already exist, so re-running this migration is safe.
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'goal_transactions' AND column_name = 'payment_method'
  ) THEN
    ALTER TABLE goal_transactions
      ADD COLUMN payment_method text NOT NULL DEFAULT 'manual'
      CHECK (payment_method IN ('manual', 'paypal'));
  END IF;
END $$;
