# Stage 1: Install dependencies
FROM node:24-slim AS deps
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

# Stage 2: Build the application
FROM node:24-slim AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Create DB tables so static pages can prerender against an empty DB
RUN node migrate.cjs

# Build Next.js (standalone output)
RUN npm run build

# Stage 3: Production runtime
FROM node:24-slim AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=8080

# better-sqlite3 needs these at runtime
RUN apt-get update && apt-get install -y --no-install-recommends \
    libstdc++6 \
    && rm -rf /var/lib/apt/lists/*

# Copy standalone build output
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

# Copy migration files and script
COPY --from=builder /app/drizzle ./drizzle
COPY --from=builder /app/migrate.cjs ./migrate.cjs

# Copy native better-sqlite3 binding (needed at runtime)
COPY --from=builder /app/node_modules/better-sqlite3 ./node_modules/better-sqlite3
COPY --from=builder /app/node_modules/bindings ./node_modules/bindings
COPY --from=builder /app/node_modules/file-uri-to-path ./node_modules/file-uri-to-path
COPY --from=builder /app/node_modules/prebuild-install ./node_modules/prebuild-install

# Copy the startup script
COPY start.sh ./start.sh
RUN chmod +x start.sh

EXPOSE 8080

CMD ["./start.sh"]
