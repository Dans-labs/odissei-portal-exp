# Stage 1: Build
FROM node:22-alpine AS builder
RUN apk add --no-cache git
RUN corepack enable && corepack prepare pnpm@latest --activate
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
ENV CI=true
RUN pnpm install --frozen-lockfile --ignore-scripts
COPY . .
RUN pnpm run build

# Stage 2: Run
FROM node:22-alpine
WORKDIR /app
COPY --from=builder /app/.output ./.output

ENV HOST=0.0.0.0
ENV PORT=3000
ENV NODE_ENV=production

EXPOSE 3000
CMD ["node", ".output/server/index.mjs"]