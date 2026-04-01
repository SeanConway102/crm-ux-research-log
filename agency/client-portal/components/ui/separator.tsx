"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

/**
 * A thin horizontal or vertical divider.
 * Built on a simple div — no Radix dependency needed.
 */
export function Separator({
  className,
  orientation = "horizontal",
  decorative = true,
}: {
  className?: string
  orientation?: "horizontal" | "vertical"
  decorative?: boolean
}) {
  return (
    <div
      role={decorative ? undefined : "separator"}
      aria-orientation={decorative ? undefined : orientation}
      className={cn(
        "shrink-0 bg-border",
        orientation === "horizontal" ? "h-px w-full" : "h-full w-px",
        className
      )}
    />
  )
}
