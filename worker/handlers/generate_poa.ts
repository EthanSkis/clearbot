import type { Handler } from "../types";
import { generatePoa } from "../../lib/poa-generator";

export const generatePoaHandler: Handler = async (job, admin) => {
  const workspaceId = job.payload?.workspace_id as string | undefined;
  const agencyId = job.payload?.agency_id as string | undefined;
  const signerName = job.payload?.signer_name as string | undefined;
  const signerEmail = job.payload?.signer_email as string | undefined;
  const signerTitle = (job.payload?.signer_title as string | null) ?? null;
  const durationDays = (job.payload?.duration_days as number | undefined) ?? 365;

  if (!workspaceId || !agencyId || !signerName || !signerEmail) {
    throw new Error("payload requires workspace_id, agency_id, signer_name, signer_email");
  }

  const result = await generatePoa(
    {
      workspaceId,
      agencyId,
      signerName,
      signerEmail,
      signerTitle,
      durationDays,
    },
    admin
  );
  if (!result.ok) throw new Error(result.error);

  return {
    document_id: result.documentId,
    storage_path: result.storagePath,
    bytes: result.bytes,
  };
};
