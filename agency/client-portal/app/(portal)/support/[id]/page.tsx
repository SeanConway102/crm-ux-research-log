import { auth } from "@/lib/auth"
import { redirect, notFound } from "next/navigation"
import { getCrmTicket, getCrmTicketComments, type CrmComment } from "@/lib/crm-api"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, Clock, User } from "lucide-react"
import Link from "next/link"
import { CommentThread } from "./comment-thread"

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    open: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
    in_progress: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300",
    resolved: "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300",
    closed: "bg-muted text-muted-foreground",
  }
  return (
    <Badge className={colors[status] ?? ""} variant="outline">
      {status.replace("_", " ")}
    </Badge>
  )
}

function PriorityBadge({ priority }: { priority: string }) {
  const colors: Record<string, string> = {
    low: "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300",
    medium: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300",
    high: "bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300",
    urgent: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300",
  }
  return (
    <Badge className={colors[priority] ?? ""} variant="outline">
      {priority}
    </Badge>
  )
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

export default async function TicketDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const session = await auth()
  if (!session?.user?.tenantId) {
    redirect("/login")
  }

  const { id } = await params

  const [ticket, comments] = await Promise.all([
    getCrmTicket(id),
    getCrmTicketComments(id),
  ])

  if (!ticket) {
    notFound()
  }

  if (ticket.tenant_id !== session.user.tenantId) {
    notFound()
  }

  const initials = (name: string) =>
    name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Back + header */}
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <Button variant="ghost" size="sm" className="-ml-2" asChild>
            <Link href="/support">
              <ArrowLeft className="mr-1 h-4 w-4" />
              Support
            </Link>
          </Button>
          <h1 className="text-2xl font-semibold leading-tight">{ticket.subject}</h1>
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <span>#{ticket.id.slice(-6)}</span>
            <span>·</span>
            <span>Opened {formatDate(ticket.created_at)}</span>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <StatusBadge status={ticket.status} />
          <PriorityBadge priority={ticket.priority} />
        </div>
      </div>

      {/* Ticket description */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-medium">Description</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">
            {ticket.description ?? "No description provided."}
          </p>
          {ticket.assignee_id && (
            <div className="flex items-center gap-2 mt-4 pt-4 border-t text-xs text-muted-foreground">
              <User className="h-3.5 w-3.5" />
              <span>Assigned to team member</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Comment thread */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <h2 className="text-base font-semibold">
            {comments.length === 0 ? "No replies yet" : `${comments.length} ${comments.length === 1 ? "reply" : "replies"}`}
          </h2>
        </div>

        {comments.length > 0 ? (
          <Card>
            <CardContent className="pt-6 space-y-5">
              {comments.map((comment) => (
                <CommentItem
                  key={comment.id}
                  comment={comment}
                  initials={initials}
                />
              ))}
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-8 text-center">
              <p className="text-sm text-muted-foreground">
                No replies yet. Add the first reply below.
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Comment form */}
      <CommentThread ticketId={id} />
    </div>
  )
}

function CommentItem({
  comment,
  initials,
}: {
  comment: CrmComment
  initials: (name: string) => string
}) {
  return (
    <div className="flex gap-3">
      {/* Avatar */}
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-semibold">
        {initials(comment.author_name)}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-2 mb-1">
          <span className="text-sm font-medium">{comment.author_name}</span>
          <span className="text-xs text-muted-foreground flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {formatDate(comment.created_at)}
          </span>
        </div>
        <p className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">
          {comment.body}
        </p>
      </div>
    </div>
  )
}
