"use client"

import { useState } from "react"
import { signIn } from "next-auth/react"
import { useSearchParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"

export default function LoginPage() {
  const searchParams = useSearchParams()
  const tenantSlug = searchParams.get("tenant")
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email) return
    setLoading(true)
    setError(null)

    try {
      const result = await signIn("resend", {
        email,
        redirect: false,
        tenant: tenantSlug ?? undefined,
      })
      if (result?.error) {
        setError("Unable to send sign-in link. Please check your email address.")
      } else {
        setSent(true)
      }
    } catch {
      setError("Something went wrong. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  if (sent) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Check your email</CardTitle>
          <CardDescription>
            We sent a sign-in link to <strong>{email}</strong>. Click the link in the email to access your portal.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Didn&apos;t receive it? Check your spam folder, or{" "}
            <button
              className="text-primary underline"
              onClick={() => setSent(false)}
            >
              try again
            </button>
            .
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Sign in to your portal</CardTitle>
        <CardDescription>
          {tenantSlug
            ? "Enter your email to receive a sign-in link."
            : "Enter your work email to access the client portal."}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email address</Label>
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              autoFocus
            />
          </div>
          {error && <p className="text-sm text-red-500">{error}</p>}
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Sending..." : "Send sign-in link"}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
