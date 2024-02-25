FROM node:16-alpine As base
RUN npm i -g pnpm
WORKDIR /usr/src/app

COPY ["package.json", "pnpm-lock.yaml", "./"]
RUN pnpm install --frozen-lockfile

FROM base as build
ENV NODE_ENV production

COPY . .
RUN pnpm generate
RUN pnpm build

FROM build as prod-deps
# Prune unused dependencies
RUN pnpm prune --prod

FROM base AS production

USER node

WORKDIR /usr/src/app

ENV NODE_ENV production

COPY --chown=node:node --from=prod-deps /usr/src/app/node_modules ./node_modules
COPY --chown=node:node --from=build /usr/src/app/dist ./dist

CMD node dist/index