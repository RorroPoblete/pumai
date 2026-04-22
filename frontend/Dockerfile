# ─── Stage 1: Dev dependencies for build ───
FROM node:22-alpine AS deps
WORKDIR /build
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci

# ─── Stage 2: Production-only dependencies ───
FROM node:22-alpine AS deps-prod
WORKDIR /build
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci --omit=dev

# ─── Stage 3: Build ───
FROM node:22-alpine AS builder
WORKDIR /build

COPY --from=deps /build/node_modules ./node_modules
COPY frontend/ ./
COPY backend/src/ ./src/backend/
COPY backend/prisma/ ./prisma/
COPY backend/prisma.config.ts ./prisma.config.ts

ENV NEXT_TELEMETRY_DISABLED=1

RUN npx prisma generate
RUN npm run build

# ─── Stage 4: Production runner ───
FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

COPY --from=builder /build/public ./public
COPY --from=builder /build/.next/standalone ./
COPY --from=builder /build/.next/static ./.next/static
COPY --from=builder /build/prisma ./prisma
COPY --from=builder /build/prisma.config.ts ./prisma.config.ts
COPY --from=builder /build/tsconfig.json ./tsconfig.json
COPY --from=builder /build/src/generated ./src/generated
COPY --from=builder /build/package.json ./package.json

# Use production-only dependencies (excludes eslint, tsx, @prisma/dev, etc.)
COPY --from=deps-prod /build/node_modules ./node_modules

COPY frontend/entrypoint.sh ./entrypoint.sh
RUN chmod +x ./entrypoint.sh

RUN chown -R nextjs:nodejs /app

USER nextjs

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

ENTRYPOINT ["./entrypoint.sh"]
