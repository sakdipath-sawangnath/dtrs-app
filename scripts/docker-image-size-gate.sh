#!/usr/bin/env sh
# TC-CI-02: ตรวจขนาด Docker image หลัง build (ใช้ docker image inspect .Size เป็น bytes)
# Usage: docker-image-size-gate.sh <image> <max_mb> [label]
set -eu

IMAGE="${1:?image name required}"
MAX_MB="${2:?max size MB required}"
LABEL="${3:-$IMAGE}"

if ! command -v docker >/dev/null 2>&1; then
  echo "ERROR: docker CLI not found"
  exit 1
fi

if ! docker image inspect "$IMAGE" >/dev/null 2>&1; then
  echo "ERROR: image not found: $IMAGE"
  exit 1
fi

SIZE_BYTES="$(docker image inspect --format='{{.Size}}' "$IMAGE")"
MAX_BYTES=$((MAX_MB * 1024 * 1024))
SIZE_MB=$(( (SIZE_BYTES + 1024 * 1024 - 1) / (1024 * 1024) ))

echo "${LABEL}: ${SIZE_MB} MB (${SIZE_BYTES} bytes) — limit ${MAX_MB} MB"

if [ "$SIZE_BYTES" -gt "$MAX_BYTES" ]; then
  echo "ERROR: ${LABEL} exceeds limit (${SIZE_MB} MB > ${MAX_MB} MB)"
  docker images "$IMAGE" || true
  exit 1
fi

echo "OK ${LABEL} within limit"
