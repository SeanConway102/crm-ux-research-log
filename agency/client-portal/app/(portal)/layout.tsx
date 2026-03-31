import { ReactNode } from "react"
import { auth } from "@/lib/auth"
import { getEnabledFeatures } from "@/lib/features"
import { PortalSidebar } from "@/components/portal/sidebar"
import { PortalHeader } from "@/components/portal/header"

export default async function PortalLayout({ children }: { children: ReactNode }) {
  const session = await auth()
  const tenantId = session?.user?.tenantId

  // Fetch enabled features for this tenant (cached in-memory, 60s TTL)
  const enabledFeatures = tenantId
    ? await getEnabledFeatures(tenantId)
    : {}

  return (
    <div className="flex h-screen bg-bg">
      <PortalSidebar enabledFeatures={enabledFeatures} />
      <div className="flex flex-1 flex-col overflow-hidden">
        <PortalHeader />
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
