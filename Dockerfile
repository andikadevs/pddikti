FROM oven/bun:1.3-alpine AS base
WORKDIR /app

# Install dependencies (cached layer)
FROM base AS deps
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile --production

# Runtime image
FROM base AS runtime
ENV NODE_ENV=production
COPY --from=deps /app/node_modules ./node_modules
COPY package.json bun.lock tsconfig.json ./
COPY src ./src

EXPOSE 3000
CMD ["bun", "run", "src/index.ts"]
