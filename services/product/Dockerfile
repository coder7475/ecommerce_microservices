FROM node:20-alpine AS base
RUN apk add --no-cache libc6-compat openssl
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable
WORKDIR /app

# Development stage with hot-reloading
FROM base AS development
ENV NODE_ENV=development
COPY package.json pnpm-lock.yaml ./
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile
COPY . .
RUN if [ -d "prisma" ]; then pnpm prisma:generate; fi
EXPOSE 3001
CMD ["pnpm", "dev"]

# Build stage
FROM base AS build
COPY package.json pnpm-lock.yaml ./
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile
COPY . .
RUN if [ -d "prisma" ]; then pnpm prisma:generate; fi
RUN pnpm run build

# Production dependencies stage
FROM base AS prod-deps
COPY package.json pnpm-lock.yaml ./
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --prod --frozen-lockfile
COPY prisma ./prisma
RUN if [ -d "prisma" ]; then npx prisma generate; fi

# Hardened production stage
FROM node:20-alpine AS production
RUN apk add --no-cache dumb-init libc6-compat openssl
WORKDIR /app
ENV NODE_ENV=production

RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001 -G nodejs

COPY --chown=nodejs:nodejs --from=prod-deps /app/node_modules ./node_modules
COPY --chown=nodejs:nodejs --from=build /app/dist ./dist
COPY --chown=nodejs:nodejs package.json ./

USER nodejs
EXPOSE 3001
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "dist/src/index.js"]
