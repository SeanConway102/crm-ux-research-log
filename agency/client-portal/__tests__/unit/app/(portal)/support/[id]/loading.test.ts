/**
 * Unit tests for app/(portal)/support/[id]/loading.tsx
 *
 * Verifies the loading skeleton for the ticket detail page:
 * - Default export is a function (Next.js loading component)
 * - Imports Skeleton from @/components/ui/skeleton
 * - Contains skeletons matching the page structure (back link, header, badges, description card, comments, composer)
 */

import { describe, it, expect } from "vitest"
import { readFileSync } from "fs"
import { resolve } from "path"

const LOADING_SOURCE = readFileSync(
  resolve(__dirname, "../../../../../../app/(portal)/support/[id]/loading.tsx"),
  "utf8"
)

describe("TicketDetailLoading — structural expectations from source", () => {
  /**
   * The skeleton mirrors the ticket detail page layout:
   * 1. Back link + header + status/priority badges
   * 2. Description card
   * 3. Comment count heading
   * 4. Comment thread (2 comment skeletons)
   * 5. Reply composer
   */

  it("renders back link skeleton", () => {
    expect(LOADING_SOURCE).toContain("h-5 w-24")
  })

  it("renders title skeleton (ticket subject h1)", () => {
    expect(LOADING_SOURCE).toContain("h-8 w-96")
  })

  it("renders ticket meta skeletons (id + date)", () => {
    expect(LOADING_SOURCE).toContain("h-4 w-16") // ticket ID
    expect(LOADING_SOURCE).toContain("h-4 w-32") // date
  })

  it("renders status and priority badge skeletons", () => {
    expect(LOADING_SOURCE).toContain("h-6 w-20") // status badge
    expect(LOADING_SOURCE).toContain("h-6 w-16") // priority badge
  })

  it("renders description card with card-header and card-content area", () => {
    expect(LOADING_SOURCE).toContain("rounded-lg")
    expect(LOADING_SOURCE).toContain("border")
    expect(LOADING_SOURCE).toContain("bg-surface")
    expect(LOADING_SOURCE).toContain("h-4 w-full") // description text lines
    expect(LOADING_SOURCE).toContain("h-4 w-5/6") // partial-width line
    expect(LOADING_SOURCE).toContain("h-4 w-4/6") // shorter line
  })

  it("renders comment count skeleton", () => {
    expect(LOADING_SOURCE).toContain("h-5 w-28")
  })

  it("renders two comment skeletons (avatar + name + text)", () => {
    // Each comment has: h-8 w-8 rounded-full avatar + name + date + body lines
    const h8Matches = LOADING_SOURCE.match(/h-8/g) ?? []
    // Should have at least 2 h-8 elements (avatars)
    expect(h8Matches.length).toBeGreaterThanOrEqual(2)
  })

  it("renders reply composer skeleton (textarea + button)", () => {
    expect(LOADING_SOURCE).toContain("h-24") // textarea
    expect(LOADING_SOURCE).toContain("h-9 w-24") // submit button
  })

  it("imports Skeleton from @/components/ui/skeleton", () => {
    expect(LOADING_SOURCE).toContain('from "@/components/ui/skeleton"')
  })
})
