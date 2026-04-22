import { createClient } from "@supabase/supabase-js";

/**
 * Admin-privileged Supabase client for server routes that need to bypass RLS
 * (Stripe webhook, cron jobs, etc.). Never import from client components.
 */
export function adminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY missing — add it to .env.local from Supabase dashboard → Project → API"
    );
  }
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

/**
 * Authenticated client scoped to a specific user's access token (passed from
 * a browser request). All queries go through RLS as that user.
 */
export function userClient(accessToken: string) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) throw new Error("Supabase env missing");
  return createClient(url, key, {
    global: { headers: { Authorization: `Bearer ${accessToken}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

/**
 * Extract the access token from a request's Authorization: Bearer header and
 * resolve it to a user. Returns null if the header is missing or invalid.
 */
export async function authedUser(
  req: Request
): Promise<{ id: string; email: string | null; token: string } | null> {
  const token = req.headers
    .get("authorization")
    ?.replace(/^Bearer\s+/i, "")
    .trim();
  if (!token) return null;
  const sb = userClient(token);
  const { data, error } = await sb.auth.getUser();
  if (error || !data?.user) return null;
  return { id: data.user.id, email: data.user.email ?? null, token };
}

/**
 * Get the signed-in user's subscription tier. Uses admin client so this works
 * from server-side API routes that don't have the user's session cookie.
 */
export async function getUserTier(userId: string): Promise<"free" | "pro"> {
  try {
    const { data } = await adminClient()
      .from("profiles")
      .select("subscription_tier")
      .eq("id", userId)
      .maybeSingle();
    return ((data?.subscription_tier as "free" | "pro") || "free") as "free" | "pro";
  } catch {
    return "free";
  }
}

export const FREE_DAILY_AI_LIMIT = 3;

/**
 * Read-only count of today's free-tier AI usage. Safe for Pro users too
 * (they simply get `limit: Infinity`-style signaling from the caller).
 */
export async function getFreeAiUsage(
  userId: string
): Promise<{ used: number; limit: number }> {
  const sb = adminClient();
  const day = todayISO();
  const { data } = await sb
    .from("ai_usage")
    .select("count")
    .eq("user_id", userId)
    .eq("day", day)
    .maybeSingle();
  return { used: (data?.count as number) ?? 0, limit: FREE_DAILY_AI_LIMIT };
}

function todayISO(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate()
  ).padStart(2, "0")}`;
}

/**
 * Atomically check the free user's daily AI budget and increment on success.
 * Returns null if allowed, or { remaining: 0, limit } if blocked.
 * Pro users bypass this check entirely — callers should skip this for Pro.
 */
export async function consumeFreeAiBudget(
  userId: string
): Promise<{ ok: boolean; used: number; remaining: number; limit: number }> {
  const sb = adminClient();
  const day = todayISO();
  const { data: existing } = await sb
    .from("ai_usage")
    .select("count")
    .eq("user_id", userId)
    .eq("day", day)
    .maybeSingle();
  const current = (existing?.count as number) ?? 0;
  if (current >= FREE_DAILY_AI_LIMIT) {
    return { ok: false, used: current, remaining: 0, limit: FREE_DAILY_AI_LIMIT };
  }
  const next = current + 1;
  await sb
    .from("ai_usage")
    .upsert(
      { user_id: userId, day, count: next, updated_at: new Date().toISOString() },
      { onConflict: "user_id,day" }
    );
  return { ok: true, used: next, remaining: FREE_DAILY_AI_LIMIT - next, limit: FREE_DAILY_AI_LIMIT };
}
