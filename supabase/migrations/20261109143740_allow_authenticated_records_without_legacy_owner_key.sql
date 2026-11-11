/*
# Finish account ownership transition

1. Modified Tables
- `budget_profiles`, `savings_goals`, and `goal_transactions`: legacy `owner_key` columns are now nullable.

2. Security
- Access remains restricted by the authenticated `user_id` policies from the account ownership migration.

3. Important Notes
- 1. The old browser key is retained for compatibility with existing rows but is no longer required for new account-owned records.
- 2. No rows or columns are deleted.
*/

ALTER TABLE budget_profiles ALTER COLUMN owner_key DROP NOT NULL;
ALTER TABLE savings_goals ALTER COLUMN owner_key DROP NOT NULL;
ALTER TABLE goal_transactions ALTER COLUMN owner_key DROP NOT NULL;
