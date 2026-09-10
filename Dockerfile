FROM node:22-alpine

WORKDIR /app
COPY engine ./engine
COPY service ./service
COPY ui ./ui

ENV NODE_ENV=production \
    PROOF_HOST=0.0.0.0 \
    PROOF_PORT=8791 \
    PROOF_DATA_DIR=/data \
    PROOF_API_URL=http://127.0.0.1:8791

RUN mkdir -p /data && chown -R node:node /app /data
USER node
EXPOSE 8791
VOLUME ["/data"]
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://127.0.0.1:8791/health >/dev/null || exit 1
CMD ["node", "service/server.mjs"]
