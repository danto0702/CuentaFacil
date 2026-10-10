# CuentaFacil panel: Next.js + LibreOffice (template previews as PDF).
# Build from the repository root:  docker build -f apps/panel/Dockerfile -t cuentafacil-panel .
FROM node:22-bookworm-slim

ENV DEBIAN_FRONTEND=noninteractive \
    TZ=America/Bogota \
    SOFFICE_PATH=/usr/bin/soffice \
    NEXT_TELEMETRY_DISABLED=1

RUN apt-get update \
 && apt-get install -y --no-install-recommends \
      libreoffice-writer-nogui fonts-liberation fonts-crosextra-carlito fonts-crosextra-caladea \
      poppler-utils ca-certificates tzdata \
 && rm -rf /var/lib/apt/lists/*

RUN corepack enable
WORKDIR /app
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages ./packages
COPY apps/panel ./apps/panel
RUN pnpm install --frozen-lockfile --filter @cuentasbot/panel...

# Public Supabase values are inlined at build time (Railway passes service variables as build args).
ARG NEXT_PUBLIC_SUPABASE_URL
ARG NEXT_PUBLIC_SUPABASE_ANON_KEY
ENV NEXT_PUBLIC_SUPABASE_URL=$NEXT_PUBLIC_SUPABASE_URL \
    NEXT_PUBLIC_SUPABASE_ANON_KEY=$NEXT_PUBLIC_SUPABASE_ANON_KEY
RUN pnpm --filter @cuentasbot/panel build

ENV NODE_ENV=production
USER node
EXPOSE 3000
CMD ["pnpm", "--filter", "@cuentasbot/panel", "start"]
