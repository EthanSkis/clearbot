import { createHmac } from "crypto";
import type { Handler } from "../types";

const FETCH_TIMEOUT_MS = 15_000;
const RETRY_BASE_SECONDS = 30;

export const deliverWebhookHandler: Handler = async (job, admin) => {
  const deliveryId = job.payload?.delivery_id as string | undefined;
  if (!deliveryId) throw new Error("payload.delivery_id required");

  const { data: delivery, error: dErr } = await admin
    .from("webhook_deliveries")
    .select("id, workspace_id, webhook_id, event, payload, attempts, max_attempts")
    .eq("id", deliveryId)
    .single();
  if (dErr || !delivery) throw new Error(`delivery: ${dErr?.message ?? "not found"}`);

  const { data: hook, error: hErr } = await admin
    .from("webhooks")
    .select("id, url, signing_secret, active")
    .eq("id", delivery.webhook_id)
    .single();
  if (hErr || !hook) throw new Error(`webhook: ${hErr?.message ?? "not found"}`);
  if (!hook.active) {
    await admin
      .from("webhook_deliveries")
      .update({ status: "dropped", last_error: "webhook inactive" })
      .eq("id", delivery.id);
    return { skipped: "webhook_inactive" };
  }

  const body = JSON.stringify({
    id: delivery.id,
    event: delivery.event,
    delivered_at: new Date().toISOString(),
    payload: delivery.payload,
  });
  const signature = createHmac("sha256", hook.signing_secret as string).update(body).digest("hex");
  const timestamp = Math.floor(Date.now() / 1000).toString();

  let status = 0;
  let respBody = "";
  let networkErr: string | null = null;
  try {
    const ac = new AbortController();
    const timer = setTimeout(() => ac.abort(), FETCH_TIMEOUT_MS);
    const res = await fetch(hook.url as string, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "user-agent": "ClearBot-Webhooks/1.0",
        "x-clearbot-event": delivery.event as string,
        "x-clearbot-delivery": delivery.id as string,
        "x-clearbot-timestamp": timestamp,
        "x-clearbot-signature": `sha256=${signature}`,
      },
      body,
      signal: ac.signal,
    }).finally(() => clearTimeout(timer));
    status = res.status;
    respBody = (await res.text()).slice(0, 4000);
  } catch (e) {
    networkErr = e instanceof Error ? e.message : String(e);
  }

  const success = status >= 200 && status < 300;
  const attempts = (delivery.attempts as number) + 1;
  const maxAttempts = (delivery.max_attempts as number) ?? 6;

  if (success) {
    await admin
      .from("webhook_deliveries")
      .update({
        status: "delivered",
        attempts,
        last_response_status: status,
        last_response_body: respBody,
        last_error: null,
        delivered_at: new Date().toISOString(),
      })
      .eq("id", delivery.id);
    await admin
      .from("webhooks")
      .update({ last_fired_at: new Date().toISOString(), last_status: String(status) })
      .eq("id", hook.id);
    return { ok: true, status };
  }

  const exhausted = attempts >= maxAttempts;
  const nextRetrySec = RETRY_BASE_SECONDS * Math.pow(2, attempts);
  await admin
    .from("webhook_deliveries")
    .update({
      status: exhausted ? "failed" : "pending",
      attempts,
      last_response_status: status || null,
      last_response_body: respBody || null,
      last_error: networkErr ?? `http ${status}`,
      next_retry_at: exhausted
        ? new Date().toISOString()
        : new Date(Date.now() + nextRetrySec * 1000).toISOString(),
    })
    .eq("id", delivery.id);
  await admin
    .from("webhooks")
    .update({ last_status: String(status || "network_error") })
    .eq("id", hook.id);

  if (exhausted) {
    return { ok: false, exhausted: true, status, error: networkErr };
  }
  // Throw so the job harness retries with backoff.
  throw new Error(networkErr ?? `http ${status}`);
};
