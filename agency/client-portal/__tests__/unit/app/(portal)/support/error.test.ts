/**
 * Unit tests for app/(portal)/support/error.tsx
 *
 * Verifies the support tickets list error boundary:
 * - Default export is a client component
 * - Renders AlertTriangle icon, heading, and action buttons
 * - Shows ticket-specific error messaging
 */

import { describe, it, expect } from "vitest"
import { readFileSync } from "fs"
import { resolve } from "path"

const ERROR_SOURCE = readFileSync(
  resolve(__dirname, "../../../../../app/(portal)/support/error.tsx"),
  "utf8"
)

describe("SupportError — structural expectations from source", () => {
  it("is a client component ('use client' directive)", () => {
    expect(ERROR_SOURCE).toContain('"use client"')
  })

  it("exports a default function named SupportError", () => {
    expect(ERROR_SOURCE).toContain("export default function SupportError")
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

  it("shows support-ticket-specific heading text", () => {
    expect(ERROR_SOURCE).toContain("Could not load tickets")
  })

  it("imports Button from @/components/ui/button", () => {
    expect(ERROR_SOURCE).toContain('from "@/components/ui/button"')
  })
})
