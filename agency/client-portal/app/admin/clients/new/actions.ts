'use server';

import { prisma } from "@/lib/prisma";
import { redis } from "@/lib/redis";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

// ─── Validation ────────────────────────────────────────────────────────────────

function isValidSlug(slug: string): boolean {
  return /^[a-z0-9][a-z0-9-]*[a-z0-9]$|^[a-z0-9]$/.test(slug);
}

function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

export type CreateTenantState = {
  success?: boolean;
  error?: string;
  fieldErrors?: {
    name?: string[];
    slug?: string[];
    domain?: string[];
    logoUrl?: string[];
  };
};

/**
 * Create a new client tenant.
 *
 * Creates:
 * 1. A Prisma Tenant record (type: CLIENT)
 * 2. A Redis subdomain entry
 * 3. TenantFeatureFlag records for all seeded feature flags (all disabled)
 *
 * After creation, redirects to the client's feature flags admin page.
 */
export async function createTenantAction(
  _prevState: CreateTenantState,
  formData: FormData
): Promise<CreateTenantState> {
  const name = (formData.get("name") as string | null)?.trim() ?? "";
  const slug = (formData.get("slug") as string | null)?.trim() ?? "";
  const domain = (formData.get("domain") as string | null)?.trim() ?? "";
  const logoUrl = (formData.get("logoUrl") as string | null)?.trim() ?? "";
  const accentColor = (formData.get("accentColor") as string | null)?.trim() ?? "#6366F1";

  // ── Validation ──────────────────────────────────────────────────────────────
  const fieldErrors: CreateTenantState["fieldErrors"] = {};

  if (!name) fieldErrors.name = ["Client name is required."];
  if (!slug) {
    fieldErrors.slug = ["Subdomain is required."];
  } else if (!isValidSlug(slug)) {
    fieldErrors.slug = [
      "Subdomain can only contain lowercase letters, numbers, and hyphens. It must start and end with a letter or number.",
    ];
  }
  if (domain && !isValidUrl(`https://${domain}`)) {
    fieldErrors.domain = ["Please enter a valid domain (e.g. example.com)."];
  }
  if (logoUrl && !isValidUrl(logoUrl)) {
    fieldErrors.logoUrl = ["Please enter a valid URL for the logo."];
  }

  if (Object.keys(fieldErrors).length > 0) {
    return { error: "Please fix the errors below.", fieldErrors };
  }

  // ── Uniqueness checks ───────────────────────────────────────────────────────
  const [existingTenant, existingRedis] = await Promise.all([
    prisma.tenant.findUnique({ where: { slug } }),
    redis.get(`subdomain:${slug}`),
  ]);

  if (existingTenant || existingRedis) {
    return {
      error: `A client with subdomain "${slug}" already exists. Choose a different subdomain.`,
    };
  }

  // ── Create Tenant record + Redis entry + Feature Flags ───────────────────
  try {
    const tenant = await prisma.tenant.create({
      data: {
        slug,
        name,
        domain: domain || null,
        type: "CLIENT",
        logoUrl: logoUrl || null,
        accentColor,
        crmSiteId: null,
        sanityDataset: "production",
      },
    });

    // Create Redis subdomain entry
    await redis.set(`subdomain:${slug}`, {
      emoji: "🏢",
      createdAt: Date.now(),
    });

    // Seed all feature flags as disabled (agency admin enables them per-client)
    const featureFlags = await prisma.featureFlag.findMany({ select: { id: true } });
    await prisma.tenantFeatureFlag.createMany({
      data: featureFlags.map((flag) => ({
        tenantId: tenant.id,
        featureFlagId: flag.id,
        enabled: false,
      })),
    });

    revalidatePath("/admin");
    redirect(`/admin/clients/${tenant.id}?created=1`);
  } catch (err: any) {
    // Redirect throws an expected Next.js error — re-throw so it propagates
    if (err?.message?.includes("NEXT_REDIRECT")) throw err;
    console.error("[createTenantAction] failed:", err);
    return { error: "Failed to create client. Please try again." };
  }
}
