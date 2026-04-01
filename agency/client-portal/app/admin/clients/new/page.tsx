import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { TenantForm } from "./tenant-form";
import { rootDomain } from "@/lib/utils";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: `Create Client | ${rootDomain}`,
  description: "Add a new client to the agency portal.",
};

export default async function NewClientPage() {
  // Auth check — only agency admins
  const session = await auth();
  if (!session?.user || session.user.role !== "OWNER") {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-xl mx-auto">
          <div className="bg-white rounded-xl border p-8 text-center">
            <p className="text-muted-foreground">Access denied. Agency admin only.</p>
            <Link
              href="/admin"
              className="mt-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Admin
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top bar */}
      <div className="bg-white border-b px-6 py-4 flex items-center gap-4">
        <Link
          href="/admin"
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          All Clients
        </Link>
      </div>

      <div className="max-w-xl mx-auto px-6 py-8">
        {/* Page header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-foreground">Add New Client</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Create a new client tenant. After creation, you&apos;ll be redirected to configure feature flags.
          </p>
        </div>

        {/* Form card */}
        <div className="bg-white rounded-xl border shadow-sm">
          <div className="px-6 py-5">
            <TenantForm />
          </div>
        </div>

        {/* Info box */}
        <div className="mt-6 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3">
          <p className="text-sm text-blue-800">
            <strong>What happens next:</strong> The tenant record is created with all features disabled by default. You&apos;ll be redirected to the feature flags page where you can enable the features this client should have access to.
          </p>
        </div>
      </div>
    </div>
  );
}
