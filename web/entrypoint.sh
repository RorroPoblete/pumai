#!/bin/sh
set -e

echo "[pumai] Waiting for database..."
until node -e "
const net = require('net');
const s = new net.Socket();
s.setTimeout(1000);
s.connect(5432, 'postgres', () => { s.destroy(); process.exit(0); });
s.on('error', () => { s.destroy(); process.exit(1); });
s.on('timeout', () => { s.destroy(); process.exit(1); });
" 2>/dev/null; do
  sleep 1
done
echo "[pumai] Database ready"

echo "[pumai] Applying migrations..."
npx prisma migrate deploy

echo "[pumai] Seeding database (idempotent)..."
npx prisma db seed || echo "[pumai] Seed skipped"

echo "[pumai] Starting on port ${PORT:-3000}..."
exec node server.js
