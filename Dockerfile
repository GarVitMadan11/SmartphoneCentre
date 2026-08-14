# ─────────────────────────────────────────────────────────────────────────────
# SmartphoneCentre — Docker image
# Runs a single Node.js / Express process that serves BOTH:
#   • /api/*  — REST API (Prisma + PostgreSQL)
#   • /*      — React SPA (Vite build, served as static files)
#
# NOTE: On Render, render.yaml forces the Node.js runtime (not this Dockerfile).
#       This Dockerfile is used for local docker-compose development only.
# ─────────────────────────────────────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

# ── 1. Install root (frontend) dependencies ───────────────────────────────────
COPY package*.json ./
RUN npm ci

# ── 2. Install server dependencies ───────────────────────────────────────────
COPY server/package*.json ./server/
RUN cd server && npm install --include=dev

# ── 3. Copy full source ───────────────────────────────────────────────────────
COPY . .

# ── 4. Build server + frontend ────────────────────────────────────────────────
#    RENDER=1 makes the build script use the PostgreSQL schema provider.
#    DATABASE_URL can be overridden at runtime; the build only needs it for
#    `prisma generate` (schema compilation) and `prisma db push` (migrations).
ARG DATABASE_URL
ENV DATABASE_URL=${DATABASE_URL}
ENV RENDER=1
RUN npm run build

# ─────────────────────────────────────────────────────────────────────────────
# Production stage — lean Node.js image, no dev deps, no build tools
# ─────────────────────────────────────────────────────────────────────────────
FROM node:20-alpine AS production

WORKDIR /app

# Copy server production dependencies
COPY server/package*.json ./server/
RUN cd server && npm ci --omit=dev

# Copy compiled Express server
COPY --from=builder /app/server/dist ./server/dist/

# Copy Prisma client (generated during build)
COPY --from=builder /app/server/node_modules/.prisma ./server/node_modules/.prisma/
COPY --from=builder /app/server/node_modules/@prisma ./server/node_modules/@prisma/
COPY --from=builder /app/server/prisma ./server/prisma/

# Copy built React frontend (Express serves these as static files)
COPY --from=builder /app/dist ./dist/

# Express listens on PORT (default 4000); override via environment variable
EXPOSE 4000
ENV NODE_ENV=production
ENV PORT=4000

# Start Express — it serves /api/* routes AND static frontend files
WORKDIR /app/server
CMD ["node", "dist/index.js"]
