import type { Adapter } from "./types";

export const idIspAbcAdapter: Adapter = {
  agencyCode: "ID ISP ABC",
  description: "Idaho State Police — Alcohol Beverage Control — portal RPA pending",
  requiresCredentials: true,

  async submit(ctx) {
    if (!ctx.credentials?.username || !ctx.credentials?.password) {
      return { ok: false, reason: "credentials_invalid", detail: "no portal credentials on file" };
    }
    if (!ctx.packet) {
      return { ok: false, reason: "transient", detail: "no packet attached to filing" };
    }
    // Real impl: log into ISP ABC online services, locate beer/wine license
    // ctx.license.license_number, attach packet, remit annual fee, capture
    // confirmation receipt.
    return { ok: false, reason: "not_implemented", detail: "ID ISP ABC adapter scaffolded" };
  },
};
