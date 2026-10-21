FROM node:20-alpine

WORKDIR /app
COPY host/genesis-host.cjs ./host/genesis-host.cjs
COPY src/genesis/runtime-config-injection.js ./src/genesis/runtime-config-injection.js

ENV PORT=8080
ENV GENESIS_PROFILE=docker
EXPOSE 8080

CMD ["node", "host/genesis-host.cjs"]
