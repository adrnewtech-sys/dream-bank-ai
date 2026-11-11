import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const STATE_TTL_MS = 15 * 60 * 1000;
const PAYPAL_SCOPE = "openid email profile https://uri.paypal.com/services/paypalattributes";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const PAYPAL_CLIENT_ID = Deno.env.get("PAYPAL_CLIENT_ID");
const PAYPAL_CLIENT_SECRET = Deno.env.get("PAYPAL_CLIENT_SECRET");
const PAYPAL_ENV = Deno.env.get("PAYPAL_ENV") === "live" ? "live" : "sandbox";
const SIMULATED = !PAYPAL_CLIENT_ID || !PAYPAL_CLIENT_SECRET;

const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, { auth: { persistSession: false } });

interface PayPalAccount {
  payerId: string;
  name: string;
  email: string;
  avatarUrl: string | null;
  status: string;
  balance: number | null;
}

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

const redirectTo = (location: string) =>
  new Response(null, { status: 302, headers: { ...corsHeaders, Location: location } });

function isWebOrigin(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
}

async function requireUser(req: Request) {
  const token = req.headers.get("Authorization")?.replace(/^Bearer /, "");
  if (!token) return null;
  const client = createClient(SUPABASE_URL, ANON_KEY, { auth: { persistSession: false } });
  const { data, error } = await client.auth.getUser(token);
  if (error || !data.user) return null;
  return data.user;
}

function simulatedAccount(): PayPalAccount {
  const people = [["Alex", "Morgan"], ["Priya", "Shah"], ["Daniel", "Okafor"], ["Sofia", "Lindqvist"]];
  const [first, last] = people[Math.floor(Math.random() * people.length)];
  const suffix = crypto.randomUUID().slice(0, 8);
  return {
    payerId: `SBX${suffix.toUpperCase()}`,
    name: `${first} ${last}`,
    email: `${first}.${last}.${suffix}@example.com`.toLowerCase(),
    avatarUrl: null,
    status: "Verified",
    balance: Math.round((1500 + Math.random() * 4500) * 100) / 100,
  };
}

async function fetchPayPalAccount(code: string): Promise<PayPalAccount> {
  const base = PAYPAL_ENV === "live" ? "https://api-m.paypal.com" : "https://api-m.sandbox.paypal.com";

  const tokenResponse = await fetch(`${base}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${btoa(`${PAYPAL_CLIENT_ID}:${PAYPAL_CLIENT_SECRET}`)}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({ grant_type: "authorization_code", code }),
  });
  if (!tokenResponse.ok) {
    const details = await tokenResponse.text();
    throw new Error(`PayPal token exchange failed (${tokenResponse.status}): ${details.slice(0, 300)}`);
  }
  const { access_token } = (await tokenResponse.json()) as { access_token: string };

  const profileResponse = await fetch(`${base}/v1/identity/oauth2/userinfo?schema=paypalv1.1`, {
    headers: { Authorization: `Bearer ${access_token}` },
  });
  if (!profileResponse.ok) throw new Error(`PayPal profile lookup failed (${profileResponse.status})`);
  const profile = (await profileResponse.json()) as {
    payer_id?: string;
    name?: string;
    email?: string;
    picture?: string;
    verified_account?: boolean;
  };

  let balance: number | null = null;
  const balanceResponse = await fetch(`${base}/v1/reporting/balances`, {
    headers: { Authorization: `Bearer ${access_token}` },
  });
  if (balanceResponse.ok) {
    const body = (await balanceResponse.json()) as {
      balances?: Array<{ currency: string; total_balance?: { value: string } }>;
    };
    const usd = body.balances?.find((item) => item.currency === "USD");
    if (usd?.total_balance) balance = Number(usd.total_balance.value);
  }

  return {
    payerId: profile.payer_id ?? "",
    name: profile.name ?? "PayPal user",
    email: profile.email ?? "",
    avatarUrl: profile.picture ?? null,
    status: profile.verified_account ? "Verified" : "Unverified",
    balance,
  };
}

async function handleStart(req: Request) {
  const user = await requireUser(req);
  if (!user) return json({ error: "Please sign in before connecting PayPal." }, 401);

  const origin = req.headers.get("origin") ?? "";
  if (!isWebOrigin(origin)) return json({ error: "Could not determine where to return after PayPal sign-in." }, 400);

  const state = crypto.randomUUID();
  const { error } = await admin.from("paypal_oauth_states").insert({ state, user_id: user.id, return_to: origin });
  if (error) throw error;

  const callbackUrl = `${SUPABASE_URL}/functions/v1/paypal-oauth/callback`;
  if (SIMULATED) return json({ url: `${callbackUrl}?code=sandbox-demo&state=${state}`, redirect_uri: callbackUrl });

  const host = PAYPAL_ENV === "live" ? "www.paypal.com" : "www.sandbox.paypal.com";
  const params = new URLSearchParams({
    flowEntry: "static",
    client_id: PAYPAL_CLIENT_ID!,
    scope: PAYPAL_SCOPE,
    redirect_uri: callbackUrl,
    response_type: "code",
    state,
  });
  return json({ url: `https://${host}/connect?${params.toString()}`, redirect_uri: callbackUrl });
}

async function handleCallback(url: URL) {
  const state = url.searchParams.get("state");
  if (!state) return json({ error: "PayPal did not return a valid response." }, 400);

  const { data: pending, error: lookupError } = await admin
    .from("paypal_oauth_states")
    .delete()
    .eq("state", state)
    .select("user_id, return_to, created_at")
    .maybeSingle();
  if (lookupError) throw lookupError;
  if (!pending || Date.now() - new Date(pending.created_at).getTime() > STATE_TTL_MS) {
    return json({ error: "This PayPal connection link has expired. Please try connecting again." }, 400);
  }

  const oauthError = url.searchParams.get("error");
  if (oauthError) {
    const description = url.searchParams.get("error_description");
    const details = [oauthError, description].filter(Boolean).join(": ");
    return redirectTo(`${pending.return_to}/?paypal=error&paypal_error=${encodeURIComponent(details)}`);
  }

  const code = url.searchParams.get("code");
  if (!code) return redirectTo(`${pending.return_to}/?paypal=error`);

  let account: PayPalAccount;
  try {
    account = SIMULATED ? simulatedAccount() : await fetchPayPalAccount(code);
  } catch (error) {
    const details = error instanceof Error ? error.message : "PayPal authorization failed";
    console.error(details);
    return redirectTo(`${pending.return_to}/?paypal=error&paypal_error=${encodeURIComponent(details.slice(0, 300))}`);
  }

  const now = new Date().toISOString();
  const { error: saveError } = await admin.from("paypal_settings").upsert(
    {
      user_id: pending.user_id,
      connected: true,
      payer_id: account.payerId,
      account_name: account.name,
      account_email: account.email,
      avatar_url: account.avatarUrl,
      account_status: account.status,
      paypal_balance: account.balance ?? 0,
      balance_available: account.balance !== null,
      connected_at: now,
      updated_at: now,
    },
    { onConflict: "user_id" },
  );
  if (saveError) throw saveError;

  return redirectTo(`${pending.return_to}/?paypal=connected`);
}

async function handleDisconnect(req: Request) {
  const user = await requireUser(req);
  if (!user) return json({ error: "Please sign in first." }, 401);

  const { error } = await admin.from("paypal_settings").upsert(
    {
      user_id: user.id,
      connected: false,
      payer_id: "",
      account_name: "",
      account_email: "",
      avatar_url: null,
      account_status: "",
      paypal_balance: 0,
      balance_available: false,
      connected_at: null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" },
  );
  if (error) throw error;
  return json({ ok: true });
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 200, headers: corsHeaders });

  try {
    const url = new URL(req.url);
    const action = url.pathname.split("/").filter(Boolean).pop();

    if (action === "start" && req.method === "POST") return await handleStart(req);
    if (action === "callback" && req.method === "GET") return await handleCallback(url);
    if (action === "disconnect" && req.method === "POST") return await handleDisconnect(req);
    return json({ error: "Not found" }, 404);
  } catch (error) {
    console.error(error);
    return json({ error: "Something went wrong. Please try again." }, 500);
  }
});
