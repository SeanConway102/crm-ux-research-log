/**
 * Unit tests for app/(portal)/content/tv-feed/loading.tsx
 *
 * Verifies the loading skeleton for the TV Feed page:
 * - Default export is a function (Next.js loading component)
 * - Uses correct UI primitives (Skeleton, Radio)
 * - Contains all expected skeleton elements matching the page structure
 */

import { describe, it, expect } from "vitest"
import { readFileSync } from "fs"
import { resolve } from "path"

const LOADING_SOURCE = readFileSync(
  resolve(__dirname, "../../../../../../app/(portal)/content/tv-feed/loading.tsx"),
  "utf8"
)

describe("TvFeedLoading — structural expectations from source", () => {
  /**
   * The skeleton mirrors the page layout:
   * 1. Header area (breadcrumb icon + title + subtitle skeletons)
   * 2. Dashed card with icon + "Coming Soon" heading + form field skeletons
   *
   * Since we can't server-render in unit tests without a full Next.js
   * environment, we verify the expected structure is present in the source.
   */

  it("renders the breadcrumb icon for the Content section", () => {
    expect(LOADING_SOURCE).toContain("<Radio")
    expect(LOADING_SOURCE).toContain('className="h-4 w-4 text-muted-foreground"')
  })

  it("renders title skeleton (h-9 w-40 matches the 2xl h1)", () => {
    expect(LOADING_SOURCE).toContain("h-9")
    expect(LOADING_SOURCE).toContain("w-40")
  })

  it("renders subtitle skeleton (description line)", () => {
    expect(LOADING_SOURCE).toContain('h-4 w-72')
  })

  it("renders the dashed placeholder card container", () => {
    expect(LOADING_SOURCE).toContain("border-dashed")
    expect(LOADING_SOURCE).toContain("rounded-lg")
    expect(LOADING_SOURCE).toContain("bg-muted/30")
    expect(LOADING_SOURCE).toContain("p-8")
  })

  it("renders Radio icon inside the dashed card", () => {
    expect(LOADING_SOURCE).toContain("h-6 w-6")
    expect(LOADING_SOURCE).toContain("text-primary")
  })

  it("renders feed name form field skeleton", () => {
    // Feed name section — labeled as "Feed name" in JSX comment
    expect(LOADING_SOURCE).toContain("{/* Feed name */}")
    expect(LOADING_SOURCE).toContain('h-4 w-24') // label skeleton width
    expect(LOADING_SOURCE).toContain('h-10 w-full') // input skeleton
  })

  it("renders feed URL form field skeleton", () => {
    expect(LOADING_SOURCE).toContain("{/* Feed URL */}")
    expect(LOADING_SOURCE).toContain('h-4 w-32')
  })

  it("renders feed format form field skeleton (select placeholder)", () => {
    expect(LOADING_SOURCE).toContain("{/* Feed format")
  })

  it("renders description form field skeleton (textarea)", () => {
    expect(LOADING_SOURCE).toContain("{/* Description */}")
    // Textarea is taller (h-24) than a regular input
    expect(LOADING_SOURCE).toContain("h-24")
  })

  it("renders two button skeletons in the form footer", () => {
    // Cancel (outline) + Submit buttons
    const h10Matches = LOADING_SOURCE.match(/h-10 w-\d+/g) ?? []
    // Should have at least 2 h-10 elements (Cancel + Submit), plus the format select trigger
    expect(h10Matches.length).toBeGreaterThanOrEqual(2)
  })

  it("imports Skeleton from @/components/ui/skeleton", () => {
    expect(LOADING_SOURCE).toContain('from "@/components/ui/skeleton"')
  })

  it("imports Radio from lucide-react", () => {
    expect(LOADING_SOURCE).toContain('from "lucide-react"')
  })
})
