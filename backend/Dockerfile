# NestJS API — production (พอร์ตภายใน 4100)
#
# Targets:
#   runner     — default (stage สุดท้าย); build ภายใน Docker (docker compose / local)
#   ci-runner  — copy artifacts จาก CI (build:backend) โดยไม่ rebuild

FROM node:20-bookworm-slim AS builder
WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*
COPY package*.json ./
ENV PUPPETEER_SKIP_DOWNLOAD=true
RUN npm ci
COPY . .
RUN npx prisma generate && npm run build && npm prune --omit=dev

# CI: ใช้เมื่อ build:backend ส่ง dist + node_modules (prod) มาแล้ว
FROM node:20-bookworm-slim AS ci-runner
WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends \
  openssl ca-certificates dumb-init \
  chromium fonts-noto-color-emoji fonts-thai-tlwg \
  && rm -rf /var/lib/apt/lists/*
ENV NODE_ENV=production
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium
USER node
COPY --chown=node:node node_modules ./node_modules
COPY --chown=node:node dist ./dist
COPY --chown=node:node package.json ./
COPY --chown=node:node prisma ./prisma
EXPOSE 4100
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "dist/src/main.js"]

FROM node:20-bookworm-slim AS runner
WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends \
  openssl ca-certificates dumb-init \
  chromium fonts-noto-color-emoji fonts-thai-tlwg \
  && rm -rf /var/lib/apt/lists/*
ENV NODE_ENV=production
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium
USER node
COPY --from=builder --chown=node:node /app/node_modules ./node_modules
COPY --from=builder --chown=node:node /app/dist ./dist
COPY --from=builder --chown=node:node /app/package.json ./
COPY --from=builder --chown=node:node /app/prisma ./prisma
EXPOSE 4100
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "dist/src/main.js"]
