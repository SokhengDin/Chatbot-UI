FROM node:20-slim

WORKDIR /workspace

COPY package*.json ./

RUN mkdir -p /workspace/logs && chown -R node:node /workspace/logs

USER node

ENV NITRO_PORT=8085
# Run the Nuxt.js server
CMD ["node", ".output/server/index.mjs"]