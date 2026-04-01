"use client"

import { useState } from "react"
import { Star, Loader2, XIcon } from "lucide-react"
import { toast } from "sonner"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"

type Props = {
  featureKey: string
  featureLabel: string
  children?: React.ReactNode // the trigger button/link element
}

/**
 * RequestFeatureAccess — Dialog for requesting access to a Coming Soon feature.
 *
 * Usage in sidebar (see sidebar.tsx):
 *   <RequestFeatureAccess featureKey="studio" featureLabel="Site Editor">
 *     <div className="flex items-center gap-2 ...">
 *       <Monitor className="h-4 w-4" />
 *       Site Editor
 *       <Eye className="ml-auto h-3 w-3 opacity-50" />
 *     </div>
 *   </RequestFeatureAccess>
 *
 * The `children` is the trigger element (shown in the "Coming Soon" section).
 * Clicking it opens the dialog. The form submits a support ticket via POST
 * to /api/tickets with subject "[Feature Request] {featureLabel}".
 */
export function RequestFeatureAccess({ featureKey, featureLabel, children }: Props) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState("")

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    const description = message.trim()
      ? message.trim()
      : `I would like access to the ${featureLabel} feature.`

    try {
      const res = await fetch("/api/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject: `[Feature Request] ${featureLabel}`,
          description,
          priority: "low",
        }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        toast.error(data.error ?? "Failed to submit request. Please try again.")
        return
      }

      toast.success(`Request sent! We'll enable ${featureLabel} for you soon.`)
      setOpen(false)
      setMessage("")
    } catch {
      toast.error("Something went wrong. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {/* Trigger — whatever the sidebar passes as children (the clickable row) */}
      <DialogTrigger asChild onClick={() => setOpen(true)}>
        {children}
      </DialogTrigger>

      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Request access</DialogTitle>
          <DialogDescription>
            Send a request to enable <strong>{featureLabel}</strong> for your account.
            We&apos;ll review it and get back to you shortly.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Pre-filled context shown as read-only */}
          <div className="rounded-md bg-muted/60 px-3 py-2 text-sm text-muted-foreground">
            <span className="font-medium text-foreground">{featureLabel}</span> — this
            feature is not yet enabled for your plan.
          </div>

          {/* Optional message */}
          <div className="space-y-1.5">
            <Label htmlFor={`access-msg-${featureKey}`}>
              Message <span className="text-muted-foreground font-normal">(optional)</span>
            </Label>
            <Textarea
              id={`access-msg-${featureKey}`}
              placeholder="Any specific requirements or context you'd like us to know..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={3}
              disabled={loading}
            />
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Star className="mr-1.5 h-3.5 w-3.5" />
                  Send request
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
