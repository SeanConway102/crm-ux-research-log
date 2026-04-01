import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { getCrmTickets } from "@/lib/crm-api"
import { isFeatureEnabled } from "@/lib/features"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Plus, Search } from "lucide-react"

// Compact relative date formatter — no external deps required
function formatRelativeDate(dateStr: string): string {
  const date = new Date(dateStr)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffSec = Math.floor(diffMs / 1000)
  const diffMin = Math.floor(diffSec / 60)
  const diffHr = Math.floor(diffMin / 60)
  const diffDay = Math.floor(diffHr / 24)
  if (diffSec < 60) return "just now"
  if (diffMin < 60) return `${diffMin}m ago`
  if (diffHr < 24) return `${diffHr}h ago`
  if (diffDay < 7) return `${diffDay}d ago`
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" })
}

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

// Priority dot colors — matching the internal dashboard style
const priorityDots: Record<string, { fill: string; label: string }> = {
  urgent: { fill: "#ef4444", label: "Urgent" },
  high: { fill: "#f97316", label: "High" },
  medium: { fill: "#eab308", label: "Medium" },
  low: { fill: "#d1d5db", label: "Low" },
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

export default async function SupportPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string }>
}) {
  const session = await auth()
  if (!session?.user?.tenantId) redirect("/login")

  // Phase 0 feature flag enforcement
  if (!(await isFeatureEnabled(session.user.tenantId, "support"))) {
    redirect("/dashboard")
  }

  const { q, status } = await searchParams
  const tickets = await getCrmTickets(session.user.tenantId, status)

  const filtered = q
    ? tickets.filter((t) =>
        t.subject.toLowerCase().includes(q.toLowerCase())
      )
    : tickets

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Support</h1>
          <p className="text-muted-foreground mt-1">
            Manage your support tickets
          </p>
        </div>
        <Button asChild>
          <a href="/support/new">
            <Plus className="mr-2 h-4 w-4" /> New Ticket
          </a>
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <form>
            <Input
              name="q"
              defaultValue={q}
              placeholder="Search tickets..."
              className="pl-9"
            />
          </form>
        </div>
        {/* Status filters */}
        <div className="flex gap-1">
          {[
            { label: "All", value: undefined },
            { label: "Open", value: "open" },
            { label: "In Progress", value: "in_progress" },
            { label: "Resolved", value: "resolved" },
          ].map(({ label, value }) => (
            <Button
              key={label}
              variant={status === value ? "default" : "outline"}
              size="sm"
              asChild
            >
              <a
                href={
                  value
                    ? `/support?status=${value}${q ? `&q=${q}` : ""}`
                    : `/support${q ? `?q=${q}` : ""}`
                }
              >
                {label}
              </a>
            </Button>
          ))}
        </div>
      </div>

      {/* Ticket list */}
      {filtered.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="text-muted-foreground">No tickets found.</p>
            <Button variant="link" asChild className="mt-2">
              <a href="/support/new">File the first ticket</a>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {filtered.map((ticket) => {
          const dot = priorityDots[ticket.priority]
          const initials = ticket.assignee
            ? `${ticket.assignee.first_name?.[0] ?? ""}${ticket.assignee.last_name?.[0] ?? ""}`.toUpperCase()
            : null

          return (
            <Card key={ticket.id} className="hover:bg-muted/40 transition-colors">
              <CardContent className="flex items-center justify-between gap-4 p-4">
                {/* Left: priority dot + subject + meta */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    {/* Priority dot — scannable at a glance */}
                    {dot && (
                      <span
                        title={`Priority: ${dot.label}`}
                        className="shrink-0"
                      >
                        <svg width="8" height="8" viewBox="0 0 8 8">
                          <circle cx="4" cy="4" r="4" fill={dot.fill} />
                        </svg>
                      </span>
                    )}
                    <a
                      href={`/support/${ticket.id}`}
                      className="font-medium hover:underline truncate"
                    >
                      {ticket.subject}
                    </a>
                  </div>
                  <div className="flex items-center gap-3 mt-1 ml-2.5 text-xs text-muted-foreground">
                    <span>Opened {new Date(ticket.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>
                    <span>·</span>
                    <span>Updated {formatRelativeDate(ticket.updated_at)}</span>
                    {ticket.description && (
                      <>
                        <span>·</span>
                        <span className="truncate max-w-xs">
                          {ticket.description.slice(0, 60)}
                        </span>
                      </>
                    )}
                  </div>
                </div>
                {/* Right: assignee + badges */}
                <div className="flex items-center gap-3 shrink-0">
                  {ticket.assignee && (
                    <div className="flex items-center gap-1.5" title={`Assigned to ${ticket.assignee.first_name} ${ticket.assignee.last_name}`}>
                      <div className="h-5 w-5 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-semibold text-primary shrink-0">
                        {initials}
                      </div>
                      <span className="text-xs text-muted-foreground hidden sm:inline">
                        {ticket.assignee.first_name}
                      </span>
                    </div>
                  )}
                  <StatusBadge status={ticket.status} />
                  <PriorityBadge priority={ticket.priority} />
                </div>
              </CardContent>
            </Card>
          )
        })}
        </div>
      )}
    </div>
  )
}
