# ─────────────────────────────────────────────────────────────────────────────
# Build Stage
# ─────────────────────────────────────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files first for dependency installation caching
COPY package*.json ./

# Install frontend dependencies
RUN npm ci

# Copy source code and config files
COPY . .

# Build the frontend production assets
RUN npm run build

# ─────────────────────────────────────────────────────────────────────────────
# Production Stage
# ─────────────────────────────────────────────────────────────────────────────
FROM nginx:alpine

# Copy built static files to Nginx directory
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy custom Nginx configuration for routing
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
