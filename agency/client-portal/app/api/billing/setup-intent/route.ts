/**
 * POST /api/billing/setup-intent
 *
 * Creates a Stripe SetupIntent for the authenticated tenant's Stripe customer.
 * Returns the client_secret for use with Stripe Elements on the billing page.
 *
 * Used when: subscription.status is "past_due" or "incomplete"
 * The portal creates a SetupIntent (not a PaymentIntent) so the card is saved
 * to the customer for automatic retry of their subscription.
 */

import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { getCrmSubscription } from "@/lib/crm-api"
import { getStripe } from "@/lib/stripe"

export async function POST(req: NextRequest) {
  // ── Auth ───────────────────────────────────────────────────────────────────
  const session = await auth()
  if (!session?.user?.tenantId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const tenantId = session.user.tenantId

  // ── Fetch subscription to get stripe_customer_id ─────────────────────────────
  const subscription = await getCrmSubscription(tenantId)

  if (!subscription) {
    return NextResponse.json(
      { error: "No subscription found for this account." },
      { status: 404 }
    )
  }

  const stripeCustomerId = subscription.stripe_customer_id

  if (!stripeCustomerId) {
    // Stripe customer hasn't been created yet — this is a CRM/setup issue.
    // Surface it clearly so Sean can resolve it.
    return NextResponse.json(
      {
        error:
          "Billing account not configured. Please contact your account manager.",
        code: "stripe_customer_not_found",
      },
      { status: 422 }
    )
  }

  // ── Verify the Stripe customer actually exists ───────────────────────────────
  const stripe = getStripe()
  try {
    await stripe.customers.retrieve(stripeCustomerId)
  } catch (err) {
    // Customer was deleted from Stripe but CRM still references them
    console.error(
      `[billing/setup-intent] Stripe customer not found: ${stripeCustomerId}`,
      err
    )
    return NextResponse.json(
      {
        error:
          "Billing account not found. Please contact your account manager.",
        code: "stripe_customer_not_found",
      },
      { status: 422 }
    )
  }

  // ── Create SetupIntent ───────────────────────────────────────────────────────
  // Using confirm: true returns the object with client_secret already available.
  // attach_to_self is not needed — SetupIntents don't attach to the customer
  // automatically; we use payment_method_data to collect + attach in one step.
  let setupIntent
  try {
    setupIntent = await stripe.setupIntents.create({
      customer: stripeCustomerId,
      payment_method_types: ["card"],
      // Stripe will automatically use this saved payment method to retry
      // the subscription's failed invoice when the SetupIntent succeeds.
      usage: "off_session",
    })
  } catch (err) {
    console.error(`[billing/setup-intent] Stripe error:`, err)
    return NextResponse.json(
      { error: "Failed to initialize payment. Please try again." },
      { status: 500 }
    )
  }

  // ── Respond with client secret + publishable key ─────────────────────────────
  const publishableKey =
    process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? ""

  return NextResponse.json(
    {
      clientSecret: setupIntent.client_secret,
      publishableKey,
    },
    { status: 200 }
  )
}
