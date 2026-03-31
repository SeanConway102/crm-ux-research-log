"use client"

import { useSession } from "next-auth/react"
import { Bell } from "lucide-react"

export function PortalHeader() {
  const { data: session } = useSession()

  return (
    <header className="flex h-14 items-center justify-between border-b bg-surface px-6">
      <div className="text-sm text-muted-foreground">
        Welcome back, <span className="font-medium text-foreground">{session?.user?.name ?? session?.user?.email ?? "there"}</span>
      </div>
      <div className="flex items-center gap-3">
        <button className="relative rounded-md p-2 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors">
          <Bell className="h-4 w-4" />
        </button>
        <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-semibold uppercase">
          {session?.user?.name?.[0] ?? session?.user?.email?.[0] ?? "?"}
        </div>
      </div>
    </header>
  )
}
