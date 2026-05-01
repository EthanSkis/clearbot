import type { Adapter } from "./types";

export const idTaxAdapter: Adapter = {
  agencyCode: "ID TAX",
  description: "Idaho State Tax Commission — portal RPA pending",
  requiresCredentials: true,

  async submit(ctx) {
    if (!ctx.credentials?.username || !ctx.credentials?.password) {
      return { ok: false, reason: "credentials_invalid", detail: "no portal credentials on file" };
    }
    if (!ctx.packet) {
      return { ok: false, reason: "transient", detail: "no packet attached to filing" };
    }
    // Real impl: log into Idaho TAP (tax.idaho.gov), file the period return
    // referenced by ctx.filing, submit payment, capture confirmation number.
    return { ok: false, reason: "not_implemented", detail: "ID TAX adapter scaffolded" };
  },
};
