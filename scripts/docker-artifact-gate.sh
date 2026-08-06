#!/usr/bin/env sh
# ตรวจ artifacts ก่อน docker build --target ci-runner (TC-CI validation)
set -eu

ROOT="${1:-.}"

echo "=== docker-artifact-gate (repo: ${ROOT}) ==="

FE_SERVER="${ROOT}/frontend/.next/standalone/server.js"
BE_PRISMA="${ROOT}/backend/node_modules/@prisma/client"

if [ ! -f "$FE_SERVER" ]; then
  echo "ERROR: missing ${FE_SERVER}"
  echo "  → build:frontend ต้อง emit Next.js standalone (output: standalone)"
  exit 1
fi
echo "OK frontend standalone: ${FE_SERVER}"

if [ ! -d "$BE_PRISMA" ]; then
  echo "ERROR: missing ${BE_PRISMA}"
  echo "  → build:backend ต้องรัน npm prune --omit=dev และ artifact node_modules/"
  exit 1
fi
echo "OK backend prisma client: ${BE_PRISMA}"

FE_STATIC="${ROOT}/frontend/.next/static"
FE_PUBLIC="${ROOT}/frontend/public"
[ -d "$FE_STATIC" ] || { echo "ERROR: missing ${FE_STATIC}"; exit 1; }
[ -d "$FE_PUBLIC" ] || { echo "ERROR: missing ${FE_PUBLIC}"; exit 1; }
echo "OK frontend static + public"

BE_DIST="${ROOT}/backend/dist/src/main.js"
[ -f "$BE_DIST" ] || { echo "ERROR: missing ${BE_DIST}"; exit 1; }
echo "OK backend dist: ${BE_DIST}"

echo "=== artifact gate passed ==="
