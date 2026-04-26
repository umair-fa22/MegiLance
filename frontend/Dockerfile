# Frontend Dockerfile for MegiLance with Turso
# Build context: repo root (when using dockerfile_path: frontend/Dockerfile)
FROM node:22-alpine AS base

# Install dependencies only when needed
FROM base AS deps
WORKDIR /app

# Install dependencies - copy from frontend subdirectory
COPY frontend/package.json frontend/package-lock.json* ./
RUN npm install --legacy-peer-deps \
	&& npm install --no-save lightningcss-linux-x64-musl@1.32.0

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
# Copy frontend directory contents
COPY frontend/ .

# Build arguments for Next.js public env vars (NO credentials - pass via CI/CD)
ARG NEXT_PUBLIC_BACKEND_URL
ARG NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_SHOW_DEMO_LOGIN=false
ARG NEXT_PUBLIC_GA_MEASUREMENT_ID
ARG NEXT_PUBLIC_SENTRY_DSN

# Set as environment variables for the build
ENV NEXT_PUBLIC_BACKEND_URL=${NEXT_PUBLIC_BACKEND_URL}
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}
ENV NEXT_PUBLIC_SHOW_DEMO_LOGIN=${NEXT_PUBLIC_SHOW_DEMO_LOGIN}
ENV NEXT_PUBLIC_GA_MEASUREMENT_ID=${NEXT_PUBLIC_GA_MEASUREMENT_ID}
ENV NEXT_PUBLIC_SENTRY_DSN=${NEXT_PUBLIC_SENTRY_DSN}

# Disable telemetry and Turbopack
ENV NEXT_TELEMETRY_DISABLED 1
ENV TURBOPACK 0

# Build Next.js
RUN npm run build

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy built application - use frontend/ prefix since build context is repo root
COPY frontend/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

CMD ["node", "server.js"]
