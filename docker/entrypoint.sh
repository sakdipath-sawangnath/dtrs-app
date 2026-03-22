#!/bin/sh
set -e
node /app/backend/dist/main.js &
cd /app/frontend
exec ./node_modules/.bin/next start -H 0.0.0.0 -p 3000
