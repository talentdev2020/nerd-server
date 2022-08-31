# base image contains the dependencies and application code
FROM node:16 AS base

WORKDIR /opt/app
## install dependencies
##
COPY package*.json .npmrc ./
RUN npm ci --ignore-scripts

## Copy and build our source code
##
COPY . .
RUN npm run build

# prod image inherits from base and adds application code
FROM base as prod
WORKDIR /opt/app
RUN mkdir -p /opt/app/node_modules && chown -R node:node /opt/app
COPY --from=base --chown=node:node /opt/app/lib ./lib
COPY --chown=node:node package*.json .npmrc ./
USER node
ENV NODE_ENV=production
RUN npm ci --only=production --ignore-scripts && npm cache clean --force
EXPOSE 3000
# CMD ["node", "./lib/index.js"]
CMD ["npm", "run", "test"]
