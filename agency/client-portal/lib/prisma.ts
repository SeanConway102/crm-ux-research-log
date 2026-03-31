import { PrismaClient } from "@prisma/client"

// PrismaClient is generated after `pnpm db:generate` — this works at runtime
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let prisma: PrismaClient
try {
  prisma = globalForPrisma.prisma ?? new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  })
} catch {
  // Fallback during build/compile before prisma generate has run
  prisma = new PrismaClient()
}

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma

export { prisma }
