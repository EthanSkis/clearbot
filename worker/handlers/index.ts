import type { Handler, JobType } from "../types";
import { generatePacketHandler } from "./generate_packet";

export const handlers: Record<JobType, Handler> = {
  generate_packet: generatePacketHandler,
  form_hash_check: async () => ({ skipped: "not implemented yet (Phase 4)" }),
};
