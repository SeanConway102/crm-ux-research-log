"use client"

import { useOptimistic, useRef, useTransition } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"
import { Send, RefreshCw } from "lucide-react"
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
  id: string
  ticket_id: string
  author_name: string
  author_email: string
  body: string
  is_internal: boolean
  created_at: string
  _pending?: true
  _failed?: true
}

type CommentAction =
  | { type: "add"; comment: OptimisticComment }
  | { type: "replace"; tempId: string; real: CrmComment }
  | { type: "remove"; id: string }

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
    case "remove":
      return comments.filter((c) => c.id !== action.id)
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
  const [isPending, startTransition] = useTransition()
  const [optimisticComments, dispatch] = useOptimistic(
    initialComments as OptimisticComment[],
    commentsReducer
  )

  /**
   * Core comment submission — used by both the form submit handler and
   * the retry button. Keeps both flows consistent.
   */
  function submitComment(body: string, tempId: string) {
    const optimisticComment: OptimisticComment = {
      id: tempId,
      ticket_id: ticketId,
      author_name: "You",
      author_email: "",
      body,
      is_internal: false,
      created_at: new Date().toISOString(),
      _pending: true,
    }

    dispatch({ type: "add", comment: optimisticComment })

    startTransition(async () => {
      try {
        const res = await fetch(`/api/tickets/${ticketId}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ body }),
        })

        if (!res.ok) {
          const data = await res.json().catch(() => ({}))
          throw new Error(data.error ?? "Failed to add reply.")
        }

        const realComment: CrmComment = await res.json()
        dispatch({ type: "replace", tempId, real: realComment })
        toast.success("Reply added.")
      } catch (err) {
        // Mark failed so the UI can show retry / dismiss controls.
        // useOptimistic does not auto-remove on error — we keep the
        // comment visible with an error state and let the user decide.
        // Cast required because CrmComment doesn't include _failed — the
        // OptimisticComment subtype carries it through the reducer.
        dispatch({
          type: "replace",
          tempId,
          real: {
            ...optimisticComment,
            _pending: undefined,
            _failed: true,
          } as OptimisticComment as CrmComment,
        })
        toast.error(
          err instanceof Error
            ? err.message
            : "Failed to add reply. Tap retry to send again."
        )
      }
    })
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (isPending) return
    const body = e.currentTarget.body?.value?.trim()
    if (!body) return
    formRef.current?.reset()
    submitComment(body, `temp-${Date.now()}`)
  }

  function retryComment(comment: OptimisticComment) {
    // Remove the failed entry and re-submit with a fresh temp ID.
    dispatch({ type: "remove", id: comment.id })
    submitComment(comment.body, `temp-${Date.now()}`)
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
        <div className="space-y-5 mb-6">
          {optimisticComments.map((comment) => (
            <div key={comment.id} className="flex gap-3">
              {/* Avatar */}
              <div
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${
                  comment._pending
                    ? "bg-muted text-muted-foreground"
                    : comment._failed
                    ? "bg-red-100 text-red-600 dark:bg-red-900 dark:text-red-300"
                    : "bg-primary/10 text-primary"
                }`}
              >
                {comment._pending ? (
                  <div className="h-3 w-3 rounded-full bg-muted-foreground/30 animate-pulse" />
                ) : comment._failed ? (
                  "!"
                ) : (
                  initials(comment.author_name)
                )}
              </div>

              {/* Body */}
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-2 mb-1">
                  <span className="text-sm font-medium">{comment.author_name}</span>
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    {comment._pending
                      ? "Sending..."
                      : comment._failed
                      ? "Failed to send"
                      : formatCommentDate(comment.created_at)}
                  </span>
                </div>
                <p className="text-sm whitespace-pre-wrap leading-relaxed text-muted-foreground">
                  {comment.body}
                </p>

                {/* Failed comment actions */}
                {comment._failed && (
                  <div className="flex items-center gap-2 mt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 gap-1.5 text-xs"
                      onClick={() => retryComment(comment)}
                    >
                      <RefreshCw className="h-3 w-3" />
                      Retry
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 text-xs text-muted-foreground"
                      onClick={() => dispatch({ type: "remove", id: comment.id })}
                    >
                      Dismiss
                    </Button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Reply form */}
        <form ref={formRef} onSubmit={handleSubmit} className="space-y-3">
          <Textarea
            name="body"
            placeholder="Add a reply..."
            rows={4}
            maxLength={5000}
            className="resize-none"
            disabled={isPending}
          />
          <div className="flex justify-end">
            <Button
              type="submit"
              size="sm"
              disabled={isPending}
              className="gap-1.5"
            >
              <Send className="h-3.5 w-3.5" />
              {isPending ? "Sending..." : "Reply"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
