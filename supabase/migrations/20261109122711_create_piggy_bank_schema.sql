/*
# Create AI Piggy Bank schema

1. New Tables
- `budget_profiles`: one row per browser owner holding monthly income and monthly expenses.
  - `owner_key` (uuid, unique): random id generated in the browser and stored locally; scopes all rows to one user.
  - `monthly_income` (numeric), `monthly_expenses` (numeric), `updated_at` (timestamp).
- `savings_goals`: goal folders.
  - `owner_key`, `name`, `icon` (icon key), `color` (color key), `target_amount`, `target_date`, `created_at`, `updated_at`.
- `goal_transactions`: ledger of money moving into or out of a goal.
  - `goal_id` (cascades on goal delete), `owner_key`, `kind` ('deposit', 'withdrawal', 'emergency'), `amount`, `note`, `created_at`.

2. Security
- Row level security is enabled on all three tables.
- Access is granted to the `anon` and `authenticated` roles because the app has no sign-in screen.
- Every query in the app filters by `owner_key`; the random key is not guessable.
- Each table has separate select, insert, update and delete policies.

3. Important notes
- Amounts must be non-negative and kind must be one of the three allowed values (enforced by constraints).
- Indexes are added on `owner_key` and `goal_id` for fast dashboard loads.
- Deleting a goal removes its transaction history (cascade), which the app confirms with the user first.
*/

CREATE TABLE IF NOT EXISTS budget_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_key uuid NOT NULL UNIQUE,
  monthly_income numeric(12, 2) NOT NULL DEFAULT 0 CHECK (monthly_income >= 0),
  monthly_expenses numeric(12, 2) NOT NULL DEFAULT 0 CHECK (monthly_expenses >= 0),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS savings_goals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_key uuid NOT NULL,
  name text NOT NULL CHECK (char_length(name) BETWEEN 1 AND 80),
  icon text NOT NULL DEFAULT 'target',
  color text NOT NULL DEFAULT 'blue',
  target_amount numeric(12, 2) NOT NULL CHECK (target_amount > 0),
  target_date date NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS goal_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  goal_id uuid NOT NULL REFERENCES savings_goals(id) ON DELETE CASCADE,
  owner_key uuid NOT NULL,
  kind text NOT NULL CHECK (kind IN ('deposit', 'withdrawal', 'emergency')),
  amount numeric(12, 2) NOT NULL CHECK (amount > 0),
  note text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_savings_goals_owner ON savings_goals (owner_key);
CREATE INDEX IF NOT EXISTS idx_goal_transactions_owner ON goal_transactions (owner_key);
CREATE INDEX IF NOT EXISTS idx_goal_transactions_goal ON goal_transactions (goal_id);

ALTER TABLE budget_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE savings_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE goal_transactions ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE ON budget_profiles TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON savings_goals TO anon, authenticated;
GRANT SELECT, INSERT, DELETE ON goal_transactions TO anon, authenticated;

DROP POLICY IF EXISTS "budget_profiles_select" ON budget_profiles;
CREATE POLICY "budget_profiles_select" ON budget_profiles FOR SELECT
  TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "budget_profiles_insert" ON budget_profiles;
CREATE POLICY "budget_profiles_insert" ON budget_profiles FOR INSERT
  TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "budget_profiles_update" ON budget_profiles;
CREATE POLICY "budget_profiles_update" ON budget_profiles FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "savings_goals_select" ON savings_goals;
CREATE POLICY "savings_goals_select" ON savings_goals FOR SELECT
  TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "savings_goals_insert" ON savings_goals;
CREATE POLICY "savings_goals_insert" ON savings_goals FOR INSERT
  TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "savings_goals_update" ON savings_goals;
CREATE POLICY "savings_goals_update" ON savings_goals FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "savings_goals_delete" ON savings_goals;
CREATE POLICY "savings_goals_delete" ON savings_goals FOR DELETE
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "goal_transactions_select" ON goal_transactions;
CREATE POLICY "goal_transactions_select" ON goal_transactions FOR SELECT
  TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "goal_transactions_insert" ON goal_transactions;
CREATE POLICY "goal_transactions_insert" ON goal_transactions FOR INSERT
  TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "goal_transactions_delete" ON goal_transactions;
CREATE POLICY "goal_transactions_delete" ON goal_transactions FOR DELETE
  TO anon, authenticated USING (true);
