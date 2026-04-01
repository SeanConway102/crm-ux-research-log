"use client"

import { useSession } from "next-auth/react"
import { Bell } from "lucide-react"
import { useMobileNav } from "@/components/portal/sidebar"
import { SheetTrigger } from "@/components/ui/sheet"
import { Menu } from "lucide-react"
import type { CSSProperties } from "react"

type PortalHeaderProps = {
  /** Tenant's accent color from DB — applied as CSS var for avatar background */
  accentColor?: string
}

const DEFAULT_ACCENT = "#6366F1"

export function PortalHeader({ accentColor }: PortalHeaderProps) {
  const { data: session } = useSession()
  const { setOpen } = useMobileNav()
  const accent = accentColor ?? DEFAULT_ACCENT

  return (
    <header className="flex h-14 items-center justify-between border-b bg-surface px-4 md:px-6">
      {/* Left: hamburger (mobile) + welcome message */}
      <div className="flex items-center gap-3">
        {/* Hamburger — opens the mobile navigation drawer via SheetTrigger */}
        <SheetTrigger asChild>
          <button
            className="flex md:hidden items-center justify-center rounded-md p-2 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            aria-label="Open navigation menu"
            onClick={() => setOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </button>
        </SheetTrigger>

        <div className="text-sm text-muted-foreground">
          Welcome back,{" "}
          <span className="font-medium text-foreground">
            {session?.user?.name ?? session?.user?.email ?? "there"}
          </span>
        </div>
      </div>

      {/* Right: notifications + avatar */}
      <div className="flex items-center gap-3">
        <button className="relative rounded-md p-2 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors">
          <Bell className="h-4 w-4" />
        </button>
        <div
          className="h-7 w-7 rounded-full flex items-center justify-center text-xs font-semibold uppercase"
          style={{ backgroundColor: "var(--accent)", color: "white" }}
        >
          {session?.user?.name?.[0] ?? session?.user?.email?.[0] ?? "?"}
        </div>
      </div>
    </header>
  )
}
