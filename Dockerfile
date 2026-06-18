# ── Stage 1: Install dependencies ──────────────────────────────────────────
FROM node:20-alpine AS deps
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

# ── Stage 2: Build the Next.js app ─────────────────────────────────────────
FROM node:20-alpine AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Generate Prisma client for the correct platform
RUN npx prisma generate

ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# ── Stage 3: Migration runner (has full node_modules for prisma CLI) ────────
FROM node:20-alpine AS migrator
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY prisma ./prisma

CMD ["node", "node_modules/.bin/prisma", "migrate", "deploy"]

# ── Stage 4: Production runtime ────────────────────────────────────────────
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Non-root user for security
RUN addgroup --system --gid 1001 nodejs && \
    adduser  --system --uid 1001 nextjs

# Standalone output: self-contained server bundle
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static    ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public          ./public

# Prisma generated client (needed by the app at runtime — no CLI required)
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/.prisma  ./node_modules/.prisma
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/@prisma  ./node_modules/@prisma

# Uploads directory (overridden by Docker volume)
RUN mkdir -p /app/uploads && chown nextjs:nodejs /app/uploads

USER nextjs

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

CMD ["node", "server.js"]
