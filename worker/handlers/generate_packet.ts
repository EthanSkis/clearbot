import type { Handler } from "../types";
import { generatePacket } from "../../lib/packet-generator";

export const generatePacketHandler: Handler = async (job, admin) => {
  const filingId = job.payload?.filing_id as string | undefined;
  if (!filingId) throw new Error("payload.filing_id required");

  const result = await generatePacket(filingId, admin);
  if (!result.ok) throw new Error(result.error);
  return {
    document_id: result.documentId,
    storage_path: result.storagePath,
    bytes: result.bytes,
    used_template: result.usedTemplate,
  };
};
