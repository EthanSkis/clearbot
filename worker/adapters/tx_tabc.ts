import type { Adapter } from "./types";

export const txTabcAdapter: Adapter = {
  agencyCode: "TX TABC",
  description: "Texas Alcoholic Beverage Commission — portal RPA pending",
  requiresCredentials: true,

  async submit(ctx) {
    if (!ctx.credentials?.username || !ctx.credentials?.password) {
      return { ok: false, reason: "credentials_invalid", detail: "no portal credentials on file" };
    }
    if (!ctx.packet) {
      return { ok: false, reason: "transient", detail: "no packet attached to filing" };
    }
    // Real impl: launch Playwright, log into TABC AIMS portal, navigate to
    // renewal flow for ctx.license.license_number, upload ctx.packet PDF,
    // pay fee with ctx.credentials.virtual_card or ACH, capture confirmation
    // number + receipt PDF.
    return { ok: false, reason: "not_implemented", detail: "TX TABC adapter scaffolded" };
  },
};
