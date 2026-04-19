import { NextResponse } from "next/server";
import { getStripe, getAppUrl } from "@/lib/stripe";
import { userClient } from "@/lib/supabase-server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/stripe/checkout
 * Body: { priceId?: string }
 * Header: Authorization: Bearer <supabase access token>
 *
 * Creates (or reuses) a Stripe customer for the signed-in user and returns a
 * Checkout Session URL to redirect to.
 */
export async function POST(req: Request) {
  try {
    const auth = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
    if (!auth) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const priceId = (body?.priceId as string) || process.env.STRIPE_PRICE_EMBER_PRO;
    if (!priceId) {
      return NextResponse.json(
        { error: "STRIPE_PRICE_EMBER_PRO not configured — create a Price in Stripe dashboard and add to .env.local" },
        { status: 500 }
      );
    }

    const sb = userClient(auth);
    const { data: userData, error: userErr } = await sb.auth.getUser();
    if (userErr || !userData?.user) {
      return NextResponse.json({ error: "invalid session" }, { status: 401 });
    }
    const user = userData.user;

    // Fetch existing customer id from profile
    const { data: profile } = await sb
      .from("profiles")
      .select("stripe_customer_id")
      .eq("id", user.id)
      .maybeSingle();

    const stripe = getStripe();

    let customerId = profile?.stripe_customer_id as string | undefined;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: { supabase_user_id: user.id },
      });
      customerId = customer.id;
      await sb.from("profiles").update({ stripe_customer_id: customerId }).eq("id", user.id);
    }

    const origin = getAppUrl(req);
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer: customerId,
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${origin}/?upgrade=success`,
      cancel_url: `${origin}/?upgrade=cancel`,
      allow_promotion_codes: true,
      subscription_data: { metadata: { supabase_user_id: user.id } },
      client_reference_id: user.id,
    });

    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error("[stripe/checkout]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "unknown" },
      { status: 500 }
    );
  }
}
