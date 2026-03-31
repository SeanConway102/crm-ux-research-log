import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { getTenantBySlug } from "@/lib/tenant"
import { getCrmTickets } from "@/lib/crm-api"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Monitor, LifeBuoy, CreditCard, ArrowRight } from "lucide-react"

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

export default async function DashboardPage() {
  const session = await auth()
  if (!session?.user?.tenantId) {
    redirect("/login")
  }

  const tenant = await getTenantBySlug(session.user.tenantId)
  const tickets = await getCrmTickets(session.user.tenantId, "open")

  const firstName = session.user.name?.split(" ")[0] ?? "there"

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <div>
        <h1 className="text-2xl font-semibold">Good morning, {firstName}</h1>
        <p className="text-muted-foreground mt-1">
          Here&apos;s what&apos;s happening with {tenant?.name ?? "your portal"} today.
        </p>
      </div>

      {/* Quick stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Open Tickets</CardTitle>
            <LifeBuoy className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{tickets.length}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {tickets.filter((t) => t.priority === "urgent" || t.priority === "high").length} high priority
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Site Status</CardTitle>
            <Monitor className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold">Active</span>
              <span className="h-2 w-2 rounded-full bg-green-500" />
            </div>
            <p className="text-xs text-muted-foreground mt-1">All systems operational</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Plan</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Pro</div>
            <p className="text-xs text-muted-foreground mt-1">Next billing: Apr 15, 2026</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent tickets */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Recent Tickets</CardTitle>
              <Button variant="ghost" size="sm" asChild>
                <a href="/support">
                  View all <ArrowRight className="ml-1 h-3 w-3" />
                </a>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {tickets.length === 0 ? (
              <p className="text-sm text-muted-foreground py-6 text-center">
                No open tickets.{" "}
                <a href="/support/new" className="text-primary underline">
                  File one
                </a>{" "}
                if you need help.
              </p>
            ) : (
              <div className="space-y-3">
                {tickets.slice(0, 5).map((ticket) => (
                  <div key={ticket.id} className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">{ticket.subject}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {new Date(ticket.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <PriorityBadge priority={ticket.priority} />
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick actions */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button variant="outline" className="w-full justify-start" asChild>
              <a href="/studio">
                <Monitor className="mr-2 h-4 w-4" /> Edit website content
              </a>
            </Button>
            <Button variant="outline" className="w-full justify-start" asChild>
              <a href="/support/new">
                <LifeBuoy className="mr-2 h-4 w-4" /> File a support ticket
              </a>
            </Button>
            <Button variant="outline" className="w-full justify-start" asChild>
              <a href="/billing">
                <CreditCard className="mr-2 h-4 w-4" /> View billing & invoices
              </a>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
