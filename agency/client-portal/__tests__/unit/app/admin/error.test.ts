/**
 * Unit tests for app/admin/error.tsx
 *
 * Verifies the admin section error boundary:
 * - Default export is a client component
 * - Renders AlertTriangle icon, heading, and action buttons
 */

import { describe, it, expect } from "vitest"
import { readFileSync } from "fs"
import { resolve } from "path"

const ERROR_SOURCE = readFileSync(
  resolve(__dirname, "../../../../app/admin/error.tsx"),
  "utf8"
)

describe("AdminError — structural expectations from source", () => {
  it("is a client component ('use client' directive)", () => {
    expect(ERROR_SOURCE).toContain('"use client"')
  })

  it("exports a default function named AdminError", () => {
    expect(ERROR_SOURCE).toContain("export default function AdminError")
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

  it("shows admin-specific heading text", () => {
    expect(ERROR_SOURCE).toContain("Admin dashboard error")
  })

  it("imports Button from @/components/ui/button", () => {
    expect(ERROR_SOURCE).toContain('from "@/components/ui/button"')
  })
})
