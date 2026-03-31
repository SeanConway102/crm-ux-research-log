"use client"

/**
 * PaymentForm — embedded Stripe Elements form for collecting new card details.
 *
 * Used when subscription.status is "past_due" or "incomplete" to let clients
 * update their payment method and restore portal access.
 *
 * Flow:
 * 1. Client enters card details
 * 2. stripe.confirmCardSetup() → Stripe saves card to the customer record
 * 3. On success: Stripe automatically retries the failed subscription invoice
 *    and fires invoice.paid → webhook → CRM updates subscription to "active"
 * 4. Portal UI detects the status change on next page load / SWR refresh
 */

import { useState, useId } from "react"
import { useStripe, useElements, CardElement } from "@stripe/react-stripe-js"
import { Button } from "@/components/ui/button"
import { AlertTriangle, CheckCircle2, Lock } from "lucide-react"

interface PaymentFormProps {
  /**
   * The client_secret of a Stripe SetupIntent, created server-side via
   * POST /api/billing/setup-intent.  We receive it from the billing page
   * (passed as prop from a server-fetched API response).
   */
  clientSecret: string

  /** Called when Stripe confirms the SetupIntent successfully. */
  onSuccess?: () => void
}

const CARD_ELEMENT_OPTIONS = {
  style: {
    base: {
      fontFamily: '"Inter", system-ui, sans-serif',
      fontSize: "16px",
      color: "#111827",
      fontWeight: "400",
      "::placeholder": {
        color: "#9CA3AF",
      },
    },
    invalid: {
      color: "#EF4444",
      iconColor: "#EF4444",
    },
  },
  hidePostalCode: false,
}

export function PaymentForm({ clientSecret, onSuccess }: PaymentFormProps) {
  const stripe = useStripe()
  const elements = useElements()
  const formId = useId()

  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [succeeded, setSucceeded] = useState(false)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    if (!stripe || !elements) {
      // Stripe.js hasn't loaded yet — this shouldn't happen but guard anyway
      setError("Payment system is still loading. Please refresh the page.")
      return
    }

    if (!clientSecret) {
      setError("Payment session expired. Please refresh the page.")
      return
    }

    setLoading(true)
    setError(null)

    const cardElement = elements.getElement(CardElement)
    if (!cardElement) {
      setLoading(false)
      setError("Card input not found. Please refresh the page.")
      return
    }

    // confirmCardSetup uses the card Element to collect CVC/zip if needed,
    // then creates a PaymentMethod and attaches it to the Stripe Customer.
    // Because usage="off_session" on the SetupIntent, Stripe will also
    // automatically retry the failed subscription invoice using this
    // newly-attached payment method.
    const { error: stripeError, setupIntent } = await stripe.confirmCardSetup(
      clientSecret,
      {
        payment_method: {
          card: cardElement,
        },
      }
    )

    setLoading(false)

    if (stripeError) {
      setError(
        stripeError.message ??
          "Your card could not be saved. Please check your details and try again."
      )
      return
    }

    if (setupIntent?.status === "succeeded") {
      setSucceeded(true)
      onSuccess?.()
    } else {
      // Unexpected SetupIntent status — treat as a soft error
      setError(
        "Your card was saved but the setup didn't complete. Please contact support."
      )
    }
  }

  if (succeeded) {
    return (
      <div className="flex flex-col items-center justify-center py-6 text-center space-y-3">
        <CheckCircle2 className="h-10 w-10 text-green-500" />
        <div>
          <p className="font-medium text-green-700 dark:text-green-400">
            Payment method updated!
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            Your subscription will be restored shortly. This page will update
            automatically.
          </p>
        </div>
      </div>
    )
  }

  return (
    <form
      id={formId}
      onSubmit={handleSubmit}
      className="flex flex-col gap-4"
      noValidate
    >
      {/* Card input */}
      <div className="rounded-md border border-input bg-background p-3 shadow-sm">
        <CardElement options={CARD_ELEMENT_OPTIONS} />
      </div>

      {/* Security note */}
      <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Lock className="h-3 w-3" />
        Secured by Stripe. Your card details are never stored on our servers.
      </p>

      {/* Error */}
      {error && (
        <div className="flex items-start gap-2 rounded-md bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950 dark:text-red-400">
          <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
          {error}
        </div>
      )}

      {/* Submit */}
      <Button
        type="submit"
        disabled={!stripe || !elements || loading}
        className="w-full"
      >
        {loading ? "Saving card…" : "Save payment method"}
      </Button>
    </form>
  )
}
