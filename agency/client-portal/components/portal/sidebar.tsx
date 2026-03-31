"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard,
  Monitor,
  FileText,
  LifeBuoy,
  CreditCard,
  Settings,
  LogOut,
  Eye,
} from "lucide-react"
import { signOut } from "next-auth/react"
import { cn } from "@/lib/utils"

type NavItem = {
  href: string
  label: string
  icon: React.ComponentType<{ className?: string }>
  featureKey?: string // feature flag key — if set, item is hidden when flag is disabled
}

const NAV_ITEMS: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/studio", label: "Site Editor", icon: Monitor, featureKey: "studio" },
  { href: "/content", label: "Content", icon: FileText, featureKey: "content_hub" },
  { href: "/support", label: "Support", icon: LifeBuoy, featureKey: "support" },
  { href: "/billing", label: "Billing", icon: CreditCard, featureKey: "billing" },
]

type PortalSidebarProps = {
  /**
   * Map of feature flag key → enabled (from lib/features.ts getEnabledFeatures).
   * Items with a `featureKey` are hidden when their flag is false.
   */
  enabledFeatures?: Record<string, boolean>
}

export function PortalSidebar({ enabledFeatures = {} }: PortalSidebarProps) {
  const pathname = usePathname()

  const visibleItems = NAV_ITEMS.filter((item) => {
    if (!item.featureKey) return true
    return enabledFeatures[item.featureKey] === true
  })

  return (
    <aside className="flex w-60 flex-col border-r bg-surface">
      {/* Logo / Tenant name */}
      <div className="flex h-14 items-center border-b px-4">
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary text-primary-foreground text-sm font-bold">
            CT
          </div>
          <span className="text-sm font-semibold">Client Portal</span>
        </Link>
      </div>

      {/* Nav items */}
      <nav className="flex-1 space-y-1 px-2 py-3">
        {visibleItems.map(({ href, label, icon: Icon }) => {
          const active = pathname.startsWith(href)
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                active
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {label}
            </Link>
          )
        })}
      </nav>

      {/* Coming-soon features (disabled, shown as locked) */}
      {NAV_ITEMS.filter(
        (item) => item.featureKey && enabledFeatures[item.featureKey] !== true
      ).length > 0 && (
        <div className="border-t px-2 py-3">
          <p className="px-3 py-1 text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Coming Soon
          </p>
          {NAV_ITEMS.filter(
            (item) =>
              item.featureKey && enabledFeatures[item.featureKey] !== true
          ).map(({ href, label, icon: Icon }) => (
            <div
              key={href}
              className="flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground/50 cursor-not-allowed"
              title={`${label} — not enabled for your plan`}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {label}
              <Eye className="ml-auto h-3 w-3 shrink-0 opacity-50" />
            </div>
          ))}
        </div>
      )}

      {/* Footer */}
      <div className="border-t px-2 py-3">
        <Link
          href="/settings"
          className="flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
        >
          <Settings className="h-4 w-4 shrink-0" />
          Settings
        </Link>
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
        >
          <LogOut className="h-4 w-4 shrink-0" />
          Sign out
        </button>
      </div>
    </aside>
  )
}
