#!/bin/sh
set -e

# In Cloud Run the DB is reached via Unix socket (/cloudsql/...) mounted by
# --add-cloudsql-instances; no TCP wait is needed. In docker-compose dev the
# DB is at tcp://postgres:5432 and we wait for it.
case "$DATABASE_URL" in
  *host=/cloudsql/*)
    echo "[pumai] Cloud SQL socket detected — skipping TCP wait"
    ;;
  *)
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
    ;;
esac

echo "[pumai] Applying migrations..."
npx prisma migrate deploy

if [ "${RUN_SEED:-0}" = "1" ]; then
  echo "[pumai] Seeding database (RUN_SEED=1)..."
  npx prisma db seed || echo "[pumai] Seed failed"
else
  echo "[pumai] Seed skipped (set RUN_SEED=1 to enable)"
fi

echo "[pumai] Starting on port ${PORT:-3000}..."
exec node server.js
