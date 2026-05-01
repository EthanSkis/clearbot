import type { Adapter } from "./types";

export const idMccallAdapter: Adapter = {
  agencyCode: "McCall Clerk",
  description: "City of McCall — City Clerk — portal RPA pending",
  requiresCredentials: true,

  async submit(ctx) {
    if (!ctx.credentials?.username || !ctx.credentials?.password) {
      return { ok: false, reason: "credentials_invalid", detail: "no portal credentials on file" };
    }
    if (!ctx.packet) {
      return { ok: false, reason: "transient", detail: "no packet attached to filing" };
    }
    // Real impl: McCall accepts paper renewals today; first pass will likely
    // be a mailroom/print-and-mail flow rather than RPA. Hook this up once
    // the city stands up its online portal or once the print pipeline lands.
    return { ok: false, reason: "not_implemented", detail: "City of McCall adapter scaffolded" };
  },
};
