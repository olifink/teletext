# syntax=docker/dockerfile:1

# ------------------------------------------------------------------------------
# Stage 1: Builder (Compile Core & Angular PWA Web Viewer)
# ------------------------------------------------------------------------------
FROM node:22-alpine AS builder

WORKDIR /app

# Install Bun for fast workspace bundling
RUN npm install -g bun

# Copy package manifests & lockfile for layer caching
COPY package.json bun.lock ./
COPY packages/core/package.json ./packages/core/
COPY packages/viewer/package.json ./packages/viewer/

# Install dependencies
RUN bun install --frozen-lockfile

# Copy monorepo source files
COPY packages ./packages
COPY README.md ./

# Compile both packages (@teletext/core and @teletext/viewer PWA)
ENV NODE_ENV=production
ENV NG_DISABLE_VERSION_CHECK=1
RUN bun run build

# ------------------------------------------------------------------------------
# Stage 2: Lightweight Production Runtime
# ------------------------------------------------------------------------------
FROM oven/bun:1-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
ENV STATIC_DIR=/app/dist/viewer/browser

# Copy manifests & source files
COPY --from=builder /app/package.json /app/bun.lock ./
COPY --from=builder /app/packages/core/package.json ./packages/core/
COPY --from=builder /app/packages/viewer/package.json ./packages/viewer/
COPY --from=builder /app/packages/core/dist ./packages/core/dist
COPY --from=builder /app/packages/core/src ./packages/core/src

# Copy compiled Angular PWA static web assets
COPY --from=builder /app/packages/viewer/dist/viewer/browser ./dist/viewer/browser

# Copy node_modules from builder
COPY --from=builder /app/node_modules ./node_modules

# Expose service port
EXPOSE 3000

# Container Healthcheck
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/api/health || exit 1

# Start unified Bun server (Serves /api/* endpoints and PWA Web Viewer)
CMD ["bun", "run", "packages/core/src/server/server.ts"]
