# ClearBot worker — long-running tsx process that drains the Postgres
# job queue. Build context MUST be the repo root because the worker
# imports lib/packet-generator and lib/crypto from outside its own
# package directory.
#
# Build:    docker build -f worker/Dockerfile -t clearbot-worker .
# Run:      docker run --env-file worker/.env clearbot-worker

FROM node:20-alpine AS base
RUN apk add --no-cache dumb-init tini
WORKDIR /app

# ── Install deps first (cache-friendly) ─────────────────────────
COPY worker/package.json worker/package-lock.json ./worker/
RUN cd worker && npm ci --omit=dev --no-audit --no-fund \
  && npm cache clean --force

# ── Copy the runtime source ─────────────────────────────────────
COPY worker ./worker
# Worker handlers reach into ../../lib for a few Next-free modules.
# Copy just those — everything else in lib/ pulls in Next, which we
# don't want on the worker image.
COPY lib/packet-generator.ts ./lib/packet-generator.ts
COPY lib/poa-generator.ts ./lib/poa-generator.ts
COPY lib/crypto.ts ./lib/crypto.ts

# Worker reads .env at startup (via dotenv). For real deploys, pass
# env via the platform (Render env vars, Fly secrets, k8s ConfigMap).
ENV NODE_ENV=production
ENV WORKER_POLL_MS=2000
ENV WORKER_STALE_LEASE_SECONDS=600

WORKDIR /app/worker
USER node

ENTRYPOINT ["/sbin/tini", "--"]
CMD ["node_modules/.bin/tsx", "run.ts"]
