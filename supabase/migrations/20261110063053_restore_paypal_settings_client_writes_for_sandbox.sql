/*
# Restore client write access to paypal_settings for sandbox demo

## Plain-English summary
The previous OAuth migration revoked INSERT/UPDATE/DELETE from the `authenticated`
role on `paypal_settings`, because only the server-side edge function was allowed
to write connection state. For the hackathon demo we are removing the mandatory
OAuth flow and simulating the PayPal connection directly from the browser using a
sandbox demo account. This restores the authenticated user's ability to write
their own paypal_settings row, so the simulated connect/disconnect works without
an edge function. The OAuth state table is left in place (unused) so the real
OAuth flow can be re-enabled later without a schema change.

## Security changes
- Re-grant INSERT, UPDATE, DELETE on `paypal_settings` to `authenticated`.
- Re-create the four per-verb RLS policies (select/insert/update/delete) scoped
  to `auth.uid() = user_id`, identical to the original pattern before OAuth.
- `service_role` retains full access.
- `paypal_oauth_states` table is untouched.
*/

REVOKE INSERT, UPDATE, DELETE ON paypal_settings FROM anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON paypal_settings TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON paypal_settings TO service_role;

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
