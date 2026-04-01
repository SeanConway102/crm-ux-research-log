import { ReactNode } from "react"
import { auth } from "@/lib/auth"
import { getEnabledFeatures } from "@/lib/features"
import { prisma } from "@/lib/prisma"
import {
  PortalSidebar,
  MobileNavProvider,
  MobileDrawerContent,
} from "@/components/portal/sidebar"
import { PortalHeader } from "@/components/portal/header"
import { PortalMobileNav } from "@/components/portal/mobile-nav"
import { FeatureFlagRefreshProvider } from "@/components/portal/FeatureFlagRefreshProvider"

export default async function PortalLayout({ children }: { children: ReactNode }) {
  const session = await auth()
  const tenantId = session?.user?.tenantId

  // Fetch enabled features for this tenant (cached in-memory, 60s TTL)
  const enabledFeatures = tenantId
    ? await getEnabledFeatures(tenantId)
    : {}

  // Fetch tenant's accent color for white-label branding (Phase 6)
  // Falls back to CT Website Co. indigo if no tenant or no accent set
  let accentColor: string | null = null
  let logoUrl: string | null = null
  let tenantName: string | null = null
  if (tenantId) {
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { accentColor: true, logoUrl: true, name: true },
    })
    accentColor = tenant?.accentColor ?? null
    logoUrl = tenant?.logoUrl ?? null
    tenantName = tenant?.name ?? null
  }

  return (
    <FeatureFlagRefreshProvider>
    <MobileNavProvider>
      <div className="flex h-screen bg-bg">
        {/* Desktop sidebar — hidden on mobile */}
        <PortalSidebar enabledFeatures={enabledFeatures} accentColor={accentColor ?? undefined} logoUrl={logoUrl} tenantName={tenantName} />

        {/* Main content area */}
        <div className="flex flex-1 flex-col overflow-hidden">
          {/* Mobile drawer (Sheet with nav links) — rendered here for DOM order */}
          <MobileDrawerContent enabledFeatures={enabledFeatures} accentColor={accentColor ?? undefined} logoUrl={logoUrl} tenantName={tenantName} />

          {/* Top header — contains hamburger SheetTrigger on mobile */}
          <PortalHeader accentColor={accentColor ?? undefined} />

          {/* Page content — extra bottom padding on mobile to clear the bottom nav */}
          <main className="flex-1 overflow-y-auto p-4 md:p-6 pb-20 md:pb-6">
            {children}
          </main>
        </div>

        {/* Mobile bottom navigation bar — visible only on mobile */}
        <PortalMobileNav enabledFeatures={enabledFeatures} accentColor={accentColor ?? undefined} />
      </div>
    </MobileNavProvider>
    </FeatureFlagRefreshProvider>
  )
}
