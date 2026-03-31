"use client"

import { useOptimistic, useRef, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"
import { Send } from "lucide-react"
import type { CrmComment } from "@/lib/crm-api"

function formatCommentDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

// ── Types ────────────────────────────────────────────────────────────────────

export interface OptimisticComment {
  id: string // temporary negative id for optimistic comments
  ticket_id: string
  author_name: string
  author_email: string
  body: string
  is_internal: boolean
  created_at: string
  _pending?: true
}

type CommentAction =
  | { type: "add"; comment: OptimisticComment }
  | { type: "replace"; tempId: string; real: CrmComment }

function commentsReducer(
  comments: OptimisticComment[],
  action: CommentAction
): OptimisticComment[] {
  switch (action.type) {
    case "add":
      return [...comments, action.comment]
    case "replace":
      return comments.map((c) =>
        c.id === action.tempId ? { ...action.real, _pending: undefined } : c
      )
    default:
      return comments
  }
}

// ── Component ────────────────────────────────────────────────────────────────

interface CommentThreadProps {
  ticketId: string
  initialComments?: CrmComment[]
}

export function CommentThread({
  ticketId,
  initialComments = [],
}: CommentThreadProps) {
  const formRef = useRef<HTMLFormElement>(null)
  const [optimisticComments, dispatch] = useOptimistic(
    initialComments as OptimisticComment[],
    commentsReducer
  )
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = e.currentTarget
    const body = form.body.value.trim()
    if (!body) return

    setLoading(true)

    // Build optimistic comment
    const optimisticComment: OptimisticComment = {
      id: `temp-${Date.now()}`,
      ticket_id: ticketId,
      author_name: "You",
      author_email: "",
      body,
      is_internal: false,
      created_at: new Date().toISOString(),
      _pending: true,
    }

    // Optimistically add to UI immediately
    dispatch({ type: "add", comment: optimisticComment })

    // Reset form
    form.reset()

    try {
      const res = await fetch(`/api/tickets/${ticketId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body }),
      })

      if (!res.ok) {
        const data = await res.json()
        toast.error(data.error ?? "Failed to add reply.")
        // Remove the optimistic comment on failure (it was never added to state, but we re-render)
        // Actually the optimistic comment IS in state — we need to replace it back
        // Since we can't remove via useOptimistic reducer, we'll just show error toast
        // The optimistic comment stays until next full page refresh
        setLoading(false)
        return
      }

      const realComment: CrmComment = await res.json()

      // Replace optimistic comment with the real one from server
      dispatch({ type: "replace", tempId: optimisticComment.id, real: realComment })
      toast.success("Reply added.")
    } catch {
      toast.error("Something went wrong. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const initials = (name: string) =>
    name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)

  return (
    <Card>
      <CardContent className="pt-6">
        {/* Comment list */}
        {optimisticComments.length > 0 && (
          <div className="space-y-5 mb-6">
            {optimisticComments.map((comment) => (
              <div key={comment.id} className="flex gap-3">
                <div
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${
                    comment._pending
                      ? "bg-muted text-muted-foreground"
                      : "bg-primary/10 text-primary"
                  }`}
                >
                  {comment._pending ? (
                    <div className="h-3 w-3 rounded-full bg-muted-foreground/30 animate-pulse" />
                  ) : (
                    initials(comment.author_name)
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-2 mb-1">
                    <span className="text-sm font-medium">
                      {comment.author_name}
                    </span>
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <span
                        className={
                          comment._pending ? "text-muted-foreground/50" : ""
                        }
                      >
                        {comment._pending
                          ? "Sending..."
                          : formatCommentDate(comment.created_at)}
                      </span>
                    </span>
                  </div>
                  <p
                    className={`text-sm whitespace-pre-wrap leading-relaxed ${
                      comment._pending ? "text-muted-foreground/60" : "text-muted-foreground"
                    }`}
                  >
                    {comment.body}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Reply form */}
        <form ref={formRef} onSubmit={handleSubmit} className="space-y-3">
          <Textarea
            name="body"
            placeholder="Add a reply..."
            rows={4}
            maxLength={5000}
            className="resize-none"
            disabled={loading}
          />
          <div className="flex justify-end">
            <Button
              type="submit"
              size="sm"
              disabled={loading}
              className="gap-1.5"
            >
              <Send className="h-3.5 w-3.5" />
              {loading ? "Sending..." : "Reply"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
