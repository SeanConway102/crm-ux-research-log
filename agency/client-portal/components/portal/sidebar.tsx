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
  Menu,
  Radio,
} from "lucide-react"
import { signOut } from "next-auth/react"
import { cn } from "@/lib/utils"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { createContext, useContext, useState, type ReactNode, type CSSProperties } from "react"

// ─── Shared mobile nav sheet context ────────────────────────────────────────

type MobileNavContextValue = {
  open: boolean
  setOpen: (open: boolean) => void
}

const MobileNavContext = createContext<MobileNavContextValue | null>(null)

export function MobileNavProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false)
  return (
    <MobileNavContext.Provider value={{ open, setOpen }}>
      {children}
    </MobileNavContext.Provider>
  )
}

export function useMobileNav() {
  const ctx = useContext(MobileNavContext)
  if (!ctx) throw new Error("useMobileNav must be used inside MobileNavProvider")
  return ctx
}

// ─── Default brand accent (CT Website Co. indigo) ────────────────────────────
const DEFAULT_ACCENT = "#6366F1"

// ─── Nav items definition (shared between sidebar and mobile nav) ─────────────

type NavItem = {
  href: string
  label: string
  icon: React.ComponentType<{ className?: string }>
  featureKey?: string
}

export const NAV_ITEMS: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/studio", label: "Site Editor", icon: Monitor, featureKey: "studio" },
  { href: "/content", label: "Content", icon: FileText, featureKey: "content_hub" },
  { href: "/support", label: "Support", icon: LifeBuoy, featureKey: "support" },
  { href: "/billing", label: "Billing", icon: CreditCard, featureKey: "billing" },
  // tv_feed is nested under Content — only shown in sidebar when flag is enabled
  { href: "/content/tv-feed", label: "TV Feed", icon: Radio, featureKey: "tv_feed" },
]

// ─── Desktop sidebar ────────────────────────────────────────────────────────

export type PortalSidebarProps = {
  enabledFeatures?: Record<string, boolean>
  /** Tenant's accent color from DB (e.g. "#E11D48"). Defaults to CT Website Co. indigo. */
  accentColor?: string
  /** Tenant's logo URL — rendered in the sidebar header. Falls back to CT Website Co. default. */
  logoUrl?: string | null
  /** Tenant's display name — rendered in the sidebar header. Falls back to "Client Portal". */
  tenantName?: string | null
}

export type MobileDrawerContentProps = {
  enabledFeatures?: Record<string, boolean>
  /** Tenant's accent color from DB — applied as CSS var for active states */
  accentColor?: string
  /** Tenant's logo URL — rendered in the mobile drawer header. Falls back to default. */
  logoUrl?: string | null
  /** Tenant's display name — rendered in the mobile drawer header. Falls back to "Client Portal". */
  tenantName?: string | null
}

export function PortalSidebar({ enabledFeatures = {}, accentColor, logoUrl, tenantName }: PortalSidebarProps) {
  const pathname = usePathname()
  const accent = accentColor ?? DEFAULT_ACCENT
  const useCustomLogo = Boolean(logoUrl)
  const displayName = tenantName ?? "Client Portal"

  const visibleItems = NAV_ITEMS.filter((item) => {
    if (!item.featureKey) return true
    return enabledFeatures[item.featureKey] === true
  })

  const hiddenItems = NAV_ITEMS.filter(
    (item) => item.featureKey && enabledFeatures[item.featureKey] !== true
  )

  return (
    <aside
      className="hidden md:flex w-60 flex-col border-r bg-surface"
      style={{ "--accent": accent } as CSSProperties}
    >
      {/* Logo / Tenant name */}
      <div className="flex h-14 items-center border-b px-4">
        <Link href="/dashboard" className="flex items-center gap-2 min-w-0">
          {useCustomLogo ? (
            // Tenant-branded: show their logo + name
            <img
              src={logoUrl!}
              alt={displayName}
              className="h-7 w-7 shrink-0 rounded-md object-contain"
            />
          ) : (
            // Default: CT Website Co. logo
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-primary text-primary-foreground text-sm font-bold">
              CT
            </div>
          )}
          <span className="text-sm font-semibold truncate">{displayName}</span>
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
                  ? "bg-[var(--accent)]/10 text-[var(--accent)]"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {label}
            </Link>
          )
        })}
      </nav>

      {/* Coming-soon features */}
      {hiddenItems.length > 0 && (
        <div className="border-t px-2 py-3">
          <p className="px-3 py-1 text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Coming Soon
          </p>
          {hiddenItems.map(({ href, label, icon: Icon }) => (
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

// ─── Mobile drawer content (called from layout, inside MobileNavProvider) ─────

export function MobileDrawerContent({ enabledFeatures = {}, accentColor, logoUrl, tenantName }: MobileDrawerContentProps) {
  const pathname = usePathname()
  const { open, setOpen } = useMobileNav()
  const accent = accentColor ?? DEFAULT_ACCENT
  const useCustomLogo = Boolean(logoUrl)
  const displayName = tenantName ?? "Client Portal"

  const visibleItems = NAV_ITEMS.filter((item) => {
    if (!item.featureKey) return true
    return enabledFeatures[item.featureKey] === true
  })

  const hiddenItems = NAV_ITEMS.filter(
    (item) => item.featureKey && enabledFeatures[item.featureKey] !== true
  )

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetContent side="left" className="w-72 p-0 flex flex-col">
        <SheetHeader className="px-4 py-4 border-b shrink-0">
          <SheetTitle className="flex items-center gap-2 text-base min-w-0">
            {useCustomLogo ? (
              <img
                src={logoUrl!}
                alt={displayName}
                className="h-7 w-7 shrink-0 rounded-md object-contain"
              />
            ) : (
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-primary text-primary-foreground text-sm font-bold">
                CT
              </div>
            )}
            <span className="text-sm font-semibold truncate">{displayName}</span>
          </SheetTitle>
        </SheetHeader>

        <nav className="flex-1 space-y-1 px-2 py-3 overflow-y-auto">
          {visibleItems.map(({ href, label, icon: Icon }) => {
            const active = pathname.startsWith(href)
            return (
              <Link
                key={href}
                href={href}
                onClick={() => setOpen(false)}
                className={cn(
                  "flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  active
                    ? "bg-[var(--accent)]/10 text-[var(--accent)]"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <Icon className="h-4 w-4 shrink-0" />
                {label}
              </Link>
            )
          })}
        </nav>

        {hiddenItems.length > 0 && (
          <div className="border-t px-2 py-3 shrink-0">
            <p className="px-3 py-1 text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Coming Soon
            </p>
            {hiddenItems.map(({ href, label, icon: Icon }) => (
              <div
                key={href}
                className="flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground/50 cursor-not-allowed"
              >
                <Icon className="h-4 w-4 shrink-0" />
                {label}
                <Eye className="ml-auto h-3 w-3 shrink-0 opacity-50" />
              </div>
            ))}
          </div>
        )}

        <div className="border-t px-2 py-3 shrink-0">
          <Link
            href="/settings"
            onClick={() => setOpen(false)}
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
      </SheetContent>
    </Sheet>
  )
}
