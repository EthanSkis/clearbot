import type { Adapter } from "./types";

export const idIsldAdapter: Adapter = {
  agencyCode: "ID ISLD",
  description: "Idaho State Liquor Division — portal RPA pending",
  requiresCredentials: true,

  async submit(ctx) {
    if (!ctx.credentials?.username || !ctx.credentials?.password) {
      return { ok: false, reason: "credentials_invalid", detail: "no portal credentials on file" };
    }
    if (!ctx.packet) {
      return { ok: false, reason: "transient", detail: "no packet attached to filing" };
    }
    // Real impl: log into liquor.idaho.gov licensee portal, navigate to
    // renewal flow for ctx.license.license_number, upload ctx.packet PDF,
    // pay state fee, capture confirmation number + receipt.
    return { ok: false, reason: "not_implemented", detail: "ID ISLD adapter scaffolded" };
  },
};
