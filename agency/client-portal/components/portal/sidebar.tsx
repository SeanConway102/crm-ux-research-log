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
  ChevronLeft,
  LogOut,
} from "lucide-react"
import { signOut } from "next-auth/react"
import { cn } from "@/lib/utils"

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/studio", label: "Site Editor", icon: Monitor },
  { href: "/content", label: "Content", icon: FileText },
  { href: "/support", label: "Support", icon: LifeBuoy },
  { href: "/billing", label: "Billing", icon: CreditCard },
]

export function PortalSidebar() {
  const pathname = usePathname()

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
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
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
