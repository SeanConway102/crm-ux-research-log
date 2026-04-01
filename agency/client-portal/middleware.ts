import { type NextRequest, NextResponse } from "next/server"
import { extractSubdomain, getTenantBySubdomain, ROOT_DOMAIN, PORTAL_SUBDOMAIN } from "@/lib/tenant"
import { auth } from "@/lib/auth"
import { FEATURE_FLAGS, type FeatureKey } from "@/lib/features"

// ─── Routes that don't need feature flag checks ───────────────────────────────
const ALWAYS_ALLOWED_PATHS = ["/login", "/login/verify", "/api/auth", "/onboarding", "/_next", "/favicon.ico", "/s/"]
const ALWAYS_ALLOWED_PREFIXES = ["/admin", "/api/_trpc"]

// ─── Map route prefixes → required feature flag ────────────────────────────────
const ROUTE_FEATURE_MAP: Partial<Record<string, FeatureKey>> = {
  "/studio": "studio",
  "/support": "support",
  "/billing": "billing",
  "/content/tv-feed": "tv_feed",
  "/content/media": "media_library",
  "/content": "content_hub",
}

function getRequiredFlag(pathname: string): FeatureKey | null {
  // Exact match first
  if (pathname in ROUTE_FEATURE_MAP) return ROUTE_FEATURE_MAP[pathname] as FeatureKey
  // Prefix match — find longest prefix that matches
  let best: FeatureKey | null = null
  for (const prefix of Object.keys(ROUTE_FEATURE_MAP).sort((a, b) => b.length - a.length)) {
    if (pathname.startsWith(prefix)) {
      best = ROUTE_FEATURE_MAP[prefix] as FeatureKey
      break
    }
  }
  return best
}

function isFlagEnabled(enabledFeatures: Record<string, boolean> | undefined, flag: FeatureKey): boolean {
  return enabledFeatures?.[flag] ?? false
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const hostname = request.headers.get("host")?.split(":")[0] ?? ""

  // ── Static / public paths — allow through ─────────────────────────────────
  if (ALWAYS_ALLOWED_PATHS.some((p) => pathname.startsWith(p))) {
    return NextResponse.next()
  }

  // ── Admin paths — always allowed (auth + role checked in page) ──────────────
  if (ALWAYS_ALLOWED_PREFIXES.some((p) => pathname.startsWith(p))) {
    return NextResponse.next()
  }

  // ── Subdomain resolution ──────────────────────────────────────────────────
  const subdomain = extractSubdomain(hostname)
  const { tenant, type } = await getTenantBySubdomain(subdomain)

  // If no valid tenant found, pass through (let the page handle 404)
  if (!tenant) {
    return NextResponse.next()
  }

  // Attach tenant context to request headers
  const requestHeaders = new Headers(request.headers)
  requestHeaders.set("x-tenant-id", tenant.id)
  requestHeaders.set("x-tenant-slug", tenant.slug)
  requestHeaders.set("x-tenant-type", type ?? "client")
  requestHeaders.set("x-portal-subdomain", PORTAL_SUBDOMAIN)

  // ── Auth check ────────────────────────────────────────────────────────────
  const session = await auth()
  const isLoggedIn = !!session?.user

  // Login page — allow through if logged out
  if (pathname === "/login") {
    return NextResponse.next({ request: { headers: requestHeaders } })
  }

  // Logged out users go to login
  if (!isLoggedIn) {
    const loginUrl = new URL("/login", request.url)
    loginUrl.searchParams.set("tenant", tenant.slug)
    return NextResponse.redirect(loginUrl)
  }

  // ── Feature flag enforcement ───────────────────────────────────────────────
  const requiredFlag = getRequiredFlag(pathname)
  if (requiredFlag) {
    const enabledFeatures = session.user?.enabledFeatures
    if (!isFlagEnabled(enabledFeatures, requiredFlag)) {
      // Feature is disabled — redirect to the tenant's dashboard
      const flagMeta = FEATURE_FLAGS[requiredFlag]
      const dashboardUrl = new URL(`/${tenant.slug}/dashboard`, request.url)
      return NextResponse.redirect(dashboardUrl)
    }
  }

  // ── Role-based access ─────────────────────────────────────────────────────
  const { role } = session.user

  // Agency admin routes — require OWNER role
  if (pathname.startsWith("/admin") && role !== "OWNER") {
    return NextResponse.redirect(new URL(`/${tenant.slug}/dashboard`, request.url))
  }

  // Studio — requires EDITOR or OWNER
  if (pathname.startsWith("/studio") && !["EDITOR", "OWNER"].includes(role)) {
    return NextResponse.redirect(new URL(`/${tenant.slug}/dashboard`, request.url))
  }

  // All other checks passed
  return NextResponse.next({ request: { headers: requestHeaders } })
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|s/).*)",
  ],
}
