import "server-only";
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { hashApiKey } from "@/lib/crypto";

export type ApiContext = {
  workspaceId: string;
  apiKeyId: string;
  scope: "read" | "read_write";
};

export async function authenticateApi(req: Request): Promise<ApiContext | NextResponse> {
  const header = req.headers.get("x-api-key") ?? extractBearer(req.headers.get("authorization"));
  if (!header) return unauth("missing x-api-key header");
  if (!header.startsWith("cb_")) return unauth("invalid key format");
  let hash: string;
  try {
    hash = hashApiKey(header);
  } catch (e) {
    return unauth("server crypto unavailable");
  }
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("api_keys")
    .select("id, workspace_id, scope, revoked_at")
    .eq("key_hash", hash)
    .maybeSingle();
  if (error) return unauth(`lookup failed: ${error.message}`);
  if (!data) return unauth("unknown key");
  if (data.revoked_at) return unauth("key revoked");
  await admin.from("api_keys").update({ last_used_at: new Date().toISOString() }).eq("id", data.id);
  return {
    workspaceId: data.workspace_id as string,
    apiKeyId: data.id as string,
    scope: (data.scope as "read" | "read_write") ?? "read",
  };
}

export function requireScope(ctx: ApiContext, scope: "read" | "read_write"): NextResponse | null {
  if (scope === "read") return null; // any scope can read
  if (ctx.scope !== "read_write") return unauth("read_write scope required");
  return null;
}

export function isErr(x: unknown): x is NextResponse {
  return x instanceof NextResponse;
}

function unauth(reason: string) {
  return NextResponse.json({ ok: false, error: reason }, { status: 401 });
}

function extractBearer(h: string | null): string | null {
  if (!h) return null;
  const m = h.match(/^Bearer\s+(.+)$/i);
  return m ? m[1].trim() : null;
}
