#!/bin/sh
set -eu
cd "$(dirname "$0")"
if [ -z "${DATABASE_URL:-}" ] && [ -f .env.development.local ]; then
  set -a
  # shellcheck disable=SC1091
  . ./.env.development.local
  set +a
fi
if [ -z "${DATABASE_URL:-}" ]; then
  echo "startup.sh: DATABASE_URL is required (Neon or local Postgres)." >&2
  exit 1
fi
if curl -sf -o /dev/null --max-time 2 http://127.0.0.1:8080/; then
  exit 0
fi
mkdir -p .local
pnpm dev >>.local/app-startup.log 2>&1 &
