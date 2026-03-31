/**
 * Stripe server-side client.
 * Never import this in client components — it's for server routes and actions only.
 *
 * Usage:
 *   import { stripe } from "@/lib/stripe"
 *   const intent = await stripe.setupIntents.create({ customer: "cus_..." })
 */

import Stripe from "stripe"

let _stripe: Stripe | null = null

export function getStripe(): Stripe {
  if (_stripe) return _stripe

  const key = process.env.STRIPE_SECRET_KEY
  if (!key) {
    throw new Error(
      "STRIPE_SECRET_KEY is not configured. " +
        "Add STRIPE_SECRET_KEY to .env.local or the deployment environment."
    )
  }

  _stripe = new Stripe(key, {
    apiVersion: "2026-03-25.dahlia",
    // Disable telemetry in server-to-server contexts
    telemetry: false,
  })

  return _stripe
}

/**
 * Verify that a Stripe webhook payload arrived from Stripe (not a forged request).
 * Throws Stripe.errors.StripeError on failure.
 */
export async function constructWebhookEvent(
  payload: string,
  signature: string,
  secret: string
): Promise<Stripe.Event> {
  return getStripe().webhooks.constructEventAsync(payload, signature, secret)
}
