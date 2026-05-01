import type { Adapter } from "./types";

export const idBoiseAdapter: Adapter = {
  agencyCode: "Boise Clerk",
  description: "City of Boise — City Clerk — portal RPA pending",
  requiresCredentials: true,

  async submit(ctx) {
    if (!ctx.credentials?.username || !ctx.credentials?.password) {
      return { ok: false, reason: "credentials_invalid", detail: "no portal credentials on file" };
    }
    if (!ctx.packet) {
      return { ok: false, reason: "transient", detail: "no packet attached to filing" };
    }
    // Real impl: log into the Boise Clerk online licensing portal, locate
    // the city business or liquor license referenced by
    // ctx.license.license_number, attach packet, remit fee, capture conf.
    return { ok: false, reason: "not_implemented", detail: "City of Boise adapter scaffolded" };
  },
};
