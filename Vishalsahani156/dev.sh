#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND="$ROOT/backend"
FRONTEND="$ROOT/frontend"

cleanup() {
  echo ""
  echo "Stopping backend and frontend..."
  [[ -n "${BACKEND_PID:-}" ]] && kill "$BACKEND_PID" 2>/dev/null || true
  [[ -n "${FRONTEND_PID:-}" ]] && kill "$FRONTEND_PID" 2>/dev/null || true
  wait 2>/dev/null || true
}
trap cleanup EXIT INT TERM

if [[ ! -f "$BACKEND/prisma/schema.prisma" ]]; then
  echo "Error: backend not found at $BACKEND"
  exit 1
fi

if [[ ! -f "$BACKEND/.env" ]]; then
  cp "$BACKEND/.env.example" "$BACKEND/.env"
  echo "Created backend/.env from .env.example"
fi

echo "Starting PostgreSQL..."
cd "$BACKEND"
docker compose up -d

echo "Preparing database..."
cd "$BACKEND"
npx prisma generate
npx prisma db push
npm run db:seed

echo "Starting backend (http://localhost:3000)..."
cd "$BACKEND"
npm run dev &
BACKEND_PID=$!

echo "Starting frontend (http://localhost:5173)..."
cd "$FRONTEND"
pnpm dev &
FRONTEND_PID=$!

echo ""
echo "Both servers running. Press Ctrl+C to stop."
echo "  Frontend: http://localhost:5173"
echo "  Backend:  http://localhost:3000"
echo "  API docs: http://localhost:3000/api/docs"
echo ""

wait
