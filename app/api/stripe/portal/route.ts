import { NextResponse } from "next/server";
import { getStripe, getAppUrl } from "@/lib/stripe";
import { userClient } from "@/lib/supabase-server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/stripe/portal — returns a Stripe customer portal URL so users can
 * manage their subscription (change plan, update card, cancel).
 */
export async function POST(req: Request) {
  try {
    const auth = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
    if (!auth) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

    const sb = userClient(auth);
    const { data: userData } = await sb.auth.getUser();
    if (!userData?.user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

    const { data: profile } = await sb
      .from("profiles")
      .select("stripe_customer_id")
      .eq("id", userData.user.id)
      .maybeSingle();

    if (!profile?.stripe_customer_id) {
      return NextResponse.json({ error: "no customer" }, { status: 400 });
    }

    const stripe = getStripe();
    const session = await stripe.billingPortal.sessions.create({
      customer: profile.stripe_customer_id as string,
      return_url: getAppUrl(req),
    });

    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error("[stripe/portal]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "unknown" },
      { status: 500 }
    );
  }
}
