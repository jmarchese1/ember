import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { getStripe } from "@/lib/stripe";
import { adminClient } from "@/lib/supabase-server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/stripe/webhook — handles Stripe subscription lifecycle events.
 * Add this URL in Stripe dashboard → Developers → Webhooks, subscribe to:
 *   customer.subscription.created / updated / deleted
 *   checkout.session.completed
 * Copy the signing secret and paste into .env.local as STRIPE_WEBHOOK_SECRET.
 */
export async function POST(req: Request) {
  const sig = req.headers.get("stripe-signature");
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!sig || !secret) {
    return NextResponse.json({ error: "webhook not configured" }, { status: 500 });
  }

  const rawBody = await req.text();

  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(rawBody, sig, secret);
  } catch (err) {
    console.error("[stripe/webhook] signature verification failed", err);
    return NextResponse.json({ error: "invalid signature" }, { status: 400 });
  }

  try {
    const sb = adminClient();

    async function syncSubscription(sub: Stripe.Subscription) {
      const customerId =
        typeof sub.customer === "string" ? sub.customer : sub.customer.id;
      const tier =
        sub.status === "active" || sub.status === "trialing" ? "pro" : "free";
      const periodEnd = new Date(sub.current_period_end * 1000).toISOString();

      const { error } = await sb
        .from("profiles")
        .update({
          subscription_status: sub.status,
          subscription_tier: tier,
          current_period_end: periodEnd,
        })
        .eq("stripe_customer_id", customerId);
      if (error) console.error("[stripe/webhook] profile update failed", error.message);
    }

    switch (event.type) {
      case "checkout.session.completed": {
        const s = event.data.object as Stripe.Checkout.Session;
        const userId = s.client_reference_id;
        const customerId =
          typeof s.customer === "string" ? s.customer : s.customer?.id;
        if (userId && customerId) {
          // Ensure the customer_id is linked (checkout may precede any prior link)
          await sb
            .from("profiles")
            .update({ stripe_customer_id: customerId })
            .eq("id", userId);
        }
        break;
      }
      case "customer.subscription.created":
      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        await syncSubscription(event.data.object as Stripe.Subscription);
        break;
      }
      default:
        // no-op
        break;
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error("[stripe/webhook]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "unknown" },
      { status: 500 }
    );
  }
}
