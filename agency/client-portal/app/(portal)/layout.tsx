import { ReactNode } from "react"
import { PortalSidebar } from "@/components/portal/sidebar"
import { PortalHeader } from "@/components/portal/header"

export default function PortalLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-screen bg-bg">
      <PortalSidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <PortalHeader />
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
