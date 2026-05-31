#!/usr/bin/env bash
set -euo pipefail

ROOT="/home/vishal/test.me/Vishalsahani156"
BACKEND="$ROOT/backend"
FRONTEND="$ROOT/frontend"

cd "$BACKEND"

if [[ ! -f prisma/schema.prisma ]]; then
  echo "Error: prisma/schema.prisma not found in $BACKEND"
  echo "You may be in the wrong folder (zoxide can jump to another Vishalsahani156 project)."
  exit 1
fi

if [[ ! -f .env ]]; then
  cp .env.example .env
  echo "Created .env from .env.example"
fi

npm install
npx prisma generate
npx prisma db push
npm run db:seed

echo ""
echo "Backend ready. Start with:"
echo "  cd $BACKEND && npm run dev"
echo ""
echo "Frontend (new terminal):"
echo "  cd $FRONTEND && pnpm install && pnpm dev"
