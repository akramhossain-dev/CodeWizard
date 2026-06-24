# ─── Stage 1: Dependencies ────────────────────────────────────────────────
FROM node:20-alpine AS deps

WORKDIR /app

# Install only production deps first (layer caching)
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

# ─── Stage 2: Runtime ─────────────────────────────────────────────────────
FROM node:20-alpine AS runner

# Security: run as non-root user
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

# Install docker CLI to communicate with host docker socket
RUN apk add --no-cache docker-cli

WORKDIR /app

# Copy production node_modules from deps stage
COPY --from=deps /app/node_modules ./node_modules

# Copy application source
COPY . .

# Create uploads directory with correct permissions
RUN mkdir -p uploads && chown appuser:appgroup uploads

# Create judge execution workdir (replaces /tmp for sandboxed code execution)
RUN mkdir -p /var/codewizard/exec && chown appuser:appgroup /var/codewizard/exec

# Ensure judge workdir env is set
ENV JUDGE_WORKDIR=/var/codewizard/exec

# Switch to non-root user
USER appuser

# Expose application port
EXPOSE 8000

# Health check — verifies the API is responding
HEALTHCHECK --interval=30s --timeout=10s --start-period=15s --retries=3 \
    CMD wget -qO- http://127.0.0.1:8000/ || exit 1

# Start the server in production mode
ENV NODE_ENV=production
CMD ["node", "server.js"]
