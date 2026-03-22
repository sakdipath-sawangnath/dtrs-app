# CCTV Maintenance — ภาพ production: NestJS (4000) + Next.js (3000) ในคอนเทนเนอร์เดียว
# build-arg NEXT_PUBLIC_API_BASE_URL ต้องชี้ URL ที่เบราว์เซอร์ผู้ใช้เรียก API ได้ (เช่น http://host:8310/api)

FROM node:20-bookworm-slim AS backend-build
WORKDIR /app/backend
RUN apt-get update && apt-get install -y --no-install-recommends openssl ca-certificates && rm -rf /var/lib/apt/lists/*
COPY backend/package*.json ./
RUN npm ci
COPY backend/ ./
RUN npx prisma generate && npm run build && npm prune --omit=dev

FROM node:20-bookworm-slim AS frontend-build
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm ci
ARG NEXT_PUBLIC_API_BASE_URL=http://localhost:4000/api
ENV NEXT_PUBLIC_API_BASE_URL=${NEXT_PUBLIC_API_BASE_URL}
ENV NEXT_TELEMETRY_DISABLED=1
COPY frontend/ ./
RUN npm run build && npm prune --omit=dev

FROM node:20-bookworm-slim AS runner
WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends openssl ca-certificates dumb-init && rm -rf /var/lib/apt/lists/*
COPY --from=backend-build /app/backend /app/backend
COPY --from=frontend-build /app/frontend /app/frontend
COPY docker/entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh
ENV NODE_ENV=production
EXPOSE 3000 4000
ENTRYPOINT ["dumb-init", "--", "/entrypoint.sh"]
