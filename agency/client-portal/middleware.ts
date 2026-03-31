import { type NextRequest, NextResponse } from "next/server"
import { extractSubdomain, getTenantBySubdomain, ROOT_DOMAIN, PORTAL_SUBDOMAIN } from "@/lib/tenant"
import { auth } from "@/lib/auth"

const PUBLIC_PATHS = ["/login", "/login/verify", "/api/auth", "/onboarding", "/_next", "/favicon.ico", "/s/"]

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const hostname = request.headers.get("host")?.split(":")[0] ?? ""

  // ── Static / public paths — allow through ──
  if (PUBLIC_PATHS.some((p) => pathname.startsWith(p))) {
    return NextResponse.next()
  }

  // ── Subdomain resolution ──
  const subdomain = extractSubdomain(hostname)
  const { tenant, type } = await getTenantBySubdomain(subdomain)

  // If no valid tenant found for this subdomain, pass through (let the page handle 404)
  if (!tenant) {
    return NextResponse.next()
  }

  // Attach tenant context to request headers for downstream use
  const requestHeaders = new Headers(request.headers)
  requestHeaders.set("x-tenant-id", tenant.id)
  requestHeaders.set("x-tenant-slug", tenant.slug)
  requestHeaders.set("x-tenant-type", type ?? "client")
  requestHeaders.set("x-portal-subdomain", PORTAL_SUBDOMAIN)

  // ── Auth check ──
  const session = await auth()
  const isLoggedIn = !!session?.user

  // Login page — allow through if logged out (they need to see the login form)
  if (pathname === "/login") {
    return NextResponse.next({ request: { headers: requestHeaders } })
  }

  // Logged out users go to login
  if (!isLoggedIn) {
    const loginUrl = new URL("/login", request.url)
    loginUrl.searchParams.set("tenant", tenant.slug)
    return NextResponse.redirect(loginUrl)
  }

  // ── Role-based access ──
  const { role } = session.user

  // Agency routes — require OWNER role
  if (pathname.startsWith("/admin") && role !== "OWNER") {
    return NextResponse.redirect(new URL(`/${tenant.slug}/dashboard`, request.url))
  }

  // Studio — requires EDITOR or OWNER
  if (pathname.startsWith("/studio") && !["EDITOR", "OWNER"].includes(role)) {
    return NextResponse.redirect(new URL(`/${tenant.slug}/dashboard`, request.url))
  }

  // Billing routes — requires BILLING or OWNER (OWNER covers all access)
  // Support routes — open to all roles

  return NextResponse.next({ request: { headers: requestHeaders } })
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|s/).*)",
  ],
}
