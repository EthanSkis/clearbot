import type { Handler, JobType } from "../types";
import { generatePacketHandler } from "./generate_packet";
import { formHashCheckHandler } from "./form_hash_check";
import { submitFilingHandler } from "./submit_filing";
import { deliverWebhookHandler } from "./deliver_webhook";

export const handlers: Record<JobType, Handler> = {
  generate_packet: generatePacketHandler,
  form_hash_check: formHashCheckHandler,
  submit_filing: submitFilingHandler,
  deliver_webhook: deliverWebhookHandler,
};
