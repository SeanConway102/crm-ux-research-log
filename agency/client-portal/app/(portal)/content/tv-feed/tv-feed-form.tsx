"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { toast } from "sonner"

type FormState = {
  feedName: string
  feedUrl: string
  feedFormat: string
  description: string
}

type FieldErrors = Partial<Record<keyof FormState, string>>

export function TvFeedRequestForm() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState<FormState>({
    feedName: "",
    feedUrl: "",
    feedFormat: "",
    description: "",
  })
  const [errors, setErrors] = useState<FieldErrors>({})

  function validate(): FieldErrors {
    const e: FieldErrors = {}
    if (!form.feedName.trim()) e.feedName = "Feed name is required."
    if (!form.feedUrl.trim()) e.feedUrl = "Current feed URL is required."
    if (!form.feedFormat) e.feedFormat = "Feed format is required."
    if (!form.description.trim()) e.description = "Description is required."
    return e
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length) {
      setErrors(errs)
      return
    }

    setLoading(true)
    setErrors({})

    try {
      const res = await fetch("/api/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject: `[TV Feed Request] ${form.feedName}`,
          description:
            `Feed URL: ${form.feedUrl}\n` +
            `Feed Format: ${form.feedFormat}\n\n` +
            `${form.description}`,
          priority: "medium",
        }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        toast.error(data.error ?? "Failed to submit request. Please try again.")
        return
      }

      toast.success("TV Feed request submitted! We'll be in touch soon.")
      router.push("/support")
    } catch {
      toast.error("Something went wrong. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="max-w-xl mx-auto text-left">
      <CardHeader>
        <CardTitle className="text-base">Request TV Feed access</CardTitle>
        <CardDescription>
          Tell us about your TV feed and we&apos;ll get it set up for you.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="feedName">
              Feed name <span className="text-red-500">*</span>
            </Label>
            <Input
              id="feedName"
              value={form.feedName}
              onChange={(e) => setForm({ ...form, feedName: e.target.value })}
              placeholder="e.g. ACME Corp Main Feed"
              aria-invalid={!!errors.feedName}
            />
            {errors.feedName && (
              <p className="text-xs text-red-500">{errors.feedName}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="feedUrl">
              Current feed URL <span className="text-red-500">*</span>
            </Label>
            <Input
              id="feedUrl"
              type="url"
              value={form.feedUrl}
              onChange={(e) => setForm({ ...form, feedUrl: e.target.value })}
              placeholder="https://example.com/feed.xml"
              aria-invalid={!!errors.feedUrl}
            />
            {errors.feedUrl && (
              <p className="text-xs text-red-500">{errors.feedUrl}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="feedFormat">
              Feed format <span className="text-red-500">*</span>
            </Label>
            <Select
              value={form.feedFormat}
              onValueChange={(v) => setForm({ ...form, feedFormat: v })}
            >
              <SelectTrigger aria-invalid={!!errors.feedFormat}>
                <SelectValue placeholder="Select format..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="xml">XML</SelectItem>
                <SelectItem value="json">JSON</SelectItem>
                <SelectItem value="api">REST API</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
            {errors.feedFormat && (
              <p className="text-xs text-red-500">{errors.feedFormat}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">
              Description <span className="text-red-500">*</span>
            </Label>
            <Textarea
              id="description"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Describe your TV feed setup, what content you want to display, and any special requirements."
              rows={4}
              aria-invalid={!!errors.description}
            />
            {errors.description && (
              <p className="text-xs text-red-500">{errors.description}</p>
            )}
          </div>

          <div className="flex gap-2 justify-end pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Submitting..." : "Submit request"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
