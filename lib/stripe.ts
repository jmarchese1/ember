import Stripe from "stripe";

let _stripe: Stripe | null = null;

/** Server-only Stripe client. Never import from client components. */
export function getStripe(): Stripe {
  if (!_stripe) {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) throw new Error("STRIPE_SECRET_KEY not configured");
    _stripe = new Stripe(key);
  }
  return _stripe;
}

export function getAppUrl(req?: Request): string {
  if (req) {
    const origin = new URL(req.url).origin;
    if (origin && !origin.startsWith("http://0.0.0.0")) return origin;
  }
  return process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3022";
}
