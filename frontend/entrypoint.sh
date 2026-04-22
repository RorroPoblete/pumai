#!/bin/sh
set -e

echo "Waiting for database..."
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

echo "Database is ready"

echo "Applying migrations..."
npx prisma migrate deploy

echo "Seeding database (idempotent upserts)..."
node --import tsx prisma/seed.ts || echo "Seed skipped (may already exist or failed)"

echo "Starting PumAI on port 3000..."
exec node server.js
