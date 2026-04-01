'use client';

import { useActionState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { createTenantAction, type CreateTenantState } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { rootDomain } from "@/lib/utils";

const initialState: CreateTenantState = {};

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function TenantForm() {
  const router = useRouter();
  const [state, action, isPending] = useActionState<CreateTenantState, FormData>(
    createTenantAction,
    initialState
  );

  const nameRef = useRef<HTMLInputElement>(null);
  const slugRef = useRef<HTMLInputElement>(null);
  const slugManuallyEdited = useRef(false);

  // When server action returns an error (non-validation), show toast
  useEffect(() => {
    if (state?.error && !state.fieldErrors) {
      toast.error(state.error);
    }
  }, [state]);

  // When slug was manually edited, don't auto-update
  function handleNameChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (!slugManuallyEdited.current && slugRef.current) {
      // Don't update slug field while user is typing — only on blur if unchanged
    }
  }

  function handleNameBlur() {
    // If slug hasn't been manually edited, sync it from name
    if (!slugManuallyEdited.current && nameRef.current && slugRef.current) {
      const nameValue = nameRef.current.value;
      if (nameValue) {
        slugRef.current.value = slugify(nameValue);
      }
    }
  }

  function handleSlugChange() {
    slugManuallyEdited.current = true;
  }

  const nameError = state?.fieldErrors?.name?.[0];
  const slugError = state?.fieldErrors?.slug?.[0];
  const domainError = state?.fieldErrors?.domain?.[0];
  const logoUrlError = state?.fieldErrors?.logoUrl?.[0];

  return (
    <form action={action} className="space-y-6">
      {/* Client name */}
      <div className="space-y-1.5">
        <Label htmlFor="name">Client Name *</Label>
        <Input
          ref={nameRef}
          id="name"
          name="name"
          placeholder="Acme Corporation"
          autoComplete="organization"
          onChange={handleNameChange}
          onBlur={handleNameBlur}
          aria-describedby={nameError ? "name-error" : undefined}
          required
        />
        {nameError && (
          <p id="name-error" className="text-sm text-destructive">
            {nameError}
          </p>
        )}
      </div>

      {/* Subdomain */}
      <div className="space-y-1.5">
        <Label htmlFor="slug">Subdomain *</Label>
        <div className="flex items-center rounded-md border border-input bg-white">
          <Input
            ref={slugRef}
            id="slug"
            name="slug"
            placeholder="acme-corp"
            className="border-0 rounded-l-md flex-1"
            style={{ boxShadow: "none" }}
            onChange={handleSlugChange}
            aria-describedby={slugError ? "slug-error" : "slug-hint"}
            required
          />
          <span className="pr-3 text-sm text-muted-foreground select-none">
            .{rootDomain}
          </span>
        </div>
        {slugError ? (
          <p id="slug-error" className="text-sm text-destructive">
            {slugError}
          </p>
        ) : (
          <p id="slug-hint" className="text-xs text-muted-foreground">
            Lowercase letters, numbers, and hyphens only. Auto-generated from name — edit to override.
          </p>
        )}
      </div>

      {/* Primary domain */}
      <div className="space-y-1.5">
        <Label htmlFor="domain">Primary Domain</Label>
        <Input
          id="domain"
          name="domain"
          placeholder="acme-corp.com"
          autoComplete="url"
          aria-describedby={domainError ? "domain-error" : undefined}
        />
        {domainError && (
          <p id="domain-error" className="text-sm text-destructive">
            {domainError}
          </p>
        )}
        <p className="text-xs text-muted-foreground">
          The client&apos;s main website. Leave blank if unknown.
        </p>
      </div>

      {/* Logo URL */}
      <div className="space-y-1.5">
        <Label htmlFor="logoUrl">Logo URL</Label>
        <Input
          id="logoUrl"
          name="logoUrl"
          type="url"
          placeholder="https://acme-corp.com/logo.png"
          autoComplete="url"
          aria-describedby={logoUrlError ? "logo-url-error" : undefined}
        />
        {logoUrlError && (
          <p id="logo-url-error" className="text-sm text-destructive">
            {logoUrlError}
          </p>
        )}
        <p className="text-xs text-muted-foreground">
          Absolute URL to the client&apos;s logo. Leave blank to use the default.
        </p>
      </div>

      {/* Accent color */}
      <div className="space-y-1.5">
        <Label htmlFor="accentColor">Accent Color</Label>
        <div className="flex items-center gap-3">
          <input
            id="accentColor"
            name="accentColor"
            type="color"
            defaultValue="#6366F1"
            className="h-10 w-20 rounded-md border border-input cursor-pointer"
          />
          <p className="text-sm text-muted-foreground">
            Hex value preview — appears in the client&apos;s portal sidebar and mobile nav.
          </p>
        </div>
      </div>

      {/* Submit */}
      <div className="flex items-center justify-end gap-3 pt-2 border-t pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push("/admin")}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={isPending}>
          {isPending ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Creating…
            </>
          ) : (
            "Create Client"
          )}
        </Button>
      </div>
    </form>
  );
}
