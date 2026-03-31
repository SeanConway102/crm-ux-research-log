"use client"

/**
 * BillingPaymentForm — fetches a Stripe SetupIntent client_secret, then
 * renders the embedded Stripe Elements card form.
 *
 * Shown only when subscription.status is "past_due" or "incomplete".
 * Uses a loading skeleton during the API fetch, then swaps to the real form.
 */

import { useState, useEffect } from "react"
import { loadStripe } from "@stripe/stripe-js"
import { Elements } from "@stripe/react-stripe-js"
import { PaymentForm } from "./payment-form"
import { Button } from "@/components/ui/button"
import { AlertTriangle, RefreshCw } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"

// Lazy-load the Stripe.js instance so it only loads when this component mounts
let stripePromise: ReturnType<typeof loadStripe> | null = null

function getStripeInstance(publishableKey: string) {
  if (!stripePromise) {
    stripePromise = loadStripe(publishableKey)
  }
  return stripePromise
}

interface SetupIntentResult {
  clientSecret: string
  publishableKey: string
}

export function BillingPaymentForm() {
  const [result, setResult] = useState<SetupIntentResult | null>(null)
  const [fetchError, setFetchError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    async function fetchSetupIntent() {
      setLoading(true)
      setFetchError(null)

      try {
        const res = await fetch("/api/billing/setup-intent", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
        })

        if (!res.ok) {
          const body = await res.json().catch(() => ({}))
          throw new Error(
            body.error ??
              `Request failed (${res.status}). Please try again or contact support.`
          )
        }

        const data = (await res.json()) as SetupIntentResult

        if (cancelled) return
        setResult(data)
      } catch (err) {
        if (cancelled) return
        setFetchError(
          err instanceof Error
            ? err.message
            : "Failed to load payment form. Please refresh the page."
        )
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    fetchSetupIntent()

    return () => {
      cancelled = true
    }
  }, [])

  // Loading state — skeleton matching the form shape
  if (loading) {
    return (
      <div className="flex flex-col gap-3">
        <Skeleton className="h-12 w-full rounded-md" />
        <Skeleton className="h-4 w-48" />
        <Skeleton className="h-10 w-full" />
      </div>
    )
  }

  // Fetch error state
  if (fetchError || !result) {
    return (
      <div className="flex flex-col items-center gap-3 py-4 text-center">
        <AlertTriangle className="h-8 w-8 text-orange-500" />
        <div>
          <p className="font-medium">Could not load payment form</p>
          <p className="text-sm text-muted-foreground mt-1">
            {fetchError ?? "An unexpected error occurred."}
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            setLoading(true)
            setFetchError(null)
            // Re-trigger the useEffect by forcing a remount
            window.location.reload()
          }}
        >
          <RefreshCw className="mr-2 h-4 w-4" />
          Retry
        </Button>
      </div>
    )
  }

  // Render the Stripe Elements form
  const stripeInstance = getStripeInstance(result.publishableKey)

  return (
    <Elements
      stripe={stripeInstance}
      options={{
        clientSecret: result.clientSecret,
        appearance: {
          theme: "stripe",
          variables: {
            fontFamily: '"Inter", system-ui, sans-serif',
            fontSizeBase: "16px",
          },
        },
      }}
    >
      <PaymentForm
        clientSecret={result.clientSecret}
        onSuccess={() => {
          // Refresh the page after a short delay so the subscription status
          // has time to propagate from Stripe → webhook → CRM → portal
          setTimeout(() => {
            window.location.reload()
          }, 2000)
        }}
      />
    </Elements>
  )
}
