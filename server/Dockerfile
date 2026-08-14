# ─────────────────────────────────────────────────────────────────────────────
# Build Stage
# ─────────────────────────────────────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files and prisma schema first for dependency installation caching
COPY package*.json ./
COPY prisma ./prisma/

# Install dependencies including devDependencies (needed to compile TS)
RUN npm ci

# Copy server source code
COPY . .

# Generate Prisma Client & Build the TypeScript code
RUN npx prisma generate
RUN npm run build

# ─────────────────────────────────────────────────────────────────────────────
# Production Stage
# ─────────────────────────────────────────────────────────────────────────────
FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install only production dependencies
RUN npm ci --only=production

# Copy built application and generated prisma client from builder
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma/client ./node_modules/@prisma/client
COPY --from=builder /app/prisma ./prisma

# Environment defaults
ENV PORT=4000
ENV NODE_ENV=production
ENV DATABASE_URL="file:/app/prisma/dev.db"

EXPOSE 4000

# Run migrations and start the server
CMD ["sh", "-c", "npx prisma migrate deploy && npm run start"]
