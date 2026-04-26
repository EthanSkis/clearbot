# ClearBot worker

Long-running tsx process. Polls the `jobs` table every 2s, runs handlers, writes results back. Phase 0 plumbing for everything in Phases 1–4 — without this running, packets never generate, agency portals never get hashed, and webhooks never fire.

## Run locally

```bash
cd worker
npm install
cp .env.example .env   # then fill in Supabase URL + service-role key + master key
npm run dev            # tsx watch run.ts
```

## Deploy

The worker depends on `lib/crypto.ts` and `lib/packet-generator.ts` from the repo root, so the Docker build context must be the repo root.

### Render (recommended for first deploy)

The repo ships a top-level `render.yaml` Blueprint. From the Render dashboard:

1. New → Blueprint → connect this GitHub repo
2. Set `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `CREDENTIAL_MASTER_KEY`
3. Apply

Logs are visible from the Render dashboard. The starter plan ($7/mo) is enough — the worker is mostly idle between job polls.

### Fly.io

```bash
fly secrets set \
  NEXT_PUBLIC_SUPABASE_URL=https://<project>.supabase.co \
  SUPABASE_SERVICE_ROLE_KEY=<service-role-jwt> \
  CREDENTIAL_MASTER_KEY=<32-byte-hex-or-base64>
fly deploy
```

`fly.toml` already configures the build to use `worker/Dockerfile`.

### Anywhere else (raw Docker)

```bash
docker build -f worker/Dockerfile -t clearbot-worker .
docker run --env-file worker/.env clearbot-worker
```

## What it runs

Handlers are registered in `worker/handlers/index.ts`. Today:

- `generate_packet` — fills the form template (or synthesizes a packet) and uploads to Supabase Storage. Advances filing intake → prep.
- `submit_filing` — looks up the per-agency adapter, decrypts portal credentials, calls `submit()`. Currently TX TABC + CA ABC return `not_implemented` — Phase 3 work.
- `form_hash_check` — fetches an agency portal URL, sha256s the body, diffs against the latest `form_snapshots` row. Bumps in-flight filings to `review` on a portal change.
- `deliver_webhook` — fans out a single `webhook_deliveries` row. Retries with exponential backoff up to `max_attempts`.

## Adding a handler

```ts
// worker/handlers/my_handler.ts
import type { Handler } from "../types";
export const myHandler: Handler = async (job, admin) => {
  // ...
  return { foo: "bar" };
};
```

Then register it in `worker/handlers/index.ts` and extend the `JobType` union in both `worker/types.ts` and `lib/jobs.ts`. Cron / dashboard code calls `enqueueJob({ type: "my_handler" })` to trigger it.
