#!/usr/bin/env sh
# ก่อน docker build --target ci-runner: อนุญาต artifacts เข้า build context
# (.dockerignore สำหรับ local runner ยัง ignore อยู่ — สคริปต์นี้แก้เฉพาะใน workspace CI)
set -eu

ROOT="${1:-.}"

echo "=== docker-ci-allow-artifacts (repo: ${ROOT}) ==="

# backend: ci-runner COPY node_modules + dist จาก artifacts
if [ -f "${ROOT}/backend/.dockerignore" ]; then
  grep -vE '^(node_modules|dist)$' "${ROOT}/backend/.dockerignore" > "${ROOT}/backend/.dockerignore.tmp"
  mv "${ROOT}/backend/.dockerignore.tmp" "${ROOT}/backend/.dockerignore"
  echo "OK backend/.dockerignore — allow node_modules, dist"
else
  echo "WARN missing ${ROOT}/backend/.dockerignore"
fi

# frontend: ci-runner COPY .next/standalone + .next/static จาก artifacts
if [ -f "${ROOT}/frontend/.dockerignore" ]; then
  grep -vE '^(\.next|node_modules)$' "${ROOT}/frontend/.dockerignore" > "${ROOT}/frontend/.dockerignore.tmp"
  mv "${ROOT}/frontend/.dockerignore.tmp" "${ROOT}/frontend/.dockerignore"
  echo "OK frontend/.dockerignore — allow .next, node_modules"
else
  echo "WARN missing ${ROOT}/frontend/.dockerignore"
fi

echo "=== dockerignore prepared for ci-runner ==="
