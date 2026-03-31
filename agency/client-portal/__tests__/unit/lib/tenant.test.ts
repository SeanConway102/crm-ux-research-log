import { describe, it, expect } from "vitest"
import { extractSubdomain } from "../../../lib/tenant"

describe("extractSubdomain", () => {
  it("extracts subdomain from localhost dev URL", () => {
    expect(extractSubdomain("acme-corp.localhost")).toBe("acme-corp")
    expect(extractSubdomain("admin.localhost")).toBe("admin")
    expect(extractSubdomain("localhost")).toBeNull()
  })

  it("extracts subdomain from localhost with port", () => {
    expect(extractSubdomain("acme-corp.localhost:3000")).toBe("acme-corp")
    expect(extractSubdomain("admin.acme-corp.localhost:3000")).toBe("admin")
  })

  it("extracts subdomain from production domain", () => {
    // portal.ctwebsiteco.com with ROOT_DOMAIN=ctwebsiteco.com → "portal"
    expect(
      extractSubdomain("portal.ctwebsiteco.com", "ctwebsiteco.com")
    ).toBe("portal")

    // admin.acme-corp.clientsite.com with ROOT_DOMAIN=clientsite.com → "admin.acme-corp"
    // (multi-level subdomain: admin.acme-corp is everything before clientsite.com)
    expect(
      extractSubdomain("admin.acme-corp.clientsite.com", "clientsite.com")
    ).toBe("admin.acme-corp")

    // admin.clientsite.com with ROOT_DOMAIN=clientsite.com → "admin"
    expect(
      extractSubdomain("admin.clientsite.com", "clientsite.com")
    ).toBe("admin")
  })

  it("returns null for root domain", () => {
    // ctwebsiteco.com with ROOT_DOMAIN=ctwebsiteco.com → null (no subdomain)
    expect(extractSubdomain("ctwebsiteco.com", "ctwebsiteco.com")).toBeNull()
    expect(extractSubdomain("localhost")).toBeNull()
  })

  it("handles port-stripped hosts", () => {
    // portal.ctwebsiteco.com:3000 with ROOT_DOMAIN=ctwebsiteco.com → "portal"
    expect(
      extractSubdomain("portal.ctwebsiteco.com:3000", "ctwebsiteco.com")
    ).toBe("portal")

    // admin.clientsite.com:3000 with ROOT_DOMAIN=clientsite.com → "admin"
    expect(
      extractSubdomain("admin.clientsite.com:3000", "clientsite.com")
    ).toBe("admin")
  })
})
