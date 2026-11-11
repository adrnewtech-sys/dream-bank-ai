/*
# Add PayPal account settings table

1. New Tables
- `paypal_settings`: one row per account storing the simulated PayPal connection state and balance.
  - `user_id` (uuid, default auth.uid()): links to the signed-in account.
  - `connected` (boolean, default false): whether the user has "connected" their PayPal account (simulated).
  - `account_email` (text): the display email for the connected PayPal account (simulated).
  - `paypal_balance` (numeric, default 0): the simulated total PayPal balance available to spend or allocate.
  - `updated_at` (timestamp).

2. Security
- RLS enabled on `paypal_settings`.
- Grants restricted to `authenticated` only.
- Separate select, insert, update, delete policies scoped to `auth.uid() = user_id`.

3. Important Notes
- This is a demo. The PayPal balance and connection are simulated values stored in the database — no real PayPal API is called.
- The table follows the same pattern as `autosave_settings`: one row per user, upserted on save.
*/

CREATE TABLE IF NOT EXISTS paypal_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  connected boolean NOT NULL DEFAULT false,
  account_email text NOT NULL DEFAULT '',
  paypal_balance numeric(12, 2) NOT NULL DEFAULT 0 CHECK (paypal_balance >= 0),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_paypal_settings_user ON paypal_settings (user_id);

ALTER TABLE paypal_settings ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON paypal_settings FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON paypal_settings TO authenticated;

DROP POLICY IF EXISTS "paypal_settings_select" ON paypal_settings;
CREATE POLICY "paypal_settings_select" ON paypal_settings FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "paypal_settings_insert" ON paypal_settings;
CREATE POLICY "paypal_settings_insert" ON paypal_settings FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "paypal_settings_update" ON paypal_settings;
CREATE POLICY "paypal_settings_update" ON paypal_settings FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "paypal_settings_delete" ON paypal_settings;
CREATE POLICY "paypal_settings_delete" ON paypal_settings FOR DELETE
  TO authenticated USING (auth.uid() = user_id);
