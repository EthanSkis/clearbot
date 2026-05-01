import type { Adapter } from "./types";

export const idCdhAdapter: Adapter = {
  agencyCode: "ID CDH",
  description: "Central District Health (Ada + Valley counties) — portal RPA pending",
  requiresCredentials: true,

  async submit(ctx) {
    if (!ctx.credentials?.username || !ctx.credentials?.password) {
      return { ok: false, reason: "credentials_invalid", detail: "no portal credentials on file" };
    }
    if (!ctx.packet) {
      return { ok: false, reason: "transient", detail: "no packet attached to filing" };
    }
    // Real impl: log into CDH eHealth portal, locate food establishment
    // permit ctx.license.license_number, upload renewal packet, remit fee,
    // capture confirmation. Covers Boise (Ada Co.) and McCall (Valley Co.).
    return { ok: false, reason: "not_implemented", detail: "ID CDH adapter scaffolded" };
  },
};
