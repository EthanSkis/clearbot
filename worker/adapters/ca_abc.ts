import type { Adapter } from "./types";

export const caAbcAdapter: Adapter = {
  agencyCode: "CA ABC",
  description: "California Dept. of Alcoholic Beverage Control — portal RPA pending",
  requiresCredentials: true,

  async submit(ctx) {
    if (!ctx.credentials?.username || !ctx.credentials?.password) {
      return { ok: false, reason: "credentials_invalid", detail: "no portal credentials on file" };
    }
    if (!ctx.packet) {
      return { ok: false, reason: "transient", detail: "no packet attached to filing" };
    }
    // Real impl: log into ABC eServices, navigate to renewal for license
    // ctx.license.license_number, upload packet, pay fee, capture conf no.
    return { ok: false, reason: "not_implemented", detail: "CA ABC adapter scaffolded" };
  },
};
