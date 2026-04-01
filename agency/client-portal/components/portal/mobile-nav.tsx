/**
 * components/portal/mobile-nav.tsx
 *
 * Bottom tab bar for mobile (visible only on md: and below).
 * Shows up to 5 items: Dashboard, Studio, Content, Support, Billing.
 * Feature-gated items (Studio, Content, Support, Billing) are hidden when
 * their feature flag is disabled.
 *
 * Spec: §10.2 Navigation — "Mobile (bottom nav): 5 items max"
 * Spec: §3.2.1 — Feature flags gate which nav items are visible
 */

"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard,
  Monitor,
  FileText,
  LifeBuoy,
  CreditCard,
} from "lucide-react"
import { cn } from "@/lib/utils"
import type { CSSProperties } from "react"

// ─── Types ─────────────────────────────────────────────────────────────────

export type MobileNavItem = {
  key: string
  href: string
  label: string
  icon: React.ComponentType<{ className?: string }>
  featureKey?: string // feature flag key — hidden when flag is disabled
  active?: boolean
}

// ─── Static nav definition (matches sidebar.tsx NAV_ITEMS) ─────────────────

const MOBILE_NAV_ITEMS: MobileNavItem[] = [
  { key: "dashboard", href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { key: "studio", href: "/studio", label: "Site Editor", icon: Monitor, featureKey: "studio" },
  { key: "content", href: "/content", label: "Content", icon: FileText, featureKey: "content_hub" },
  { key: "support", href: "/support", label: "Support", icon: LifeBuoy, featureKey: "support" },
  { key: "billing", href: "/billing", label: "Billing", icon: CreditCard, featureKey: "billing" },
]

// ─── Pure logic (testable without React) ──────────────────────────────────

/**
 * Filter and annotate nav items for the mobile bottom bar.
 * - Always includes Dashboard
 * - Includes feature-gated items only when their flag is true
 * - Marks the item active when its href matches the current pathname
 * - Caps at 5 items (spec requirement — dashboard always counts as 1)
 */
export function getMobileNavItems(
  enabledFeatures: Record<string, boolean>,
  pathname: string
): MobileNavItem[] {
  const items = MOBILE_NAV_ITEMS.filter((item) => {
    if (!item.featureKey) return true
    return enabledFeatures[item.featureKey] === true
  })

  // Mark active item
  return items.map((item) => ({
    ...item,
    active: pathname.startsWith(item.href) && item.href !== "/dashboard"
      ? true
      : pathname === item.href && item.href === "/dashboard"
      ? true
      : false,
  }))
}

// ─── Component ─────────────────────────────────────────────────────────────

type PortalMobileNavProps = {
  /** Map of feature flag key → enabled (from lib/features.ts getEnabledFeatures) */
  enabledFeatures?: Record<string, boolean>
  /** Tenant's accent color from DB — applied as CSS var for active states */
  accentColor?: string
}

const DEFAULT_ACCENT = "#6366F1"

/**
 * Bottom tab bar — visible on mobile only (hidden md: and up).
 * Fixed to the bottom of the viewport with safe-area insets for iOS.
 */
export function PortalMobileNav({ enabledFeatures = {}, accentColor }: PortalMobileNavProps) {
  const pathname = usePathname()
  const accent = accentColor ?? DEFAULT_ACCENT

  // Use synchronous filtering on the client (enabledFeatures is already loaded)
  const items = MOBILE_NAV_ITEMS.filter((item) => {
    if (!item.featureKey) return true
    return enabledFeatures[item.featureKey] === true
  })

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 flex md:hidden border-t bg-surface"
      style={{ paddingBottom: "env(safe-area-inset-bottom)", "--accent": accent } as CSSProperties}
      aria-label="Mobile navigation"
    >
      {items.map((item) => {
        const Icon = item.icon
        const isActive = pathname.startsWith(item.href)

        return (
          <Link
            key={item.key}
            href={item.href}
            className={cn(
              "flex flex-1 flex-col items-center justify-center gap-0.5 py-2 text-[10px] font-medium transition-colors",
              isActive
                ? "text-[var(--accent)]"
                : "text-muted-foreground hover:text-foreground"
            )}
            aria-current={isActive ? "page" : undefined}
          >
            <Icon
              className={cn(
                "h-5 w-5 transition-colors",
                isActive ? "fill-[var(--accent)]/20" : ""
              )}
            />
            <span className="truncate max-w-full">{item.label}</span>
          </Link>
        )
      })}
    </nav>
  )
}
