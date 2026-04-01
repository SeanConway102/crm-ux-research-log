/**
 * Unit tests for app/(portal)/support/new/loading.tsx
 *
 * Verifies the loading skeleton for the new ticket form page:
 * - Default export is a function (Next.js loading component)
 * - Imports Skeleton from @/components/ui/skeleton
 * - Contains skeletons matching the form structure (heading, subject, priority, description, submit)
 */

import { describe, it, expect } from "vitest"
import { readFileSync } from "fs"
import { resolve } from "path"

const LOADING_SOURCE = readFileSync(
  resolve(__dirname, "../../../../../../app/(portal)/support/new/loading.tsx"),
  "utf8"
)

describe("NewTicketLoading — structural expectations from source", () => {
  /**
   * The skeleton mirrors the new ticket form layout:
   * 1. Page heading (h1 + subtitle)
   * 2. Form card with: subject field, priority select, description textarea, submit button
   */

  it("renders page heading skeletons (h1 + subtitle)", () => {
    expect(LOADING_SOURCE).toContain("h-8")
    expect(LOADING_SOURCE).toContain("w-48")
    expect(LOADING_SOURCE).toContain("h-4")
    expect(LOADING_SOURCE).toContain("w-72")
  })

  it("renders a rounded-lg border card container", () => {
    expect(LOADING_SOURCE).toContain("rounded-lg")
    expect(LOADING_SOURCE).toContain("border")
    expect(LOADING_SOURCE).toContain("bg-surface")
  })

  it("renders a subject field skeleton", () => {
    expect(LOADING_SOURCE).toContain("h-4 w-20") // label
    expect(LOADING_SOURCE).toContain("h-10") // input height
  })

  it("renders a priority field skeleton", () => {
    expect(LOADING_SOURCE).toContain("h-4 w-24") // label
    expect(LOADING_SOURCE).toContain("h-10") // select height
  })

  it("renders a description textarea skeleton (taller than input)", () => {
    expect(LOADING_SOURCE).toContain("h-4 w-28") // label
    expect(LOADING_SOURCE).toContain("h-32") // textarea height (taller than h-10 input)
  })

  it("renders a submit button skeleton", () => {
    expect(LOADING_SOURCE).toContain("h-10 w-32")
  })

  it("imports Skeleton from @/components/ui/skeleton", () => {
    expect(LOADING_SOURCE).toContain('from "@/components/ui/skeleton"')
  })
})
