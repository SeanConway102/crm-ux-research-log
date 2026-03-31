/**
 * Seed script for Feature Flags.
 * Run with: npx prisma db seed
 * (add "prisma": { "seed": "tsx prisma/seed.ts" } to package.json)
 */
import { prisma } from "../lib/prisma"

const FEATURE_FLAGS = [
  {
    key: "studio",
    label: "Site Editor",
    description: "Embedded Sanity Studio for content editing",
    isBeta: false,
  },
  {
    key: "support",
    label: "Support Tickets",
    description: "File and track support tickets",
    isBeta: false,
  },
  {
    key: "billing",
    label: "Billing",
    description: "Subscription status, invoices, and payment management",
    isBeta: false,
  },
  {
    key: "content_hub",
    label: "Content Hub",
    description: "Overview of content types with links to Studio",
    isBeta: false,
  },
  {
    key: "tv_feed",
    label: "TV Feed",
    description: "Satellite TV feed management",
    isBeta: true,
  },
  {
    key: "media_library",
    label: "Media Library",
    description: "Sanity media browser for managing images and files",
    isBeta: true,
  },
]

async function main() {
  console.log("🌱 Seeding feature flags...")

  for (const flag of FEATURE_FLAGS) {
    const record = await prisma.featureFlag.upsert({
      where: { key: flag.key },
      update: {
        label: flag.label,
        description: flag.description,
        isBeta: flag.isBeta,
      },
      create: flag,
    })
    console.log(`  ✓ ${record.key} (${record.id})`)
  }

  console.log(`\n✅ Seeded ${FEATURE_FLAGS.length} feature flags.`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
