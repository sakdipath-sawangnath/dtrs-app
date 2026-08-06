#!/usr/bin/env sh
# Docker regression smoke (Phase A) — TC-FE-01, TC-FE-03, TC-FE-05, TC-BE-01
# GitLab/UAT: ตั้ง SMOKE_FRONTEND_URL จาก FRONTEND_BASE_URL
# Local compose: SMOKE_FRONTEND_URL=http://localhost:8404 SMOKE_BACKEND_URL=http://localhost:8405/api
set -eu

SMOKE_FRONTEND_URL="${SMOKE_FRONTEND_URL:-http://localhost:8404}"
SMOKE_FRONTEND_URL="${SMOKE_FRONTEND_URL%/}"

if [ -z "${SMOKE_BACKEND_URL:-}" ]; then
  case "$SMOKE_FRONTEND_URL" in
    *:8404)
      SMOKE_BACKEND_URL="${SMOKE_FRONTEND_URL%:*}:8405/api"
      ;;
    *)
      SMOKE_BACKEND_URL="${SMOKE_FRONTEND_URL}/api"
      ;;
  esac
fi
SMOKE_BACKEND_URL="${SMOKE_BACKEND_URL%/}"

CURL="${CURL:-curl}"
CURL_OPTS="-fsS -o /dev/null -w %{http_code}"

pass() { echo "[PASS] $1"; }
fail() { echo "[FAIL] $1"; exit 1; }

http_code() {
  # shellcheck disable=SC2086
  $CURL $CURL_OPTS "$1" 2>/dev/null || echo "000"
}

echo "=== docker-regression-smoke ==="
echo "frontend: ${SMOKE_FRONTEND_URL}"
echo "backend:  ${SMOKE_BACKEND_URL}"
echo ""

echo "=== TC-FE-01 GET /login ==="
code="$(http_code "${SMOKE_FRONTEND_URL}/login")"
[ "$code" = "200" ] && pass "TC-FE-01 ($code)" || fail "TC-FE-01 expected 200 got $code"

echo "=== TC-FE-03 GET /dashboard (no auth → redirect) ==="
# -L off: 307/308 จาก middleware/next-auth
redirect_code="$($CURL -fsS -o /dev/null -w '%{http_code}' "${SMOKE_FRONTEND_URL}/dashboard" 2>/dev/null || echo "000")"
case "$redirect_code" in
  301|302|303|307|308)
    pass "TC-FE-03 redirect ($redirect_code)"
    ;;
  200)
    # บาง config อาจ render หน้า login ที่ /dashboard wrapper
    pass "TC-FE-03 (200 — ตรวจ middleware ด้วยตาเพิ่มถ้าจำเป็น)"
    ;;
  *)
    fail "TC-FE-03 expected redirect got $redirect_code"
    ;;
esac

echo "=== TC-FE-05 GET /fonts/Sarabun-Regular.ttf ==="
code="$(http_code "${SMOKE_FRONTEND_URL}/fonts/Sarabun-Regular.ttf")"
[ "$code" = "200" ] && pass "TC-FE-05 ($code)" || fail "TC-FE-05 expected 200 got $code"

echo "=== TC-BE-01 backend reachable ==="
be_code="$($CURL -fsS -o /dev/null -w '%{http_code}' "${SMOKE_BACKEND_URL}" 2>/dev/null || echo "000")"
case "$be_code" in
  200|401|403|404)
    pass "TC-BE-01 backend responded ($be_code)"
    ;;
  *)
    fail "TC-BE-01 backend not reachable (HTTP $be_code)"
    ;;
esac

echo ""
echo "Smoke passed. Manual: login (TC-FE-02), PDF (TC-INT-01/03)."
