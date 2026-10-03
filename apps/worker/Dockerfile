# CuentasBot worker: Node 22 + LibreOffice headless for DOCX→PDF (ADR-004).
# Build from the repository root:  docker build -f apps/worker/Dockerfile -t cuentasbot-worker .
FROM node:22-bookworm-slim

ENV DEBIAN_FRONTEND=noninteractive \
    TZ=America/Bogota \
    SOFFICE_PATH=/usr/bin/soffice \
    NODE_ENV=production

RUN apt-get update \
 && apt-get install -y --no-install-recommends \
      libreoffice-writer-nogui fonts-liberation fonts-crosextra-carlito fonts-crosextra-caladea \
      ghostscript qpdf poppler-utils ca-certificates tzdata \
 && rm -rf /var/lib/apt/lists/*

RUN corepack enable
WORKDIR /app
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages ./packages
COPY apps/worker ./apps/worker
RUN pnpm install --frozen-lockfile --filter @cuentasbot/worker... \
 && pnpm add -w tsx@^4.20.0

USER node
CMD ["pnpm", "--filter", "@cuentasbot/worker", "start"]
