/*
# PayPal account connection via server-side OAuth

Plain-English summary
- PayPal account details and balances can now only be written by the server after a real PayPal sign-in. The browser can read them but can no longer write them.
- A short-lived table stores the sign-in request so the return from PayPal can be matched to the user who started it. Each request is single-use.

1. Modified table: paypal_settings
- New columns: payer_id, account_name, avatar_url, account_status, balance_available, connected_at.
- Existing rows are kept; new columns get safe empty defaults.

2. New table: paypal_oauth_states
- state (text, primary key): random one-time token sent to PayPal and checked on return.
- user_id (uuid): the signed-in user who started the connection.
- return_to (text): the app address to send the user back to.
- created_at (timestamptz): used to expire old requests.
- Only the server can read or write this table.

3. Security changes
- Browser (authenticated role) loses INSERT, UPDATE and DELETE on paypal_settings and the matching policies are removed. The user can still read their own row (SELECT policy unchanged).
- paypal_oauth_states has RLS enabled, no policies, and is granted only to service_role.

Important notes
1. No data is deleted or changed in type.
2. Statements are idempotent and safe to re-run.
*/

ALTER TABLE paypal_settings ADD COLUMN IF NOT EXISTS payer_id text NOT NULL DEFAULT '';
ALTER TABLE paypal_settings ADD COLUMN IF NOT EXISTS account_name text NOT NULL DEFAULT '';
ALTER TABLE paypal_settings ADD COLUMN IF NOT EXISTS avatar_url text;
ALTER TABLE paypal_settings ADD COLUMN IF NOT EXISTS account_status text NOT NULL DEFAULT '';
ALTER TABLE paypal_settings ADD COLUMN IF NOT EXISTS balance_available boolean NOT NULL DEFAULT false;
ALTER TABLE paypal_settings ADD COLUMN IF NOT EXISTS connected_at timestamptz;

DROP POLICY IF EXISTS "paypal_settings_insert" ON paypal_settings;
DROP POLICY IF EXISTS "paypal_settings_update" ON paypal_settings;
DROP POLICY IF EXISTS "paypal_settings_delete" ON paypal_settings;

REVOKE INSERT, UPDATE, DELETE ON paypal_settings FROM anon, authenticated;
GRANT SELECT ON paypal_settings TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON paypal_settings TO service_role;

CREATE TABLE IF NOT EXISTS paypal_oauth_states (
  state text PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  return_to text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS paypal_oauth_states_created_at_idx ON paypal_oauth_states (created_at);

ALTER TABLE paypal_oauth_states ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON paypal_oauth_states FROM anon, authenticated;
GRANT SELECT, INSERT, DELETE ON paypal_oauth_states TO service_role;
