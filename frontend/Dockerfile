# Next.js — production (พอร์ตภายใน 3000)
# build-arg NEXT_PUBLIC_API_BASE_URL ต้องเป็น URL ที่เบราว์เซอร์เรียก API ได้
# GlitchTip (optional): NEXT_PUBLIC_SENTRY_DSN / SENTRY_DSN / NEXT_PUBLIC_APP_ENV / SENTRY_URL
#
# Targets:
#   runner     — default (stage สุดท้าย); build ภายใน Docker (docker compose / local)
#   ci-runner  — copy artifacts จาก CI (build:frontend) โดยไม่ rebuild

FROM node:20-bookworm-slim AS builder
WORKDIR /app
ARG NEXT_PUBLIC_API_BASE_URL=http://localhost:4100/api
ARG NEXT_PUBLIC_SENTRY_DSN
ARG SENTRY_DSN
ARG NEXT_PUBLIC_APP_ENV
ARG NEXT_PUBLIC_APP_RELEASE
ARG SENTRY_URL
ENV NEXT_PUBLIC_API_BASE_URL=${NEXT_PUBLIC_API_BASE_URL}
ENV NEXT_PUBLIC_SENTRY_DSN=${NEXT_PUBLIC_SENTRY_DSN}
ENV SENTRY_DSN=${SENTRY_DSN}
ENV NEXT_PUBLIC_APP_ENV=${NEXT_PUBLIC_APP_ENV}
ENV NEXT_PUBLIC_APP_RELEASE=${NEXT_PUBLIC_APP_RELEASE}
ENV SENTRY_URL=${SENTRY_URL}
ENV NEXT_TELEMETRY_DISABLED=1
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# CI: ใช้เมื่อ build:frontend ส่ง .next/standalone มาแล้ว
FROM node:20-bookworm-slim AS ci-runner
WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends dumb-init \
  && rm -rf /var/lib/apt/lists/*
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV HOSTNAME=0.0.0.0
ENV PORT=3000
USER node
COPY --chown=node:node .next/standalone ./
COPY --chown=node:node .next/static ./.next/static
COPY --chown=node:node public ./public
EXPOSE 3000
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "server.js"]

FROM node:20-bookworm-slim AS runner
WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends dumb-init \
  && rm -rf /var/lib/apt/lists/*
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV HOSTNAME=0.0.0.0
ENV PORT=3000
USER node
COPY --from=builder --chown=node:node /app/.next/standalone ./
COPY --from=builder --chown=node:node /app/.next/static ./.next/static
COPY --from=builder --chown=node:node /app/public ./public
EXPOSE 3000
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "server.js"]
