/**
 * Stripe Customer Portal — server-side redirect.
 *
 * POST /api/billing/portal-session
 *   → creates a Stripe Billing Portal session for the authenticated tenant's customer
 *   → redirects to the portal URL
 *
 * GET  /api/billing/portal-session
 *   → same redirect (supports direct link from billing page)
 *
 * Stripe docs: https://docs.stripe.com/customer-management/integrate-customer-portal
 */

import { NextRequest, NextResponse } from "next/server"
import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { getStripe } from "@/lib/stripe"
import { getCrmSubscription } from "@/lib/crm-api"

export async function GET(_request: NextRequest) {
  return createPortalSession()
}

export async function POST(_request: NextRequest) {
  return createPortalSession()
}

async function createPortalSession() {
  const session = await auth()
  if (!session?.user?.tenantId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const tenantId = session.user.tenantId

  // Fetch the Stripe customer ID from the CRM subscription record
  const subscription = await getCrmSubscription(tenantId)
  if (!subscription?.stripe_customer_id) {
    return NextResponse.json(
      { error: "No Stripe customer found for this tenant." },
      { status: 422 }
    )
  }

  const stripe = getStripe()
  const appUrl = process.env.NEXTAUTH_URL ?? "http://localhost:3000"

  let portalUrl: string
  try {
    const portalSession = await stripe.billingPortal.sessions.create({
      customer: subscription.stripe_customer_id,
      return_url: `${appUrl}/billing`,
    })
    portalUrl = portalSession.url
  } catch (err) {
    console.error("[billing-portal-session]", err)
    return NextResponse.json(
      { error: "Failed to create billing portal session." },
      { status: 500 }
    )
  }

  if (!portalUrl) {
    return NextResponse.json(
      { error: "Stripe returned an empty portal URL." },
      { status: 500 }
    )
  }

  // Redirect server-side to Stripe's hosted portal
  redirect(portalUrl)
}
