# Build from the repo root: docker build -f services/node-api/Dockerfile .
FROM node:22-alpine AS build
RUN corepack enable
WORKDIR /repo
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json tsconfig.base.json ./
COPY packages/types packages/types
COPY services/node-api services/node-api
RUN pnpm install --frozen-lockfile --filter @tc/node-api...
RUN pnpm --filter @tc/types build && pnpm --filter @tc/node-api build
RUN pnpm deploy --filter @tc/node-api --prod /out

FROM node:22-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /out .
EXPOSE 8080
USER node
CMD ["node", "dist/server.js"]
