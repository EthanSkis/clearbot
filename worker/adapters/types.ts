import type { SupabaseClient } from "@supabase/supabase-js";

export type AdapterContext = {
  admin: SupabaseClient;
  filing: {
    id: string;
    short_id: string;
    workspace_id: string;
    license_id: string;
    location_id: string;
    agency_id: string | null;
    fee_cents: number;
    stage: string;
    mode: string;
  };
  license: {
    id: string;
    license_type: string;
    license_number: string | null;
    expires_at: string | null;
    cycle_days: number;
  };
  location: {
    id: string;
    name: string;
    address_line1: string | null;
    city: string | null;
    state: string | null;
    zip: string | null;
  };
  agency: {
    id: string;
    code: string;
    name: string;
    portal_url: string | null;
  };
  packet: {
    storage_path: string;
    bytes: number;
  } | null;
  credentials: {
    username?: string;
    password?: string;
    mfa_seed?: string;
    [k: string]: unknown;
  } | null;
};

export type SubmitOutcome =
  | {
      ok: true;
      confirmation_number: string;
      receipt_storage_path?: string;
      screenshot_storage_path?: string;
      submitted_at: string; // ISO
    }
  | { ok: false; reason: "not_implemented"; detail?: string }
  | { ok: false; reason: "credentials_invalid"; detail?: string }
  | { ok: false; reason: "portal_changed"; detail?: string }
  | { ok: false; reason: "fee_payment_failed"; detail?: string }
  | { ok: false; reason: "agency_rejected"; detail?: string }
  | { ok: false; reason: "transient"; detail?: string };

export type Adapter = {
  agencyCode: string;        // matches agencies.code
  description: string;
  requiresCredentials: boolean;
  submit(ctx: AdapterContext): Promise<SubmitOutcome>;
};
