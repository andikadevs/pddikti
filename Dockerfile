FROM oven/bun:1.3-alpine AS base
WORKDIR /app

# Install dependencies (cached layer)
FROM base AS deps
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile --production

# Runtime image
FROM base AS runtime
LABEL org.opencontainers.image.title="pddikti-api" \
      org.opencontainers.image.description="Read-only proxy API and MCP server for Indonesian higher-education data (PDDikti)" \
      org.opencontainers.image.source="https://github.com/andikadevs/pddikti" \
      org.opencontainers.image.authors="Andika Dwi Saputra <hello@andikadevs.space>" \
      org.opencontainers.image.licenses="AGPL-3.0-or-later"
ENV NODE_ENV=production
COPY --from=deps /app/node_modules ./node_modules
COPY package.json bun.lock tsconfig.json ./
COPY src ./src

EXPOSE 3000
# The overview endpoint stays public even when API_KEY gates /api/*.
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO /dev/null "http://127.0.0.1:${PORT:-3000}/api/" || exit 1
CMD ["bun", "run", "src/index.ts"]
