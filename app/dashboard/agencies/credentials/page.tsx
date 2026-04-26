import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { requireContext, canAdmin } from "@/lib/workspace";
import { CredentialsClient } from "./CredentialsClient";
import { listCredentials, listAgencyOptions } from "./actions";

export const metadata: Metadata = { title: "Portal credentials · ClearBot" };
export const dynamic = "force-dynamic";

export default async function CredentialsPage() {
  const ctx = await requireContext();
  if (!canAdmin(ctx.membership.role)) redirect("/dashboard/agencies");

  const [creds, agencies] = await Promise.all([listCredentials(), listAgencyOptions()]);

  return (
    <>
      <PageHeader
        eyebrow="Vault · AES-256-GCM · Per-row DEK"
        title={
          <>
            Portal <span className="italic">credentials.</span>
          </>
        }
        subtitle="Encrypted at rest with envelope encryption. Decrypted only by the worker, never by the dashboard."
        actions={
          <Link
            href="/dashboard/agencies"
            className="rounded-full border border-hairline bg-white px-4 py-2 font-mono text-[11px] uppercase tracking-wider text-body hover:text-ink"
          >
            Back to agencies
          </Link>
        }
      />
      <CredentialsClient
        initialCredentials={creds.ok ? creds.items : []}
        initialError={creds.ok ? null : creds.error}
        agencies={agencies.ok ? agencies.items : []}
      />
    </>
  );
}
