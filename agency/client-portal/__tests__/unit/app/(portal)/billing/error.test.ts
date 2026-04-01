/**
 * Unit tests for app/(portal)/billing/error.tsx
 *
 * Verifies the billing route error boundary:
 * - Default export is a client component
 * - Renders AlertTriangle icon, heading, and action buttons
 * - Shows billing-specific messaging
 */

import { describe, it, expect } from "vitest"
import { readFileSync } from "fs"
import { resolve } from "path"

const ERROR_SOURCE = readFileSync(
  resolve(__dirname, "../../../../../app/(portal)/billing/error.tsx"),
  "utf8"
)

describe("BillingError — structural expectations from source", () => {
  it("is a client component ('use client' directive)", () => {
    expect(ERROR_SOURCE).toContain('"use client"')
  })

  it("exports a default function named BillingError", () => {
    expect(ERROR_SOURCE).toContain("export default function BillingError")
  })

  it("accepts error and reset props", () => {
    expect(ERROR_SOURCE).toContain("error: Error & { digest?: string }")
    expect(ERROR_SOURCE).toContain("reset: () => void")
  })

  it("renders AlertTriangle icon from lucide-react", () => {
    expect(ERROR_SOURCE).toContain("AlertTriangle")
    expect(ERROR_SOURCE).toContain('from "lucide-react"')
  })

  it("renders a Try again button with RefreshCw icon", () => {
    expect(ERROR_SOURCE).toContain("Try again")
    expect(ERROR_SOURCE).toContain("RefreshCw")
  })

  it("renders a Go to dashboard button", () => {
    expect(ERROR_SOURCE).toContain("Go to dashboard")
  })

  it("shows billing-specific heading text", () => {
    expect(ERROR_SOURCE).toContain("Could not load billing")
  })

  it("imports Button from @/components/ui/button", () => {
    expect(ERROR_SOURCE).toContain('from "@/components/ui/button"')
  })

  it("uses useEffect for dev-only console.error logging", () => {
    expect(ERROR_SOURCE).toContain("useEffect")
    expect(ERROR_SOURCE).toContain("NODE_ENV")
    expect(ERROR_SOURCE).toContain('"development"')
    expect(ERROR_SOURCE).toContain('console.error')
  })
})
