"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import { toast } from "sonner"

export default function NewTicketPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    subject: "",
    description: "",
    priority: "medium",
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  function validate() {
    const e: Record<string, string> = {}
    if (!form.subject.trim()) e.subject = "Subject is required."
    if (form.subject.length > 200) e.subject = "Subject must be under 200 characters."
    if (!form.description.trim()) e.description = "Description is required."
    return e
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length) { setErrors(errs); return }

    setLoading(true)
    try {
      const res = await fetch("/api/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })
      if (!res.ok) {
        const data = await res.json()
        toast.error(data.error ?? "Failed to create ticket.")
      } else {
        toast.success("Ticket submitted successfully.")
        router.push("/support")
      }
    } catch {
      toast.error("Something went wrong.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">File a support ticket</h1>
        <p className="text-muted-foreground mt-1">
          Describe the issue and we&apos;ll get back to you as soon as possible.
        </p>
      </div>

      <Card>
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="subject">Subject <span className="text-red-500">*</span></Label>
              <Input
                id="subject"
                value={form.subject}
                onChange={(e) => setForm({ ...form, subject: e.target.value })}
                placeholder="Brief description of the issue"
                aria-invalid={!!errors.subject}
              />
              {errors.subject && <p className="text-xs text-red-500">{errors.subject}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="priority">Priority</Label>
              <Select
                value={form.priority}
                onValueChange={(v: string) => setForm({ ...form, priority: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low — Minor issue, no rush</SelectItem>
                  <SelectItem value="medium">Medium — Should be addressed soon</SelectItem>
                  <SelectItem value="high">High — Blocking important work</SelectItem>
                  <SelectItem value="urgent">Urgent — System is down</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description <span className="text-red-500">*</span></Label>
              <Textarea
                id="description"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Describe the issue in detail. Include any steps to reproduce, error messages, or relevant context."
                rows={6}
                aria-invalid={!!errors.description}
              />
              {errors.description && <p className="text-xs text-red-500">{errors.description}</p>}
            </div>

            <div className="flex gap-2 justify-end">
              <Button variant="outline" type="button" onClick={() => router.back()}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? "Submitting..." : "Submit ticket"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
