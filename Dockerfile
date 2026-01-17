# Multi-stage build for Resume Maker
# Stage 1: Build frontend
FROM node:20-alpine AS frontend-builder

WORKDIR /app/client

# Copy frontend package files
COPY client/package.json ./

# Install dependencies (use npm ci if package-lock.json exists, otherwise npm install)
RUN if [ -f package-lock.json ]; then npm ci; else npm install; fi

# Copy frontend source
COPY client/ ./

# Build frontend
RUN npm run build

# Stage 2: Backend with LaTeX
FROM texlive/texlive:latest AS backend

# Install Bun and curl for healthcheck
RUN apt-get update && apt-get install -y \
    curl \
    unzip \
    ca-certificates \
    && curl -fsSL https://bun.sh/install | bash \
    && mv /root/.bun/bin/bun /usr/local/bin/bun \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy backend package files
COPY package.json ./

# Copy Prisma schema first
COPY prisma ./prisma/

# Install backend dependencies (try bun first, fallback to npm)
RUN if command -v bun > /dev/null; then \
      bun install --production; \
    else \
      npm install --production; \
    fi

# Generate Prisma Client
RUN if command -v bun > /dev/null; then \
      bun prisma generate; \
    else \
      npx prisma generate; \
    fi

# Copy backend source
COPY src/ ./src/
COPY templates/ ./templates/

# Copy built frontend from stage 1
COPY --from=frontend-builder /app/client/dist ./client/dist

# Create temp directory for LaTeX compilation and shared frontend mount
RUN mkdir -p /app/temp /shared-frontend

# Expose port
EXPOSE 3000

# Start server (run migrations first)
CMD ["sh", "-c", "bun prisma migrate deploy && bun run src/server.ts"]

