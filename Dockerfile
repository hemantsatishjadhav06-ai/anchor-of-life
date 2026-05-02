# Two-stage build: deps + build, then minimal runner.
FROM node:20-bookworm-slim AS deps
WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 build-essential ca-certificates curl \
    && rm -rf /var/lib/apt/lists/*
COPY package.json package-lock.json* ./
RUN npm ci --omit=optional

FROM node:20-bookworm-slim AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM node:20-bookworm-slim AS runner
WORKDIR /app
ENV NODE_ENV=production PORT=3000
RUN apt-get update && apt-get install -y --no-install-recommends ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Copy built app
COPY --from=deps /app/node_modules ./node_modules
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/scripts ./scripts
COPY --from=builder /app/src ./src
COPY package.json next.config.js next-env.d.ts tsconfig.json ./

# Persistent data volume mounted at /data on Fly.
ENV DB_PATH=/data/anchor.db
RUN mkdir -p /data

EXPOSE 3000

# Bootstrap downloads anchor.db (R2 → GitHub Release fallback) on first boot,
# then starts Next.
CMD ["sh", "-c", "npx tsx scripts/bootstrap.ts && npm start"]
