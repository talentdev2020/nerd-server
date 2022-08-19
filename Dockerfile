FROM node:16 AS builder
LABEL maintainer="Phillip Thurston <phil@goinvictus.com>"

WORKDIR /opt/app

## install dependencies
##
COPY package*.json .npmrc ./
RUN npm ci --ignore-scripts

## Copy and build our source code
##
COPY . .
RUN npm run build


## Build out production
##
FROM node:16-stretch-slim AS prod
WORKDIR /opt/app
RUN mkdir -p /opt/app/node_modules && chown -R node:node /opt/app
COPY --from=builder --chown=node:node /opt/app/lib ./lib
COPY --chown=node:node package*.json .npmrc ./
USER node
ENV NODE_ENV=production
RUN npm ci --only=production --ignore-scripts && npm cache clean --force
EXPOSE 4444
CMD ["node", "./lib/index.js"]


## Build out development
##
FROM node:16-stretch-slim AS dev
WORKDIR /opt/app
RUN mkdir -p /opt/app/node_modules && chown -R node:node /opt/app
COPY --from=builder --chown=node:node /opt/app/lib ./lib
COPY --chown=node:node package*.json .npmrc ./

# The next line is extremely dangerous and should never be put into
# production for any reason whatsoever.
COPY --chown=node:node .env serviceAccountKey.json ./

USER node
ENV NODE_ENV=development
RUN npm ci --ignore-scripts && npm cache clean --force
EXPOSE 4444
CMD ["node", "./lib/index.js"]
