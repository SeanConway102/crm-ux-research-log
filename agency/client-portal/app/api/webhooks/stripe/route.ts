/**
 * Stripe webhook handler — receives events from Stripe and forwards them to
 * the CRM for authoritative processing (subscription updates, invoice creation,
 * payment failure alerts, etc.).
 *
 * The portal never owns billing data — it only relays events between Stripe
 * and the CRM.
 *
 * @see /lib/crm-api.ts `forwardStripeEvent()`
 */

import { NextRequest, NextResponse } from "next/server"
import Stripe from "stripe"
import { forwardStripeEvent } from "@/lib/crm-api"
import { prisma } from "@/lib/prisma"

// Stripe instance — only used for signature verification, not API calls
function getStripe(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY
  if (!key) throw new Error("STRIPE_SECRET_KEY is not configured")
  return new Stripe(key, { apiVersion: "2026-03-25.dahlia" })
}

/**
 * Verify that the request is actually from Stripe using the webhook signing
 * secret.  If verification fails the request is rejected immediately so
 * malicious callers cannot inject fake events.
 */
async function verifyStripeSignature(
  req: NextRequest,
  stripe: Stripe
): Promise<Stripe.Event> {
  const rawBody = await req.text()
  const signature = req.headers.get("stripe-signature")

  if (!signature) {
    throw new Error("Missing stripe-signature header")
  }

  return stripe.webhooks.constructEventAsync(
    rawBody,
    signature,
    // Use the same `apiVersion` string as the Stripe instance above
    process.env.STRIPE_WEBHOOK_SECRET ?? ""
  )
}

export async function POST(req: NextRequest) {
  // ── Early exit for health checks ───────────────────────────────────────
  if (req.headers.get("content-type") === "application/health") {
    return NextResponse.json({ status: "ok" })
  }

  // ── Auth check ─────────────────────────────────────────────────────────
  // Stripe webhooks are authenticated by signature verification below.
  // Optionally, also guard with a static secret header set by the platform.
  const platformSecret = req.headers.get("x-platform-secret")
  const configuredSecret = process.env.PLATFORM_WEBHOOK_SECRET
  if (configuredSecret && platformSecret !== configuredSecret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  let stripe: Stripe
  try {
    stripe = getStripe()
  } catch (err) {
    console.error("[stripe-webhook] Stripe not configured:", err)
    // Return 200 so Stripe does not retry a misconfigured endpoint
    return NextResponse.json({ error: "Stripe not configured" }, { status: 200 })
  }

  let event: Stripe.Event
  try {
    event = await verifyStripeSignature(req, stripe)
  } catch (err) {
    console.error("[stripe-webhook] Signature verification failed:", err)
    return NextResponse.json(
      { error: "Invalid signature" },
      { status: 400 }
    )
  }

  // ── Log receipt (structured for easy grep) ─────────────────────────────
  console.log(`[stripe-webhook] Received event: ${event.type} (id=${event.id})`)

  // ── Forward to CRM for authoritative processing ─────────────────────────
  try {
    await forwardStripeEvent(event as unknown as Record<string, unknown>)
    console.log(`[stripe-webhook] Forwarded to CRM: ${event.type}`)
  } catch (err) {
    // Log but do NOT return error to Stripe — we don't want Stripe to retry
    // a CRM outage. Log for manual reconciliation instead.
    console.error(`[stripe-webhook] Failed to forward to CRM:`, err)
  }

  // ── Lightweight local sync (portal UI only) ─────────────────────────────
  // The CRM is the source of truth.  These updates are purely to keep the
  // portal's own DB state fresh for UI purposes (e.g. caching).
  // If this fails, the CRM → webhook retry will eventually bring it in sync.
  try {
    await syncLocalPortalState(event)
  } catch (err) {
    console.warn(`[stripe-webhook] Local sync failed (non-critical):`, err)
  }

  return NextResponse.json({ received: true })
}

/**
 * Sync relevant billing events to the portal's local Prisma state.
 * Only handles events where local state is needed for the portal UI.
 * All business logic runs in the CRM.
 */
async function syncLocalPortalState(event: Stripe.Event): Promise<void> {
  const subject =
    "customer" in event.data.object
      ? String(event.data.object["customer"])
      : null

  if (!subject) return

  switch (event.type) {
    case "invoice.payment_succeeded":
    case "invoice.payment_failed": {
      // Find tenant by stripe_customer_id cached in our local db
      // The CRM owns this mapping; we just update the cached status.
      // In practice, the CRM will send a `customer.subscription.updated` or
      // we can look it up via the CRM API.  Here we simply log and skip
      // since we don't store stripe_customer_id on Tenant.
      break
    }

    case "customer.subscription.updated":
    case "customer.subscription.deleted": {
      // Subscription state changes are forwarded to the CRM which handles them.
      // The portal UI re-fetches from the CRM API on next load.
      break
    }

    default:
      // Unhandled event types are forwarded to the CRM — no local action needed
      break
  }
}
