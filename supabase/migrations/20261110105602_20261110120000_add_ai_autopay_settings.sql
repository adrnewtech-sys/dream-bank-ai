/*
# Add AI AutoPay plan details

1. Modified Tables
- `autosave_settings`: adds the selected dream, safety buffer, AI recommendation, AutoPay status, schedule timestamps, and transfer count.
- No existing rows or user data are deleted.

2. New Columns
- `goal_id`: the user's selected dream goal for future contributions.
- `safety_buffer`: the amount reserved before calculating a contribution.
- `recommended_amount`: the latest AI-calculated dream contribution.
- `autopay_enabled`: whether the recurring contribution plan is active.
- `autopay_status`: the plan state, such as ready, active, paused, or unavailable.
- `next_run_at`: the next scheduled sandbox contribution time.
- `last_recalculated_at`: when PayPal activity last recalculated the recommendation.
- `last_transfer_at`: when the most recent automatic contribution was recorded.
- `transfer_count`: number of automatic contributions recorded for the plan.

3. Security
- Existing authenticated owner-scoped RLS policies remain in place.
- Existing authenticated table grants remain in place for the account-owned settings row.
- The selected goal references only goals owned by the same account through the application flow; the existing goal ownership policy continues to protect goal rows.

4. Important Notes
- 1. These fields support the sandbox AutoPay demonstration and durable plan state.
- 2. Real PayPal recurring billing still requires a server-side PayPal billing agreement and merchant approval; this migration does not create external PayPal charges.
*/

ALTER TABLE autosave_settings
  ADD COLUMN IF NOT EXISTS goal_id uuid REFERENCES savings_goals(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS safety_buffer numeric(12, 2) NOT NULL DEFAULT 0 CHECK (safety_buffer >= 0),
  ADD COLUMN IF NOT EXISTS recommended_amount numeric(12, 2) NOT NULL DEFAULT 0 CHECK (recommended_amount >= 0),
  ADD COLUMN IF NOT EXISTS autopay_enabled boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS autopay_status text NOT NULL DEFAULT 'ready' CHECK (autopay_status IN ('ready', 'active', 'paused', 'unavailable')),
  ADD COLUMN IF NOT EXISTS next_run_at timestamptz,
  ADD COLUMN IF NOT EXISTS last_recalculated_at timestamptz,
  ADD COLUMN IF NOT EXISTS last_transfer_at timestamptz,
  ADD COLUMN IF NOT EXISTS transfer_count integer NOT NULL DEFAULT 0 CHECK (transfer_count >= 0);

CREATE INDEX IF NOT EXISTS idx_autosave_settings_goal ON autosave_settings (goal_id);
