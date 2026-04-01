import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { getTenantBySlug } from "@/lib/tenant"
import { getCrmTickets, getCrmSubscription, getCrmSite } from "@/lib/crm-api"
import { getEnabledFeatures } from "@/lib/features"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Monitor, LifeBuoy, CreditCard, ArrowRight } from "lucide-react"
import type { Metadata } from "next"

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

function PlanBadge({ planName, status }: { planName: string; status: string }) {
  const statusConfig: Record<string, { label: string; bg: string; text: string }> = {
    active: { label: "Active", bg: "bg-green-100", text: "text-green-700" },
    trialing: { label: "Trial", bg: "bg-blue-100", text: "text-blue-700" },
    past_due: { label: "Past Due", bg: "bg-orange-100", text: "text-orange-700" },
    canceled: { label: "Canceled", bg: "bg-red-100", text: "text-red-700" },
    incomplete: { label: "Setup Required", bg: "bg-yellow-100", text: "text-yellow-700" },
    unpaid: { label: "Unpaid", bg: "bg-red-100", text: "text-red-700" },
  }
  const config = statusConfig[status] ?? { label: status, bg: "bg-gray-100", text: "text-gray-700" }
  return (
    <div className="flex items-center gap-2">
      <span className="text-2xl font-bold">{planName}</span>
      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${config.bg} ${config.text}`}>
        {config.label}
      </span>
    </div>
  )
}

function SiteStatusIndicator({ status }: { status: string | null }) {
  const configs: Record<string, { label: string; dot: string; text: string }> = {
    active: { label: "Active", dot: "bg-green-500", text: "text-green-600" },
    inactive: { label: "Inactive", dot: "bg-yellow-500", text: "text-yellow-600" },
    suspended: { label: "Suspended", dot: "bg-red-500", text: "text-red-600" },
    pending: { label: "Pending", dot: "bg-orange-500", text: "text-orange-600" },
  }
  const config = status ? configs[status] : null
  return (
    <div className="flex items-center gap-2">
      <span className="text-2xl font-bold">{config?.label ?? "Unknown"}</span>
      <span className={`h-2 w-2 rounded-full ${config?.dot ?? "bg-gray-400"}`} />
    </div>
  )
}

// ─── Feature-gated quick actions ─────────────────────────────────────────────

type QuickAction = {
  key: string
  label: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  featureKey?: string
}

const ALL_QUICK_ACTIONS: QuickAction[] = [
  { key: "studio", label: "Edit website content", href: "/studio", icon: Monitor, featureKey: "studio" },
  { key: "support", label: "File a support ticket", href: "/support/new", icon: LifeBuoy, featureKey: "support" },
  { key: "billing", label: "View billing & invoices", href: "/billing", icon: CreditCard, featureKey: "billing" },
]

export default async function DashboardPage() {
  const session = await auth()
  if (!session?.user?.tenantId) {
    redirect("/login")
  }

  const tenantId = session.user.tenantId
  const enabledFeatures = await getEnabledFeatures(tenantId)

  const tenant = await getTenantBySlug(tenantId)
  const tickets = await getCrmTickets(tenantId, "open")

  // Fetch subscription and site status from CRM (gracefully degrade if unavailable)
  const [subscription, site] = await Promise.all([
    getCrmSubscription(tenantId),
    tenant?.crmSiteId ? getCrmSite(tenant.crmSiteId) : null,
  ])

  // Time-based greeting
  const hourUtc = new Date().getUTCHours()
  const greeting =
    hourUtc >= 5 && hourUtc < 12 ? "Good morning" :
    hourUtc >= 12 && hourUtc < 17 ? "Good afternoon" :
    hourUtc >= 17 && hourUtc < 21 ? "Good evening" :
    "Good night"

  const firstName = session.user.name?.split(" ")[0] ?? "there"

  // Feature-gated quick actions
  const visibleQuickActions = ALL_QUICK_ACTIONS.filter((action) => {
    if (!action.featureKey) return true
    return enabledFeatures[action.featureKey] === true
  })

  return (
    <div className="space-y-6">
      {/* Welcome with time-based greeting */}
      <div>
        <h1 className="text-2xl font-semibold">{greeting}, {firstName}</h1>
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
            <SiteStatusIndicator status={site?.status ?? null} />
            <p className="text-xs text-muted-foreground mt-1">
              {site?.url ?? "No site linked"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Plan</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="space-y-1">
            {subscription ? (
              <>
                <PlanBadge planName={subscription.plan_name} status={subscription.status} />
                <p className="text-xs text-muted-foreground mt-1">
                  {subscription.status === "canceled"
                    ? "Canceled"
                    : `Next billing: ${new Date(subscription.current_period_end).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`}
                </p>
              </>
            ) : (
              <>
                <span className="text-2xl font-bold text-muted-foreground">No plan</span>
                <p className="text-xs text-muted-foreground mt-1">Contact sales to get started</p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent tickets */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Recent Tickets</CardTitle>
              {enabledFeatures.support && (
                <Button variant="ghost" size="sm" asChild>
                  <a href="/support">
                    View all <ArrowRight className="ml-1 h-3 w-3" />
                  </a>
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {!enabledFeatures.support ? (
              <p className="text-sm text-muted-foreground py-6 text-center">
                Support tickets are not available on your current plan.
              </p>
            ) : tickets.length === 0 ? (
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

        {/* Quick actions — feature-flag gated */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {visibleQuickActions.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">
                No actions available on your current plan.
              </p>
            ) : (
              visibleQuickActions.map((action) => {
                const Icon = action.icon
                return (
                  <Button key={action.key} variant="outline" className="w-full justify-start" asChild>
                    <a href={action.href}>
                      <Icon className="mr-2 h-4 w-4" />
                      {action.label}
                    </a>
                  </Button>
                )
              })
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
