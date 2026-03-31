import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { getTenantBySlug } from "@/lib/tenant"
import { getCrmSubscription, getCrmInvoices } from "@/lib/crm-api"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { CreditCard, ExternalLink, AlertTriangle } from "lucide-react"

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; color: string }> = {
    active: { label: "Active", color: "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300" },
    trialing: { label: "Trial", color: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300" },
    past_due: { label: "Payment Required", color: "bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300" },
    incomplete: { label: "Setup Required", color: "bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300" },
    canceled: { label: "Canceled", color: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300" },
    unpaid: { label: "Unpaid", color: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300" },
  }
  const { label, color } = map[status] ?? { label: status, color: "bg-muted" }
  return <Badge className={color}>{label}</Badge>
}

export default async function BillingPage() {
  const session = await auth()
  if (!session?.user?.tenantId) redirect("/login")

  const tenant = await getTenantBySlug(session.user.tenantId)
  const [subscription, invoices] = await Promise.all([
    getCrmSubscription(session.user.tenantId),
    getCrmInvoices(session.user.tenantId),
  ])

  const status = subscription?.status ?? "incomplete"
  const showPaymentForm = ["past_due", "incomplete"].includes(status)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Billing</h1>
        <p className="text-muted-foreground mt-1">Manage your subscription and invoices.</p>
      </div>

      {/* Payment alert */}
      {showPaymentForm && (
        <div className="flex items-start gap-3 rounded-lg border border-orange-200 bg-orange-50 p-4 dark:border-orange-900 dark:bg-orange-950">
          <AlertTriangle className="h-5 w-5 text-orange-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-medium text-orange-800 dark:text-orange-200">
              {status === "past_due"
                ? "Your last payment failed. Update your card to restore full access."
                : "Your subscription setup is incomplete. Add a payment method to activate your portal."}
            </p>
            <p className="text-sm text-orange-700 dark:text-orange-300 mt-1">
              Contact your account manager if you need assistance.
            </p>
          </div>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Plan card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Current Plan</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold">{subscription?.plan_name ?? "—"}</p>
                <p className="text-sm text-muted-foreground mt-1">
                  {subscription
                    ? `${(subscription.plan_amount / 100).toFixed(2)} / ${subscription.plan_interval === "month" ? "month" : "year"}`
                    : "No active plan"}
                </p>
              </div>
              <StatusBadge status={status} />
            </div>

            {subscription?.current_period_end && (
              <p className="text-sm text-muted-foreground">
                {status === "canceled"
                  ? `Access ends ${new Date(subscription.current_period_end).toLocaleDateString()}`
                  : `Next billing date: ${new Date(subscription.current_period_end).toLocaleDateString()}`}
              </p>
            )}

            {/* Stripe Customer Portal link */}
            {tenant && (
              <Button variant="outline" asChild className="w-full mt-2">
                <a
                  href={`https://billing.stripe.com/p/login/${tenant.slug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <CreditCard className="mr-2 h-4 w-4" />
                  Manage Billing
                  <ExternalLink className="ml-2 h-3 w-3" />
                </a>
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Quick actions */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Need to change your plan?</CardTitle>
            <CardDescription>
              Contact us to upgrade, downgrade, or change your billing frequency.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" asChild>
              <a href="/support/new">Contact support</a>
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Invoice history */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Invoice History</CardTitle>
        </CardHeader>
        <CardContent>
          {invoices.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">
              No invoices yet.
            </p>
          ) : (
            <div className="space-y-3">
              {invoices.map((invoice) => (
                <div key={invoice.id} className="flex items-center justify-between py-2 border-b last:border-0">
                  <div>
                    <p className="text-sm font-medium">{invoice.number}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(invoice.created).toLocaleDateString()}
                      {invoice.due_date && ` · Due: ${new Date(invoice.due_date).toLocaleDateString()}`}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <StatusBadge status={invoice.status} />
                    <p className="text-sm font-medium">
                      {(invoice.amount / 100).toFixed(2)}
                    </p>
                    {invoice.pdf_url && (
                      <Button variant="ghost" size="sm" asChild>
                        <a href={invoice.pdf_url} target="_blank" rel="noopener noreferrer">
                          PDF
                        </a>
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
