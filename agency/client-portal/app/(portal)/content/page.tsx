/**
 * Content Hub — Phase 5 (partial).
 *
 * Overview page showing content types with links to Sanity Studio.
 * TV Feed management is a Phase 5+ feature — shown as "Coming Soon".
 *
 * @see SPEC.md Phase 5
 */

import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { getTenantBySlug } from "@/lib/tenant"
import { isFeatureEnabled } from "@/lib/features"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { FileText, Monitor, Radio, ArrowRight } from "lucide-react"
import Link from "next/link"

// Content type cards — these link to the relevant Sanity Studio tool.
// The counts are placeholders; Phase 5b will fetch real counts from
// the Sanity API per tenant's project.
const CONTENT_TYPES = [
  {
    label: "Pages",
    description: "Manage your website pages, headers, footers, and navigation.",
    icon: FileText,
    href: "/studio",
    count: null, // populated in Phase 5b
    badge: null as string | null,
  },
  {
    label: "Blog Posts",
    description: "Write, edit, and publish blog articles.",
    icon: FileText,
    href: "/studio",
    count: null,
    badge: null,
  },
  {
    label: "Media",
    description: "Upload and manage images, videos, and documents.",
    icon: FileText,
    href: "/studio/media",
    count: null,
    badge: null,
  },
]

export const dynamic = "force-dynamic"

export default async function ContentPage() {
  const session = await auth()
  if (!session?.user?.tenantId) redirect("/login")

  // Phase 0 feature flag enforcement
  if (!(await isFeatureEnabled(session.user.tenantId, "content_hub"))) {
    redirect("/dashboard")
  }

  const tenant = await getTenantBySlug(session.user.tenantId)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold">Content</h1>
        <p className="text-muted-foreground mt-1">
          Manage your website content, media, and more.
        </p>
      </div>

      {/* Content type grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {CONTENT_TYPES.map(({ label, description, icon: Icon, href, count, badge }) => (
          <Card key={label} className="hover:border-primary/30 transition-colors">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Icon className="h-4 w-4 text-muted-foreground" />
                  <CardTitle className="text-base">{label}</CardTitle>
                </div>
                {badge && (
                  <Badge variant="outline" className="text-xs">
                    {badge}
                  </Badge>
                )}
              </div>
              <CardDescription className="text-sm">{description}</CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <Button variant="ghost" size="sm" className="gap-1.5 w-full justify-start" asChild>
                <Link href={href}>
                  Open in Studio
                  <ArrowRight className="h-3.5 w-3.5 ml-auto" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        ))}

        {/* TV Feed — Coming Soon placeholder */}
        <Card className="border-dashed opacity-70">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Radio className="h-4 w-4 text-muted-foreground" />
              <CardTitle className="text-base">TV Feed</CardTitle>
              <Badge variant="secondary" className="ml-auto text-xs">
                Coming Soon
              </Badge>
            </div>
            <CardDescription className="text-sm">
              Manage your satellite TV program schedule and content feed.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <p className="text-xs text-muted-foreground">
              Need TV Feed access?{" "}
              <a href="/support/new" className="text-primary underline">
                File a ticket
              </a>{" "}
              and we&apos;ll get it set up.
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Studio shortcut banner */}
      <Card className="bg-primary/5 border-primary/10">
        <CardContent className="flex items-center justify-between gap-4 py-4">
          <div className="flex items-center gap-3">
            <Monitor className="h-5 w-5 text-primary" />
            <div>
              <p className="text-sm font-medium">Open full Content Editor</p>
              <p className="text-xs text-muted-foreground">
                {tenant?.name ?? "Your site"} — Sanity Studio
              </p>
            </div>
          </div>
          <Button size="sm" asChild>
            <Link href="/studio">
              Launch Studio
              <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
